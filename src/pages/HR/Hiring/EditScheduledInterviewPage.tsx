import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  User,
  Users,
  Video,
  ExternalLink,
  Copy,
  Check,
  Save,
  Trash2,
  ArrowLeft,
  Briefcase,
  Star,
  FileText,
  Mail,
  Sparkles,
  AlertCircle,
  Link as LinkIcon,
  Phone,
  CheckCircle2,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useHiringContext } from './HiringContext';
import { Interview } from './types';

export const EditScheduledInterviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    interviews,
    candidates,
    users,
    activeEmployees,
    fetchInterviews,
    fetchCandidates,
    handleDeleteInterview,
    showCustomToast,
    isHRAdmin
  } = useHiringContext();

  const interviewId = id ? parseInt(id.split('-')[0], 10) : NaN;

  // Local interview state
  const [interview, setInterview] = useState<Interview | null>(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewerId, setInterviewerId] = useState<string>('');
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [technicalScore, setTechnicalScore] = useState<number | null>(null);
  const [technicalNotes, setTechnicalNotes] = useState('');

  // Find candidate details
  const candidate = candidates.find((c) => c.id === interview?.candidate_id) || null;

  // Initial load from context or API
  useEffect(() => {
    let isMounted = true;

    const loadInterview = async () => {
      if (isNaN(interviewId)) {
        setFetching(false);
        return;
      }

      // 1. Try finding in context first
      const foundInContext = interviews.find((i) => i.id === interviewId);
      if (foundInContext) {
        if (isMounted) {
          applyInterviewData(foundInContext);
          setFetching(false);
        }
        return;
      }

      // 2. Fallback to API
      try {
        setFetching(true);
        const res = await fetch(`/api/hr/recruitment/interviews/${interviewId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            applyInterviewData(data);
          }
        } else {
          if (isMounted) setInterview(null);
        }
      } catch (err) {
        console.error('Error fetching interview by ID:', err);
        if (isMounted) setInterview(null);
      } finally {
        if (isMounted) setFetching(false);
      }
    };

    loadInterview();

    return () => {
      isMounted = false;
    };
  }, [interviewId, interviews]);

  const applyInterviewData = (data: Interview) => {
    setInterview(data);
    setTitle(data.title || '');
    setMeetingLink(data.meeting_link || '');
    setInterviewerId(data.interviewer_id ? String(data.interviewer_id) : '');
    setNotes(data.notes || '');
    setTechnicalScore(
      data.technical_score !== null && data.technical_score !== undefined
        ? Number(data.technical_score)
        : null
    );
    setTechnicalNotes(data.technical_notes || '');

    // Format date for datetime-local
    if (data.interview_date) {
      try {
        const d = new Date(data.interview_date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        setInterviewDate(`${year}-${month}-${day}T${hours}:${minutes}`);
      } catch (e) {
        setInterviewDate(data.interview_date);
      }
    }
  };

  // Quick preset title buttons
  const titlePresets = [
    'Technical Assessment & Live Coding',
    'Initial HR Screening Call',
    'System Architecture Discussion',
    'Culture & Leadership Fit',
    'Final Executive Panel Discussion',
    'Job Offer & Alignment Review'
  ];

  // Quick preset time helpers
  const applyTimePreset = (type: 'tomorrow_10am' | 'tomorrow_2pm' | 'next_week') => {
    const now = new Date();
    if (type === 'tomorrow_10am') {
      now.setDate(now.getDate() + 1);
      now.setHours(10, 0, 0, 0);
    } else if (type === 'tomorrow_2pm') {
      now.setDate(now.getDate() + 1);
      now.setHours(14, 0, 0, 0);
    } else if (type === 'next_week') {
      now.setDate(now.getDate() + 7);
      now.setHours(11, 0, 0, 0);
    }
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setInterviewDate(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  // Generate Google Meet URL
  const handleGenerateGoogleMeet = () => {
    setMeetingLink('https://meet.google.com/new');
    showCustomToast('Meeting link set to Google Meet shortcut', 'info');
  };

  // Copy link
  const handleCopyLink = () => {
    if (!meetingLink) return;
    navigator.clipboard.writeText(meetingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showCustomToast('Meeting link copied to clipboard!', 'success');
  };

  // Copy formatted invite message
  const handleCopyInviteText = () => {
    const candidateName = interview?.candidate_name || candidate?.name || 'Candidate';
    const interviewerObj = users.find((u) => String(u.id) === String(interviewerId));
    const interviewerName = interviewerObj?.name || interview?.interviewer_name || 'HR Team';
    const formattedDate = interviewDate ? new Date(interviewDate).toLocaleString() : 'TBD';

    const text = `📅 Interview Invitation: ${title}\n👤 Candidate: ${candidateName}\n🎙️ Host / Interviewer: ${interviewerName}\n🕒 Date & Time: ${formattedDate}\n🔗 Meeting Link: ${meetingLink || 'To be shared'}\n\nNotes & Agenda:\n${notes || 'Standard evaluation round'}`;

    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
    showCustomToast('Full interview invitation briefing copied!', 'success');
  };

  // Form submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview) return;

    if (!title.trim()) {
      showCustomToast('Please provide an interview title', 'error');
      return;
    }
    if (!interviewDate) {
      showCustomToast('Please select the interview date and time', 'error');
      return;
    }
    if (!meetingLink.trim()) {
      showCustomToast('Please provide a meeting URL or location', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/hr/recruitment/interviews/${interview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          interview_date: interviewDate,
          interviewer_id: interviewerId ? Number(interviewerId) : null,
          meeting_link: meetingLink,
          notes,
          technical_score: technicalScore !== null ? Number(technicalScore) : null,
          technical_notes: technicalNotes
        })
      });

      if (res.ok) {
        showCustomToast('Scheduled interview updated successfully!', 'success');
        await fetchInterviews();
        await fetchCandidates();
        navigate('/hr/recruitment/interviews');
      } else {
        const err = await res.json();
        showCustomToast(err.error || 'Failed to update interview', 'error');
      }
    } catch (err: any) {
      showCustomToast(err.message || 'Error saving interview', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!interview) return;
    setLoading(true);
    try {
      await handleDeleteInterview(interview.id);
      showCustomToast('Scheduled interview removed', 'info');
      navigate('/hr/recruitment/interviews');
    } catch (err: any) {
      showCustomToast(err.message || 'Error deleting interview', 'error');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500">Loading scheduled interview dossier...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        <button
          type="button"
          onClick={() => navigate('/hr/recruitment/interviews')}
          className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Interviews Calendar
        </button>
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Interview Record Not Found</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
            The requested interview #{interviewId || id} does not exist or may have been completed or removed.
          </p>
          <button
            type="button"
            onClick={() => navigate('/hr/recruitment/interviews')}
            className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> Go to Interviews Calendar
          </button>
        </div>
      </div>
    );
  }

  const candidateDisplayName = interview.candidate_name || candidate?.name || 'Candidate';
  const targetJobTitle = interview.job_title || candidate?.job_title || 'Target Position';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-6 max-w-5xl mx-auto text-left"
    >
      {/* Top Header & Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/hr/recruitment/interviews')}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Back to Interviews Calendar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link
              to="/hr/recruitment/interviews"
              className="hover:text-emerald-700 transition-colors"
            >
              Interviews
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-bold">Interview #{interview.id}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px] uppercase">
              Edit Mode
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {interview.candidate_id && (
            <Link
              to={`/hr/recruitment/candidates/${interview.candidate_id}`}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Candidate Dossier</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleCopyInviteText}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            title="Copy invitation briefing message"
          >
            {copiedInvite ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{copiedInvite ? 'Copied Briefing' : 'Copy Invitation'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-slate-50 via-emerald-50/20 to-blue-50/30 border-b border-slate-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-md shadow-blue-200 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded-lg">
                    Interview #{interview.id}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    {targetJobTitle}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
                  Edit Scheduled Interview: {interview.title}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Update candidate session timing, assigned panel interviewer, meeting link, and briefing notes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {interviewDate ? new Date(interviewDate).toLocaleDateString() : 'Scheduled'}
              </span>
            </div>
          </div>
        </div>

        {/* Candidate & Job Context Bar */}
        <div className="bg-slate-50/70 border-b border-slate-100 px-6 sm:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {candidateDisplayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Target Candidate
                </span>
                <span className="font-bold text-slate-800 text-sm">{candidateDisplayName}</span>
                {candidate?.stage && (
                  <span className="ml-1.5 text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-black uppercase">
                    {candidate.stage}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Candidate Contact
                </span>
                <span className="font-medium text-slate-700 truncate block max-w-[200px]">
                  {candidate?.email || (interview as any).candidate_email || 'No email registered'}
                </span>
                {(candidate?.phone || (interview as any).candidate_phone) && (
                  <span className="text-[11px] text-slate-400 block">
                    {candidate?.phone || (interview as any).candidate_phone}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Assigned Interviewer
                </span>
                <span className="font-bold text-slate-800">
                  {users.find((u) => String(u.id) === String(interviewerId))?.name ||
                    interview.interviewer_name ||
                    'Unassigned'}
                </span>
                <span className="text-[10px] text-slate-400 block">Host / Panel Coordinator</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
          {/* Section 1: Title & Preset Chips */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Interview Title *
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                Specify meeting purpose & round
              </span>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Technical Assessment Interview, Round 2 Discussion"
              className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm text-slate-900 transition-all"
            />

            {/* Quick title presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Presets:
              </span>
              {titlePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer ${
                    title === preset
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Date & Time + Presets & Interviewer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Interview Date & Time *
                </label>
                <span className="text-[10px] font-bold text-slate-400">Candidate Local Time</span>
              </div>
              <input
                type="datetime-local"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs text-slate-900 transition-all"
              />

              {/* Quick time adjustment buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Adjust:
                </span>
                <button
                  type="button"
                  onClick={() => applyTimePreset('tomorrow_10am')}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold border border-slate-200 cursor-pointer"
                >
                  Tomorrow 10:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => applyTimePreset('tomorrow_2pm')}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold border border-slate-200 cursor-pointer"
                >
                  Tomorrow 2:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => applyTimePreset('next_week')}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold border border-slate-200 cursor-pointer"
                >
                  Next Week
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  Interviewer (HR Host / Panel Lead) *
                </label>
                <span className="text-[10px] font-bold text-slate-400">Active Host</span>
              </div>
              <select
                required
                value={interviewerId}
                onChange={(e) => setInterviewerId(e.target.value)}
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs text-slate-900 transition-all"
              >
                <option value="">-- Select Interviewer / HR Host --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.role ? `(${u.role})` : ''} - {u.email}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                The selected interviewer will receive calendar notices and be authorized to evaluate scorecards.
              </p>
            </div>
          </div>

          {/* Section 3: Meeting Link & Platform */}
          <div className="space-y-3 bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-blue-600" />
                Meeting Link or Virtual Room URL *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateGoogleMeet}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  Generate Google Meet
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  required
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom / Teams URL"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 font-medium text-xs text-slate-900"
                />
              </div>

              {meetingLink && (
                <>
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-white hover:bg-slate-100 text-blue-600 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                    title="Test / Open meeting link in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-3 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                    title="Copy meeting link"
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Provide Google Meet, Zoom, Microsoft Teams link, or dial-in bridge for this video assessment.
            </p>
          </div>

          {/* Section 4: Agenda & Interviewer Briefing Notes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Interview Agenda & Briefing Notes
              </label>
              <span className="text-[10px] font-bold text-slate-400">Internal panel briefing</span>
            </div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specify interview focal points, technical questions, resume highlights to probe, case study overview..."
              className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs text-slate-900 transition-all leading-relaxed"
            />
          </div>

          {/* Section 5: Technical Assessment Scorecard & Feedback */}
          <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  Scorecard & Technical Evaluation Rating
                </h4>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  Record post-interview rating and feedback directly on this interview record.
                </p>
              </div>

              {/* Star Rating Picker */}
              <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs self-start sm:self-auto">
                <span className="text-[10px] font-bold text-slate-400 mr-1.5 uppercase">Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setTechnicalScore(technicalScore === star ? null : star)
                    }
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    title={`Rate ${star} out of 5`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        technicalScore !== null && star <= technicalScore
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                {technicalScore !== null && (
                  <span className="text-xs font-black text-amber-700 ml-1.5">
                    {technicalScore}/5
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-amber-900">
                Evaluation Notes / Panel Feedback
              </label>
              <textarea
                rows={3}
                value={technicalNotes}
                onChange={(e) => setTechnicalNotes(e.target.value)}
                placeholder="Candidate demonstrated strong architecture skills, clean code conventions, positive culture fit..."
                className="w-full p-3 border border-amber-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-amber-500 font-medium text-xs text-slate-900 leading-relaxed"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {isHRAdmin && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Interview</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => navigate('/hr/recruitment/interviews')}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-200 hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-left"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-3 bg-rose-50 rounded-2xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Delete Scheduled Interview?</h3>
                  <p className="text-slate-400 text-xs">Interview #{interview.id} for {candidateDisplayName}</p>
                </div>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">
                Are you sure you want to delete this scheduled interview? This will remove the calendar booking and any associated scorecards. This action cannot be undone.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{loading ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
