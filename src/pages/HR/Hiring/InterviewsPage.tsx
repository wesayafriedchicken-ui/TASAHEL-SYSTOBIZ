import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  Star,
  Edit,
  Trash2,
  ClipboardList,
  Plus,
  Video,
  ExternalLink
} from 'lucide-react';
import { useHiringContext } from './HiringContext';
import { Interview } from './types';

export const InterviewsPage: React.FC = () => {
  const {
    scopeFilteredInterviews,
    candidates,
    users,
    canCreateInterviewPerm,
    canEditInterviewPerm,
    canDeleteInterviewPerm,
    setShowInterviewModal,
    setShowAssessmentModal,
    openAssessmentModal,
    handleDeleteInterview,
    handleScheduleInterviewAndStage,
    loading
  } = useHiringContext();

  const navigate = useNavigate();

  // Quick schedule form state
  const [quickCandidateId, setQuickCandidateId] = useState<string>('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDate, setQuickDate] = useState('');
  const [quickInterviewerId, setQuickInterviewerId] = useState('');
  const [quickMeetingLink, setQuickMeetingLink] = useState('');
  const [quickNotes, setQuickNotes] = useState('');

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCandidateId || !quickDate) return;

    const cand = candidates.find((c) => String(c.id) === quickCandidateId);
    await handleScheduleInterviewAndStage(e, {
      id: 0,
      candidate_id: Number(quickCandidateId),
      candidate_name: cand?.name || '',
      title: quickTitle || 'First Round Interview',
      interview_date: quickDate,
      interviewer_id: quickInterviewerId,
      meeting_link: quickMeetingLink || 'https://meet.google.com/new',
      notes: quickNotes
    });

    // Reset quick form
    setQuickCandidateId('');
    setQuickTitle('');
    setQuickDate('');
    setQuickInterviewerId('');
    setQuickMeetingLink('');
    setQuickNotes('');
  };

  return (
    <motion.div
      key="interviews-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-xl font-bold text-emerald-800 font-serif">
            Interviews Calendar & Technical Evaluation Desk
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Schedule candidate discussions, assign interview panels, and conduct AI-assisted scorecards.
          </p>
        </div>

        {canCreateInterviewPerm && (
          <button
            type="button"
            onClick={() =>
              setShowInterviewModal({
                id: 0,
                candidate_id: 0,
                candidate_name: '',
                title: 'Video Assessment Interview',
                interview_date: '',
                interviewer_id: '',
                meeting_link: 'https://meet.google.com/new',
                notes: ''
              })
            }
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-200 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Interview</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Scheduled Interviews Agenda */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4 text-left">
              <Calendar className="w-5 h-5 text-blue-500" />
              Interview Calendar Agenda & Scorecard Desk
            </h3>

            {scopeFilteredInterviews.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
                <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold">No interviews scheduled yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Use the quick scheduler on the right or the button above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {scopeFilteredInterviews.map((i) => (
                  <div
                    key={i.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left"
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded inline-block">
                        {new Date(i.interview_date).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{i.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>
                          Candidate: <strong className="text-slate-800">{i.candidate_name}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Interviewer:{' '}
                          <strong className="text-slate-800">{i.interviewer_name || 'HR Host'}</strong>
                        </span>
                      </div>

                      {i.meeting_link && (
                        <div className="pt-1">
                          <a
                            href={i.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <Video className="w-3.5 h-3.5" /> Meeting Link
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Technical Assessment Score Indicator */}
                      {i.technical_score !== null && i.technical_score !== undefined && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase w-fit">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>Technical Score: {i.technical_score}/5</span>
                          </div>
                          {i.technical_notes && (
                            <p className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded-xl border border-slate-100 max-w-sm whitespace-pre-line truncate max-h-[80px]">
                              "{i.technical_notes}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end flex-wrap">
                      {canEditInterviewPerm && (
                        <button
                          type="button"
                          onClick={() => navigate(`/hr/recruitment/interviews/${i.id}/edit`)}
                          className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Edit Interview Details"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-500" />
                          Edit
                        </button>
                      )}

                      {/* Open Assessment Modal */}
                      <button
                        type="button"
                        onClick={() => openAssessmentModal(i)}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Evaluate candidate scorecard and trigger AI analysis"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                        Scorecard & Eval
                      </button>

                      {canDeleteInterviewPerm && (
                        <button
                          type="button"
                          onClick={() => handleDeleteInterview(i.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="Cancel/Delete Interview"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Scheduler Form */}
        <div>
          {canCreateInterviewPerm ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-left">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4 text-emerald-600" />
                Quick Schedule Interview
              </h3>

              <form onSubmit={handleQuickSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Select Candidate *</label>
                  <select
                    required
                    value={quickCandidateId}
                    onChange={(e) => setQuickCandidateId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.job_title || 'Unassigned'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Interview Title</label>
                  <input
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="e.g. Technical Screen"
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Interview Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Interviewer (Host)</label>
                  <select
                    value={quickInterviewerId}
                    onChange={(e) => setQuickInterviewerId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                  >
                    <option value="">-- Choose Host --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Google Meet / Video Link</label>
                  <input
                    type="url"
                    value={quickMeetingLink}
                    onChange={(e) => setQuickMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Notes / Agenda</label>
                  <textarea
                    value={quickNotes}
                    onChange={(e) => setQuickNotes(e.target.value)}
                    placeholder="Key questions, resume points..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium h-16"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !quickCandidateId || !quickDate}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {loading ? 'Scheduling...' : 'Save & Schedule Interview'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold">Scheduling requires permissions.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InterviewsPage;
