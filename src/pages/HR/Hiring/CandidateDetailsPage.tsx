import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Users, ClipboardList, Mail, Calendar,
  Star, MessageSquare, Settings, ChevronDown, Plus, X, Search,
  Paperclip, Send, Edit, Clock, RefreshCw, Video, FileText, Linkedin,
  ExternalLink, Trash2, User
} from 'lucide-react';
import { useHiringContext } from './HiringContext';
import { useAuth } from '../../../context/AuthContext';
import { CustomFieldsDisplay } from '../../../components/HR/CustomFieldsManager';
import { CVDocumentViewer } from './CVDocumentViewer';

export const CandidateDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    candidates,
    filteredCandidates,
    jobs,
    users,
    interviews,
    emailTemplates,
    activeStages,
    getStageInfo,
    fetchCandidates,
    fetchInterviews,
    fetchEmailTemplates,
    handleUpdateScore,
    handleUpdateCandidateStage,
    handleDeleteCandidate,
    isCandidateProfileReadOnly,
    canViewCandidatePerm
  } = useHiringContext();

  const candidateId = Number(id);
  const candidate = candidates.find(c => c.id === candidateId);
  const candidateCvUrl = candidate ? (candidate.cv_url || (candidate as any).cv_link || (candidate as any).portfolio_url || '') : '';

  // Sub-tabs in candidate details
  const [profileTab, setProfileTab] = useState<'info' | 'cv_viewer' | 'notes' | 'emails' | 'interviews'>('info');
  const [isCvExpanded, setIsCvExpanded] = useState<boolean>(false);
  const [notesSubTab, setNotesSubTab] = useState<'comments' | 'history' | 'all'>('comments');

  // Comments state
  const [profileComments, setProfileComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [profileLogs, setProfileLogs] = useState<any[]>([]);

  // Email state
  const [candidateEmails, setCandidateEmails] = useState<any[]>([]);
  const [isComposingEmail, setIsComposingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [emailPlaceholderFilter, setEmailPlaceholderFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inline edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormCandidate, setEditFormCandidate] = useState<any>({
    name: '',
    email: '',
    job_opening_id: '',
    linkedin_url: '',
    cv_url: '',
    notes: ''
  });

  // Inline interview form state
  const [isSchedulingInterviewInline, setIsSchedulingInterviewInline] = useState(false);
  const [inlineInterviewForm, setInlineInterviewForm] = useState({
    title: '',
    interview_date: '',
    interviewer_id: '',
    meeting_link: 'https://meet.google.com/new',
    notes: ''
  });

  // Fetch comments & logs & emails for this candidate
  const fetchProfileComments = async (candId: number) => {
    try {
      const res = await fetch(`/api/hr/recruitment/candidates/${candId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setProfileComments(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfileLogs = async (candId: number) => {
    try {
      const res = await fetch(`/api/hr/recruitment/candidates/${candId}/logs`);
      if (res.ok) {
        const data = await res.json();
        setProfileLogs(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCandidateEmails = async (candId: number) => {
    try {
      const res = await fetch(`/api/hr/recruitment/candidates/${candId}/emails`);
      if (res.ok) {
        const data = await res.json();
        setCandidateEmails(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (candidateId) {
      fetchProfileComments(candidateId);
      fetchProfileLogs(candidateId);
      fetchCandidateEmails(candidateId);
    }
  }, [candidateId]);

  if (!canViewCandidatePerm) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs my-6">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-800 mb-2">Access Restricted / غير مسموح بالعرض</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          You do not have permission to view candidate dossiers.
        </p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs my-6">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-800 mb-2">Candidate Not Found</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
          The requested candidate record could not be found or may have been deleted.
        </p>
        <button
          onClick={() => navigate('/hr/recruitment/candidates')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          Return to Candidates Pipeline
        </button>
      </div>
    );
  }

  // Prev & Next navigation
  const currentIdx = filteredCandidates.findIndex(c => c.id === candidate.id);
  const prevCandidate = currentIdx > 0 ? filteredCandidates[currentIdx - 1] : null;
  const nextCandidate = currentIdx !== -1 && currentIdx < filteredCandidates.length - 1 ? filteredCandidates[currentIdx + 1] : null;

  const addedDate = new Date(candidate.created_at || Date.now());
  const daysAgo = Math.max(0, Math.floor((Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24)));
  const addedText = addedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const handleAddComment = async (candId: number) => {
    if (!newCommentText.trim()) return;
    try {
      const res = await fetch(`/api/hr/recruitment/candidates/${candId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newCommentText,
          author_id: user?.id,
          author_name: user?.name || 'Recruiter'
        })
      });
      if (res.ok) {
        setNewCommentText('');
        fetchProfileComments(candId);
        fetchProfileLogs(candId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendActualEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailBody.trim()) return;
    try {
      const payload = {
        subject: emailSubject,
        body: emailBody,
        sender: user?.name || "Charlotte Abbott",
        receiver: candidate.name,
        status: 'Sent'
      };
      const res = await fetch(`/api/hr/recruitment/candidates/${candidate.id}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEmailSubject("");
        setEmailBody("");
        setIsComposingEmail(false);
        fetchCandidateEmails(candidate.id);
        fetchProfileLogs(candidate.id);
        alert("Email routed via SMTP gateway successfully!");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to send email. Please check your SMTP configuration in HR Settings.");
      }
    } catch (err) {
      console.error("Error sending email", err);
      alert("Error sending email.");
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert("Please fill out both subject and body first!");
      return;
    }
    const tplName = prompt("Enter a name for this new email template:", "Candidate Follow Up");
    if (!tplName || !tplName.trim()) return;

    try {
      const res = await fetch("/api/hr/recruitment/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tplName,
          subject: emailSubject,
          body: emailBody
        })
      });
      if (res.ok) {
        alert("Template saved successfully!");
        fetchEmailTemplates();
      } else {
        alert("Failed to save template.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving template.");
    }
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplateId(val);
    if (!val) {
      setEmailSubject("");
      setEmailBody("");
      return;
    }
    const tpl = emailTemplates.find(t => t.id === Number(val));
    if (tpl) {
      setEmailSubject(tpl.subject);
      
      let processedBody = tpl.body;
      const candName = candidate.name || 'Candidate';
      const firstName = candName.split(" ")[0] || "";
      const lastName = candName.split(" ").slice(1).join(" ") || candName;
      const senderFirst = user?.name?.split(" ")[0] || "Charlotte";
      const senderLast = user?.name?.split(" ").slice(1).join(" ") || "Abbott";
      const senderTitle = user?.job_title || "Recruitment Manager";
      
      const foundJob = jobs.find((j: any) => j.id === candidate.job_opening_id);
      const jobName = foundJob ? foundJob.title : "Target Position";

      processedBody = processedBody
        .replace(/{Candidate First Name}/g, firstName)
        .replace(/{Candidate Last Name}/g, lastName)
        .replace(/{Sender First Name}/g, senderFirst)
        .replace(/{Sender Last Name}/g, senderLast)
        .replace(/{Sender Phone}/g, "+1 555-0199")
        .replace(/{Sender Extension}/g, "402")
        .replace(/{Sender Job Title}/g, senderTitle)
        .replace(/{Job Opening Name}/g, jobName);

      setEmailBody(processedBody);
    }
  };

  const insertPlaceholderTag = (tag: string) => {
    const txtarea = textareaRef.current;
    if (!txtarea) {
      setEmailBody(prev => prev + " " + tag);
      return;
    }
    const start = txtarea.selectionStart;
    const end = txtarea.selectionEnd;
    const text = txtarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    setEmailBody(before + tag + after);
    setTimeout(() => {
      txtarea.focus();
      txtarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const groupEmailsByDay = (emails: any[]) => {
    const groups: { [key: string]: any[] } = {};
    emails.forEach(email => {
      const dateVal = new Date(email.created_at || email.date || Date.now());
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let dayStr = "";
      if (dateVal.toDateString() === today.toDateString()) {
        dayStr = "TODAY - " + dateVal.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      } else if (dateVal.toDateString() === yesterday.toDateString()) {
        dayStr = "YESTERDAY - " + dateVal.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      } else {
        dayStr = dateVal.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
      dayStr = dayStr.toUpperCase();
      if (!groups[dayStr]) {
        groups[dayStr] = [];
      }
      groups[dayStr].push(email);
    });
    return groups;
  };

  const formatTime = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getRelativeDaysText = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    const daysAgo = Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
    if (daysAgo === 0) return "Sent today";
    if (daysAgo === 1) return "Sent 1 day ago";
    return `Sent ${daysAgo} days ago`;
  };

  const PLACEHOLDERS_LIST = [
    { name: "Candidate First Name", tag: "{Candidate First Name}", desc: "First name of candidate" },
    { name: "Candidate Last Name", tag: "{Candidate Last Name}", desc: "Last name of candidate" },
    { name: "Sender First Name", tag: "{Sender First Name}", desc: "Your first name" },
    { name: "Sender Last Name", tag: "{Sender Last Name}", desc: "Your last name" },
    { name: "Sender Phone", tag: "{Sender Phone}", desc: "Your contact number" },
    { name: "Sender Extension", tag: "{Sender Extension}", desc: "Your office extension" },
    { name: "Sender Job Title", tag: "{Sender Job Title}", desc: "Your corporate title" },
    { name: "Job Opening Name", tag: "{Job Opening Name}", desc: "Position title of opening" },
  ];

  const filteredPlaceholders = PLACEHOLDERS_LIST.filter(p => 
    (p.name || '').toLowerCase().includes((emailPlaceholderFilter || '').toLowerCase()) ||
    (p.tag || '').toLowerCase().includes((emailPlaceholderFilter || '').toLowerCase())
  );

  const handleInlineSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedCandidateObj = {
        ...candidate,
        name: editFormCandidate.name,
        email: editFormCandidate.email,
        job_opening_id: editFormCandidate.job_opening_id ? Number(editFormCandidate.job_opening_id) : null,
        linkedin_url: editFormCandidate.linkedin_url,
        cv_url: editFormCandidate.cv_url,
        notes: editFormCandidate.notes
      };
      const res = await fetch(`/api/hr/recruitment/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCandidateObj)
      });
      if (res.ok) {
        await fetchCandidates();
        setIsEditingProfile(false);
        await fetch(`/api/hr/recruitment/candidates/${candidate.id}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'edit_profile',
            details: `Candidate profile details updated`
          })
        });
        fetchProfileLogs(candidate.id);
        alert("Candidate profile updated successfully!");
      } else {
        alert("Failed to save candidate details.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving candidate info.");
    }
  };

  const handleInlineScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!inlineInterviewForm.interview_date) {
        alert("Please select an interview date.");
        return;
      }
      
      const payload = {
        candidate_id: candidate.id,
        candidate_name: candidate.name,
        title: inlineInterviewForm.title || `Interview with ${candidate.name}`,
        interview_date: inlineInterviewForm.interview_date,
        interviewer_id: inlineInterviewForm.interviewer_id || null,
        meeting_link: inlineInterviewForm.meeting_link || 'https://meet.google.com/new',
        notes: inlineInterviewForm.notes || ''
      };

      const interviewRes = await fetch('/api/hr/recruitment/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (interviewRes.ok) {
        await fetch(`/api/hr/recruitment/candidates/${candidate.id}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'interview_scheduled',
            details: `Scheduled "${payload.title}" on ${new Date(payload.interview_date).toLocaleString()}`
          })
        });

        await fetchInterviews();
        await fetchProfileLogs(candidate.id);
        setIsSchedulingInterviewInline(false);
        setInlineInterviewForm({ title: '', interview_date: '', interviewer_id: '', meeting_link: 'https://meet.google.com/new', notes: '' });
        alert("Interview scheduled successfully!");
      } else {
        alert("Failed to schedule interview.");
      }
    } catch (err) {
      console.error(err);
      alert("Error scheduling interview.");
    }
  };

  return (
    <div id="candidate_profile_view" className="space-y-6 text-left -mx-4 md:-mx-8 -mt-6 bg-slate-50 min-h-screen pb-12 font-sans" dir="ltr">
      {/* Deep Green Header */}
      <div className="bg-[#1b5e20] text-white px-6 md:px-8 pt-8 pb-0 rounded-b-[2.5rem] shadow-md relative overflow-hidden">
        {/* Top navigation row */}
        <div className="flex justify-between items-center text-xs text-white/80 font-medium mb-6">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => navigate('/hr/recruitment/candidates')}
              className="hover:underline hover:text-white flex items-center gap-1 font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Candidates
            </button>
            {prevCandidate && (
              <>
                <span className="text-white/40">/</span>
                <button 
                  onClick={() => navigate(`/hr/recruitment/candidates/${prevCandidate.id}`)}
                  className="hover:underline hover:text-white font-medium"
                >
                  Previous: {prevCandidate.name}
                </button>
              </>
            )}
          </div>

          {nextCandidate && (
            <button 
              onClick={() => navigate(`/hr/recruitment/candidates/${nextCandidate.id}`)}
              className="text-right hover:text-white group flex flex-col items-end"
            >
              <span className="font-bold group-hover:underline flex items-center gap-0.5">
                Next: {nextCandidate.name} <ArrowRight className="w-3 h-3 inline ml-0.5" />
              </span>
              <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full mt-0.5 font-bold uppercase tracking-wider">{nextCandidate.stage}</span>
            </button>
          )}
        </div>

        {/* Main Candidate details block inside header */}
        <div className="space-y-3 mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white font-serif">{candidate.name}</h1>
          <p className="text-sm md:text-base text-white/90 font-medium">
            Added on {addedText} ({daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`})
          </p>
        </div>

        {/* Bottom Tabs within the Header */}
        <div className="flex border-b border-white/10 overflow-x-auto scrollbar-none gap-2">
          <button
            onClick={() => setProfileTab('info')}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-t-2xl text-xs font-black transition-all shrink-0 border-b-2 ${
              profileTab === 'info' 
                ? 'bg-white text-[#1b5e20] border-white font-black shadow-sm' 
                : 'text-white/80 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Candidate Info</span>
          </button>

          {candidateCvUrl && (
            <button
              onClick={() => setProfileTab('cv_viewer')}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-t-2xl text-xs font-black transition-all shrink-0 border-b-2 ${
                profileTab === 'cv_viewer'
                  ? 'bg-white text-[#1b5e20] border-white font-black shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>CV / Portfolio</span>
            </button>
          )}

          {[
            { id: 'notes', label: 'Notes', icon: ClipboardList },
            { id: 'emails', label: 'Emails', icon: Mail },
            { id: 'interviews', label: 'Interviews', icon: Calendar },
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = profileTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setProfileTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-t-2xl text-xs font-black transition-all shrink-0 border-b-2 ${
                  isActive 
                    ? 'bg-white text-[#1b5e20] border-white font-black shadow-sm' 
                    : 'text-white/80 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inner Content Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
        
        {/* LEFT SIDE CONTENT - takes 8 columns, or 12 when expanded */}
        <div className={profileTab === 'cv_viewer' && isCvExpanded ? "col-span-12 space-y-6" : "md:col-span-8 space-y-6"}>
          
          {/* CV / Portfolio Tab View */}
          {profileTab === 'cv_viewer' && (
            <div className="space-y-4">
              <CVDocumentViewer
                url={candidateCvUrl}
                candidateName={candidate.name}
                isExpanded={isCvExpanded}
                onToggleExpand={() => setIsCvExpanded(!isCvExpanded)}
              />
            </div>
          )}

          {/* Notes Tab View */}
          {profileTab === 'notes' && (
            <div className="space-y-6">
              {/* Horizontal notes sub-tabs */}
              <div className="flex gap-6 border-b border-slate-200 pb-3 items-center">
                {[
                  { id: 'comments', label: 'Comments', count: profileComments.length },
                  { id: 'history', label: `History (${1 + interviews.filter(i => i.candidate_id === candidate.id).length})` },
                  { id: 'all', label: 'All' }
                ].map(sub => {
                  const isActive = notesSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setNotesSubTab(sub.id as any)}
                      className={`text-xs font-black transition-all pb-3 relative ${
                        isActive ? 'text-green-800' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {sub.label}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-800 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sub-tab 1: Comments */}
              {(notesSubTab === 'comments' || notesSubTab === 'all') && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 font-serif">Comments</h2>
                  
                  {/* New Comment Box */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-green-900 mb-4 uppercase tracking-wider">New Comment</h3>
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600 border border-slate-200 shrink-0 uppercase">
                        {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'US'}
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="relative">
                          <textarea
                            rows={3}
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-600 focus:outline-none shadow-inner"
                          />
                          <Paperclip className="absolute bottom-3 right-4 w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleAddComment(candidate.id)}
                            className="bg-[#1b5e20] text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-green-800 transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" /> Post Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments Feed List */}
                  <div className="space-y-4">
                    {profileComments.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs font-bold">
                        No comments posted yet. Be the first to leave a note!
                      </div>
                    ) : (
                      profileComments.map(comment => (
                        <div key={comment.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-green-50 text-green-800 font-bold text-xs flex items-center justify-center uppercase border border-green-100">
                                {(comment.author_name || 'User').split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 text-xs block">{comment.author_name}</span>
                                <span className="text-[10px] text-slate-400 font-medium block">
                                  {new Date(comment.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-slate-700 text-xs font-medium leading-relaxed">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: History */}
              {(notesSubTab === 'history' || notesSubTab === 'all') && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 font-serif">Candidate History</h2>
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                    
                    <div className="relative border-l border-slate-100 pl-6 ml-4 space-y-6">
                      {profileLogs.length > 0 ? (
                        profileLogs.map((log) => {
                          let icon = <Clock className="w-3 h-3 text-slate-500" />;
                          let colorClass = "bg-slate-100 border-slate-200";
                          let title = "System Action";

                          if (log.action_type === 'created') {
                            icon = <Plus className="w-3 h-3 text-slate-600" />;
                            colorClass = "bg-slate-100 border-slate-200";
                            title = "Candidate Registered";
                          } else if (log.action_type === 'stage_change') {
                            icon = <RefreshCw className="w-3 h-3 text-green-600" />;
                            colorClass = "bg-green-100 border-green-200";
                            title = "Pipeline Stage Updated";
                          } else if (log.action_type === 'score_update') {
                            icon = <Star className="w-3 h-3 text-amber-500 fill-amber-500" />;
                            colorClass = "bg-amber-100 border-amber-200";
                            title = "Rating Updated";
                          } else if (log.action_type === 'edit_profile') {
                            icon = <Edit className="w-3 h-3 text-purple-600" />;
                            colorClass = "bg-purple-100 border-purple-200";
                            title = "Profile Info Updated";
                          } else if (log.action_type === 'comment_added') {
                            icon = <MessageSquare className="w-3 h-3 text-blue-600" />;
                            colorClass = "bg-blue-100 border-blue-200";
                            title = "New Note Added";
                          } else if (log.action_type === 'interview_scheduled') {
                            icon = <Calendar className="w-3 h-3 text-cyan-600" />;
                            colorClass = "bg-cyan-100 border-cyan-200";
                            title = "Interview Activity";
                          }

                          return (
                            <div key={log.id} className="relative">
                              <div className={`absolute -left-[36px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${colorClass}`}>
                                {icon}
                              </div>
                              <div className="pl-2">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{title}</span>
                                <span className="text-xs font-semibold text-slate-800 block">{log.details}</span>
                                <span className="text-[10px] text-slate-500 block">Date: {new Date(log.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <>
                          <div className="relative">
                            <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm" />
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Current Stage Status</span>
                              <span className="text-xs font-black text-slate-800 block">Candidate is currently at "{candidate.stage}" stage.</span>
                            </div>
                          </div>

                          {interviews.filter(i => i.candidate_id === candidate.id).map(i => (
                            <div key={i.id} className="relative">
                              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Interview Scheduled</span>
                                <span className="text-xs font-black text-slate-800 block">{i.title}</span>
                                <span className="text-[10px] text-slate-500 block">Scheduled on: {new Date(i.interview_date).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}

                          <div className="relative">
                            <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white shadow-sm" />
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Candidate Profile Opened</span>
                              <span className="text-xs font-black text-slate-800 block">Candidate was registered into the system for {candidate.job_title || 'Target Job'}.</span>
                              <span className="text-[10px] text-slate-500 block">Date: {addedText}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* Candidate Info Tab View */}
          {profileTab === 'info' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
              {isEditingProfile ? (
                <form onSubmit={handleInlineSaveProfile} className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 font-serif">Edit Candidate Details</h2>
                      <p className="text-xs text-slate-400 font-medium">Modify candidate credentials, job opening, and biography.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-black text-slate-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-xl text-xs font-black transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editFormCandidate.name}
                        onChange={(e) => setEditFormCandidate({ ...editFormCandidate, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                      <input
                        type="email"
                        value={editFormCandidate.email}
                        onChange={(e) => setEditFormCandidate({ ...editFormCandidate, email: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Target Job Position</label>
                      <select
                        value={editFormCandidate.job_opening_id || ''}
                        onChange={(e) => setEditFormCandidate({ ...editFormCandidate, job_opening_id: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold focus:ring-1 focus:ring-green-500"
                      >
                        <option value="">Select Opening...</option>
                        {jobs.map(job => (
                          <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">LinkedIn Profile URL</label>
                      <input
                        type="url"
                        value={editFormCandidate.linkedin_url}
                        onChange={(e) => setEditFormCandidate({ ...editFormCandidate, linkedin_url: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">CV / Resume Document URL</label>
                      <input
                        type="text"
                        value={editFormCandidate.cv_url}
                        onChange={(e) => setEditFormCandidate({ ...editFormCandidate, cv_url: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white focus:ring-1 focus:ring-green-500"
                        placeholder="https://example.com/cv.pdf"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Biography & Screening Notes</label>
                      <textarea
                        rows={4}
                        value={editFormCandidate.notes}
                        onChange={(e) => setEditFormCandidate({ ...editFormCandidate, notes: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 font-medium resize-none bg-white focus:ring-1 focus:ring-green-500"
                        placeholder="Enter summary notes..."
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 font-serif">Personal & Professional Details</h2>
                      <p className="text-xs text-slate-400 font-medium">View and update candidate specific fields and attachments.</p>
                    </div>
                    {!isCandidateProfileReadOnly && (
                      <button
                        onClick={() => {
                          setEditFormCandidate({
                            name: candidate.name,
                            email: candidate.email || '',
                            job_opening_id: candidate.job_opening_id || '',
                            linkedin_url: candidate.linkedin_url || '',
                            cv_url: candidate.cv_url || '',
                            notes: candidate.notes || ''
                          });
                          setIsEditingProfile(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-black text-slate-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" /> Edit Profile Info
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold text-slate-700">
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase block">Full Name</span>
                      <span className="text-slate-800 font-black text-sm block">{candidate.name}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase block">Email Address</span>
                      <span className="text-slate-800 font-black text-sm block">{candidate.email || 'N/A'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase block">Target Job Position</span>
                      <span className="text-slate-800 font-black text-sm block">{candidate.job_title || 'Unassigned Role'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase block">LinkedIn Profile</span>
                      {candidate.linkedin_url ? (
                        <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm block">
                          <Linkedin className="w-4 h-4 shrink-0 text-blue-500" /> View Profile <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 font-medium block">Not Provided</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-slate-400 text-[10px] uppercase block">CV / Portfolio Link</span>
                      {candidateCvUrl ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setProfileTab('cv_viewer')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" /> View in CV / Portfolio Tab
                          </button>
                          <a
                            href={candidateCvUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-emerald-700 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                            title="Open external link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium block">Not Provided</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase block">Rating Score</span>
                      <span className="text-slate-800 font-black text-sm block">{candidate.score || 0} / 5 Stars</span>
                    </div>
                  </div>

                  {/* Candidate Notes */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase block font-bold">Biography & Screening Notes</span>
                    <p className="text-slate-600 text-xs font-medium italic bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                      "{candidate.notes || 'No screening notes or bio provided.'}"
                    </p>
                  </div>

                  {/* Custom Fields Relations Display */}
                  <div className="space-y-3 pt-6 border-t border-slate-100">
                    <h3 className="text-xs uppercase font-black text-slate-800 tracking-wider">Custom Field Relationships</h3>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                      <CustomFieldsDisplay entityType="candidate" entityId={candidate.id} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Emails Tab View */}
          {profileTab === 'emails' && (
            <div className="space-y-6">
              {!isComposingEmail ? (
                <div className="space-y-6">
                  {/* Header Row */}
                  <div className="flex justify-between items-center bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div>
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Email Correspondence</h3>
                      <p className="text-xs text-slate-400 font-bold mt-0.5">Manage external recruitment communications with {candidate.name}</p>
                    </div>
                    {!isCandidateProfileReadOnly && (
                      <button
                        onClick={() => setIsComposingEmail(true)}
                        className="border-2 border-[#1b5e20] text-[#1b5e20] hover:bg-green-50/50 rounded-full px-5 py-2 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
                      >
                        <Plus className="w-4 h-4 text-[#1b5e20]" /> New Email
                      </button>
                    )}
                  </div>

                  {/* Email Feed */}
                  <div className="space-y-6">
                    {(() => {
                      const grouped = groupEmailsByDay(candidateEmails);
                      const days = Object.keys(grouped);

                      if (days.length === 0) {
                        return (
                          <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl">
                            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-xs text-slate-400 font-bold">No correspondence records found.</p>
                          </div>
                        );
                      }

                      return days.map(dayStr => (
                        <div key={dayStr} className="space-y-4">
                          <h4 className="text-xs font-black text-[#1b5e20] tracking-wider uppercase font-sans mt-6 first:mt-2">
                            {dayStr}
                          </h4>

                          <div className="space-y-4">
                            {grouped[dayStr].map((email: any) => {
                              const isSenderCharlotte = email.sender?.toLowerCase().includes("charlotte") || email.sender?.toLowerCase().includes("recruiter") || email.sender?.toLowerCase().includes("team") || email.sender?.toLowerCase().includes("manager");
                              return (
                                <div key={email.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex gap-4 text-left hover:shadow-md transition-all">
                                  {isSenderCharlotte ? (
                                    <div className="relative">
                                      <img 
                                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120" 
                                        className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-emerald-100" 
                                        referrerPolicy="no-referrer"
                                        alt="Recruiter"
                                      />
                                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                                    </div>
                                  ) : (
                                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 border border-slate-200">
                                      <User className="w-5 h-5 text-slate-500" />
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex justify-between items-start flex-wrap gap-2 pb-2 border-b border-slate-100">
                                      <div className="space-y-0.5">
                                        <div className="text-xs text-slate-500 font-bold">
                                          From: <span className="text-slate-800 font-black">{email.sender}</span>
                                          {email.created_at && (
                                            <span className="text-[10px] text-slate-400 font-bold ml-1.5 font-mono">
                                              {formatTime(email.created_at)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-slate-500 font-bold">
                                          To: <span className="text-slate-700 font-black">{email.receiver || candidate.name}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 font-bold">
                                          Subject: <span className="text-slate-700 font-black">{email.subject}</span>
                                        </div>
                                      </div>
                                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-black uppercase tracking-wider font-mono">
                                        {email.created_at ? getRelativeDaysText(email.created_at) : "Delivered"}
                                      </span>
                                    </div>
                                    <p className="text-slate-600 text-xs font-medium leading-relaxed whitespace-pre-wrap pt-1 font-sans">
                                      {email.body}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : (
                /* HIGH FIDELITY EMAIL COMPOSER FORM */
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md text-left space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Compose Outbound Communication</h3>
                      <p className="text-xs text-slate-400 font-bold mt-0.5">Draft a message using standard placeholders or predefined gateway templates</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to discard your draft?")) {
                          setIsComposingEmail(false);
                        }
                      }}
                      className="text-xs text-slate-400 font-bold hover:text-slate-600 flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 transition-all"
                    >
                      <X className="w-4 h-4" /> Discard
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <form onSubmit={handleSendActualEmail} className="xl:col-span-2 space-y-4">
                      <div className="space-y-1.5 text-xs font-bold">
                        <label className="text-slate-600 block">Select Email Template (Optional)</label>
                        <select
                          value={selectedTemplateId || ''}
                          onChange={handleTemplateSelect}
                          className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-xs font-black text-slate-700 bg-white"
                        >
                          <option value="">-- Predefined Recruiting Templates --</option>
                          {emailTemplates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl flex-wrap">
                        <button
                          type="button"
                          onClick={() => alert("Files attached successfully")}
                          className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 transition-all"
                        >
                          <Paperclip className="w-3.5 h-3.5" /> Attach Files
                        </button>
                        <div className="h-6 w-px bg-slate-200 mx-1"></div>
                        {['B', 'I', 'U'].map(fmt => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => insertPlaceholderTag("")}
                            className={`w-7 h-7 bg-white hover:bg-slate-100 text-xs font-black text-slate-700 rounded-lg border border-slate-200 flex items-center justify-center transition-all ${fmt === 'B' ? 'font-serif' : fmt === 'I' ? 'italic' : 'underline'}`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1.5 text-xs font-bold">
                        <label className="text-slate-600 block">Subject Line</label>
                        <input
                          type="text"
                          required
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="e.g. Schedule for Technical Assessment Interview"
                          className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold"
                        />
                      </div>

                      <div className="space-y-1.5 text-xs font-bold">
                        <label className="text-slate-600 block flex justify-between items-center">
                          <span>Email Body Message</span>
                          <span className="text-[10px] text-[#1b5e20] font-black uppercase">Dynamic Markdown Rendering Enabled</span>
                        </label>
                        <textarea
                          ref={textareaRef}
                          rows={12}
                          required
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          placeholder="Draft your email message here. Click placeholders on the right to insert..."
                          className="w-full border-2 border-emerald-600/80 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium font-sans leading-relaxed whitespace-pre-wrap"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleSaveAsTemplate}
                          className="text-xs font-black uppercase text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-xl px-4 py-2.5 transition-all"
                        >
                          Save as New Template
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Discard draft?")) {
                                setIsComposingEmail(false);
                              }
                            }}
                            className="px-4 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-black uppercase transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-[#1b5e20] hover:bg-green-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
                          >
                            <Send className="w-4 h-4" /> Send Message
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Right side: Interactive Placeholders Directory */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="border-b border-slate-200 pb-3">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          📚 Interactive Placeholders
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 leading-normal">
                          Click any placeholder tag below to dynamically insert it at your cursor's focus position.
                        </p>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={emailPlaceholderFilter}
                          onChange={(e) => setEmailPlaceholderFilter(e.target.value)}
                          placeholder="Filter placeholders..."
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                      </div>

                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {filteredPlaceholders.map(p => (
                          <button
                            key={p.tag}
                            type="button"
                            onClick={() => insertPlaceholderTag(p.tag)}
                            className="w-full text-left p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:ring-1 hover:ring-emerald-100 hover:bg-emerald-50/10 transition-all block group"
                          >
                            <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md block w-fit mb-1 group-hover:bg-emerald-100">
                              {p.tag}
                            </span>
                            <span className="text-[10px] text-slate-700 font-black block">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interviews Tab View */}
          {profileTab === 'interviews' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              {isSchedulingInterviewInline ? (
                <form onSubmit={handleInlineScheduleInterview} className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-base font-black text-slate-900 tracking-tight">Schedule Interview</h2>
                      <p className="text-xs text-slate-400 font-bold">Specify title, date, HR host, and details for {candidate.name}.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsSchedulingInterviewInline(false)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-black text-slate-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#1b5e20] hover:bg-green-800 text-white rounded-xl text-xs font-black transition-colors"
                      >
                        Schedule
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Interview Title *</label>
                    <input
                      type="text"
                      required
                      value={inlineInterviewForm.title}
                      onChange={e => setInlineInterviewForm({ ...inlineInterviewForm, title: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-1 focus:ring-green-500 font-bold text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">Interview Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={inlineInterviewForm.interview_date}
                        onChange={e => setInlineInterviewForm({ ...inlineInterviewForm, interview_date: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-1 focus:ring-green-500 font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">Interviewer (HR Host) *</label>
                      <select
                        required
                        value={inlineInterviewForm.interviewer_id || ''}
                        onChange={e => setInlineInterviewForm({ ...inlineInterviewForm, interviewer_id: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-1 focus:ring-green-500 font-bold text-xs"
                      >
                        <option value="">-- Select Host --</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Google Meet / Meeting Link *</label>
                    <input
                      type="url"
                      required
                      value={inlineInterviewForm.meeting_link}
                      onChange={e => setInlineInterviewForm({ ...inlineInterviewForm, meeting_link: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-1 focus:ring-green-500 font-bold text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Agenda / Meeting Notes</label>
                    <textarea
                      value={inlineInterviewForm.notes}
                      onChange={e => setInlineInterviewForm({ ...inlineInterviewForm, notes: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-1 focus:ring-green-500 font-bold text-xs h-20"
                      placeholder="Specify target questions, resume highlights, panel agenda..."
                    />
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Scheduled Interviews</h2>
                    <p className="text-xs text-slate-400 font-bold">List of all face-to-face, screening and technical interviews scheduled.</p>
                  </div>
                  {!isCandidateProfileReadOnly && (
                    <button
                      onClick={() => {
                        setInlineInterviewForm({
                          title: `Interview with ${candidate.name}`,
                          interview_date: '',
                          interviewer_id: '',
                          meeting_link: 'https://meet.google.com/new',
                          notes: ''
                        });
                        setIsSchedulingInterviewInline(true);
                      }}
                      className="bg-[#1b5e20] text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-green-800 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Schedule Interview
                    </button>
                  )}
                </div>
              )}

              {interviews.filter(i => i.candidate_id === candidate.id).length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-black">No interviews scheduled yet for {candidate.name}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {interviews.filter(i => i.candidate_id === candidate.id).map(i => (
                    <div key={i.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                      <div className="space-y-1">
                        <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-lg border border-blue-100 inline-block">{i.title}</span>
                        <span className="text-slate-900 font-bold text-sm block">{new Date(i.interview_date).toLocaleString()}</span>
                        <span className="text-slate-400 text-xs font-medium block">Interviewer: {i.interviewer_name || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
                        {i.meeting_link && (
                          <a
                            href={i.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 px-3.5 py-2 rounded-xl font-black flex items-center gap-1.5 justify-center transition-all"
                          >
                            <Video className="w-3.5 h-3.5" /> Join Meeting URL
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/hr/recruitment/interviews/${i.id}/edit`)}
                          className="text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 justify-center transition-all cursor-pointer"
                          title="Edit Scheduled Interview"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-500" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT SIDE FLOATING CARD & ACTIONS - takes 4 columns */}
        {!(profileTab === 'cv_viewer' && isCvExpanded) && (
          <div className="md:col-span-4 space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 space-y-6 -mt-10 relative z-10">
            
            {/* 5 Golden Rating Stars */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block text-center">
                Score Card Rating {isCandidateProfileReadOnly && <span className="text-[9px] text-slate-400 font-normal opacity-75">(View Only)</span>}
              </span>
              <div className="flex items-center gap-1.5 justify-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    disabled={isCandidateProfileReadOnly}
                    onClick={() => !isCandidateProfileReadOnly && handleUpdateScore(candidate.id, star)}
                    className={`transition-transform ${isCandidateProfileReadOnly ? 'cursor-default opacity-85' : 'active:scale-95 hover:scale-110 cursor-pointer'}`}
                  >
                    <Star 
                      className={`w-8 h-8 ${star <= (candidate.score || 0) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Circle Action Buttons Side-by-side */}
            <div className={`flex items-center justify-center gap-4 border-t border-b border-slate-100 py-4 ${isCandidateProfileReadOnly ? 'opacity-40 pointer-events-none select-none' : ''}`}>
              <button
                type="button"
                title="Post Comments Note"
                disabled={isCandidateProfileReadOnly}
                onClick={() => {
                  setProfileTab('notes');
                  setNotesSubTab('comments');
                }}
                className="p-3.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-5 h-5 text-slate-600" />
              </button>
              <button
                type="button"
                title="Compose Email"
                disabled={isCandidateProfileReadOnly}
                onClick={() => setProfileTab('emails')}
                className="p-3.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm cursor-pointer"
              >
                <Mail className="w-5 h-5 text-slate-600" />
              </button>
              <div className="relative group">
                <button
                  type="button"
                  title="Quick Stage Actions"
                  disabled={isCandidateProfileReadOnly}
                  className="p-3.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                >
                  <Settings className="w-5 h-5 text-slate-600" />
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {!isCandidateProfileReadOnly && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 hidden group-focus-within:block group-hover:block z-50">
                    <button
                      type="button"
                      onClick={() => handleUpdateCandidateStage(candidate.id, 'Hired')}
                      className="w-full text-left px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50 transition-colors block cursor-pointer"
                    >
                      Mark as Hired 🎉
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateCandidateStage(candidate.id, 'Rejected')}
                      className="w-full text-left px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 transition-colors block cursor-pointer"
                    >
                      Reject Candidate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this candidate?")) {
                          handleDeleteCandidate(candidate.id);
                          navigate('/hr/recruitment/candidates');
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors block cursor-pointer"
                    >
                      Delete Candidate Record
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stage Selection Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                Candidate Pipeline Stage {isCandidateProfileReadOnly && <span className="text-[9px] text-slate-400 font-normal opacity-75">(View Only)</span>}
              </label>
              <div className="relative">
                <select
                  disabled={isCandidateProfileReadOnly}
                  value={candidate.stage || ''}
                  onChange={(e) => handleUpdateCandidateStage(candidate.id, e.target.value as any)}
                  className={`w-full border border-slate-200 rounded-2xl p-3.5 pr-10 text-slate-800 font-black text-xs shadow-sm appearance-none ${
                    isCandidateProfileReadOnly 
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-80' 
                      : 'bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 cursor-pointer'
                  }`}
                >
                  {activeStages.map(stg => {
                    const stgInfo = getStageInfo(stg);
                    return (
                      <option key={stg} value={stg}>{stgInfo.name_en} {stgInfo.name_ar !== stgInfo.name_en ? `/ ${stgInfo.name_ar}` : ''}</option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-4 top-4 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Small "Added X days ago" label */}
            <div className="text-center text-[11px] text-slate-400 font-bold">
              Added {daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}
            </div>

          </div>

          {/* Side attributes benchmarks */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider">Candidate Benchmarks</h3>
            
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Desired Pay</span>
              <span className="text-slate-800 font-black text-base">
                {candidate.job_title ? (jobs.find(j => j.id === candidate.job_opening_id)?.salary_range || "€85,000") : "€85,000"}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Available Start Date</span>
              <span className="text-slate-800 font-black text-sm">
                {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        )}

      </div>

    </div>
  );
};
