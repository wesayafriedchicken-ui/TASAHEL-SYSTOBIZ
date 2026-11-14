import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  CheckCircle,
  Users,
  Sliders,
  Calendar,
  Star,
  ClipboardList,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Trash2,
  Share2,
  Copy,
  Mail,
  Linkedin
} from 'lucide-react';
import { useHiringContext } from './HiringContext';
import { EditorBlock } from './types';
import { CustomFieldsForm } from '../../../components/HR/CustomFieldsManager';
import { PipelinePopupModal } from '../../../components/HR/PipelinePopupModal';

export const HiringModals: React.FC = () => {
  const {
    selectedAnnounceJob,
    setSelectedAnnounceJob,
    showJobModal,
    setShowJobModal,
    jobCustomFieldValues,
    setJobCustomFieldValues,
    showCandidateModal,
    setShowCandidateModal,
    showInterviewModal,
    setShowInterviewModal,
    showAssessmentModal,
    setShowAssessmentModal,
    stagePopupState,
    setStagePopupState,
    shareModalItem,
    setShareModalItem,
    handleSaveJob,
    handleSaveCandidate,
    handleScheduleInterviewAndStage,
    handleSaveEvaluation,
    handleAiAnalyzeScorecard,
    aiAnalyzing,
    aiAnalysisResult,
    setAiAnalysisResult,
    handleStagePopupConfirm,
    handleApplyNow,
    activeStages,
    getStageInfo,
    jobs,
    users,
    candidates,
    user,
    loading,
    setCandidateCustomFieldValues,
    showCustomToast
  } = useHiringContext();

  const navigate = useNavigate();

  // If edit scheduled interview is requested via showInterviewModal with an id, route to dedicated page
  useEffect(() => {
    if (showInterviewModal && showInterviewModal.id) {
      const interviewIdToEdit = showInterviewModal.id;
      setShowInterviewModal(null);
      navigate(`/hr/recruitment/interviews/${interviewIdToEdit}/edit`);
    }
  }, [showInterviewModal, navigate, setShowInterviewModal]);

  // Internal state for Assessment Modal
  const [scoreCoding, setScoreCoding] = useState(3);
  const [scoreArchitecture, setScoreArchitecture] = useState(3);
  const [scoreProblemSolving, setScoreProblemSolving] = useState(4);
  const [scoreCommunication, setScoreCommunication] = useState(4);
  const [techNotes, setTechNotes] = useState('');

  // Internal state for Edit Job Block Editor
  const [editorBlocks, setEditorBlocks] = useState<EditorBlock[]>([]);
  const [prevJobModalId, setPrevJobModalId] = useState<number | null | undefined>(undefined);

  // Sync editor blocks when job modal opens
  if (showJobModal && showJobModal.id !== prevJobModalId) {
    setPrevJobModalId(showJobModal.id);
    try {
      setEditorBlocks(
        showJobModal.description_blocks
          ? JSON.parse(showJobModal.description_blocks)
          : []
      );
    } catch (e) {
      setEditorBlocks([]);
    }
  }

  // Block Editor Helpers for Edit Job Modal
  const handleAddEditorBlock = (type: EditorBlock['type']) => {
    const newBlock: EditorBlock = {
      id: `b-${Date.now()}`,
      type,
      content: type === 'bullets' ? '• ' : ''
    };
    setEditorBlocks([...editorBlocks, newBlock]);
  };

  const handleUpdateBlockContent = (id: string, content: string) => {
    setEditorBlocks(editorBlocks.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const handleDeleteBlock = (id: string) => {
    setEditorBlocks(editorBlocks.filter((b) => b.id !== id));
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

  const onJobFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showJobModal) return;
    await handleSaveJob(e, editorBlocks, jobCustomFieldValues);
  };

  const onAssessmentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssessmentModal) return;
    const avgScore = Math.round(
      (scoreCoding + scoreArchitecture + scoreProblemSolving + scoreCommunication) / 4
    );
    const targetInterviewId = showAssessmentModal.id || (showAssessmentModal as any).interview_id;
    await handleSaveEvaluation(
      targetInterviewId,
      avgScore,
      techNotes,
      {
        coding: scoreCoding,
        architecture: scoreArchitecture,
        problem_solving: scoreProblemSolving,
        communication: scoreCommunication
      }
    );
  };

  return (
    <>
      {/* 1. ANNOUNCE JOB MODAL */}
      <AnimatePresence>
        {selectedAnnounceJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden text-left"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                <div>
                  <div className="flex gap-2 items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {selectedAnnounceJob.department_name || 'General Org'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                      {selectedAnnounceJob.salary_range}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    {selectedAnnounceJob.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAnnounceJob(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                {(() => {
                  try {
                    const blocks: EditorBlock[] = selectedAnnounceJob.description_blocks
                      ? JSON.parse(selectedAnnounceJob.description_blocks)
                      : [];
                    if (blocks.length === 0) {
                      return (
                        <p className="text-slate-500 text-sm italic">
                          No custom description blocks configured for this job opening.
                        </p>
                      );
                    }
                    return (
                      <div className="space-y-5">
                        {blocks.map((block) => {
                          if (block.type === 'header') {
                            return (
                              <h4
                                key={block.id}
                                className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 pt-2 first:pt-0"
                              >
                                {block.content}
                              </h4>
                            );
                          } else if (block.type === 'callout') {
                            return (
                              <div
                                key={block.id}
                                className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-2xl text-xs font-semibold text-blue-900 leading-relaxed"
                              >
                                {block.content}
                              </div>
                            );
                          } else if (block.type === 'bullets') {
                            return (
                              <ul
                                key={block.id}
                                className="space-y-1.5 text-xs text-slate-600 leading-relaxed pl-1 font-medium"
                              >
                                {(block.content || '').split('\n').map((bullet, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span>{bullet.replace(/^•\s*/, '')}</span>
                                  </li>
                                ))}
                              </ul>
                            );
                          } else {
                            return (
                              <p
                                key={block.id}
                                className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap"
                              >
                                {block.content}
                              </p>
                            );
                          }
                        })}
                      </div>
                    );
                  } catch (e) {
                    return <p className="text-slate-500 text-sm">Error loading description format.</p>;
                  }
                })()}

                <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                      Target Hiring headcount
                    </span>
                    <strong className="text-slate-800 text-sm">
                      {selectedAnnounceJob.headcount_needed} positions open
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                      Minimum Experience
                    </span>
                    <strong className="text-slate-800 text-sm">
                      {selectedAnnounceJob.experience_requirements || 'Any experience level'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                      Current Applicants
                    </span>
                    <strong className="text-blue-600 text-sm flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {selectedAnnounceJob.candidate_count || 0} applied
                    </strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-2 items-center">
                {(() => {
                  const hasApplied = candidates.some(
                    (c) => c.job_opening_id === selectedAnnounceJob.id && c.email === user?.email
                  );
                  if (hasApplied) {
                    return (
                      <button
                        type="button"
                        disabled
                        className="px-5 py-2.5 bg-slate-200 text-slate-500 text-xs font-black rounded-xl cursor-not-allowed uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Applied
                      </button>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => handleApplyNow(selectedAnnounceJob)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      Apply Now
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => setSelectedAnnounceJob(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-md transition-all uppercase tracking-wider cursor-pointer"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. EDIT JOB MODAL */}
      <AnimatePresence>
        {showJobModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden text-left my-8"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {showJobModal.id ? 'Edit Personnel Hire Request' : 'Submit Hire Budget & Opening Request'}
                  </h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mt-0.5">
                    Authorise salary budgets and design premium job announcements
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowJobModal(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={onJobFormSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={showJobModal.title || ''}
                    onChange={(e) => setShowJobModal({ ...showJobModal, title: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Headcount Needed *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={showJobModal.headcount_needed || 1}
                      onChange={(e) =>
                        setShowJobModal({ ...showJobModal, headcount_needed: Number(e.target.value) })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Status</label>
                    <select
                      value={showJobModal.status || 'Active'}
                      onChange={(e) => setShowJobModal({ ...showJobModal, status: e.target.value as any })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                    >
                      <option value="Pending HR Approval">Pending HR Approval</option>
                      <option value="Active">Active</option>
                      <option value="Paused">Paused</option>
                      <option value="Closed">Closed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Experience Level</label>
                    <input
                      type="text"
                      value={showJobModal.experience_requirements || ''}
                      onChange={(e) =>
                        setShowJobModal({ ...showJobModal, experience_requirements: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      placeholder="e.g., 3-5 Years"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Expected Salary Range</label>
                    <input
                      type="text"
                      value={showJobModal.salary_range || ''}
                      onChange={(e) => setShowJobModal({ ...showJobModal, salary_range: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      placeholder="e.g., 8,000 - 12,000 SAR"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Job Location</label>
                    <input
                      type="text"
                      value={showJobModal.location || ''}
                      onChange={(e) => setShowJobModal({ ...showJobModal, location: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      placeholder="e.g., Marseille, Provence"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Employment Type</label>
                    <select
                      value={showJobModal.employment_type || 'Full-Time'}
                      onChange={(e) => setShowJobModal({ ...showJobModal, employment_type: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>

                {/* Block Editor */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-slate-700 block">📢 Interactive Block-Editor</h4>
                      <p className="text-[10px] text-slate-400">
                        Design beautifully formatted announcements using customizable content blocks.
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleAddEditorBlock('header')}
                        className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200 cursor-pointer"
                      >
                        + Head
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddEditorBlock('text')}
                        className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200 cursor-pointer"
                      >
                        + Para
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddEditorBlock('bullets')}
                        className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200 cursor-pointer"
                      >
                        + Bullets
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddEditorBlock('callout')}
                        className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200 cursor-pointer"
                      >
                        + Alert
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[250px] overflow-y-auto">
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
                            className="w-full p-2 border border-slate-100 bg-slate-50 rounded-lg outline-none font-medium text-xs h-16"
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
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom No-Code Attributes */}
                <div className="pt-4 border-t border-slate-100">
                  <CustomFieldsForm
                    entityType="job_opening"
                    entityId={showJobModal.id || null}
                    onChange={setJobCustomFieldValues}
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowJobModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? 'Processing...' : 'Save & Publish Opening'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CANDIDATE EDIT MODAL */}
      <AnimatePresence>
        {showCandidateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden text-left my-8"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {showCandidateModal.id ? 'Candidate Dossier & File' : 'Register Candidate'}
                  </h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mt-0.5">
                    Log applicant credentials, portfolio links, and notes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCandidate} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={showCandidateModal.name || ''}
                      onChange={(e) =>
                        setShowCandidateModal({ ...showCandidateModal, name: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      placeholder="e.g., Sarah Jenkins"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={showCandidateModal.email || ''}
                      onChange={(e) =>
                        setShowCandidateModal({ ...showCandidateModal, email: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      placeholder="e.g., sarah@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Associated Job Opening *</label>
                    <select
                      value={showCandidateModal.job_opening_id || ''}
                      onChange={(e) =>
                        setShowCandidateModal({
                          ...showCandidateModal,
                          job_opening_id: Number(e.target.value)
                        })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      required
                    >
                      <option value="">-- Select Job --</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Pipeline Stage</label>
                    <select
                      value={showCandidateModal.stage || 'Applied'}
                      onChange={(e) =>
                        setShowCandidateModal({ ...showCandidateModal, stage: e.target.value as any })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                    >
                      {activeStages.map((stg) => {
                        const stgInfo = getStageInfo(stg);
                        return (
                          <option key={stg} value={stg}>
                            {stgInfo.name_en} {stgInfo.name_ar !== stgInfo.name_en ? `/ ${stgInfo.name_ar}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Phone Number</label>
                    <input
                      type="text"
                      value={showCandidateModal.phone || ''}
                      onChange={(e) =>
                        setShowCandidateModal({ ...showCandidateModal, phone: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      placeholder="e.g., +33 4 567 4321"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Location</label>
                    <input
                      type="text"
                      value={showCandidateModal.location || ''}
                      onChange={(e) =>
                        setShowCandidateModal({ ...showCandidateModal, location: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      placeholder="e.g., Marseille, Provence"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">LinkedIn URL</label>
                    <input
                      type="url"
                      value={showCandidateModal.linkedin_url || ''}
                      onChange={(e) =>
                        setShowCandidateModal({ ...showCandidateModal, linkedin_url: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">CV / Portfolio Link</label>
                    <input
                      type="url"
                      value={showCandidateModal.cv_url || ''}
                      onChange={(e) =>
                        setShowCandidateModal({ ...showCandidateModal, cv_url: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      placeholder="https://example.com/cv.pdf"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Score Rating (1-5)</label>
                    <select
                      value={showCandidateModal.score || 3}
                      onChange={(e) =>
                        setShowCandidateModal({ ...showCandidateModal, score: Number(e.target.value) })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} Stars
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Assessor Notes</label>
                  <textarea
                    value={showCandidateModal.notes || ''}
                    onChange={(e) =>
                      setShowCandidateModal({ ...showCandidateModal, notes: e.target.value })
                    }
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs h-20"
                    placeholder="Brief highlights about applicant background, screening comments..."
                  />
                </div>

                {/* Custom No-Code Attributes */}
                <div className="pt-4 border-t border-slate-100">
                  <CustomFieldsForm
                    entityType="candidate"
                    entityId={showCandidateModal.id || null}
                    onChange={setCandidateCustomFieldValues}
                  />
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCandidateModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? 'Processing...' : showCandidateModal.id ? 'Save Candidate Details' : 'Register Applicant'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. INTERVIEW SCHEDULE MODAL (New Interviews Only - Edits Open Dedicated Route) */}
      <AnimatePresence>
        {showInterviewModal && !showInterviewModal.id && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden text-left"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    {showInterviewModal.id ? 'Edit Scheduled Interview' : 'Schedule Interview'}
                  </h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mt-0.5">
                    Candidate: {showInterviewModal.candidate_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInterviewModal(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleInterviewAndStage} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Interview Title *</label>
                  <input
                    type="text"
                    required
                    value={showInterviewModal.title || ''}
                    onChange={(e) =>
                      setShowInterviewModal({ ...showInterviewModal, title: e.target.value })
                    }
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Interview Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={showInterviewModal.interview_date || ''}
                      onChange={(e) =>
                        setShowInterviewModal({ ...showInterviewModal, interview_date: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Interviewer (HR Host) *</label>
                    <select
                      required
                      value={showInterviewModal.interviewer_id || ''}
                      onChange={(e) =>
                        setShowInterviewModal({ ...showInterviewModal, interviewer_id: e.target.value })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                    >
                      <option value="">-- Select Host --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Google Meet / Meeting Link *</label>
                  <input
                    type="url"
                    required
                    value={showInterviewModal.meeting_link || ''}
                    onChange={(e) =>
                      setShowInterviewModal({ ...showInterviewModal, meeting_link: e.target.value })
                    }
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Agenda / Meeting Notes</label>
                  <textarea
                    value={showInterviewModal.notes || ''}
                    onChange={(e) =>
                      setShowInterviewModal({ ...showInterviewModal, notes: e.target.value })
                    }
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs h-20"
                    placeholder="Specify target questions, resume highlights, panel agenda..."
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInterviewModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? 'Processing...' : showInterviewModal.id ? 'Save Changes' : 'Schedule & Advance Stage'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. MULTI-CRITERIA SCORECARD MODAL WITH AI ANALYSIS */}
      <AnimatePresence>
        {showAssessmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden text-left my-8"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-amber-500" />
                    Technical Evaluation Scorecard
                  </h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mt-0.5">
                    Evaluate details for: <strong className="text-slate-700">{showAssessmentModal.candidate_name}</strong> • Role: <strong className="text-slate-700">{showAssessmentModal.job_title}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssessmentModal(null);
                    setAiAnalysisResult(null);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={onAssessmentFormSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest pb-1 border-b border-slate-200">
                      Engineering Capability
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Coding & Algorithms</label>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setScoreCoding(star)}
                            className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= scoreCoding ? 'fill-current text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Systems Architecture</label>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setScoreArchitecture(star)}
                            className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= scoreArchitecture ? 'fill-current text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest pb-1 border-b border-slate-200">
                      Behavioral & Logical
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Problem Solving & Logic</label>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setScoreProblemSolving(star)}
                            className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= scoreProblemSolving ? 'fill-current text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Communication & Culture</label>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setScoreCommunication(star)}
                            className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= scoreCommunication ? 'fill-current text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-700">Detailed Feedback & Notes</label>
                    <button
                      type="button"
                      onClick={() => handleAiAnalyzeScorecard()}
                      disabled={aiAnalyzing || !techNotes}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 shadow transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      {aiAnalyzing ? 'Analyzing Scorecard...' : '✨ Run AI Evaluation Analyzer'}
                    </button>
                  </div>
                  <textarea
                    required
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs h-28"
                    placeholder="Provide technical insights, coding results, and evaluation remarks to enable rich AI summaries..."
                  />
                  {!techNotes && (
                    <span className="text-[10px] text-rose-500 font-bold block">
                      ⚠️ Please type interviewer feedback notes first to unlock AI Analysis.
                    </span>
                  )}
                </div>

                {/* AI generated Evaluation details */}
                {aiAnalysisResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-indigo-100">
                      <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                        AI Scorecard Report
                      </h4>

                      <span
                        className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest ${
                          aiAnalysisResult.recommendation === 'Strongly Recommended'
                            ? 'bg-emerald-100 text-emerald-800'
                            : aiAnalysisResult.recommendation === 'Recommended'
                            ? 'bg-blue-100 text-blue-800'
                            : aiAnalysisResult.recommendation === 'Borderline'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {aiAnalysisResult.recommendation}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-700 leading-relaxed">
                      {aiAnalysisResult.summary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                      <div className="space-y-1.5">
                        <span className="font-extrabold text-indigo-950 block">💡 Key Strengths</span>
                        <ul className="space-y-1 text-slate-600 leading-relaxed font-semibold">
                          {aiAnalysisResult.strengths?.map((s: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-extrabold text-indigo-950 block">⚠️ Areas of Concern</span>
                        <ul className="space-y-1 text-slate-600 leading-relaxed font-semibold">
                          {aiAnalysisResult.weaknesses?.map((w: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-indigo-100">
                      <span className="font-extrabold text-xs text-indigo-950 block">
                        🎯 Suggested Onboarding / Next Phase Questions
                      </span>
                      <ul className="space-y-1 text-xs text-slate-600 leading-relaxed font-semibold">
                        {aiAnalysisResult.follow_up_questions?.map((q: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-indigo-500 mt-0.5 font-bold">Q{idx + 1}:</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssessmentModal(null);
                      setAiAnalysisResult(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? 'Saving Evaluation...' : 'Save & Publish Scorecard'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. PIPELINE STAGE TRANSITION POPUP MODAL */}
      <PipelinePopupModal
        isOpen={stagePopupState.isOpen}
        onClose={() => setStagePopupState({ isOpen: false, candidate: null, config: {} })}
        candidateName={stagePopupState.candidate?.name || 'Candidate'}
        config={stagePopupState.config}
        onConfirmAction={handleStagePopupConfirm}
      />

      {/* 7. SHARE MODAL */}
      <AnimatePresence>
        {shareModalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden text-left p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  Share {shareModalItem.type}
                </h3>
                <button
                  type="button"
                  onClick={() => setShareModalItem(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600 font-medium">
                  Share direct link to{' '}
                  <strong className="text-slate-900">
                    {shareModalItem.data?.title || shareModalItem.data?.name}
                  </strong>
                  :
                </p>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[11px] font-mono text-slate-700 truncate flex-1">
                    {window.location.origin}/hr/recruitment/
                    {shareModalItem.type === 'Job Posting' ? 'jobs/' : 'candidates/'}
                    {shareModalItem.data?.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/hr/recruitment/${
                          shareModalItem.type === 'Job Posting' ? 'jobs/' : 'candidates/'
                        }${shareModalItem.data?.id}`
                      );
                      showCustomToast('Link copied to clipboard!', 'success');
                    }}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                    title="Copy Link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShareModalItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HiringModals;
