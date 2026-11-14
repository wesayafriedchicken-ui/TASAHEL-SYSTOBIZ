import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search, Sliders, Users, Star, ArrowRight, Video, Mail, Linkedin,
  ExternalLink, Trash2, Share2, Eye, LayoutGrid, List, Kanban,
  Briefcase, CheckCircle, Clock, User
} from 'lucide-react';
import { useHiringContext } from './HiringContext';
import { CustomFieldsListDisplay } from '../../../components/HR/CustomFieldsManager';

export const CandidatesPipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    jobs,
    filteredCandidates,
    activeStages,
    getStageInfo,
    searchTerm,
    setSearchTerm,
    selectedJobFilter,
    setSelectedJobFilter,
    candidateViewMode,
    setCandidateViewMode,
    handleUpdateCandidateStage,
    handleDeleteCandidate,
    handleShareItem,
    setShowInterviewModal,
    canViewPipelineTab,
    canFilterCandidatesPerm,
    canMoveCandidateStagePerm,
    canScheduleInterviewPerm,
    canViewCandidatePerm,
    canDeleteCandidatePerm,
    canShareCandidatePerm,
    isCandidateFieldVisible
  } = useHiringContext();

  if (!canViewPipelineTab) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs my-6">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-800 mb-2">Access Restricted / غير مسموح بالعرض</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          You do not have permission to view the Candidates Pipeline. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 text-left"
    >
      {/* Filtering, Search & Layout View Control */}
      {canFilterCandidatesPerm && (
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-2xl text-xs bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Job:</span>
              <select
                value={selectedJobFilter}
                onChange={e => setSelectedJobFilter(e.target.value === '' ? '' : Number(e.target.value))}
                className="py-2 px-3 border border-slate-200 rounded-2xl text-xs bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              >
                <option value="">All Job Openings ({jobs.length})</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 justify-between md:justify-end">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCandidateViewMode('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${candidateViewMode === 'board' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                title="Board Pipeline View"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setCandidateViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${candidateViewMode === 'list' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                title="List Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl whitespace-nowrap">
              {filteredCandidates.length} {filteredCandidates.length === 1 ? 'Applicant' : 'Applicants'}
            </span>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: KANBAN BOARD VIEW */}
      {candidateViewMode === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start scrollbar-thin">
          {activeStages.map(stageName => {
            const stageCandidates = filteredCandidates.filter(c => c.stage === stageName);
            const stageInfo = getStageInfo(stageName);

            return (
              <div
                key={stageName}
                onDragOver={(e) => {
                  if (canMoveCandidateStagePerm) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (!canMoveCandidateStagePerm) return;
                  const candId = e.dataTransfer.getData('text/plain');
                  if (candId) {
                    handleUpdateCandidateStage(Number(candId), stageName);
                  }
                }}
                className="w-80 flex-shrink-0 bg-slate-50 border border-slate-200/80 rounded-3xl p-4 flex flex-col max-h-[750px] shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stageInfo.color }} />
                    <h4 className="text-xs font-black text-slate-800 tracking-tight">
                      {stageInfo.name_en} {stageInfo.name_ar !== stageInfo.name_en ? `/ ${stageInfo.name_ar}` : ''}
                    </h4>
                  </div>
                  <span className="text-[10px] font-black bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full shadow-2xs">
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards Column Content */}
                <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-[120px]">
                  {stageCandidates.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-[11px] text-slate-400 font-bold p-3 text-center">
                      <span>Drag candidates here</span>
                    </div>
                  ) : (
                    stageCandidates.map(c => {
                      const associatedJob = jobs.find(j => j.id === c.job_opening_id);
                      return (
                        <div
                          key={c.id}
                          draggable={canMoveCandidateStagePerm}
                          onDragStart={(e) => {
                            if (!canMoveCandidateStagePerm) return;
                            e.dataTransfer.setData('text/plain', c.id.toString());
                          }}
                          className="bg-white p-4 rounded-2xl border border-slate-200/70 hover:border-blue-400 hover:shadow-md transition-all space-y-3 group cursor-grab active:cursor-grabbing text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                {associatedJob ? associatedJob.title : (c.applied_role || 'General Role')}
                              </span>
                              {isCandidateFieldVisible('name') ? (
                                <h5 className="text-sm font-extrabold text-slate-900 leading-tight mt-0.5">{c.name}</h5>
                              ) : (
                                <h5 className="text-sm font-extrabold text-slate-400 leading-tight mt-0.5 italic">Confidential Name</h5>
                              )}
                            </div>

                            {/* Score Stars */}
                            <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < (c.score || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Contact Details & Links */}
                          <div className="space-y-1 text-xs text-slate-500 font-medium">
                            {isCandidateFieldVisible('email') && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{c.email}</span>
                              </div>
                            )}
                            {c.phone && isCandidateFieldVisible('phone') && (
                              <div className="text-[11px] text-slate-400 pl-5">
                                {c.phone}
                              </div>
                            )}
                            {c.location && isCandidateFieldVisible('location') && (
                              <div className="text-[11px] text-slate-400 pl-5">
                                {c.location}
                              </div>
                            )}
                          </div>

                          {/* External Links */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                            {c.linkedin_url && isCandidateFieldVisible('linkedin_url') && (
                              <a
                                href={c.linkedin_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md"
                              >
                                <Linkedin className="w-3 h-3" /> LinkedIn
                              </a>
                            )}
                            {c.cv_url && isCandidateFieldVisible('cv_url') && (
                              <a
                                href={c.cv_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md"
                              >
                                <ExternalLink className="w-3 h-3" /> View CV
                              </a>
                            )}
                          </div>

                          {/* Custom Fields */}
                          <CustomFieldsListDisplay entityType="candidate" entityId={c.id} />

                          {/* Actions & Next Stage Selector */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            {canViewCandidatePerm && (
                              <button
                                onClick={() => navigate(`/hr/recruitment/candidates/${c.id}`)}
                                className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider flex items-center gap-1 bg-blue-50/50 hover:bg-blue-100/50 px-2.5 py-1.5 rounded-xl transition-all"
                                title="Open Candidate Dossier"
                              >
                                <Eye className="w-3 h-3" />
                                Dossier
                              </button>
                            )}

                            <div className="flex items-center gap-1">
                              {canScheduleInterviewPerm && (
                                <button
                                  onClick={() => setShowInterviewModal({
                                    candidate_id: c.id,
                                    candidate_name: c.name,
                                    title: `Technical Interview - ${c.name}`,
                                    interview_date: '',
                                    interviewer_id: '',
                                    meeting_link: 'https://meet.google.com/new',
                                    notes: ''
                                  })}
                                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                                  title="Schedule Interview"
                                >
                                  <Video className="w-3.5 h-3.5 text-blue-500" />
                                </button>
                              )}

                              {canShareCandidatePerm && (
                                <button
                                  onClick={() => handleShareItem('candidate', c)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                                  title="Share Candidate"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {canDeleteCandidatePerm && (
                                <button
                                  onClick={() => handleDeleteCandidate(c.id)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                  title="Delete Candidate"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW MODE 2: TABLE LIST VIEW */
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                <tr>
                  <th className="py-3 px-4">Candidate / Applicant</th>
                  <th className="py-3 px-4">Target Position</th>
                  <th className="py-3 px-4">Pipeline Stage</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Added Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                      No candidates match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map(c => {
                    const associatedJob = jobs.find(j => j.id === c.job_opening_id);
                    const stageInfo = getStageInfo(c.stage);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-extrabold text-slate-900 block text-sm">{c.name}</span>
                            <span className="text-[11px] text-slate-400 block">{c.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {associatedJob ? associatedJob.title : (c.applied_role || 'General')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                            style={{ backgroundColor: `${stageInfo.color}15`, color: stageInfo.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stageInfo.color }} />
                            {stageInfo.name_en}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < (c.score || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canViewCandidatePerm && (
                              <button
                                onClick={() => navigate(`/hr/recruitment/candidates/${c.id}`)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> Dossier
                              </button>
                            )}
                            {canScheduleInterviewPerm && (
                              <button
                                onClick={() => setShowInterviewModal({
                                  candidate_id: c.id,
                                  candidate_name: c.name,
                                  title: `Technical Interview - ${c.name}`,
                                  interview_date: '',
                                  interviewer_id: '',
                                  meeting_link: 'https://meet.google.com/new',
                                  notes: ''
                                })}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                                title="Schedule Interview"
                              >
                                <Video className="w-4 h-4 text-blue-500" />
                              </button>
                            )}
                            {canDeleteCandidatePerm && (
                              <button
                                onClick={() => handleDeleteCandidate(c.id)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                title="Delete Candidate"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};
