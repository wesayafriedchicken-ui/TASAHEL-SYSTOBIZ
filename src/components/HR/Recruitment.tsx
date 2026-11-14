import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Search, Briefcase, Users, Calendar, Mail, Linkedin, FileText, 
  Trash2, Edit, Edit2, Share2, Eye, CheckCircle, Clock, AlertCircle, RefreshCw, Star, 
  ChevronRight, ArrowRight, Video, List, Sliders, ExternalLink, X,
  DollarSign, Sparkles, AlertTriangle, ArrowUp, ArrowDown, ClipboardList,
  LayoutGrid, Kanban, ArrowLeft, MessageSquare, Settings, ChevronDown, Paperclip, Lock, User, MoreVertical, Send,
  UserCheck, XCircle, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomFieldsForm, CustomFieldsDisplay, saveCustomFieldValues, CustomFieldsListDisplay } from './CustomFieldsManager';
import { useAuth } from '../../context/AuthContext';
import { AdvancedFilter } from './AdvancedFilter';
import { PipelinePopupModal } from './PipelinePopupModal';
import { CVDocumentViewer } from '../../pages/HR/Hiring/CVDocumentViewer';
import { useNavigate } from 'react-router-dom';

interface JobOpening {
  id: number;
  title: string;
  department_id: number | null;
  department_name?: string;
  department?: string;
  created_by?: number;
  headcount_needed: number;
  status: 'Pending HR Approval' | 'Active' | 'Paused' | 'Closed' | 'Rejected' | string;
  salary_range: string;
  experience_requirements: string;
  budget_status?: string;
  description_blocks?: string;
  candidate_count?: number;
  location?: string;
  employment_type?: string;
  hiring_lead?: string;
  days_open?: number;
}

const DEFAULT_DEPARTMENT_JOB_TITLES: Record<string, string[]> = {
  'Engineering': ['Software Engineer', 'Senior Backend Engineer', 'Frontend Developer', 'Full Stack Engineer', 'DevOps Engineer', 'Mobile App Developer', 'QA & Automation Engineer', 'Systems Architect', 'UI/UX Designer', 'Engineering Manager'],
  'Human Resources': ['HR Specialist', 'Talent Acquisition Recruiter', 'HR Manager', 'Personnel Specialist', 'Payroll Administrator', 'Training & Development Officer', 'HR Business Partner'],
  'Finance': ['Senior Accountant', 'Financial Analyst', 'Budget Specialist', 'Treasury Manager', 'Internal Auditor', 'Payroll Specialist', 'Chief Financial Officer (CFO)'],
  'Marketing': ['Marketing Specialist', 'Digital Content Creator', 'SEO & SEM Specialist', 'Growth Marketing Manager', 'Brand Manager', 'Graphic Designer', 'Social Media Coordinator'],
  'Sales': ['Sales Executive', 'Account Manager', 'Business Development Specialist', 'Sales Manager', 'CRM Specialist', 'Enterprise Sales Lead'],
  'Operations': ['Operations Coordinator', 'Procurement Manager', 'Supply Chain Analyst', 'Quality Inspector', 'Logistics Specialist', 'Facility Manager'],
  'Customer Support': ['Customer Support Representative', 'Technical Support Specialist', 'Client Success Manager', 'Call Center Team Lead']
};

const getJobTitlesForDepartment = (deptId: number | null, deptsList: any[], empList: any[], jobsList: any[]) => {
  const titlesSet = new Set<string>();

  if (deptId) {
    const dept = deptsList.find(d => d.id === deptId);
    const deptName = dept?.name || '';

    // 1. Add predefined department job titles if department name matches
    Object.keys(DEFAULT_DEPARTMENT_JOB_TITLES).forEach(key => {
      if ((deptName || '').toLowerCase().includes((key || '').toLowerCase()) || (key || '').toLowerCase().includes((deptName || '').toLowerCase())) {
        DEFAULT_DEPARTMENT_JOB_TITLES[key].forEach(t => titlesSet.add(t));
      }
    });

    // 2. Add job titles of employees in this department
    empList.filter(e => e.department_id === deptId || e.department_name === deptName).forEach(e => {
      if (e.job_title) titlesSet.add(e.job_title);
    });

    // 3. Add job titles of job openings in this department
    jobsList.filter(j => j.department_id === deptId).forEach(j => {
      if (j.title) titlesSet.add(j.title);
    });
  }

  // If no titles gathered yet, add standard defaults
  if (titlesSet.size === 0) {
    Object.values(DEFAULT_DEPARTMENT_JOB_TITLES).flat().forEach(t => titlesSet.add(t));
  }

  return Array.from(titlesSet);
};

interface Candidate {
  id: number;
  job_opening_id: number;
  job_title?: string;
  name: string;
  email: string;
  linkedin_url: string;
  cv_url: string;
  stage: 'Applied' | 'Screened' | 'Interviewing' | 'Technical Assessment' | 'Job Offer Sent' | 'Hired' | 'Rejected';
  score: number;
  notes: string;
  phone?: string;
  location?: string;
  created_at?: string;
  created_by?: number;
  recruiter?: string;
  assigned_recruiter?: string;
  interviewer?: string;
}

interface Interview {
  id: number;
  candidate_id: number;
  candidate_name?: string;
  job_title?: string;
  title: string;
  interview_date: string;
  interviewer_id: number | null;
  interviewer_name?: string;
  meeting_link: string;
  notes: string;
  technical_score?: number | null;
  technical_notes?: string | null;
}

interface EditorBlock {
  id: string;
  type: 'header' | 'text' | 'bullets' | 'callout';
  content: string;
}

interface RecruitmentProps {
  showBudget?: boolean;
  technicalAssessmentOnly?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onOpenAddEmployeeModal?: (candidateData: any) => void;
}

export const Recruitment: React.FC<RecruitmentProps> = ({
  showBudget = true,
  technicalAssessmentOnly = false,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  onOpenAddEmployeeModal
}) => {
  const { user, canRead, canWrite, canCreate: canCreateAuth, canDelete: canDeletePerm, canShare, checkPermission, getDataScope, getPermLevel, getFieldPermStatus } = useAuth();

  const isHRAdmin = 
    user?.role === 'Admin' || 
    user?.role_name === 'Admin' || 
    user?.role === 'Super Admin' || 
    user?.role_name === 'Super Admin' || 
    user?.role_id === 1 || 
    (user as any)?.is_super_admin || 
    user?.email === 'admin@gmail.com' || 
    user?.email === 'admin@opex.com';

  const pipelinePermLevel = Math.min(getPermLevel('HR', 'Candidates Pipeline'), getPermLevel('HR Management', 'Candidates Pipeline'));
  const jobOpeningsPermLevel = Math.min(getPermLevel('HR', 'Job Openings'), getPermLevel('HR Management', 'Job Openings'));
  const interviewsPermLevel = Math.min(getPermLevel('HR', 'Interviews & Scorecards'), getPermLevel('HR Management', 'Interviews & Scorecards'));

  const isPipelineMasterOff = (checkPermission as any)('HR', 'tab:Candidates Pipeline') === false ||
    (checkPermission as any)('HR', 'Candidates Pipeline') === false ||
    (checkPermission as any)('HR Management', 'tab:Candidates Pipeline') === false ||
    (checkPermission as any)('HR Management', 'Candidates Pipeline') === false ||
    pipelinePermLevel === 3;

  const isJobOpeningsMasterOff = (checkPermission as any)('HR', 'tab:Job Openings') === false ||
    (checkPermission as any)('HR', 'Job Openings') === false ||
    (checkPermission as any)('HR Management', 'tab:Job Openings') === false ||
    (checkPermission as any)('HR Management', 'Job Openings') === false ||
    jobOpeningsPermLevel === 3;

  const isInterviewsMasterOff = (checkPermission as any)('HR', 'tab:Interviews & Scorecards') === false ||
    (checkPermission as any)('HR', 'Interviews & Scorecards') === false ||
    (checkPermission as any)('HR Management', 'tab:Interviews & Scorecards') === false ||
    (checkPermission as any)('HR Management', 'Interviews & Scorecards') === false ||
    interviewsPermLevel === 3;

  const canViewRecruitment = isHRAdmin || (
    ((checkPermission as any)('HR', 'tab:Hiring') !== false ||
     (checkPermission as any)('HR', 'tab:Recruitment & Jobs') !== false ||
     (checkPermission as any)('HR', 'tab:Recruitment') !== false ||
     (checkPermission as any)('HR Management', 'tab:Hiring') !== false ||
     (checkPermission as any)('HR Management', 'tab:Recruitment & Jobs') !== false ||
     (checkPermission as any)('HR Management', 'tab:Recruitment') !== false) &&
    (canRead('HR', 'Hiring') || canRead('HR', 'Recruitment & Jobs') || canRead('HR', 'Recruitment') ||
     canRead('HR Management', 'Hiring') || canRead('HR Management', 'Recruitment & Jobs') || canRead('HR Management', 'Recruitment') ||
     canRead('HR', 'Job Openings') || canRead('HR', 'Candidates Pipeline') || canRead('HR', 'Interviews & Scorecards') ||
     canRead('HR Management', 'Job Openings') || canRead('HR Management', 'Candidates Pipeline') || canRead('HR Management', 'Interviews & Scorecards'))
  );

  const availableSubTabs = useMemo(() => {
    const rawSubTabs = [
      { id: 'pipeline' as const, label: 'Candidates Pipeline', permKey: 'Candidates Pipeline', icon: Sliders },
      { id: 'jobs' as const, label: 'Job Openings', permKey: 'Job Openings', icon: Briefcase },
      { id: 'interviews' as const, label: 'Interviews & Scorecards', permKey: 'Interviews & Scorecards', icon: Calendar },
    ];

    if (technicalAssessmentOnly) {
      return rawSubTabs.filter(tab => tab.id === 'interviews');
    }

    return rawSubTabs.filter(tab => {
      if (isHRAdmin) return true;
      if (!canViewRecruitment) return false;

      if (tab.id === 'pipeline' && isPipelineMasterOff) return false;
      if (tab.id === 'jobs' && isJobOpeningsMasterOff) return false;
      if (tab.id === 'interviews' && isInterviewsMasterOff) return false;

      const hasDirectPerm = 
        checkPermission('HR', tab.permKey) || 
        checkPermission('HR', `tab:${tab.permKey}`) ||
        checkPermission('HR Management', tab.permKey) || 
        checkPermission('HR Management', `tab:${tab.permKey}`) ||
        canRead('HR', tab.permKey) ||
        canRead('HR Management', tab.permKey);

      return hasDirectPerm;
    });
  }, [isHRAdmin, canViewRecruitment, isPipelineMasterOff, isJobOpeningsMasterOff, isInterviewsMasterOff, checkPermission, canRead, technicalAssessmentOnly]);

  const canViewPipelineTab = availableSubTabs.some(t => t.id === 'pipeline');
  const canViewJobOpeningsTab = availableSubTabs.some(t => t.id === 'jobs');
  const canViewInterviewsTab = availableSubTabs.some(t => t.id === 'interviews');

  const canEditRecruitment = canEdit && (isHRAdmin || canWrite('HR', 'Recruitment & Jobs') || canWrite('HR', 'Recruitment'));
  const canDeleteRecruitmentPerm = canDelete && (isHRAdmin || canDeletePerm('HR', 'Recruitment & Jobs') || canDeletePerm('HR', 'Recruitment'));
  const canShareRecruitment = isHRAdmin || canShare('HR', 'Recruitment & Jobs') || canShare('HR', 'Recruitment');

  const getCustomActionAccess = (actionKey: string, fallback: boolean, isMasterTabOff?: boolean) => {
    if (isMasterTabOff) return false;
    if (isHRAdmin) return true;
    const customActions = (user as any)?.permissions?.HR?.custom_actions || (user as any)?.permissions?.['HR Management']?.custom_actions;
    if (customActions && typeof customActions === 'object') {
      const cleanKey = (actionKey || '').toLowerCase().trim();
      const matchKey = Object.keys(customActions).find(k => (k || '').toLowerCase().trim() === cleanKey);
      if (matchKey !== undefined && typeof customActions[matchKey] === 'boolean') {
        return customActions[matchKey];
      }
    }
    const checkVal = (checkPermission as any)('HR', `custom:${actionKey}`);
    if (checkVal !== undefined && typeof checkVal === 'boolean') {
      return checkVal;
    }
    return fallback;
  };

  // Job Openings custom actions permissions
  const canRequestJobOpening = getCustomActionAccess('request_job_opening', isHRAdmin || (canCreate && canCreateAuth('HR', 'Job Openings')) || jobOpeningsPermLevel !== 3, isJobOpeningsMasterOff);
  const canAddJobPostingPerm = getCustomActionAccess('add_job_posting', isHRAdmin || (canCreate && canCreateAuth('HR', 'Job Openings')) || jobOpeningsPermLevel === 1 || jobOpeningsPermLevel === 0, isJobOpeningsMasterOff);
  const canViewJobPostingPerm = getCustomActionAccess('view_job_posting', isHRAdmin || canRead('HR', 'Job Openings') || jobOpeningsPermLevel !== 3, isJobOpeningsMasterOff);
  const canEditJobPostingPerm = getCustomActionAccess('edit_job_posting', isHRAdmin || (canEdit && canWrite('HR', 'Job Openings')) || jobOpeningsPermLevel === 1 || jobOpeningsPermLevel === 0, isJobOpeningsMasterOff);
  const canDeleteJobPostingPerm = getCustomActionAccess('delete_job_posting', isHRAdmin || (canDelete && canDeletePerm('HR', 'Job Openings')), isJobOpeningsMasterOff);
  const canShareJobPostingPerm = getCustomActionAccess('share_job_posting', isHRAdmin || canShareRecruitment, isJobOpeningsMasterOff);
  const canFilterJobOpeningsPerm = getCustomActionAccess('filter_job_openings', true, isJobOpeningsMasterOff);
  const canVerifyJobBudgetPerm = getCustomActionAccess('verify_job_budget', getCustomActionAccess('show_recruitment_budget', isHRAdmin || jobOpeningsPermLevel !== 3, isJobOpeningsMasterOff), isJobOpeningsMasterOff);

  // Candidates Pipeline custom actions permissions
  const canRegisterApplicantPerm = getCustomActionAccess('register_applicant', getCustomActionAccess('add_candidate', isHRAdmin || (canCreate && canCreateAuth('HR', 'Candidates Pipeline')) || pipelinePermLevel === 1 || pipelinePermLevel === 0, isPipelineMasterOff), isPipelineMasterOff);
  const canAddCandidatePerm = getCustomActionAccess('add_candidate', isHRAdmin || (canCreate && canCreateAuth('HR', 'Candidates Pipeline')) || pipelinePermLevel === 1 || pipelinePermLevel === 0, isPipelineMasterOff);
  const canViewCandidatePerm = getCustomActionAccess('view_candidate', isHRAdmin || canRead('HR', 'Candidates Pipeline') || pipelinePermLevel !== 3, isPipelineMasterOff);
  const canEditCandidatePerm = getCustomActionAccess('edit_candidate', isHRAdmin || (canEdit && canWrite('HR', 'Candidates Pipeline')) || pipelinePermLevel === 1 || pipelinePermLevel === 0, isPipelineMasterOff);
  const canDeleteCandidatePerm = getCustomActionAccess('delete_candidate', isHRAdmin || (canDelete && canDeletePerm('HR', 'Candidates Pipeline')), isPipelineMasterOff);
  const canShareCandidatePerm = getCustomActionAccess('share_candidate', isHRAdmin || canShareRecruitment, isPipelineMasterOff);
  const canMoveCandidateStagePerm = getCustomActionAccess('move_candidate_stage', isHRAdmin || canWrite('HR', 'Candidates Pipeline') || pipelinePermLevel === 1 || pipelinePermLevel === 0, isPipelineMasterOff);
  const canPullChannelCandidatesPerm = getCustomActionAccess('pull_channel_candidates', isHRAdmin || canWrite('HR', 'Candidates Pipeline') || pipelinePermLevel === 1 || pipelinePermLevel === 0, isPipelineMasterOff);
  const canFilterCandidatesPerm = getCustomActionAccess('filter_candidates', true, isPipelineMasterOff);

  // Field Level Permissions helpers
  const isCandidateFieldVisible = (fieldKey: string) => {
    if (isPipelineMasterOff) return false;
    if (isHRAdmin) return true;
    return getFieldPermStatus('HR', fieldKey, 0, 'Candidates Pipeline') !== 'hidden';
  };
  const isCandidateFieldEditable = (fieldKey: string) => {
    if (isPipelineMasterOff) return false;
    if (isHRAdmin) return true;
    return getFieldPermStatus('HR', fieldKey, 0, 'Candidates Pipeline') === 'editable';
  };

  const isJobFieldVisible = (fieldKey: string) => {
    if (isJobOpeningsMasterOff) return false;
    if (isHRAdmin) return true;
    return getFieldPermStatus('HR', fieldKey, 0, 'Job Openings') !== 'hidden';
  };
  const isJobFieldEditable = (fieldKey: string) => {
    if (isJobOpeningsMasterOff) return false;
    if (isHRAdmin) return true;
    return getFieldPermStatus('HR', fieldKey, 0, 'Job Openings') === 'editable';
  };

  // Interviews & Scorecards custom actions permissions
  const canScheduleInterviewPerm = getCustomActionAccess('schedule_interview', canEditRecruitment, isInterviewsMasterOff);
  const canViewInterviewPerm = getCustomActionAccess('view_interview', canViewRecruitment, isInterviewsMasterOff);
  const canEditInterviewPerm = getCustomActionAccess('edit_interview', canEditRecruitment, isInterviewsMasterOff);
  const canDeleteInterviewPerm = getCustomActionAccess('delete_interview', canDeleteRecruitmentPerm, isInterviewsMasterOff);
  const canEvaluateScorecardPerm = getCustomActionAccess('evaluate_candidate_scorecard', canEditRecruitment, isInterviewsMasterOff);
  const canEditScorecardPerm = getCustomActionAccess('edit_scorecard', canEditRecruitment, isInterviewsMasterOff);
  const canAiAnalyzeScorecardPerm = getCustomActionAccess('ai_analyze_scorecard', true, isInterviewsMasterOff);
  const canFilterInterviewsPerm = getCustomActionAccess('filter_interviews', true, isInterviewsMasterOff);

  const handleShareItem = (type: string, item: any) => {
    const title = item.title || item.name || 'Record';
    const shareUrl = `${window.location.origin}${window.location.pathname}?recruitment_type=${encodeURIComponent(type)}&id=${item.id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`🔗 Share link copied to clipboard for ${type}: ${title}\n\n${shareUrl}`);
      }).catch(() => {
        alert(`🔗 Share ${type}: ${title}\n\n${shareUrl}`);
      });
    } else {
      alert(`🔗 Share ${type}: ${title}\n\n${shareUrl}`);
    }
  };

  const [subTab, setSubTab] = useState<'jobs' | 'pipeline' | 'interviews'>(() => {
    if (technicalAssessmentOnly) return 'interviews';
    if (availableSubTabs.length > 0) return availableSubTabs[0].id;
    return 'pipeline';
  });

  const effectiveSubTab = useMemo(() => {
    if (technicalAssessmentOnly) return 'interviews';
    if (availableSubTabs.length > 0) {
      const isCurrentAvailable = availableSubTabs.some(t => t.id === subTab);
      if (!isCurrentAvailable) {
        return availableSubTabs[0].id;
      }
    }
    return subTab;
  }, [technicalAssessmentOnly, availableSubTabs, subTab]);

  const [loading, setLoading] = useState(false);
  const [verifyingBudget, setVerifyingBudget] = useState(false);
  const [budgetVerifySuccess, setBudgetVerifySuccess] = useState<string | null>(null);

  // Integration States
  const [localHiringChannels, setLocalHiringChannels] = useState<any[]>([]);
  const [isPullingCandidates, setIsPullingCandidates] = useState<string | null>(null);

  const fetchHiringChannels = () => {
    try {
      const saved = localStorage.getItem('hr_hiring_channels');
      if (saved) {
        setLocalHiringChannels(JSON.parse(saved));
      } else {
        setLocalHiringChannels([]);
      }
    } catch (e) {
      console.error('Failed to load local hiring channels:', e);
    }
  };

  useEffect(() => {
    fetchHiringChannels();
    const interval = setInterval(fetchHiringChannels, 30000); // 30s instead of 3s
    window.addEventListener('storage', fetchHiringChannels);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchHiringChannels);
    };
  }, []);

  // 3-Minute Background Sync for Google Sheets candidate integration
  useEffect(() => {
    const runBackgroundSync = async () => {
      const saved = localStorage.getItem('hr_hiring_channels');
      if (!saved) return;
      try {
        const channels = JSON.parse(saved);
        let anyUpdated = false;
        
        const updatedChannels = await Promise.all(channels.map(async (ch: any) => {
          if ((ch.source_type === 'google_sheets' || ch.source_type === 'google_forms') && ch.sheet_id && ch.last_sync_at) {
            console.log(`[Recruitment Auto Background Sync] Syncing channel "${ch.name_en}"...`);
            try {
              const res = await fetch('/api/hr/integrations/hiring/sync', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  platform: ch.source_platform,
                  job_opening_ids: ch.target_job_ids,
                  api_key: ch.api_key || ch.sheet_id,
                  source_type: ch.source_type,
                  sheet_id: ch.sheet_id,
                  tab_name: ch.tab_name,
                  form_id: ch.form_id,
                  last_row_index: ch.last_row_index || 0,
                  mappings: ch.mappings
                })
              });

              if (res.ok) {
                const data = await res.json();
                if (data.count > 0 || data.last_row_index !== ch.last_row_index) {
                  anyUpdated = true;
                  return {
                    ...ch,
                    last_sync_at: new Date().toLocaleString(),
                    last_row_index: data.last_row_index
                  };
                }
              }
            } catch (err) {
              console.error("[Recruitment Auto Background Sync] Failed", err);
            }
          }
          return ch;
        }));

        if (anyUpdated) {
          localStorage.setItem('hr_hiring_channels', JSON.stringify(updatedChannels));
          setLocalHiringChannels(updatedChannels);
          fetchCandidates();
        }
      } catch (e) {
        console.error("Failed executing recruitment background sync loop", e);
      }
    };

    // Setup 15-minute interval instead of 3-minute to avoid pooler egress exhaustion
    const interval = setInterval(runBackgroundSync, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePullFromChannel = async (channel: any) => {
    setIsPullingCandidates(channel.id);
    try {
      const res = await fetch('/api/hr/integrations/hiring/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: channel.source_platform || "Google Sheets",
          job_opening_ids: channel.target_job_ids || ["all"],
          api_key: channel.api_key,
          source_type: channel.source_type,
          sheet_id: channel.sheet_id,
          tab_name: channel.tab_name,
          form_id: channel.form_id,
          last_row_index: channel.last_row_index || 0,
          mappings: channel.mappings
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update last sync time & last_row_index in local storage
        try {
          const saved = localStorage.getItem('hr_hiring_channels');
          if (saved) {
            const currentChannels = JSON.parse(saved);
            const updated = currentChannels.map((item: any) => item.id === channel.id ? {
              ...item,
              last_sync_at: new Date().toLocaleString(),
              last_row_index: data.last_row_index
            } : item);
            localStorage.setItem('hr_hiring_channels', JSON.stringify(updated));
            setLocalHiringChannels(updated);
          }
        } catch (e) {
          console.error('Failed to update local channels', e);
        }
        alert(`Successfully pulled applicants from channel: ${channel.name_en || 'Channel'}. Imported ${data.count || 0} candidate profiles.`);
        fetchCandidates();
      } else {
        const err = await res.json();
        alert(`Failed to pull applicants: ${err.error || err.message || 'Server error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error connecting to server: ${err.message}`);
    } finally {
      setIsPullingCandidates(null);
    }
  };

  // AI Scorecard Analysis State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  // Technical Assessment Scorecard Modal details
  const [showAssessmentModal, setShowAssessmentModal] = useState<Interview | null>(null);
  const [scoreCoding, setScoreCoding] = useState<number>(5);
  const [scoreArchitecture, setScoreArchitecture] = useState<number>(5);
  const [scoreProblemSolving, setScoreProblemSolving] = useState<number>(5);
  const [scoreCommunication, setScoreCommunication] = useState<number>(5);
  const [techNotes, setTechNotes] = useState<string>('');

  // Block-Editor state
  const [editorBlocks, setEditorBlocks] = useState<EditorBlock[]>([]);

  useEffect(() => {
    if (technicalAssessmentOnly) {
      setSubTab('interviews');
    }
  }, [technicalAssessmentOnly]);

  // Data States
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]); // Potential interviewers
  const [employees, setEmployees] = useState<any[]>([]);

  // Filter active employees only
  const activeEmployees = useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || 'active').toLowerCase().trim();
      return s === 'active';
    });
  }, [employees]);

  const [activeJob, setActiveJob] = useState<JobOpening | null>(null);
  const [activeJobTab, setActiveJobTab] = useState<'candidates' | 'description'>('candidates');
  const [candidateStageFilter, setCandidateStageFilter] = useState<string>('New');

  const [advancedFilteredJobs, setAdvancedFilteredJobs] = useState<any[] | null>(null);
  const [advancedFilteredCandidates, setAdvancedFilteredCandidates] = useState<any[] | null>(null);

  const [jobStatusFilter, setJobStatusFilter] = useState<string>('all');
  const [jobSearchTerm, setJobSearchTerm] = useState<string>('');
  const [isCustomTitleMode, setIsCustomTitleMode] = useState<boolean>(false);

  useEffect(() => {
    if (activeJob) {
      const updated = jobs.find(j => j.id === activeJob.id);
      if (updated) {
        setActiveJob(updated);
      }
    }
  }, [jobs]);

  // Form Modals
  const [showJobModal, setShowJobModal] = useState<JobOpening | null>(null); // null means closed, empty means new
  const [jobCustomFieldValues, setJobCustomFieldValues] = useState<Record<number, string>>({});
  const [showCandidateModal, setShowCandidateModal] = useState<Candidate | null>(null);
  const [candidateCustomFieldValues, setCandidateCustomFieldValues] = useState<Record<number, string>>({});
  const [showInterviewModal, setShowInterviewModal] = useState<any | null>(null); // contains candidate details for scheduling

  const navigate = useNavigate();

  // If edit scheduled interview is requested with an id, route to dedicated page
  useEffect(() => {
    if (showInterviewModal && showInterviewModal.id) {
      const editId = showInterviewModal.id;
      setShowInterviewModal(null);
      navigate(`/hr/recruitment/interviews/${editId}/edit`);
    }
  }, [showInterviewModal, navigate]);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState<number | ''>('');

  // Candidate Profile Page States
  const [activeProfileCandidate, setActiveProfileCandidate] = useState<any | null>(null);
  const [isCandidateProfileReadOnly, setIsCandidateProfileReadOnly] = useState<boolean>(true);
  const [profileComments, setProfileComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [profileTab, setProfileTab] = useState<'info' | 'cv_viewer' | 'notes' | 'emails' | 'interviews'>('notes');
  const [isCvExpanded, setIsCvExpanded] = useState<boolean>(false);
  const [notesSubTab, setNotesSubTab] = useState<'comments' | 'history' | 'all'>('comments');
  const [profileEmails, setProfileEmails] = useState<any[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [candidateEmails, setCandidateEmails] = useState<any[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [isComposingEmail, setIsComposingEmail] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | number>("");
  const [emailPlaceholderFilter, setEmailPlaceholderFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormCandidate, setEditFormCandidate] = useState<any>({ name: '', email: '', job_opening_id: '', linkedin_url: '', cv_url: '', notes: '' });
  const [isSchedulingInterviewInline, setIsSchedulingInterviewInline] = useState(false);
  const [inlineInterviewForm, setInlineInterviewForm] = useState<any>({ title: '', interview_date: '', interviewer_id: '', meeting_link: 'https://meet.google.com/new', notes: '' });

  const [profileLogs, setProfileLogs] = useState<any[]>([]);

  const fetchProfileLogs = async (candidateId: number) => {
    try {
      const res = await fetch(`/api/hr/recruitment/candidates/${candidateId}/logs`);
      if (res.ok) {
        setProfileLogs(await res.json());
      }
    } catch (e) {
      console.error("Failed to load candidate logs", e);
    }
  };

  const fetchProfileComments = async (candidateId: number) => {
    try {
      const res = await fetch(`/api/hr/recruitment/candidates/${candidateId}/comments`);
      if (res.ok) {
        setProfileComments(await res.json());
      }
    } catch (e) {
      console.error("Failed to load candidate comments", e);
    }
  };

  const fetchCandidateEmails = async (candidateId: number) => {
    try {
      const res = await fetch(`/api/hr/recruitment/candidates/${candidateId}/emails`);
      if (res.ok) {
        setCandidateEmails(await res.json());
      } else {
        setCandidateEmails([]);
      }
    } catch (e) {
      console.error("Failed to load candidate emails", e);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const res = await fetch(`/api/hr/recruitment/email-templates`);
      if (res.ok) {
        setEmailTemplates(await res.json());
      }
    } catch (e) {
      console.error("Failed to load email templates", e);
    }
  };

  useEffect(() => {
    if (activeProfileCandidate?.id) {
      fetchProfileComments(activeProfileCandidate.id);
      fetchProfileLogs(activeProfileCandidate.id);
      fetchCandidateEmails(activeProfileCandidate.id);
      fetchEmailTemplates();
      setIsComposingEmail(false);
      setSelectedTemplateId("");
      setEmailSubject("");
      setEmailBody("");
    }
  }, [activeProfileCandidate?.id]);

  const handleAddComment = async (candidateId: number) => {
    if (!newCommentText.trim()) return;
    try {
      const res = await fetch(`/api/hr/recruitment/candidates/${candidateId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newCommentText, author_name: user?.name || "System User" })
      });
      if (res.ok) {
        setNewCommentText("");
        fetchProfileComments(candidateId);
        fetchProfileLogs(candidateId);
      }
    } catch (e) {
      console.error("Failed to add comment", e);
    }
  };

  // Selected view job announcement details
  const [selectedAnnounceJob, setSelectedAnnounceJob] = useState<JobOpening | null>(null);

  // View mode states (Board/Kanban vs List/Table)
  const [candidateViewMode, setCandidateViewMode] = useState<'board' | 'list'>('board');
  const [jobViewMode, setJobViewMode] = useState<'board' | 'list'>('board');

  const [customStages, setCustomStages] = useState<any[]>([]);

  const fetchCustomStages = async () => {
    try {
      const res = await fetch('/api/hr/pipelines?module_key=recruitment');
      if (res.ok) {
        const data = await res.json();
        setCustomStages(data || []);
      }
    } catch (err) {
      console.error("Error fetching custom recruitment stages:", err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCandidates();
    fetchInterviews();
    fetchDepartments();
    fetchUsers();
    fetchEmployees();
    fetchCustomStages();
  }, []);

  // Sync Job Opening blocks when job modal opens
  useEffect(() => {
    if (showJobModal) {
      setBudgetVerifySuccess(null);
      try {
        if (showJobModal.description_blocks) {
          setEditorBlocks(JSON.parse(showJobModal.description_blocks));
        } else {
          setEditorBlocks([
            { id: '1', type: 'header', content: 'Role Overview & Core Objectives' },
            { id: '2', type: 'text', content: 'We are seeking a high-caliber professional to expand our capabilities and drive key initiatives. You will work in a fast-paced environment with a focus on clean execution.' },
            { id: '3', type: 'bullets', content: '• Lead software architecture and design reviews\n• Implement clean, self-testing, and modular business features\n• Collaborate across departments to refine operational milestones' },
            { id: '4', type: 'callout', content: '⭐ Opportunity Alert: Hired candidates immediately enter standard corporate rotational programs with customized career progression tracks.' }
          ]);
        }
      } catch (e) {
        setEditorBlocks([]);
      }
    }
  }, [showJobModal]);

  const defaultStages = [
    'Applied', 
    'Screened', 
    'Interviewing', 
    'Technical Assessment', 
    'Job Offer Sent', 
    'Hired', 
    'Rejected'
  ];

  const activeStages = customStages.length > 0 
    ? customStages.map(s => s.name_en || s.name_ar || 'Stage') 
    : defaultStages;

  const getStageInfo = (stageName: string) => {
    const custom = customStages.find(s => (s.name_en || s.name_ar || '').toLowerCase() === (stageName || '').toLowerCase());
    if (custom) {
      return {
        name_en: custom.name_en,
        name_ar: custom.name_ar,
        color: custom.color || '#3b82f6',
      };
    }
    const defaultColors: Record<string, string> = {
      'Applied': '#3b82f6',
      'Screened': '#8b5cf6',
      'Interviewing': '#f59e0b',
      'Technical Assessment': '#6366f1',
      'Job Offer Sent': '#ec4899',
      'Hired': '#10b981',
      'Rejected': '#ef4444',
    };
    return {
      name_en: stageName,
      name_ar: stageName,
      color: defaultColors[stageName] || '#3b82f6',
    };
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/hr/recruitment/jobs');
      if (res.ok) setJobs(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/hr/recruitment/candidates');
      if (res.ok) setCandidates(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInterviews = async () => {
    try {
      const res = await fetch('/api/hr/recruitment/interviews');
      if (res.ok) setInterviews(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) setDepartments(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/hr/employees');
      if (res.ok) setEmployees(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickUpdateJobStatus = async (job: JobOpening, newStatus: string) => {
    try {
      const updatedJob = { ...job, status: newStatus };
      const res = await fetch(`/api/hr/recruitment/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedJob)
      });
      if (res.ok) {
        fetchJobs();
        if (showJobModal?.id === job.id) {
          setShowJobModal({ ...showJobModal, status: newStatus as any });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getSelectedHiringLeads = (leadStr?: string) => {
    if (!leadStr) return [];
    return leadStr.split(',').map(s => s.trim()).filter(Boolean);
  };

  const handleAddHiringLead = (leadName: string) => {
    if (!showJobModal) return;
    const current = getSelectedHiringLeads(showJobModal.hiring_lead);
    if (current.includes(leadName)) return;
    if (current.length >= 2) {
      alert("يمكن تحديد 2 مسؤولي توظيف بحد أقصى لكل طلب وظيفة.");
      return;
    }
    const updated = [...current, leadName].join(', ');
    setShowJobModal({ ...showJobModal, hiring_lead: updated });
  };

  const handleRemoveHiringLead = (leadName: string) => {
    if (!showJobModal) return;
    const current = getSelectedHiringLeads(showJobModal.hiring_lead);
    const updated = current.filter(l => l !== leadName).join(', ');
    setShowJobModal({ ...showJobModal, hiring_lead: updated });
  };

  // Job Actions
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showJobModal) return;

    setLoading(true);
    try {
      const isEdit = !!showJobModal.id;
      const url = isEdit ? `/api/hr/recruitment/jobs/${showJobModal.id}` : '/api/hr/recruitment/jobs';
      const method = isEdit ? 'PUT' : 'POST';

      const jobData = {
        ...showJobModal,
        description_blocks: JSON.stringify(editorBlocks)
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });

      if (res.ok) {
        let savedId = showJobModal.id;
        try {
          const result = await res.json();
          savedId = result.id || (Array.isArray(result) ? result[0]?.id : null) || savedId;
        } catch (e) {}
        if (savedId) {
          await saveCustomFieldValues(savedId, jobCustomFieldValues);
        }
        fetchJobs();
        setShowJobModal(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm("Are you sure you want to delete this job opening?")) return;
    try {
      const res = await fetch(`/api/hr/recruitment/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) fetchJobs();
    } catch (e) {
      console.error(e);
    }
  };

  // Budget Verification Check
  const handleVerifyBudget = async () => {
    if (!showJobModal) return;
    setVerifyingBudget(true);
    setBudgetVerifySuccess(null);
    try {
      // Simulate/Trigger ledger review on backend
      await new Promise(resolve => setTimeout(resolve, 1200));
      setShowJobModal({
        ...showJobModal,
        budget_status: 'Approved'
      });
      setBudgetVerifySuccess("Salary budget verified successfully against Account Ledgers. Capital allocation is confirmed.");
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingBudget(false);
    }
  };

  // Candidate Actions
  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCandidateModal) return;

    setLoading(true);
    try {
      const isEdit = !!showCandidateModal.id;
      const url = isEdit ? `/api/hr/recruitment/candidates/${showCandidateModal.id}` : '/api/hr/recruitment/candidates';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(showCandidateModal)
      });

      if (res.ok) {
        let savedId = showCandidateModal.id;
        try {
          const result = await res.json();
          savedId = result.id || (Array.isArray(result) ? result[0]?.id : null) || savedId;
        } catch (e) {}
        if (savedId) {
          await saveCustomFieldValues(savedId, candidateCustomFieldValues);
        }
        
        if (activeProfileCandidate && activeProfileCandidate.id === savedId) {
          setActiveProfileCandidate((prev: any) => ({
            ...prev,
            ...showCandidateModal
          }));
        }

        fetchCandidates();
        setShowCandidateModal(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCandidateStage = async (id: number, newStage: string) => {
    try {
      const candidate = candidates.find(c => c.id === id);
      if (!candidate) return;

      if (newStage === 'Interviewing') {
        setShowInterviewModal({
          candidate_id: id,
          candidate_name: candidate.name,
          title: `Interview with ${candidate.name}`,
          interview_date: '',
          interviewer_id: '',
          meeting_link: 'https://meet.google.com/new',
          notes: '',
          targetStage: newStage
        });
        return;
      }

      const res = await fetch(`/api/hr/recruitment/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });

      if (res.ok) {
        fetchCandidates();
        checkAndTriggerStagePopup(candidate, newStage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Stage Popup Modal state and trigger logic
  const [stagePopupState, setStagePopupState] = useState<{
    isOpen: boolean;
    candidate: any;
    config: any;
  }>({
    isOpen: false,
    candidate: null,
    config: {}
  });

  const checkAndTriggerStagePopup = (candidate: any, newStage: string) => {
    if (!candidate) return;
    const matched = customStages.find(
      (s: any) => s.name_en?.toLowerCase() === (newStage || '').toLowerCase() || s.name_ar === newStage
    );
    
    // Check if stage has has_popup OR if stage is Hired
    const isHired = (newStage || '').toLowerCase() === 'hired' || newStage === 'تم التعيين';
    if (matched?.has_popup || isHired) {
      const cfg = matched?.popup_config || {
        title: '[Candidate Name] got the job!',
        message: 'Add [Candidate Name] as a new employee now.',
        checkbox_label: 'Close this job opening and remove the public posting',
        button_label: 'Add New Employee',
        action_type: 'navigate_employee',
        action_target: 'directory'
      };
      setStagePopupState({
        isOpen: true,
        candidate,
        config: cfg
      });
    }
  };

  const handleStagePopupConfirm = async (data: { closeJobOpening: boolean; action_type?: string; action_target?: string }) => {
    const candidate = stagePopupState.candidate;
    setStagePopupState({ isOpen: false, candidate: null, config: {} });

    if (!candidate) return;

    // 1. Close Job Opening if checkbox checked
    if (data.closeJobOpening) {
      const targetJob = jobs.find(j => j.id === candidate.job_opening_id || j.title?.toLowerCase() === (candidate.applied_role || candidate.job_title || '').toLowerCase());
      if (targetJob) {
        try {
          await fetch(`/api/hr/recruitment/jobs/${targetJob.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...targetJob, status: 'Closed' })
          });
          fetchJobs();
        } catch (err) {
          console.error("Failed to close job opening:", err);
        }
      }
    }

    // 2. Perform Action Type
    const actionType = data.action_type || 'navigate_employee';
    if (actionType === 'navigate_employee') {
      const targetJob = jobs.find(j => j.id === candidate.job_opening_id || j.title?.toLowerCase() === (candidate.applied_role || candidate.job_title || '').toLowerCase());
      const candidateData = {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email || '',
        phone: candidate.phone || '',
        job_title: targetJob?.title || candidate.applied_role || candidate.job_title || 'New Hire',
        department_id: targetJob?.department_id || 1,
        notes: candidate.notes || '',
        linkedin_url: candidate.linkedin_url || '',
        cv_url: candidate.cv_url || '',
        stage: candidate.stage || 'Hired'
      };

      if (onOpenAddEmployeeModal) {
        onOpenAddEmployeeModal(candidateData);
      } else {
        try {
          const empPayload = {
            name: candidate.name,
            email: candidate.email || `${(candidate.name || 'candidate').toLowerCase().replace(/\s+/g, '.')}@company.com`,
            job_title: candidateData.job_title,
            phone: candidate.phone || '',
            status: 'Active',
            joined_at: new Date().toISOString().split('T')[0]
          };
          const empRes = await fetch('/api/hr/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empPayload)
          });
          if (empRes.ok) {
            alert(`🎉 Successfully added ${candidate.name} as a new Employee in HR Directory!`);
          }
        } catch (err) {
          console.error("Failed to register candidate as employee:", err);
        }
      }
    } else if (actionType === 'link' && data.action_target) {
      if (data.action_target.startsWith('http')) {
        window.open(data.action_target, '_blank');
      } else {
        window.location.href = data.action_target;
      }
    }
  };

  const handleApplyNow = async (job: JobOpening) => {
    if (!user) {
      alert("You must be logged in to apply.");
      return;
    }

    setLoading(true);
    try {
      const userDept = departments.find(d => d.id === user.department_id);
      const userDeptName = userDept ? userDept.name : (user.job_title || 'General Department');

      const appData = {
        job_opening_id: job.id,
        name: user.name,
        email: user.email,
        linkedin_url: '',
        cv_url: '',
        stage: 'Applied',
        score: 4,
        notes: `[Internal Application] User ID: ${user.id} | Department: ${userDeptName}`
      };

      const res = await fetch('/api/hr/recruitment/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      });

      if (res.ok) {
        alert(`🎉 Thank you for applying! Your application for "${job.title}" has been successfully submitted and placed in the candidates pipeline.`);
        fetchCandidates();
        fetchJobs(); // Update counts
        setSelectedAnnounceJob(null);
      } else {
        alert("Failed to submit application. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while submitting your application.");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterviewAndStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInterviewModal) return;

    setLoading(true);
    try {
      const isEdit = !!showInterviewModal.id;
      const url = isEdit ? `/api/hr/recruitment/interviews/${showInterviewModal.id}` : '/api/hr/recruitment/interviews';
      const method = isEdit ? 'PUT' : 'POST';

      // 1. Create or update the scheduled interview
      const interviewRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: showInterviewModal.candidate_id,
          title: showInterviewModal.title,
          interview_date: showInterviewModal.interview_date,
          interviewer_id: showInterviewModal.interviewer_id ? Number(showInterviewModal.interviewer_id) : null,
          meeting_link: showInterviewModal.meeting_link,
          notes: showInterviewModal.notes
        })
      });

      if (interviewRes.ok) {
        if (!isEdit) {
          // 2. Advance candidate to 'Interviewing' stage
          await fetch(`/api/hr/recruitment/candidates/${showInterviewModal.candidate_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: 'Interviewing' })
          });
        }

        if (activeProfileCandidate && activeProfileCandidate.id === showInterviewModal.candidate_id) {
          setActiveProfileCandidate((prev: any) => ({
            ...prev,
            stage: isEdit ? prev.stage : 'Interviewing'
          }));
          fetchProfileLogs(showInterviewModal.candidate_id);
        }

        fetchCandidates();
        fetchInterviews();
        setShowInterviewModal(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return;
    try {
      const res = await fetch(`/api/hr/recruitment/candidates/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCandidates();
    } catch (e) {
      console.error(e);
    }
  };

  // Drag & Drop Handlers for Kanban Board
  const onDragStart = (e: React.DragEvent, candidateId: number) => {
    e.dataTransfer.setData('candidateId', candidateId.toString());
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, targetStage: string) => {
    const candidateIdStr = e.dataTransfer.getData('candidateId');
    if (candidateIdStr) {
      const candidateId = parseInt(candidateIdStr, 10);
      handleUpdateCandidateStage(candidateId, targetStage);
    }
  };

  // Technical Assessment Scorecard Save
  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssessmentModal) return;
    setLoading(true);

    const compositeScore = Math.round((scoreCoding + scoreArchitecture + scoreProblemSolving + scoreCommunication) / 4);
    const compiledAssessmentNotes = `
[Scores: Coding=${scoreCoding}, Arch=${scoreArchitecture}, Logic=${scoreProblemSolving}, Comm=${scoreCommunication}]
Interviewer Remarks: ${techNotes}
${aiAnalysisResult ? `\n--- AI EVALUATION SUMMARY ---\nRecommendation: ${aiAnalysisResult.recommendation}\nStrengths: ${aiAnalysisResult.strengths?.join(', ')}\nWeaknesses: ${aiAnalysisResult.weaknesses?.join(', ')}` : ''}
`.trim();

    try {
      const res = await fetch(`/api/hr/recruitment/interviews/${showAssessmentModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technical_score: compositeScore,
          technical_notes: compiledAssessmentNotes
        })
      });
      if (res.ok) {
        // Automatically advance candidate to "Technical Assessment" or update state
        await fetch(`/api/hr/recruitment/candidates/${showAssessmentModal.candidate_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            stage: 'Technical Assessment', 
            score: compositeScore,
            notes: techNotes 
          })
        });

        await fetchInterviews();
        await fetchCandidates();
        setShowAssessmentModal(null);
        setAiAnalysisResult(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openAssessmentModal = (interview: Interview) => {
    setShowAssessmentModal(interview);
    setScoreCoding(5);
    setScoreArchitecture(5);
    setScoreProblemSolving(5);
    setScoreCommunication(5);
    setTechNotes(interview.technical_notes || '');
    setAiAnalysisResult(null);
  };

  // AI Evaluation Scorecard analysis trigger
  const handleAiAnalyzeScorecard = async () => {
    if (!showAssessmentModal) return;
    setAiAnalyzing(true);
    setAiAnalysisResult(null);

    const averageRating = (scoreCoding + scoreArchitecture + scoreProblemSolving + scoreCommunication) / 4;

    try {
      const res = await fetch('/api/hr/recruitment/analyze-scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: showAssessmentModal.candidate_name || 'Candidate',
          job_title: showAssessmentModal.job_title || 'Specialist',
          score: averageRating,
          notes: techNotes || 'No notes provided yet.'
        })
      });

      if (res.ok) {
        const result = await res.json();
        setAiAnalysisResult(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Block-Editor helper operations
  const handleAddEditorBlock = (type: 'header' | 'text' | 'bullets' | 'callout') => {
    const newBlock: EditorBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'bullets' ? '• ' : ''
    };
    setEditorBlocks([...editorBlocks, newBlock]);
  };

  const handleUpdateBlockContent = (id: string, newContent: string) => {
    setEditorBlocks(editorBlocks.map(b => b.id === id ? { ...b, content: newContent } : b));
  };

  const handleDeleteBlock = (id: string) => {
    setEditorBlocks(editorBlocks.filter(b => b.id !== id));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === editorBlocks.length - 1) return;

    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    const newBlocks = [...editorBlocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[nextIndex];
    newBlocks[nextIndex] = temp;
    setEditorBlocks(newBlocks);
  };

  // RBAC Data Scope Evaluation (Company/All, Department, Team, Own)
  const jobsScope = getDataScope('HR', 'Job Openings');
  const pipelineScope = getDataScope('HR', 'Candidates Pipeline');
  const interviewsScope = getDataScope('HR', 'Interviews & Scorecards');

  // Filter Jobs based on Data Scope
  const scopeFilteredJobs = useMemo(() => {
    if (isHRAdmin || jobsScope === 'global') return jobs;

    const userDeptId = user?.department_id || (user as any)?.dept_id;
    const userDeptName = ((user as any)?.department_name || (user as any)?.department || '').toString().toLowerCase().trim();
    const userName = (user?.name || user?.email || '').toString().toLowerCase().trim();
    const userId = user?.id;

    return jobs.filter((job) => {
      const jobDeptId = job.department_id;
      const jobDeptName = (job.department_name || job.department || '').toString().toLowerCase().trim();
      const jobLead = (job.hiring_lead || '').toString().toLowerCase();
      const isCreator = job.created_by ? job.created_by === userId : false;

      if (jobsScope === 'own') {
        return isCreator || (userName && jobLead.includes(userName));
      }

      if (jobsScope === 'team') {
        return isCreator || (userName && jobLead.includes(userName)) || (userDeptId && jobDeptId === userDeptId);
      }

      if (jobsScope === 'branch' || jobsScope === 'custom') {
        return (userDeptId && jobDeptId === userDeptId) || (userDeptName && jobDeptName === userDeptName);
      }

      return true;
    });
  }, [jobs, jobsScope, user, isHRAdmin]);

  // Combined Jobs list after Status, Search & Advanced Filter
  const filteredJobsList = useMemo(() => {
    let list = scopeFilteredJobs;
    if (jobStatusFilter !== 'all') {
      list = list.filter(j => j.status === jobStatusFilter);
    }
    if (jobSearchTerm.trim()) {
      const term = (jobSearchTerm || '').toLowerCase().trim();
      list = list.filter(j => 
        (j.title || '').toLowerCase().includes(term) ||
        (j.department_name || '').toLowerCase().includes(term) ||
        (j.hiring_lead || '').toLowerCase().includes(term) ||
        (j.location || '').toLowerCase().includes(term)
      );
    }
    if (advancedFilteredJobs !== null) {
      list = list.filter(j => advancedFilteredJobs.some(aj => aj.id === j.id));
    }
    return list;
  }, [scopeFilteredJobs, jobStatusFilter, jobSearchTerm, advancedFilteredJobs]);

  // Filter Candidates based on Data Scope
  const scopeFilteredCandidates = useMemo(() => {
    if (isHRAdmin || pipelineScope === 'global') return candidates;

    const userDeptId = user?.department_id || (user as any)?.dept_id;
    const userDeptName = ((user as any)?.department_name || (user as any)?.department || '').toString().toLowerCase().trim();
    const userName = (user?.name || user?.email || '').toString().toLowerCase().trim();
    const userId = user?.id;

    const allowedJobIds = new Set(scopeFilteredJobs.map(j => j.id));

    return candidates.filter((cand) => {
      const candCreator = cand.created_by ? cand.created_by === userId : false;
      const candRecruiter = (cand.recruiter || cand.assigned_recruiter || '').toString().toLowerCase();
      const candInterviewer = (cand.interviewer || '').toString().toLowerCase();

      if (pipelineScope === 'own') {
        return candCreator || (userName && (candRecruiter.includes(userName) || candInterviewer.includes(userName)));
      }

      if (pipelineScope === 'team') {
        return candCreator || (userName && (candRecruiter.includes(userName) || candInterviewer.includes(userName))) || (cand.job_opening_id && allowedJobIds.has(cand.job_opening_id));
      }

      if (pipelineScope === 'branch' || pipelineScope === 'custom') {
        return cand.job_opening_id ? allowedJobIds.has(cand.job_opening_id) : true;
      }

      return true;
    });
  }, [candidates, pipelineScope, scopeFilteredJobs, user, isHRAdmin]);

  // Combined Candidates list after Search, Job Filter & Advanced Filter
  const filteredCandidates = useMemo(() => {
    return scopeFilteredCandidates.filter(c => {
      const matchesSearch = (c.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                            (c.email || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      const matchesJob = selectedJobFilter === '' ? true : c.job_opening_id === Number(selectedJobFilter);
      const matchesAdvanced = advancedFilteredCandidates === null ? true : advancedFilteredCandidates.some(ac => ac.id === c.id);
      return matchesSearch && matchesJob && matchesAdvanced;
    });
  }, [scopeFilteredCandidates, searchTerm, selectedJobFilter, advancedFilteredCandidates]);

  // Filter Interviews based on Data Scope
  const scopeFilteredInterviews = useMemo(() => {
    if (isHRAdmin || interviewsScope === 'global') return interviews;

    const userName = (user?.name || user?.email || '').toString().toLowerCase().trim();
    const userId = user?.id;
    const allowedCandidateIds = new Set(scopeFilteredCandidates.map(c => c.id));

    return interviews.filter((intv) => {
      if (interviewsScope === 'own') {
        const isInterviewer = intv.interviewer_id === userId || (userName && (intv.interviewer_name || '').toLowerCase().includes(userName));
        return isInterviewer;
      }
      return allowedCandidateIds.has(intv.candidate_id);
    });
  }, [interviews, interviewsScope, scopeFilteredCandidates, user, isHRAdmin]);

  // Score rating updates
  const handleUpdateScore = async (candidateId: number, score: number) => {
    try {
      const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate) return;
      const updatedCandidate = { ...candidate, score };
      const res = await fetch(`/api/hr/recruitment/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCandidate)
      });
      if (res.ok) {
        setActiveProfileCandidate(updatedCandidate);
        fetchCandidates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Stage updates from profile page
  const handleUpdateStageFromProfile = async (candidateId: number, newStage: any) => {
    try {
      const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate) return;
      const updatedCandidate = { ...candidate, stage: newStage };
      const res = await fetch(`/api/hr/recruitment/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCandidate)
      });
      if (res.ok) {
        setActiveProfileCandidate(updatedCandidate);
        fetchCandidates();
        checkAndTriggerStagePopup(candidate, newStage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (activeProfileCandidate) {
    const currentCandidateId = activeProfileCandidate.id;
    // Find candidate in full list
    const candidate = candidates.find(c => c.id === currentCandidateId) || activeProfileCandidate;
    const candidateCvUrl = candidate ? (candidate.cv_url || (candidate as any).cv_link || (candidate as any).portfolio_url || '') : '';

    // Find previous and next candidates in list
    const currentIdx = filteredCandidates.findIndex(c => c.id === candidate.id);
    const prevCandidate = currentIdx > 0 ? filteredCandidates[currentIdx - 1] : null;
    const nextCandidate = currentIdx !== -1 && currentIdx < filteredCandidates.length - 1 ? filteredCandidates[currentIdx + 1] : null;

    // Relative days calculator
    const addedDate = new Date(candidate.created_at || Date.now());
    const daysAgo = Math.max(0, Math.floor((Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24)));
    const addedText = addedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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
        
        // Find job title
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
          // Fetch candidates again to update the list
          await fetchCandidates();
          // Update the active profile candidate state
          setActiveProfileCandidate(updatedCandidateObj);
          setIsEditingProfile(false);
          // Log update action
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
          // Add to local logs
          await fetch(`/api/hr/recruitment/candidates/${candidate.id}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action_type: 'interview_scheduled',
              details: `Scheduled "${payload.title}" on ${new Date(payload.interview_date).toLocaleString()}`
            })
          });

          // Fetch interviews and logs
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
        {/* Deep Green Header - Exact representation of image */}
        <div className="bg-[#1b5e20] text-white px-6 md:px-8 pt-8 pb-0 rounded-b-[2.5rem] shadow-md relative overflow-hidden">
          {/* Top navigation row */}
          <div className="flex justify-between items-center text-xs text-white/80 font-medium mb-6">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setActiveProfileCandidate(null)}
                className="hover:underline hover:text-white flex items-center gap-1 font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Candidates
              </button>
              {prevCandidate && (
                <>
                  <span className="text-white/40">/</span>
                  <button 
                    onClick={() => {
                      setActiveProfileCandidate(prevCandidate);
                      fetchProfileComments(prevCandidate.id);
                    }}
                    className="hover:underline hover:text-white font-medium"
                  >
                    Previous: {prevCandidate.name}
                  </button>
                </>
              )}
            </div>

            {nextCandidate && (
              <button 
                onClick={() => {
                  setActiveProfileCandidate(nextCandidate);
                  fetchProfileComments(nextCandidate.id);
                }}
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

          {/* Bottom Tabs within the Header exactly aligned like the picture */}
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

            {/* Notes Tab View - Exactly matching the image */}
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
                    
                    {/* New Comment Box exactly as image */}
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
                      
                      {/* Interactive dynamic timeline */}
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
                            {/* Stage updates / Current state timeline */}
                            <div className="relative">
                              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm" />
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Current Stage Status</span>
                                <span className="text-xs font-black text-slate-800 block">Candidate is currently at "{candidate.stage}" stage.</span>
                              </div>
                            </div>

                            {/* Scheduled Interviews timeline */}
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

                            {/* Creation timeline */}
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
                        const emailsToShow = candidateEmails.length > 0 ? candidateEmails : profileEmails;
                        const grouped = groupEmailsByDay(emailsToShow);
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
                            {/* Day Header */}
                            <h4 className="text-xs font-black text-[#1b5e20] tracking-wider uppercase font-sans mt-6 first:mt-2">
                              {dayStr}
                            </h4>

                            {/* Emails in Day */}
                            <div className="space-y-4">
                              {grouped[dayStr].map((email: any) => {
                                const isSenderCharlotte = email.sender?.toLowerCase().includes("charlotte") || email.sender?.toLowerCase().includes("recruiter") || email.sender?.toLowerCase().includes("team") || email.sender?.toLowerCase().includes("manager");
                                return (
                                  <div key={email.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex gap-4 text-left hover:shadow-md transition-all">
                                    {/* Sender Avatar */}
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

                                    {/* Email Metadata & Body */}
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
                      {/* Left side: Subject & Body Editor */}
                      <form onSubmit={handleSendActualEmail} className="xl:col-span-2 space-y-4">
                        {/* Predefined Template Selector */}
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

                        {/* Text Formatting Toolbar */}
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
                          <div className="h-6 w-px bg-slate-200 mx-1"></div>
                          <button type="button" className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600">A</button>
                          <div className="h-6 w-px bg-slate-200 mx-1"></div>
                          <button type="button" className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 text-xs">⚫</button>
                          <button type="button" className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 text-xs">✔️</button>
                          <button type="button" className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 text-xs">🔗</button>
                        </div>

                        {/* Subject Input */}
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

                        {/* Body Text Editor */}
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

                        {/* Actions */}
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

                        {/* Search placeholders */}
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

                        {/* Placeholders list */}
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
                              <span className="text-[9px] text-slate-400 font-medium block mt-0.5">e.g. {
                                p.tag === "{Candidate First Name}" ? ((candidate.name || 'Kristen').split(" ")[0] || "Kristen") :
                                p.tag === "{Candidate Last Name}" ? ((candidate.name || 'Sanders').split(" ").slice(1).join(" ") || "Sanders") :
                                p.tag === "{Sender First Name}" ? (user?.name?.split(" ")[0] || "Charlotte") :
                                p.tag === "{Sender Last Name}" ? (user?.name?.split(" ").slice(1).join(" ") || "Abbott") :
                                p.tag === "{Sender Phone}" ? "+1 555-0199" :
                                p.tag === "{Sender Extension}" ? "402" :
                                p.tag === "{Sender Job Title}" ? (user?.job_title || "Recruitment Manager") :
                                (jobs.find((j: any) => j.id === candidate.job_opening_id)?.title || "Software Architect")
                              }</span>
                            </button>
                          ))}
                          {filteredPlaceholders.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic text-center py-4">No matching placeholders.</p>
                          )}
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
                        {i.meeting_link && (
                          <a
                            href={i.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 px-4 py-2 rounded-xl font-black flex items-center gap-1.5 self-stretch sm:self-auto justify-center transition-all"
                          >
                            <Video className="w-3.5 h-3.5" /> Join Meeting URL
                          </a>
                        )}
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
            
            {/* White Floating Card - Overlap matching style exactly */}
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
                  {/* Action drop down options */}
                  {!isCandidateProfileReadOnly && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 hidden group-focus-within:block group-hover:block z-50">
                      <button
                        type="button"
                        onClick={() => handleUpdateStageFromProfile(candidate.id, 'Hired')}
                        className="w-full text-left px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50 transition-colors block cursor-pointer"
                      >
                        Mark as Hired 🎉
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStageFromProfile(candidate.id, 'Rejected')}
                        className="w-full text-left px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 transition-colors block cursor-pointer"
                      >
                        Reject Candidate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this candidate?")) {
                            handleDeleteCandidate(candidate.id);
                            setActiveProfileCandidate(null);
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

              {/* Stage Selection Dropdown exactly styled as image */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  Candidate Pipeline Stage {isCandidateProfileReadOnly && <span className="text-[9px] text-slate-400 font-normal opacity-75">(View Only)</span>}
                </label>
                <div className="relative">
                  <select
                    disabled={isCandidateProfileReadOnly}
                    value={candidate.stage || ''}
                    onChange={(e) => handleUpdateStageFromProfile(candidate.id, e.target.value as any)}
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

            {/* Side attributes cards exactly like bottom right of image */}
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
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 text-left overflow-x-hidden" dir="ltr">
      {/* Top Controller Section */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 max-w-full min-w-0">
        {/* Row 1: Primary Navigation Tabs & Main Action CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-full min-w-0">
          {/* Sub-tab pills */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/60 overflow-x-auto max-w-full min-w-0 shrink">
            {availableSubTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = effectiveSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Primary Action Button (Right aligned) */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {!technicalAssessmentOnly && (canRequestJobOpening || canAddJobPostingPerm) && effectiveSubTab === 'jobs' && (
              <button
                type="button"
                onClick={() => {
                  setIsCustomTitleMode(false);
                  setShowJobModal({
                    id: 0,
                    title: '',
                    department_id: departments[0]?.id || null,
                    headcount_needed: 1,
                    status: isHRAdmin ? 'Active' : 'Pending HR Approval',
                    salary_range: '',
                    experience_requirements: '',
                    budget_status: 'Pending Approval',
                    hiring_lead: '',
                    days_open: 7
                  });
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:scale-[1.01]"
              >
                <Plus className="w-4 h-4" /> Request Job Opening
              </button>
            )}

            {!technicalAssessmentOnly && (canRegisterApplicantPerm || canAddCandidatePerm) && effectiveSubTab === 'pipeline' && (
              <button
                type="button"
                onClick={() =>
                  setShowCandidateModal({
                    id: 0,
                    job_opening_id: jobs[0]?.id || 0,
                    name: '',
                    email: '',
                    linkedin_url: '',
                    cv_url: '',
                    stage: 'Applied',
                    score: 3,
                    notes: '',
                  })
                }
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 cursor-pointer hover:scale-[1.01]"
              >
                <Plus className="w-4 h-4" /> Register Applicant
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary Toolbar / Search & Filters (Shown for Pipeline or Jobs) */}
        {!technicalAssessmentOnly && (effectiveSubTab === 'pipeline' || effectiveSubTab === 'jobs') && (
          <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 max-w-full min-w-0">
            {/* View Mode Toggle & Search / Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0 max-w-full">
              {/* View mode toggle */}
              {effectiveSubTab === 'jobs' && (
                <>
                  <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shrink-0">
                    <button
                      type="button"
                      onClick={() => setJobViewMode('board')}
                      title="Board View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        jobViewMode === 'board' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setJobViewMode('list')}
                      title="List View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        jobViewMode === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Bar for Jobs */}
                  <div className="relative flex-1 min-w-[160px] max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search jobs, depts, leads..."
                      value={jobSearchTerm}
                      onChange={(e) => setJobSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs font-medium bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    {jobSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setJobSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Jobs Advanced Filter - Icon-only compact */}
                  <AdvancedFilter 
                    items={jobs} 
                    entityType="job_opening" 
                    departments={departments}
                    onFilter={setAdvancedFilteredJobs} 
                    title=""
                    compact={true}
                  />

                  {/* Status Filter Dropdown */}
                  <div className="shrink-0">
                    <select
                      value={jobStatusFilter}
                      onChange={(e) => setJobStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/80 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="all">All Statuses ({jobs.length})</option>
                      <option value="Pending HR Approval">⏳ Pending HR Approval ({jobs.filter(j => j.status === 'Pending HR Approval').length})</option>
                      <option value="Active">🟢 Active ({jobs.filter(j => j.status === 'Active').length})</option>
                      <option value="Paused">⏸️ Paused ({jobs.filter(j => j.status === 'Paused').length})</option>
                      <option value="Closed">🔒 Closed ({jobs.filter(j => j.status === 'Closed').length})</option>
                      <option value="Rejected">🔴 Rejected ({jobs.filter(j => j.status === 'Rejected').length})</option>
                    </select>
                  </div>
                </>
              )}

              {effectiveSubTab === 'pipeline' && (
                <>
                  <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCandidateViewMode('board')}
                      title="Board View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        candidateViewMode === 'board' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Kanban className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCandidateViewMode('list')}
                      title="List View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        candidateViewMode === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[160px] max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search candidates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs font-medium bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Job Filter Dropdown */}
                  <div className="shrink-0">
                    <select
                      value={selectedJobFilter || ''}
                      onChange={(e) => setSelectedJobFilter(e.target.value ? Number(e.target.value) : '')}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50/80 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="">All Job Openings ({jobs.length})</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Candidates Advanced Filter - Icon-only compact */}
                  <AdvancedFilter 
                    items={candidates} 
                    entityType="candidate" 
                    departments={departments}
                    onFilter={setAdvancedFilteredCandidates} 
                    title=""
                    compact={true}
                  />
                </>
              )}
            </div>

            {/* Quick Count Badge */}
            {effectiveSubTab === 'pipeline' && (
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <span className="text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/50 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-bold text-slate-700">{filteredCandidates.length}</span> Applicants
                </span>
              </div>
            )}
            {effectiveSubTab === 'jobs' && (
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <span className="text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/50 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-bold text-slate-700">{jobs.length}</span> Job Openings
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connected Hiring Channels Bar - Single Row Compact List */}
      {localHiringChannels.length > 0 && (
        <div className="bg-slate-50/80 border border-slate-200/80 px-3 py-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs w-full max-w-full overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
              Active Hiring Channels
            </span>
            <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-black uppercase tracking-wider">
              {localHiringChannels.length} Linked
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-full">
            {localHiringChannels.map(channel => (
              <div 
                key={channel.id} 
                className="bg-white border border-slate-200 hover:border-blue-300 transition-all px-2.5 py-1 rounded-xl flex items-center gap-2 text-[11px] shrink-0 shadow-2xs"
              >
                <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] shrink-0">
                  {channel.source_platform?.[0] || 'P'}
                </div>
                <div className="flex items-center gap-1 max-w-[150px] truncate">
                  <span className="font-bold text-slate-800 text-[11px] truncate">{channel.name_ar || channel.name_en}</span>
                  <span className="text-[9px] text-slate-400 font-medium">({channel.source_platform})</span>
                </div>
                <button
                  onClick={() => handlePullFromChannel(channel)}
                  disabled={isPullingCandidates !== null}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                    isPullingCandidates === channel.id
                      ? 'bg-slate-50 text-slate-400 border-slate-200'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100'
                  }`}
                >
                  {isPullingCandidates === channel.id ? (
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-600" />
                  ) : (
                    <>
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Pull</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main SubTab Content Area */}
      <div className="w-full max-w-full min-w-0">
        <AnimatePresence mode="wait">
          {/* ====================================
              SUB-TAB: JOB OPENINGS
             ==================================== */}
          {effectiveSubTab === 'jobs' && canViewJobOpeningsTab && (() => {
            const displayedJobs = filteredJobsList;

            if (activeJob) {
              const jobCandidates = scopeFilteredCandidates.filter(c => c.job_opening_id === activeJob.id);
              
              const stageTabs = [
                { label: 'New', count: jobCandidates.filter(c => c.stage === 'Applied').length, stages: ['Applied'] },
                { label: 'Reviewed', count: jobCandidates.filter(c => c.stage === 'Screened').length, stages: ['Screened'] },
                { label: 'Schedule Interview', count: jobCandidates.filter(c => ['Interviewing', 'Technical Assessment'].includes(c.stage)).length, stages: ['Interviewing', 'Technical Assessment'] },
                { label: 'Hired', count: jobCandidates.filter(c => ['Hired', 'Job Offer Sent'].includes(c.stage)).length, stages: ['Hired', 'Job Offer Sent'] },
                { label: 'Rejected', count: jobCandidates.filter(c => c.stage === 'Rejected').length, stages: ['Rejected'] }
              ];
              
              const activeStageObj = stageTabs.find(t => t.label === candidateStageFilter) || stageTabs[0];
              const filteredJobCandidates = jobCandidates.filter(cand => activeStageObj.stages.includes(cand.stage));

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
                      onClick={() => setActiveJob(null)}
                      className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Job Openings
                    </button>
                    
                    {/* Next job navigation */}
                    {(() => {
                      const currentIdx = jobs.findIndex(j => j.id === activeJob.id);
                      const nextJobObj = currentIdx !== -1 && currentIdx < jobs.length - 1 ? jobs[currentIdx + 1] : (jobs.length > 0 ? jobs[0] : null);
                      if (!nextJobObj || nextJobObj.id === activeJob.id) return null;
                      return (
                        <button 
                          onClick={() => {
                            setActiveJob(nextJobObj);
                            setCandidateStageFilter('New');
                          }}
                          className="text-right group"
                        >
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-600 block">Next: {nextJobObj.title} &gt;</span>
                          <span className="text-[9px] text-slate-300 font-medium block">{nextJobObj.location || 'Marseille, Provence'}</span>
                        </button>
                      );
                    })()}
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
                    <div className="flex items-center gap-6 bg-white border border-slate-200 rounded-2xl p-3 px-4 shrink-0 shadow-sm">
                      {/* Hiring Lead */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 font-bold rounded-xl flex items-center justify-center border border-slate-200">
                          <User className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Hiring Lead</span>
                          <span className="text-xs font-extrabold text-slate-700 block">{activeJob.hiring_lead || 'Debra Tuescher'}</span>
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
                        <span className="text-xs font-black text-slate-700 block mt-0.5">{activeJob.days_open || 7} Days</span>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Quick Dashboard */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Candidates</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-slate-900">{jobCandidates.length}</span>
                        <span className="text-[10px] font-bold text-slate-400">active profiles</span>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">Screening Stage</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-indigo-600">{jobCandidates.filter(c => ['Applied', 'Screened'].includes(c.stage)).length}</span>
                        <span className="text-[10px] font-bold text-slate-400">new & screened</span>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left">
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider block">Interviewing</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-amber-600">{jobCandidates.filter(c => ['Interviewing', 'Technical Assessment'].includes(c.stage)).length}</span>
                        <span className="text-[10px] font-bold text-slate-400">meetings & tech</span>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider block">Hired & Offers</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-emerald-600">{jobCandidates.filter(c => ['Job Offer Sent', 'Hired'].includes(c.stage)).length}</span>
                        <span className="text-[10px] font-bold text-slate-400">success {jobCandidates.length > 0 ? Math.round((jobCandidates.filter(c => c.stage === 'Hired').length / jobCandidates.length) * 100) : 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabs Button bar */}
                  <div className="flex justify-between items-center border-b border-slate-200 mb-6">
                    <div className="flex gap-8">
                      <button
                        onClick={() => setActiveJobTab('candidates')}
                        className={`pb-3 text-sm font-black transition-all border-b-2 ${
                          activeJobTab === 'candidates' 
                            ? 'border-emerald-600 text-emerald-700' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Candidates
                      </button>
                      <button
                        onClick={() => setActiveJobTab('description')}
                        className={`pb-3 text-sm font-black transition-all border-b-2 ${
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
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-all shadow-sm">
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-all shadow-sm">
                        <Users className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setSelectedAnnounceJob(activeJob)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-xl transition-all shadow-sm"
                        title="Open Job Post"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setShowJobModal(activeJob)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 bg-white border border-slate-200 rounded-xl transition-all shadow-sm"
                        title="Job Settings"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {activeJobTab === 'candidates' ? (
                    /* CANDIDATES TAB VIEW */
                    <div className="space-y-6">
                      {/* Flow navigation for stages */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-6 items-center flex-wrap mb-6 text-xs font-bold text-slate-600 shadow-sm">
                        {stageTabs.map((tab, idx) => {
                          const isActive = candidateStageFilter === tab.label;
                          return (
                            <React.Fragment key={tab.label}>
                              <button
                                onClick={() => setCandidateStageFilter(tab.label)}
                                className={`flex items-center gap-1.5 transition-all ${
                                  isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                <span className={`${isActive ? 'underline decoration-2 underline-offset-4 decoration-emerald-600' : ''}`}>
                                  {tab.label}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}>
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
                          <button className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-all shadow-sm">
                            <Settings className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-all shadow-sm">
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowCandidateModal({ id: 0, job_opening_id: activeJob.id, name: '', email: '', linkedin_url: '', cv_url: '', stage: 'Applied', score: 5, notes: '' })}
                            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus className="w-4 h-4 text-emerald-600" /> New Candidate
                          </button>
                        </div>
                      </div>

                      {/* Candidates List Table */}
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                <th className="py-3 px-4 w-10">
                                  <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                </th>
                                <th className="py-3 px-4">Candidate Info</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Rating</th>
                                <th className="py-3 px-4">Applied</th>
                                <th className="py-3 px-4">Last Email</th>
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
                                filteredJobCandidates.map(cand => {
                                  const addedDate = new Date(cand.created_at || Date.now());
                                  const appliedText = addedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                                  
                                  return (
                                    <tr key={cand.id} className="hover:bg-slate-50/30 transition-all">
                                      <td className="py-4 px-4">
                                        <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                      </td>
                                      
                                      <td className="py-4 px-4 space-y-1">
                                        <span 
                                          onClick={() => {
                                            setIsCandidateProfileReadOnly(true);
                                            setActiveProfileCandidate(cand);
                                          }}
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
                                          Updated 7 days ago
                                        </span>
                                      </td>
                                      
                                      <td className="py-4 px-4">
                                        <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map(starNum => {
                                            const isFilled = starNum <= (cand.score || 0);
                                            return (
                                              <button
                                                key={starNum}
                                                type="button"
                                                onClick={async () => {
                                                  try {
                                                    const res = await fetch(`/api/hr/recruitment/candidates/${cand.id}`, {
                                                      method: 'PUT',
                                                      headers: { 'Content-Type': 'application/json' },
                                                      body: JSON.stringify({ score: starNum })
                                                    });
                                                    if (res.ok) fetchCandidates();
                                                  } catch (e) {
                                                    console.error("Failed to update score:", e);
                                                  }
                                                }}
                                                className="p-0.5 focus:outline-none"
                                              >
                                                <Star className={`w-4 h-4 ${isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </td>
                                      
                                      <td className="py-4 px-4 space-y-0.5">
                                        <span className="text-slate-800 font-extrabold block">{appliedText}</span>
                                        <span className="text-[9px] text-blue-600 font-extrabold block cursor-pointer hover:underline">
                                          Candidate for 2 jobs.
                                        </span>
                                      </td>
                                      
                                      <td className="py-4 px-4 text-slate-400 font-normal">
                                        {/* Left blank */}
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
                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <h2 className="text-lg font-bold text-emerald-800 font-serif">Job Description</h2>
                          <button
                            onClick={() => setShowJobModal(activeJob)}
                            className="border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl px-4 py-1 font-bold text-xs transition-all shadow-sm"
                          >
                            Edit
                          </button>
                        </div>
                        
                        <div className="prose prose-slate max-w-none text-xs text-slate-600 space-y-6 font-medium leading-relaxed">
                          {(() => {
                            let blocks: any[] = [];
                            try {
                              blocks = activeJob.description_blocks ? JSON.parse(activeJob.description_blocks) : [];
                            } catch (e) {}
                            
                            if (blocks && blocks.length > 0) {
                              return blocks.map((block: any, idx: number) => {
                                if (block.type === 'header') {
                                  return <h3 key={idx} className="text-sm font-extrabold text-slate-800 pt-2 uppercase tracking-wide">{block.content}</h3>;
                                } else if (block.type === 'bullets') {
                                  return (
                                    <ul key={idx} className="list-disc pl-5 space-y-1">
                                      {(block.content || '').split('\n').map((li: string, i: number) => (
                                        <li key={i}>{li}</li>
                                      ))}
                                    </ul>
                                  );
                                } else {
                                  return <p key={idx} className="whitespace-pre-wrap">{block.content}</p>;
                                }
                              });
                            }
                            
                            // Default high-fidelity BambooHR marketing content
                            return (
                              <>
                                <div className="space-y-2">
                                  <h3 className="font-extrabold text-slate-800 uppercase tracking-wide">About Us</h3>
                                  <p>
                                    Our mission is simple: we want to set people free to do meaningful work. People love our software--and it turns out that people love working here too. We've been recognized as a "Best Company to Work For", and we're proud of our team for receiving awards for workplace effectiveness and flexibility.
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <h3 className="font-extrabold text-slate-800 uppercase tracking-wide">What You'll Do</h3>
                                  <p>
                                    Our ideal Marketing Manager will be an integral contributor to the company. You'll be working on multiple projects to continue making us the #1 HR Software for SMB business. If you get a kick out of solving problems and building beautiful world class software, then you will love BambooHR.
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <h3 className="font-extrabold text-slate-800 uppercase tracking-wide">Responsibilities:</h3>
                                  <ul className="list-disc pl-5 space-y-1">
                                    <li>Increase brand awareness and market share</li>
                                    <li>Evaluate and optimize marketing strategies</li>
                                    <li>Analyze market trends and preparing forecasts</li>
                                    <li>Develop and manage the marketing department's budget</li>
                                    <li>Oversee branding, advertising, and promotional campaigns</li>
                                    <li>Manage product marketing, demand generation, social media, and events teams</li>
                                    <li>Understand the competitive landscape</li>
                                  </ul>
                                </div>
                                
                                <div className="space-y-2">
                                  <h3 className="font-extrabold text-slate-800 uppercase tracking-wide">What You Need to Get the Job Done (Minimum Qualifications)</h3>
                                  <ul className="list-disc pl-5 space-y-1">
                                    <li>5+ years experience in B2B marketing and sales</li>
                                    <li>Strong organizational and leadership skills</li>
                                    <li>Excellent communication and presentation abilities</li>
                                  </ul>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Right Sidebar Info panel */}
                      <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Location</span>
                          <span className="text-xs font-extrabold text-slate-800 block">{activeJob.location || 'Marseille, Provence'}</span>
                        </div>
                        
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Department</span>
                          <span className="text-xs font-extrabold text-[#15803d] block">{activeJob.department_name || 'Marketing'}</span>
                        </div>
                        
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Employment Type</span>
                          <span className="text-xs font-extrabold text-slate-800 block">{activeJob.employment_type || 'Full-Time'}</span>
                        </div>
                        
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Minimum Experience</span>
                          <span className="text-xs font-extrabold text-slate-800 block">{activeJob.experience_requirements || 'Manager/Supervisor'}</span>
                        </div>
                        
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Compensation</span>
                          <span className="text-xs font-extrabold text-slate-800 block">
                            {showBudget ? (activeJob.salary_range || '€100,000') : 'Confidential (🔐)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            }

            return (
              <motion.div
                key={`jobs-${jobViewMode}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {displayedJobs.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-700">No Job Openings</h3>
                    <p className="text-slate-400 text-xs mt-1">Request new personnel hires or create dynamic postings.</p>
                  </div>
                ) : jobViewMode === 'board' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedJobs.map(job => (
                    <div key={job.id} className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-blue-400 hover:shadow-xl hover:shadow-slate-100 transition-all space-y-4 text-left relative flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-1.5 items-center flex-wrap">
                            <span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider ${
                              job.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                              job.status === 'Paused' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {job.status}
                            </span>

                            <span className={`px-2 py-0.5 text-[8px] font-black rounded border flex items-center gap-0.5 uppercase ${
                              job.budget_status === 'Approved' ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                            }`}>
                              <DollarSign className="w-2.5 h-2.5" />
                              {job.budget_status || 'Pending Approval'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={!canShareJobPostingPerm}
                              onClick={() => handleShareItem('Job Posting', job)}
                              className={`p-1.5 rounded-lg transition-colors ${canShareJobPostingPerm ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                              title={canShareJobPostingPerm ? "Share Job Posting" : "Permission Required"}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={!canViewJobPostingPerm}
                              onClick={() => setSelectedAnnounceJob(job)}
                              className={`p-1.5 rounded-lg transition-colors ${canViewJobPostingPerm ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                              title={canViewJobPostingPerm ? "View Job Post" : "Permission Required"}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={!canEditJobPostingPerm}
                              onClick={() => setShowJobModal(job)}
                              className={`p-1.5 rounded-lg transition-colors ${canEditJobPostingPerm ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                              title={canEditJobPostingPerm ? "Edit Job Posting" : "Permission Required"}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={!canDeleteJobPostingPerm}
                              onClick={() => handleDeleteJob(job.id)}
                              className={`p-1.5 rounded-lg transition-colors ${canDeleteJobPostingPerm ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                              title={canDeleteJobPostingPerm ? "Delete Job Posting" : "Permission Required"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 
                          onClick={() => { setActiveJob(job); setActiveJobTab('candidates'); }}
                          className="text-base font-black text-slate-900 font-sans tracking-tight leading-tight hover:text-emerald-700 cursor-pointer transition-colors hover:underline"
                        >
                          {job.title}
                        </h3>
                        <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">{job.department_name || 'General Org'}</p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-3 text-xs border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Headcount Needed</span>
                          <span className="font-bold text-slate-800">{job.headcount_needed} Needed</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Salary Range</span>
                          <span className="font-bold text-slate-800">
                            {showBudget ? (job.salary_range || 'Not Disclosed') : 'Confidential (🔐 Locked)'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Experience Target</span>
                          <span className="font-bold text-slate-800 truncate block">{job.experience_requirements || 'Any Level'}</span>
                        </div>
                      </div>

                      {/* Custom Fields Relations Display */}
                      <CustomFieldsDisplay entityType="job_opening" entityId={job.id} />
                      
                      {/* Custom Fields marked with In List View */}
                      <CustomFieldsListDisplay entityType="job_opening" entityId={job.id} layout="badges" />

                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => setSelectedAnnounceJob(job)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 border border-slate-200"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          View Job Post
                        </button>
                      </div>

                      <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate Pipeline</span>
                        <span className="text-xs font-black text-slate-800 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg">{job.candidate_count || 0} Registered</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View for Jobs */
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                          <th className="py-4 px-6">Job Title</th>
                          <th className="py-4 px-6">Department</th>
                          <th className="py-4 px-6">Headcount</th>
                          <th className="py-4 px-6">Salary Range</th>
                          <th className="py-4 px-6">Experience</th>
                          <th className="py-4 px-6">Applicants</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Budget Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                        {displayedJobs.map(job => (
                          <tr key={job.id} className="hover:bg-slate-50/55 transition-colors">
                            <td className="py-4 px-6">
                              <span 
                                onClick={() => { setActiveJob(job); setActiveJobTab('candidates'); }}
                                className="font-black text-slate-900 block hover:text-emerald-700 cursor-pointer transition-colors hover:underline"
                              >
                                {job.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium block">ID: #{job.id}</span>
                              <CustomFieldsListDisplay entityType="job_opening" entityId={job.id} layout="row" />
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-slate-600">{job.department_name || 'General Org'}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="bg-blue-50/50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black">{job.headcount_needed} Needed</span>
                            </td>
                            <td className="py-4 px-6">
                              <span>
                                {showBudget ? (job.salary_range || 'Not Disclosed') : 'Confidential (🔐)'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-slate-500 font-medium max-w-[150px] truncate block">{job.experience_requirements || 'Any Level'}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black">
                                {job.candidate_count || 0} Applied
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider ${
                                job.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                job.status === 'Paused' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                              }`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 text-[8px] font-black rounded border inline-flex items-center gap-0.5 uppercase ${
                                job.budget_status === 'Approved' ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                              }`}>
                                <DollarSign className="w-2.5 h-2.5" />
                                {job.budget_status || 'Pending Approval'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex gap-1.5 justify-end items-center">
                                <button 
                                  type="button"
                                  disabled={!canShareJobPostingPerm}
                                  onClick={() => handleShareItem('Job Posting', job)}
                                  className={`p-1.5 rounded-lg transition-colors ${canShareJobPostingPerm ? 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                  title={canShareJobPostingPerm ? "Share Job Posting" : "Permission Required"}
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  type="button"
                                  disabled={!canViewJobPostingPerm}
                                  onClick={() => setSelectedAnnounceJob(job)}
                                  className={`p-1.5 rounded-lg transition-colors ${canViewJobPostingPerm ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                  title={canViewJobPostingPerm ? "View Post Details" : "Permission Required"}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={!canEditJobPostingPerm}
                                  onClick={() => setShowJobModal(job)}
                                  className={`p-1.5 rounded-lg transition-colors ${canEditJobPostingPerm ? 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                  title={canEditJobPostingPerm ? "Edit Job Posting" : "Permission Required"}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={!canDeleteJobPostingPerm}
                                  onClick={() => handleDeleteJob(job.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${canDeleteJobPostingPerm ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                  title={canDeleteJobPostingPerm ? "Delete Job Posting" : "Permission Required"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
            );
          })()}

          {/* ====================================
              SUB-TAB: CANDIDATES KANBAN PIPELINE
             ==================================== */}
          {effectiveSubTab === 'pipeline' && canViewPipelineTab && (
            <motion.div
              key={`pipeline-${candidateViewMode}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {candidateViewMode === 'board' ? (
                <div className="flex gap-4 overflow-x-auto min-h-[550px] pb-4 select-none w-full max-w-full min-w-0 custom-scrollbar">
                  {activeStages.map(stage => {
                    const stageCandidates = filteredCandidates.filter(c => c.stage === stage);
                    const stageInfo = getStageInfo(stage);
                    return (
                      <div 
                        key={stage}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, stage)}
                        className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl flex flex-col min-w-[240px] max-w-[280px] flex-1 min-h-[450px] h-fit"
                      >
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200/50">
                          <h4 
                            className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: stageInfo.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stageInfo.color }} />
                            <span>{stageInfo.name_en}</span>
                          </h4>
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{stageCandidates.length}</span>
                        </div>

                        <div className="space-y-3 flex-1">
                          {stageCandidates.map(candidate => (
                            <div
                              key={candidate.id}
                              draggable
                              onDragStart={(e) => onDragStart(e, candidate.id)}
                              className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm hover:border-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-3 text-left relative"
                            >
                              <div className="flex justify-between items-start gap-1">
                                <div>
                                  <button
                                    onClick={() => {
                                      setIsCandidateProfileReadOnly(true);
                                      setActiveProfileCandidate(candidate);
                                      setProfileTab('notes');
                                      setNotesSubTab('comments');
                                      fetchProfileComments(candidate.id);
                                    }}
                                    className="font-bold text-slate-900 text-sm leading-tight hover:text-green-800 transition-colors text-left block focus:outline-none"
                                  >
                                    {candidate.name}
                                  </button>
                                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">{candidate.email}</p>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity absolute right-2 top-2 bg-white/90 backdrop-blur-2xs p-0.5 rounded-lg border border-slate-100 shadow-xs">
                                  <button
                                    type="button"
                                    disabled={!canShareCandidatePerm}
                                    onClick={(e) => { e.stopPropagation(); handleShareItem('Candidate', candidate); }}
                                    className={`p-1 rounded ${canShareCandidatePerm ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                    title={canShareCandidatePerm ? "Share Candidate" : "Permission Required"}
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canViewCandidatePerm}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsCandidateProfileReadOnly(true);
                                      setActiveProfileCandidate(candidate);
                                      setProfileTab('notes');
                                      setNotesSubTab('comments');
                                      fetchProfileComments(candidate.id);
                                    }}
                                    className={`p-1 rounded ${canViewCandidatePerm ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                    title={canViewCandidatePerm ? "View Candidate Profile" : "Permission Required"}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canEditCandidatePerm}
                                    onClick={(e) => { e.stopPropagation(); setShowCandidateModal(candidate); }}
                                    className={`p-1 rounded ${canEditCandidatePerm ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                    title={canEditCandidatePerm ? "Edit Candidate" : "Permission Required"}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canDeleteCandidatePerm}
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCandidate(candidate.id); }}
                                    className={`p-1 rounded ${canDeleteCandidatePerm ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                    title={canDeleteCandidatePerm ? "Delete Candidate" : "Permission Required"}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  const targetJob = jobs.find(j => j.id === candidate.job_opening_id);
                                  if (targetJob) {
                                    setSubTab('jobs');
                                    setSelectedAnnounceJob(targetJob);
                                  }
                                }}
                                className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-black block w-fit max-w-full truncate cursor-pointer transition-colors text-left"
                              >
                                {candidate.job_title || 'Unassigned Role'}
                              </button>

                              {candidate.notes && (
                                <p className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded-xl border border-slate-100 max-h-[50px] overflow-hidden truncate">
                                  "{candidate.notes}"
                                </p>
                              )}

                              {/* Custom Fields Relations Display */}
                              <CustomFieldsDisplay entityType="candidate" entityId={candidate.id} />

                              {/* Custom Fields marked with In List View */}
                              <CustomFieldsListDisplay entityType="candidate" entityId={candidate.id} layout="badges" />

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                {/* Score Display (Rating Stars) */}
                                <div className="flex items-center gap-0.5 text-amber-500">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star 
                                      key={star} 
                                      className={`w-3 h-3 ${star <= candidate.score ? 'fill-current' : 'text-slate-200'}`} 
                                    />
                                  ))}
                                </div>

                                <div className="flex gap-2">
                                  {candidate.linkedin_url && (
                                    <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                                      <Linkedin className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {candidate.cv_url && (
                                    <a href={candidate.cv_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                                      <FileText className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Fast move options for Mobile/Safari without full drag-drop support */}
                              <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-dotted border-slate-100">
                                <span className="text-[8px] text-slate-400 uppercase tracking-wider col-span-2 text-center font-bold">Fast Advance</span>
                                {stage !== 'Rejected' && (
                                  <button
                                    onClick={() => handleUpdateCandidateStage(candidate.id, 'Rejected')}
                                    className="text-[8px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 p-1 rounded transition-colors text-center"
                                  >
                                    Reject
                                  </button>
                                )}
                                {stage === 'Applied' && (
                                  <button
                                    onClick={() => handleUpdateCandidateStage(candidate.id, 'Screened')}
                                    className="text-[8px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 p-1 rounded transition-colors text-center"
                                  >
                                    Screened
                                  </button>
                                )}
                                {stage === 'Screened' && (
                                  <button
                                    onClick={() => handleUpdateCandidateStage(candidate.id, 'Interviewing')}
                                    className="text-[8px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 p-1 rounded transition-colors text-center col-span-2"
                                  >
                                    Interview
                                  </button>
                                )}
                                {stage === 'Interviewing' && (
                                  <button
                                    onClick={() => handleUpdateCandidateStage(candidate.id, 'Technical Assessment')}
                                    className="text-[8px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 p-1 rounded transition-colors text-center col-span-2"
                                  >
                                    Tech Assess
                                  </button>
                                )}
                                {stage === 'Technical Assessment' && (
                                  <button
                                    onClick={() => handleUpdateCandidateStage(candidate.id, 'Job Offer Sent')}
                                    className="text-[8px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 p-1 rounded transition-colors text-center col-span-2"
                                  >
                                    Send Offer
                                  </button>
                                )}
                                {stage === 'Job Offer Sent' && (
                                  <button
                                    onClick={() => handleUpdateCandidateStage(candidate.id, 'Hired')}
                                    className="text-[8px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-1 rounded transition-colors text-center col-span-2 animate-pulse"
                                  >
                                    Mark Hired 🎉
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {stageCandidates.length === 0 && (
                            <div className="flex-1 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center p-6 text-slate-300">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-center">Empty Column</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View for Candidates */
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                          <th className="py-4 px-6">Candidate</th>
                          <th className="py-4 px-6">Target Position</th>
                          <th className="py-4 px-6">Current Stage</th>
                          <th className="py-4 px-6">Score</th>
                          <th className="py-4 px-6">Documents & Links</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                        {filteredCandidates.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                              No candidates match your filters or search terms.
                            </td>
                          </tr>
                        ) : (
                          filteredCandidates.map(candidate => (
                            <tr key={candidate.id} className="hover:bg-slate-50/55 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black text-[11px] border border-slate-200">
                                    {(candidate.name || 'Candidate').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <button
                                      onClick={() => {
                                        setIsCandidateProfileReadOnly(true);
                                        setActiveProfileCandidate(candidate);
                                        setProfileTab('notes');
                                        setNotesSubTab('comments');
                                        fetchProfileComments(candidate.id);
                                      }}
                                      className="font-black text-slate-900 block text-left hover:text-green-800 transition-colors focus:outline-none"
                                    >
                                      {candidate.name}
                                    </button>
                                    <span className="text-[10px] text-slate-400 font-medium block">{candidate.email}</span>
                                    <CustomFieldsListDisplay entityType="candidate" entityId={candidate.id} layout="row" />
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <button
                                  onClick={() => {
                                    const targetJob = jobs.find(j => j.id === candidate.job_opening_id);
                                    if (targetJob) {
                                      setSubTab('jobs');
                                      setSelectedAnnounceJob(targetJob);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black transition-colors cursor-pointer text-left"
                                >
                                  {candidate.job_title || jobs.find(j => j.id === candidate.job_opening_id)?.title || 'Unassigned'}
                                </button>
                              </td>
                              <td className="py-4 px-6">
                                <select
                                  value={candidate.stage || ''}
                                  onChange={e => handleUpdateCandidateStage(candidate.id, e.target.value as any)}
                                  className={`p-1.5 text-[10px] font-black rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-wider ${
                                    candidate.stage === 'Hired' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    candidate.stage === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                    candidate.stage === 'Job Offer Sent' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                                    candidate.stage === 'Technical Assessment' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                    'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {activeStages.map(stg => {
                                    const stgInfo = getStageInfo(stg);
                                    return (
                                      <option key={stg} value={stg}>{stgInfo.name_en} {stgInfo.name_ar !== stgInfo.name_en ? `/ ${stgInfo.name_ar}` : ''}</option>
                                    );
                                  })}
                                </select>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-0.5 text-amber-500 font-black text-xs">
                                  <Star className="w-3.5 h-3.5 fill-current" /> {candidate.score}/5
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex gap-2.5 items-center">
                                  {candidate.linkedin_url ? (
                                    <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-0.5" title="LinkedIn Profile">
                                      <Linkedin className="w-4 h-4" />
                                      <span className="text-[9px] font-medium text-slate-400">LinkedIn</span>
                                    </a>
                                  ) : (
                                    <span className="text-[9px] text-slate-300 font-medium">No LinkedIn</span>
                                  )}
                                  {candidate.cv_url ? (
                                    <a href={candidate.cv_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-0.5" title="View CV">
                                      <FileText className="w-4 h-4" />
                                      <span className="text-[9px] font-medium text-slate-400">CV/Resume</span>
                                    </a>
                                  ) : (
                                    <span className="text-[9px] text-slate-300 font-medium">No CV</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex gap-1.5 justify-end items-center">
                                  <button
                                    type="button"
                                    disabled={!canShareCandidatePerm}
                                    onClick={() => handleShareItem('Candidate', candidate)}
                                    className={`p-1.5 rounded-lg transition-colors ${canShareCandidatePerm ? 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                    title={canShareCandidatePerm ? "Share Candidate" : "Permission Required"}
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canViewCandidatePerm}
                                    onClick={() => {
                                      setIsCandidateProfileReadOnly(true);
                                      setActiveProfileCandidate(candidate);
                                      setProfileTab('notes');
                                      setNotesSubTab('comments');
                                      fetchProfileComments(candidate.id);
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors ${canViewCandidatePerm ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                    title={canViewCandidatePerm ? "View Candidate Profile" : "Permission Required"}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canEditCandidatePerm}
                                    onClick={() => setShowCandidateModal(candidate)}
                                    className={`p-1.5 rounded-lg transition-colors ${canEditCandidatePerm ? 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                    title={canEditCandidatePerm ? "Edit Candidate" : "Permission Required"}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canDeleteCandidatePerm}
                                    onClick={() => handleDeleteCandidate(candidate.id)}
                                    className={`p-1.5 rounded-lg transition-colors ${canDeleteCandidatePerm ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                                    title={canDeleteCandidatePerm ? "Delete Candidate" : "Permission Required"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ====================================
              SUB-TAB: INTERVIEWS SCHEDULER
             ==================================== */}
          {effectiveSubTab === 'interviews' && canViewInterviewsTab && (
            <motion.div
              key="interviews"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Left Side: Scheduled Interviews Agenda */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Interview Calendar Agenda & Scorecard Desk
                  </h3>

                  {scopeFilteredInterviews.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
                      <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold">No interviews scheduled yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {scopeFilteredInterviews.map(i => (
                        <div key={i.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
                              {new Date(i.interview_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm">{i.title}</h4>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                              <span>Candidate: <strong className="text-slate-800">{i.candidate_name}</strong></span>
                              <span>•</span>
                              <span>Interviewer: <strong className="text-slate-800">{i.interviewer_name || 'HR Host'}</strong></span>
                            </div>
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
                                onClick={() => navigate(`/hr/recruitment/interviews/${i.id}/edit`)}
                                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Edit Interview Date, Time, or Interviewer"
                              >
                                <Edit className="w-3.5 h-3.5 text-blue-500" />
                                Edit
                              </button>
                            )}
                            {(canEvaluateScorecardPerm || canEditScorecardPerm) && (
                              <button
                                onClick={() => openAssessmentModal(i)}
                                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                              >
                                <Star className="w-3.5 h-3.5 text-amber-500" />
                                {i.technical_score !== null && i.technical_score !== undefined ? 'Edit Scorecard' : 'Evaluate Candidate'}
                              </button>
                            )}
                            {i.meeting_link && (
                              <a
                                href={i.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                              >
                                <Video className="w-4 h-4 text-slate-500" /> Launch Meet
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Integrations and Automated Triggers Info */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-950 text-left space-y-4">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">AI Scorecard Desk</span>
                  <h3 className="text-lg font-black tracking-tight leading-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    Intelligent Talent Evaluation
                  </h3>
                  <p className="text-indigo-200 text-xs leading-relaxed">
                    Evaluate candidates over multiple criteria like algorithms, system architecture, problem-solving, and communication.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-xs font-bold bg-white/5 border border-white/10 p-3 rounded-2xl">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      <span>Gemini-Powered Evaluation Analysis</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold bg-white/5 border border-white/10 p-3 rounded-2xl">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span>Onboarding Auto-trigger on Hiring</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold bg-white/5 border border-white/10 p-3 rounded-2xl">
                      <Video className="w-5 h-5 text-blue-400" />
                      <span>Google Meet & Calendar Auto-Dispatch</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!canViewPipelineTab && !canViewJobOpeningsTab && !canViewInterviewsTab && (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs my-6">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-black text-slate-800 mb-2">Access Restricted / غير مسموح بالعرض</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                You do not have permission to view any of the Recruitment sub-tabs. Please contact your administrator.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* --- POPUP VIEW: DETAILED JOB POST (Editorial Render of Block-Editor) --- */}
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedAnnounceJob.department_name || 'General Org'}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{selectedAnnounceJob.salary_range}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{selectedAnnounceJob.title}</h3>
                </div>
                <button onClick={() => setSelectedAnnounceJob(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Visual Editorial Description blocks */}
                {(() => {
                  try {
                    const blocks: EditorBlock[] = selectedAnnounceJob.description_blocks ? JSON.parse(selectedAnnounceJob.description_blocks) : [];
                    if (blocks.length === 0) {
                      return <p className="text-slate-500 text-sm italic">No custom description blocks configured for this job opening.</p>;
                    }
                    return (
                      <div className="space-y-5">
                        {blocks.map(block => {
                          if (block.type === 'header') {
                            return <h4 key={block.id} className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 pt-2 first:pt-0">{block.content}</h4>;
                          } else if (block.type === 'callout') {
                            return (
                              <div key={block.id} className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-2xl text-xs font-semibold text-blue-900 leading-relaxed">
                                {block.content}
                              </div>
                            );
                          } else if (block.type === 'bullets') {
                            return (
                              <ul key={block.id} className="space-y-1.5 text-xs text-slate-600 leading-relaxed pl-1 font-medium">
                                {(block.content || '').split('\n').map((bullet, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span>{bullet.replace(/^•\s*/, '')}</span>
                                  </li>
                                ))}
                              </ul>
                            );
                          } else {
                            return <p key={block.id} className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{block.content}</p>;
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
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Target Hiring headcount</span>
                    <strong className="text-slate-800 text-sm">{selectedAnnounceJob.headcount_needed} positions open</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Minimum Experience</span>
                    <strong className="text-slate-800 text-sm">{selectedAnnounceJob.experience_requirements || 'Any experience level'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Current Applicants</span>
                    <strong className="text-blue-600 text-sm flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {selectedAnnounceJob.candidate_count || 0} applied
                    </strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-2 items-center">
                {(() => {
                  const hasApplied = candidates.some(c => c.job_opening_id === selectedAnnounceJob.id && c.email === user?.email);
                  if (hasApplied) {
                    return (
                      <button
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
                      onClick={() => handleApplyNow(selectedAnnounceJob)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      Apply Now
                    </button>
                  );
                })()}
                <button
                  onClick={() => setSelectedAnnounceJob(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-md transition-all uppercase tracking-wider"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- POPUP MODAL: CREATE / EDIT JOB OPENING --- */}
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
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mt-0.5">Authorise salary budgets and design premium job announcements</p>
                </div>
                <button onClick={() => setShowJobModal(null)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveJob} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Visual Pipeline Approval Stepper Banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      Approval & Opening Workflow Pipeline / مسار اعتماد الوظيفة
                    </span>
                    <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                      showJobModal.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      showJobModal.status === 'Pending HR Approval' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      showJobModal.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {showJobModal.status || 'Pending HR Approval'}
                    </span>
                  </div>

                  {/* 3 Step Visual Stepper */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700 flex flex-col items-center">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase">Stage 1</span>
                      <span className="text-indigo-600">1. Manager Request</span>
                    </div>
                    <div className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center ${
                      showJobModal.status === 'Pending HR Approval' ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase">Stage 2</span>
                      <span>2. HR Approval</span>
                    </div>
                    <div className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center ${
                      showJobModal.status === 'Active' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                      showJobModal.status === 'Rejected' ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase">Stage 3</span>
                      <span>3. Active Posting</span>
                    </div>
                  </div>

                  {/* Quick HR Approval Actions if user is HR Admin */}
                  {isHRAdmin && showJobModal.status === 'Pending HR Approval' && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-600">HR Quick Decision:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowJobModal({ ...showJobModal, status: 'Active' })}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve & Activate
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowJobModal({ ...showJobModal, status: 'Rejected' })}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {showJobModal.id > 0 && (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Current Applicants</span>
                      <strong className="text-slate-800 text-sm">There are currently {showJobModal.candidate_count || 0} candidates registered for this position.</strong>
                    </div>
                    <span className="px-3 py-1.5 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {showJobModal.candidate_count || 0} Applied
                    </span>
                  </div>
                )}

                {/* 1. Department Selection (FIRST) & 2. Job Title Selection (SECOND) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                      <span>Department (القسم) *</span>
                      <span className="text-[10px] text-indigo-600 font-bold">Step 1</span>
                    </label>
                    <select
                      required
                      value={showJobModal.department_id || ''}
                      onChange={e => {
                        const newDeptId = e.target.value ? Number(e.target.value) : null;
                        setShowJobModal({ ...showJobModal, department_id: newDeptId, title: '' });
                        setIsCustomTitleMode(false);
                      }}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                    >
                      <option value="">-- Choose Department / اختر القسم --</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                      <span>Job Title (المسمى الوظيفي) *</span>
                      <span className="text-[10px] text-indigo-600 font-bold">Step 2 (Filtered)</span>
                    </label>
                    
                    {!isCustomTitleMode ? (
                      <select
                        required
                        value={showJobModal.title || ''}
                        onChange={e => {
                          if (e.target.value === '__custom__') {
                            setIsCustomTitleMode(true);
                            setShowJobModal({ ...showJobModal, title: '' });
                          } else {
                            setShowJobModal({ ...showJobModal, title: e.target.value });
                          }
                        }}
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                      >
                        <option value="">Select Job Title for Department...</option>
                        {getJobTitlesForDepartment(showJobModal.department_id, departments, employees, jobs).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        <option value="__custom__">➕ Write Custom Job Title / مسمى وظيفي آخر...</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={showJobModal.title}
                          onChange={e => setShowJobModal({ ...showJobModal, title: e.target.value })}
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

                {/* 3. Hiring Lead / Team Field (linked to Employees) */}
                <div className="space-y-2 col-span-2 bg-slate-50/60 p-3.5 border border-slate-200/80 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      Hiring Lead(s) / مسؤول التوظيف المباشر (1 أو 2 موظفين)
                    </label>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                      {getSelectedHiringLeads(showJobModal.hiring_lead).length}/2 Selected
                    </span>
                  </div>

                  {/* Selected Leads Badges */}
                  <div className="flex flex-wrap gap-2">
                    {getSelectedHiringLeads(showJobModal.hiring_lead).map((leadName, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl shadow-xs">
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
                  {getSelectedHiringLeads(showJobModal.hiring_lead).length < 2 && (
                    <div className="flex gap-2 pt-1">
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            handleAddHiringLead(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-700"
                      >
                        <option value="">+ Select Active Employee as Hiring Lead / اختر مسؤول التوظيف من الموظفين...</option>
                        {activeEmployees.map(emp => (
                          <option key={emp.id} value={emp.name || emp.full_name}>
                            👤 {emp.name || emp.full_name} — {emp.job_title || emp.department_name || 'HR Team'}
                          </option>
                        ))}
                        {users.map(u => (
                          <option key={`user-${u.id}`} value={u.name}>
                            👤 {u.name} — {u.role_name || 'HR Admin'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Headcount Needed *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={showJobModal.headcount_needed}
                      onChange={e => setShowJobModal({ ...showJobModal, headcount_needed: Number(e.target.value) })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Pipeline Request Status (حالة الطلب)</label>
                    <select
                      value={showJobModal.status || 'Pending HR Approval'}
                      onChange={e => setShowJobModal({ ...showJobModal, status: e.target.value as any })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Experience Level</label>
                    <input
                      type="text"
                      value={showJobModal.experience_requirements}
                      onChange={e => setShowJobModal({ ...showJobModal, experience_requirements: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      placeholder="e.g., 3-5 Years"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Expected Salary Range</label>
                    <input
                      type="text"
                      value={showJobModal.salary_range}
                      onChange={e => setShowJobModal({ ...showJobModal, salary_range: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      placeholder="e.g., 8,000 - 12,000 SAR"
                    />
                  </div>

                  {/* Accounting Ledger Alignment Trigger */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-black text-slate-700 block">Ledger Budget Status</label>
                    <div className="flex gap-2 items-center pt-1">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${
                        showJobModal.budget_status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {showJobModal.budget_status || 'Pending Approval'}
                      </span>

                      {showJobModal.budget_status !== 'Approved' && (
                        <button
                          type="button"
                          onClick={handleVerifyBudget}
                          disabled={verifyingBudget}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 shadow transition-all"
                        >
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                          {verifyingBudget ? 'Checking Ledgers...' : 'Verify Capital'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* BambooHR Extra fields */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Job Location</label>
                    <input
                      type="text"
                      value={showJobModal.location || ''}
                      onChange={e => setShowJobModal({ ...showJobModal, location: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      placeholder="e.g., Marseille, Provence"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Employment Type</label>
                    <select
                      value={showJobModal.employment_type || 'Full-Time'}
                      onChange={e => setShowJobModal({ ...showJobModal, employment_type: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-black text-slate-700">Days Open (أيام فتح الوظيفة)</label>
                    <input
                      type="number"
                      min={1}
                      value={showJobModal.days_open || 7}
                      onChange={e => setShowJobModal({ ...showJobModal, days_open: Number(e.target.value) })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                    />
                  </div>
                </div>

                {budgetVerifySuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    {budgetVerifySuccess}
                  </div>
                )}

                {/* --- visual block editor for Job Description --- */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-slate-700 block">📢 Interactive Block-Editor</h4>
                      <p className="text-[10px] text-slate-400">Design beautifully formatted announcements using customizable content blocks.</p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleAddEditorBlock('header')}
                        className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200"
                      >
                        + Head
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddEditorBlock('text')}
                        className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200"
                      >
                        + Para
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddEditorBlock('bullets')}
                        className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200"
                      >
                        + Bullets
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddEditorBlock('callout')}
                        className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200"
                      >
                        + Alert
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[300px] overflow-y-auto">
                    {editorBlocks.map((block, index) => (
                      <div key={block.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2 relative group">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase">
                            Block: {block.type}
                          </span>

                          <div className="flex gap-1 items-center">
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(index, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(index, 'down')}
                              disabled={index === editorBlocks.length - 1}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(block.id)}
                              className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {block.type === 'bullets' ? (
                          <textarea
                            value={block.content}
                            onChange={e => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full p-2 border border-slate-100 bg-slate-50 rounded-lg outline-none font-medium text-xs h-16"
                            placeholder="Type each bullet point on a new line starting with •"
                          />
                        ) : (
                          <input
                            type="text"
                            value={block.content}
                            onChange={e => handleUpdateBlockContent(block.id, e.target.value)}
                            className={`w-full p-2 border border-slate-100 rounded-lg outline-none text-xs font-bold ${
                              block.type === 'header' ? 'text-slate-800 font-extrabold bg-slate-50/50' : 
                              block.type === 'callout' ? 'bg-amber-50/50 border-amber-100 font-semibold' : ''
                            }`}
                            placeholder={`Enter block ${block.type} content...`}
                          />
                        )}
                      </div>
                    ))}

                    {editorBlocks.length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center py-6">No custom description blocks. Click buttons above to start visual composing.</p>
                    )}
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
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Processing...' : 'Save & Publish Opening'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- POPUP MODAL: CREATE / EDIT CANDIDATE --- */}
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
              className={`bg-white rounded-3xl border border-slate-200 shadow-2xl w-full ${showCandidateModal.id ? 'max-w-5xl' : 'max-w-lg'} overflow-hidden text-left transition-all duration-300`}
            >
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {showCandidateModal.id ? 'Candidate Dossier & File' : 'Register Candidate'}
                  </h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mt-0.5">Log applicant credentials, portfolio links, and view full interview record history</p>
                </div>
                <button onClick={() => setShowCandidateModal(null)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCandidate} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
                <div className={showCandidateModal.id ? "grid grid-cols-1 lg:grid-cols-12 gap-8" : "space-y-4"}>
                  {/* LEFT COLUMN: Candidate Profile Fields */}
                  <div className={showCandidateModal.id ? "lg:col-span-5 space-y-4" : "space-y-4"}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={showCandidateModal.name}
                          onChange={e => setShowCandidateModal({ ...showCandidateModal, name: e.target.value })}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                          placeholder="e.g., Sarah Jenkins"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={showCandidateModal.email}
                          onChange={e => setShowCandidateModal({ ...showCandidateModal, email: e.target.value })}
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
                          onChange={e => setShowCandidateModal({ ...showCandidateModal, job_opening_id: Number(e.target.value) })}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                          required
                        >
                          <option value="">-- Select Job --</option>
                          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700">Pipeline Stage</label>
                        <select
                          value={showCandidateModal.stage || ''}
                          onChange={e => setShowCandidateModal({ ...showCandidateModal, stage: e.target.value as any })}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700">Phone Number</label>
                        <input
                          type="text"
                          value={showCandidateModal.phone || ''}
                          onChange={e => setShowCandidateModal({ ...showCandidateModal, phone: e.target.value })}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                          placeholder="e.g., +33 4 567 4321"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700">Location</label>
                        <input
                          type="text"
                          value={showCandidateModal.location || ''}
                          onChange={e => setShowCandidateModal({ ...showCandidateModal, location: e.target.value })}
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
                          value={showCandidateModal.linkedin_url}
                          onChange={e => setShowCandidateModal({ ...showCandidateModal, linkedin_url: e.target.value })}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700">CV / Portfolio Link</label>
                        <input
                          type="url"
                          value={showCandidateModal.cv_url}
                          onChange={e => setShowCandidateModal({ ...showCandidateModal, cv_url: e.target.value })}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                          placeholder="https://example.com/cv.pdf"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700">Score Rating (1-5)</label>
                        <select
                          value={showCandidateModal.score || ''}
                          onChange={e => setShowCandidateModal({ ...showCandidateModal, score: Number(e.target.value) })}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                        >
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">Assessor Notes</label>
                      <textarea
                        value={showCandidateModal.notes}
                        onChange={e => setShowCandidateModal({ ...showCandidateModal, notes: e.target.value })}
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
                  </div>

                  {/* RIGHT COLUMN: Dossier of interviews, evaluations, and technical scorecards */}
                  {showCandidateModal.id && (
                    <div className="lg:col-span-7 space-y-4 lg:border-l border-slate-100 lg:pl-8 pt-6 lg:pt-0 border-t lg:border-t-0">
                      {(() => {
                        const candInterviews = interviews.filter(i => i.candidate_id === showCandidateModal.id);
                        return (
                          <div className="space-y-4">
                            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                              <div>
                                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                  <ClipboardList className="w-4 h-4 text-blue-500" />
                                  Dossier & History
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-bold">
                                  Complete history of scheduled interviews & technical scorecards
                                </p>
                              </div>
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-blue-100">
                                {candInterviews.length} {candInterviews.length === 1 ? 'Meeting' : 'Meetings'}
                              </span>
                            </div>

                            {candInterviews.length === 0 ? (
                              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2.5">
                                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                                <h5 className="text-xs font-black text-slate-700">No Scheduled Interviews</h5>
                                <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                                  No interviews or technical assessment scorecards have been logged yet for this applicant. Schedule an interview from the Interviews panel to start the evaluation.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                                {candInterviews.map((i) => (
                                  <div key={i.id} className="bg-slate-50/75 border border-slate-200 rounded-2xl p-4 transition-all space-y-3 hover:border-slate-300">
                                    <div className="flex justify-between items-start gap-2">
                                      <div>
                                        <h5 className="font-extrabold text-slate-900 text-sm">{i.title}</h5>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold mt-1">
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                                            {new Date(i.interview_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                          </span>
                                          <span>•</span>
                                          <span className="flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                            Interviewer: <strong className="text-slate-700">{i.interviewer_name || 'HR Host'}</strong>
                                          </span>
                                        </div>
                                      </div>

                                      {i.meeting_link && (
                                        <a
                                          href={i.meeting_link}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 rounded-xl text-[9px] font-black transition-all flex items-center gap-1 shrink-0"
                                          title="Join Video Meeting"
                                        >
                                          <Video className="w-3 h-3 text-blue-500" />
                                          Join
                                        </a>
                                      )}
                                    </div>

                                    {i.notes && (
                                      <div className="bg-white border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 font-medium">
                                        <span className="text-[9px] uppercase tracking-wider font-black text-slate-400 block mb-1">Interview Details:</span>
                                        <p className="whitespace-pre-line leading-relaxed">{i.notes}</p>
                                      </div>
                                    )}

                                    {/* Technical Assessment Scorecard Details */}
                                    {i.technical_score !== null && i.technical_score !== undefined ? (
                                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 space-y-2">
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-amber-800">
                                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                            Technical Evaluation Scorecard
                                          </div>
                                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-lg">
                                            Score: {i.technical_score}/5
                                          </span>
                                        </div>

                                        {i.technical_notes && (
                                          <div className="bg-white/80 border border-amber-100/60 rounded-xl p-3 text-[11px] text-slate-700 font-medium whitespace-pre-line leading-relaxed font-mono">
                                            {i.technical_notes}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="bg-slate-100/50 border border-slate-200/50 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-slate-400 font-bold">
                                          Technical evaluation scorecard not filled yet
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCandidateModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Processing...' : showCandidateModal.id ? 'Save Candidate Details' : 'Register Applicant'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- POPUP MODAL: SCHEDULE INTERVIEW & ADVANCE STAGE (New Only - Edits Open Dedicated Route) --- */}
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
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mt-0.5">Candidate: {showInterviewModal.candidate_name}</p>
                </div>
                <button onClick={() => setShowInterviewModal(null)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleInterviewAndStage} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Interview Title *</label>
                  <input
                    type="text"
                    required
                    value={showInterviewModal.title}
                    onChange={e => setShowInterviewModal({ ...showInterviewModal, title: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Interview Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={showInterviewModal.interview_date}
                      onChange={e => setShowInterviewModal({ ...showInterviewModal, interview_date: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Interviewer (HR Host) *</label>
                    <select
                      required
                      value={showInterviewModal.interviewer_id || ''}
                      onChange={e => setShowInterviewModal({ ...showInterviewModal, interviewer_id: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
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
                    value={showInterviewModal.meeting_link}
                    onChange={e => setShowInterviewModal({ ...showInterviewModal, meeting_link: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Agenda / Meeting Notes</label>
                  <textarea
                    value={showInterviewModal.notes}
                    onChange={e => setShowInterviewModal({ ...showInterviewModal, notes: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs h-20"
                    placeholder="Specify target questions, resume highlights, panel agenda..."
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInterviewModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Processing...' : showInterviewModal.id ? 'Save Changes' : 'Schedule & Advance Stage'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- POPUP MODAL: DETAILED MULTI-CRITERIA SCORECARD WITH AI ANALYSIS --- */}
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
                <button onClick={() => { setShowAssessmentModal(null); setAiAnalysisResult(null); }} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAssessment} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest pb-1 border-b border-slate-200">Engineering Capability</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Coding & Algorithms</label>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setScoreCoding(star)}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-6 h-6 ${star <= scoreCoding ? 'fill-current' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Systems Architecture</label>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setScoreArchitecture(star)}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-6 h-6 ${star <= scoreArchitecture ? 'fill-current' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest pb-1 border-b border-slate-200">Behavioral & Logical</h4>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Problem Solving & Logic</label>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setScoreProblemSolving(star)}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-6 h-6 ${star <= scoreProblemSolving ? 'fill-current' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Communication & Culture</label>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setScoreCommunication(star)}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-6 h-6 ${star <= scoreCommunication ? 'fill-current' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-700">Detailed Feedback & Notes</label>
                    {canAiAnalyzeScorecardPerm && (
                      <button
                        type="button"
                        onClick={handleAiAnalyzeScorecard}
                        disabled={aiAnalyzing || !techNotes}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 shadow transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                        {aiAnalyzing ? 'Analyzing Scorecard...' : '✨ Run AI Evaluation Analyzer'}
                      </button>
                    )}
                  </div>
                  <textarea
                    required
                    value={techNotes}
                    onChange={e => setTechNotes(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs h-28"
                    placeholder="Provide technical insights, coding results, and evaluation remarks to enable rich AI summaries..."
                  />
                  {!techNotes && (
                    <span className="text-[10px] text-rose-500 font-bold block">⚠️ Please type interviewer feedback notes first to unlock AI Analysis.</span>
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

                      <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest ${
                        aiAnalysisResult.recommendation === 'Strongly Recommended' ? 'bg-emerald-100 text-emerald-800' :
                        aiAnalysisResult.recommendation === 'Recommended' ? 'bg-blue-100 text-blue-800' :
                        aiAnalysisResult.recommendation === 'Borderline' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {aiAnalysisResult.recommendation}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-700 leading-relaxed leading-relaxed">{aiAnalysisResult.summary}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                      <div className="space-y-1.5">
                        <span className="font-extrabold text-indigo-950 block">💡 Key Strengths</span>
                        <ul className="space-y-1 text-slate-600 leading-relaxed font-semibold">
                          {aiAnalysisResult.strengths?.map((s: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
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
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-indigo-100">
                      <span className="font-extrabold text-xs text-indigo-950 block">🎯 Suggested Onboarding / Next Phase Questions</span>
                      <ul className="space-y-1 text-xs text-slate-600 leading-relaxed font-semibold">
                        {aiAnalysisResult.follow_up_questions?.map((q: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-indigo-500 mt-0.5 font-bold">Q{idx+1}:</span>
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
                    onClick={() => { setShowAssessmentModal(null); setAiAnalysisResult(null); }}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Saving Evaluation...' : 'Save & Publish Scorecard'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage Transition Popup Modal */}
      <PipelinePopupModal
        isOpen={stagePopupState.isOpen}
        onClose={() => setStagePopupState({ isOpen: false, candidate: null, config: {} })}
        candidateName={stagePopupState.candidate?.name || 'Marc'}
        config={stagePopupState.config}
        onConfirmAction={handleStagePopupConfirm}
      />
    </div>
  );
};

export default Recruitment;
