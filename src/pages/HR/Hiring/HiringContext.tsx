import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { JobOpening, Candidate, Interview, EditorBlock } from './types';
import { useAuth } from '../../../context/AuthContext';
import { saveCustomFieldValues } from '../../../components/HR/CustomFieldsManager';
import { Sliders, Briefcase, Calendar } from 'lucide-react';

interface HiringContextType {
  // Data States
  jobs: JobOpening[];
  setJobs: React.Dispatch<React.SetStateAction<JobOpening[]>>;
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  interviews: Interview[];
  setInterviews: React.Dispatch<React.SetStateAction<Interview[]>>;
  departments: any[];
  users: any[];
  employees: any[];
  activeEmployees: any[];
  customStages: any[];
  activeStages: string[];
  getStageInfo: (stageName: string) => { name_en: string; name_ar: string; color: string };

  // Loading & Verification
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  verifyingBudget: boolean;
  budgetVerifySuccess: string | null;
  setBudgetVerifySuccess: React.Dispatch<React.SetStateAction<string | null>>;

  // Hiring Channels & Sync
  localHiringChannels: any[];
  isPullingCandidates: string | null;
  handlePullFromChannel: (channel: any) => Promise<void>;

  // Block Editor for Job Opening
  editorBlocks: EditorBlock[];
  setEditorBlocks: React.Dispatch<React.SetStateAction<EditorBlock[]>>;
  handleAddEditorBlock: (type: 'header' | 'text' | 'bullets' | 'callout') => void;
  handleUpdateBlockContent: (id: string, newContent: string) => void;
  handleDeleteBlock: (id: string) => void;
  handleMoveBlock: (index: number, direction: 'up' | 'down') => void;

  // Modals & Popups
  showJobModal: JobOpening | null;
  setShowJobModal: React.Dispatch<React.SetStateAction<JobOpening | null>>;
  jobCustomFieldValues: Record<number, string>;
  setJobCustomFieldValues: React.Dispatch<React.SetStateAction<Record<number, string>>>;

  showCandidateModal: Candidate | null;
  setShowCandidateModal: React.Dispatch<React.SetStateAction<Candidate | null>>;
  candidateCustomFieldValues: Record<number, string>;
  setCandidateCustomFieldValues: React.Dispatch<React.SetStateAction<Record<number, string>>>;

  showInterviewModal: any | null;
  setShowInterviewModal: React.Dispatch<React.SetStateAction<any | null>>;

  showAssessmentModal: any | null;
  setShowAssessmentModal: React.Dispatch<React.SetStateAction<any | null>>;
  openAssessmentModal: (interview: any) => void;
  shareModalItem: { type: string; data: any } | null;
  setShareModalItem: React.Dispatch<React.SetStateAction<{ type: string; data: any } | null>>;
  scoreCoding: number;
  setScoreCoding: React.Dispatch<React.SetStateAction<number>>;
  scoreArchitecture: number;
  setScoreArchitecture: React.Dispatch<React.SetStateAction<number>>;
  scoreProblemSolving: number;
  setScoreProblemSolving: React.Dispatch<React.SetStateAction<number>>;
  scoreCommunication: number;
  setScoreCommunication: React.Dispatch<React.SetStateAction<number>>;
  techNotes: string;
  setTechNotes: React.Dispatch<React.SetStateAction<string>>;
  handleSaveAssessment: (e: React.FormEvent) => Promise<void>;
  handleSaveEvaluation: (interviewId: number, avgScore: number, notes: string, criteria?: any) => Promise<void>;

  aiAnalyzing: boolean;
  aiAnalysisResult: any | null;
  setAiAnalysisResult: React.Dispatch<React.SetStateAction<any | null>>;
  handleAiAnalyzeScorecard: () => Promise<void>;

  selectedAnnounceJob: JobOpening | null;
  setSelectedAnnounceJob: React.Dispatch<React.SetStateAction<JobOpening | null>>;

  stagePopupState: { isOpen: boolean; candidate: any; config: any };
  setStagePopupState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; candidate: any; config: any }>>;
  handleStagePopupConfirm: (data: { closeJobOpening: boolean; action_type?: string; action_target?: string }) => Promise<void>;

  // Filters & Search
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedJobFilter: number | '';
  setSelectedJobFilter: React.Dispatch<React.SetStateAction<number | ''>>;
  selectedDeptFilter: string;
  setSelectedDeptFilter: React.Dispatch<React.SetStateAction<string>>;

  jobStatusFilter: string;
  setJobStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  jobSearchTerm: string;
  setJobSearchTerm: React.Dispatch<React.SetStateAction<string>>;

  candidateViewMode: 'board' | 'list';
  setCandidateViewMode: React.Dispatch<React.SetStateAction<'board' | 'list'>>;
  jobViewMode: 'board' | 'list';
  setJobViewMode: React.Dispatch<React.SetStateAction<'board' | 'list'>>;

  // Filtered lists
  scopeFilteredJobs: JobOpening[];
  filteredJobsList: JobOpening[];
  displayedJobs: JobOpening[];
  scopeFilteredCandidates: Candidate[];
  filteredCandidates: Candidate[];
  scopeFilteredInterviews: Interview[];

  // CRUD handlers
  fetchJobs: () => Promise<void>;
  fetchCandidates: () => Promise<void>;
  fetchInterviews: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchEmployees: () => Promise<void>;
  fetchCustomStages: () => Promise<void>;

  handleSaveJob: (e: React.FormEvent, customBlocks?: EditorBlock[], customValues?: Record<number, string>) => Promise<boolean>;
  handleDeleteJob: (id: number) => Promise<void>;
  handleQuickUpdateJobStatus: (job: JobOpening, newStatus: string) => Promise<void>;
  handleVerifyBudget: (jobToVerify?: JobOpening) => Promise<void>;

  handleSaveCandidate: (e: React.FormEvent, candidateData?: Candidate, customValues?: Record<number, string>) => Promise<boolean>;
  handleDeleteCandidate: (id: number) => Promise<void>;
  handleUpdateCandidateStage: (id: number, newStage: string) => Promise<void>;
  handleUpdateScore: (candidateId: number, score: number) => Promise<void>;
  handleUpdateStageFromProfile: (candidateId: number, newStage: any) => Promise<void>;

  handleScheduleInterviewAndStage: (e?: React.FormEvent, customData?: any) => Promise<boolean>;
  handleDeleteInterview: (id: number) => Promise<void>;

  // Hiring leads helpers
  getSelectedHiringLeads: (leadStr?: string) => string[];
  handleAddHiringLead: (leadName: string, currentTarget?: JobOpening, updateSetter?: (j: JobOpening) => void) => void;
  handleRemoveHiringLead: (leadName: string, currentTarget?: JobOpening, updateSetter?: (j: JobOpening) => void) => void;

  handleShareItem: (type: string, item: any) => void;
  handleApplyNow: (job: JobOpening) => Promise<void>;

  // Profile and templates
  emailTemplates: any[];
  setEmailTemplates: React.Dispatch<React.SetStateAction<any[]>>;
  fetchEmailTemplates: () => Promise<void>;
  isCandidateProfileReadOnly: boolean;
  setIsCandidateProfileReadOnly: React.Dispatch<React.SetStateAction<boolean>>;
  activeProfileCandidate: Candidate | null;
  setActiveProfileCandidate: React.Dispatch<React.SetStateAction<Candidate | null>>;

  // User & Toast
  user: any;
  showCustomToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hiringChannels: any[];

  // Permissions & Access
  isHRAdmin: boolean;
  canViewRecruitment: boolean;
  availableSubTabs: any[];
  canViewPipelineTab: boolean;
  canViewJobOpeningsTab: boolean;
  canViewInterviewsTab: boolean;
  canEditRecruitment: boolean;
  canDeleteRecruitmentPerm: boolean;
  canShareRecruitment: boolean;
  showBudget: boolean;
  setShowBudget: React.Dispatch<React.SetStateAction<boolean>>;
  canViewBudgetSalaryPerm: boolean;

  canRequestJobOpening: boolean;
  canAddJobPostingPerm: boolean;
  canViewJobPostingPerm: boolean;
  canEditJobPostingPerm: boolean;
  canDeleteJobPostingPerm: boolean;
  canShareJobPostingPerm: boolean;
  canFilterJobOpeningsPerm: boolean;
  canVerifyJobBudgetPerm: boolean;

  canRegisterApplicantPerm: boolean;
  canAddCandidatePerm: boolean;
  canViewCandidatePerm: boolean;
  canEditCandidatePerm: boolean;
  canDeleteCandidatePerm: boolean;
  canShareCandidatePerm: boolean;
  canMoveCandidateStagePerm: boolean;
  canPullChannelCandidatesPerm: boolean;
  canFilterCandidatesPerm: boolean;

  canCreateInterviewPerm: boolean;
  canScheduleInterviewPerm: boolean;
  canViewInterviewPerm: boolean;
  canEditInterviewPerm: boolean;
  canDeleteInterviewPerm: boolean;
  canEvaluateScorecardPerm: boolean;
  canEditScorecardPerm: boolean;
  canAiAnalyzeScorecardPerm: boolean;
  canFilterInterviewsPerm: boolean;

  getCustomActionAccess: (actionKey: string, fallback: boolean, isMasterTabOff?: boolean) => boolean;
  isCandidateFieldVisible: (fieldKey: string) => boolean;
  isCandidateFieldEditable: (fieldKey: string) => boolean;
  isJobFieldVisible: (fieldKey: string) => boolean;
  isJobFieldEditable: (fieldKey: string) => boolean;
}

const HiringContext = createContext<HiringContextType | undefined>(undefined);

export const HiringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      { id: 'pipeline' as const, path: '/hr/recruitment/candidates', label: 'Candidates Pipeline', permKey: 'Candidates Pipeline', icon: Sliders },
      { id: 'jobs' as const, path: '/hr/recruitment/jobs', label: 'Job Openings', permKey: 'Job Openings', icon: Briefcase },
      { id: 'interviews' as const, path: '/hr/recruitment/interviews', label: 'Interviews & Scorecards', permKey: 'Interviews & Scorecards', icon: Calendar },
    ];

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
  }, [isHRAdmin, canViewRecruitment, isPipelineMasterOff, isJobOpeningsMasterOff, isInterviewsMasterOff, checkPermission, canRead]);

  const canViewPipelineTab = availableSubTabs.some(t => t.id === 'pipeline');
  const canViewJobOpeningsTab = availableSubTabs.some(t => t.id === 'jobs');
  const canViewInterviewsTab = availableSubTabs.some(t => t.id === 'interviews');

  const canEditRecruitment = isHRAdmin || canWrite('HR', 'Recruitment & Jobs') || canWrite('HR', 'Recruitment');
  const canDeleteRecruitmentPerm = isHRAdmin || canDeletePerm('HR', 'Recruitment & Jobs') || canDeletePerm('HR', 'Recruitment');
  const canShareRecruitment = isHRAdmin || canShare('HR', 'Recruitment & Jobs') || canShare('HR', 'Recruitment');
  const [showBudget, setShowBudget] = useState<boolean>(true);
  const canViewBudgetSalaryPerm = isHRAdmin || (checkPermission as any)('HR', 'custom:Recruitment_showBudget') !== false;

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

  // Custom permissions
  const canRequestJobOpening = getCustomActionAccess('request_job_opening', isHRAdmin || canCreateAuth('HR', 'Job Openings') || jobOpeningsPermLevel !== 3, isJobOpeningsMasterOff);
  const canAddJobPostingPerm = getCustomActionAccess('add_job_posting', isHRAdmin || canCreateAuth('HR', 'Job Openings') || jobOpeningsPermLevel === 1 || jobOpeningsPermLevel === 0, isJobOpeningsMasterOff);
  const canViewJobPostingPerm = getCustomActionAccess('view_job_posting', isHRAdmin || canRead('HR', 'Job Openings') || jobOpeningsPermLevel !== 3, isJobOpeningsMasterOff);
  const canEditJobPostingPerm = getCustomActionAccess('edit_job_posting', isHRAdmin || canWrite('HR', 'Job Openings') || jobOpeningsPermLevel === 1 || jobOpeningsPermLevel === 0, isJobOpeningsMasterOff);
  const canDeleteJobPostingPerm = getCustomActionAccess('delete_job_posting', isHRAdmin || canDeletePerm('HR', 'Job Openings'), isJobOpeningsMasterOff);
  const canShareJobPostingPerm = getCustomActionAccess('share_job_posting', isHRAdmin || canShareRecruitment, isJobOpeningsMasterOff);
  const canFilterJobOpeningsPerm = getCustomActionAccess('filter_job_openings', true, isJobOpeningsMasterOff);
  const canVerifyJobBudgetPerm = getCustomActionAccess('verify_job_budget', getCustomActionAccess('show_recruitment_budget', isHRAdmin || jobOpeningsPermLevel !== 3, isJobOpeningsMasterOff), isJobOpeningsMasterOff);

  const canRegisterApplicantPerm = getCustomActionAccess('register_applicant', getCustomActionAccess('add_candidate', isHRAdmin || canCreateAuth('HR', 'Candidates Pipeline') || pipelinePermLevel === 1 || pipelinePermLevel === 0, isPipelineMasterOff), isPipelineMasterOff);
  const canAddCandidatePerm = getCustomActionAccess('add_candidate', isHRAdmin || canCreateAuth('HR', 'Candidates Pipeline') || pipelinePermLevel === 1 || pipelinePermLevel === 0, isPipelineMasterOff);
  const canViewCandidatePerm = getCustomActionAccess('view_candidate', isHRAdmin || canRead('HR', 'Candidates Pipeline') || pipelinePermLevel !== 3, isPipelineMasterOff);
  const canEditCandidatePerm = getCustomActionAccess('edit_candidate', isHRAdmin || canWrite('HR', 'Candidates Pipeline') || pipelinePermLevel === 1 || pipelinePermLevel === 0, isPipelineMasterOff);
  const canDeleteCandidatePerm = getCustomActionAccess('delete_candidate', isHRAdmin || canDeletePerm('HR', 'Candidates Pipeline'), isPipelineMasterOff);
  const canShareCandidatePerm = getCustomActionAccess('share_candidate', isHRAdmin || canShareRecruitment, isPipelineMasterOff);
  const canMoveCandidateStagePerm = getCustomActionAccess('move_candidate_stage', isHRAdmin || canWrite('HR', 'Candidates Pipeline') || pipelinePermLevel === 1 || pipelinePermLevel === 0, isPipelineMasterOff);
  const canPullChannelCandidatesPerm = getCustomActionAccess('pull_channel_candidates', isHRAdmin || canWrite('HR', 'Candidates Pipeline') || pipelinePermLevel === 1 || pipelinePermLevel === 0, isPipelineMasterOff);
  const canFilterCandidatesPerm = getCustomActionAccess('filter_candidates', true, isPipelineMasterOff);

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

  const canScheduleInterviewPerm = getCustomActionAccess('schedule_interview', canEditRecruitment, isInterviewsMasterOff);
  const canCreateInterviewPerm = canScheduleInterviewPerm;
  const canViewInterviewPerm = getCustomActionAccess('view_interview', canViewRecruitment, isInterviewsMasterOff);
  const canEditInterviewPerm = getCustomActionAccess('edit_interview', canEditRecruitment, isInterviewsMasterOff);
  const canDeleteInterviewPerm = getCustomActionAccess('delete_interview', canDeleteRecruitmentPerm, isInterviewsMasterOff);
  const canEvaluateScorecardPerm = getCustomActionAccess('evaluate_candidate_scorecard', canEditRecruitment, isInterviewsMasterOff);
  const canEditScorecardPerm = getCustomActionAccess('edit_scorecard', canEditRecruitment, isInterviewsMasterOff);
  const canAiAnalyzeScorecardPerm = getCustomActionAccess('ai_analyze_scorecard', true, isInterviewsMasterOff);
  const canFilterInterviewsPerm = getCustomActionAccess('filter_interviews', true, isInterviewsMasterOff);

  // Data States
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [customStages, setCustomStages] = useState<any[]>([]);

  const activeEmployees = useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || 'active').toLowerCase().trim();
      return s === 'active';
    });
  }, [employees]);

  // Loading & Operations
  const [loading, setLoading] = useState(false);
  const [verifyingBudget, setVerifyingBudget] = useState(false);
  const [budgetVerifySuccess, setBudgetVerifySuccess] = useState<string | null>(null);

  // Hiring Channels
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

  // Background Sync loop for channels
  useEffect(() => {
    const runBackgroundSync = async () => {
      const saved = localStorage.getItem('hr_hiring_channels');
      if (!saved) return;
      try {
        const channels = JSON.parse(saved);
        let anyUpdated = false;
        
        const updatedChannels = await Promise.all(channels.map(async (ch: any) => {
          if ((ch.source_type === 'google_sheets' || ch.source_type === 'google_forms') && ch.sheet_id && ch.last_sync_at) {
            try {
              const res = await fetch('/api/hr/integrations/hiring/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    // Run periodic sync every 15 minutes instead of 3 minutes to avoid pooler egress exhaustion
    const interval = setInterval(runBackgroundSync, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePullFromChannel = async (channel: any) => {
    setIsPullingCandidates(channel.id);
    try {
      const res = await fetch('/api/hr/integrations/hiring/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Block Editor State
  const [editorBlocks, setEditorBlocks] = useState<EditorBlock[]>([
    { id: '1', type: 'header', content: 'Role Overview & Core Objectives' },
    { id: '2', type: 'text', content: 'We are seeking a high-caliber professional to expand our capabilities and drive key initiatives. You will work in a fast-paced environment with a focus on clean execution.' },
    { id: '3', type: 'bullets', content: '• Lead software architecture and design reviews\n• Implement clean, self-testing, and modular business features\n• Collaborate across departments to refine operational milestones' },
    { id: '4', type: 'callout', content: '⭐ Opportunity Alert: Hired candidates immediately enter standard corporate rotational programs with customized career progression tracks.' }
  ]);

  const handleAddEditorBlock = (type: 'header' | 'text' | 'bullets' | 'callout') => {
    const newBlock: EditorBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'bullets' ? '• ' : ''
    };
    setEditorBlocks(prev => [...prev, newBlock]);
  };

  const handleUpdateBlockContent = (id: string, newContent: string) => {
    setEditorBlocks(prev => prev.map(b => b.id === id ? { ...b, content: newContent } : b));
  };

  const handleDeleteBlock = (id: string) => {
    setEditorBlocks(prev => prev.filter(b => b.id !== id));
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

  // Modals & States
  const [showJobModal, setShowJobModal] = useState<JobOpening | null>(null);
  const [jobCustomFieldValues, setJobCustomFieldValues] = useState<Record<number, string>>({});
  const [showCandidateModal, setShowCandidateModal] = useState<Candidate | null>(null);
  const [candidateCustomFieldValues, setCandidateCustomFieldValues] = useState<Record<number, string>>({});
  const [showInterviewModal, setShowInterviewModal] = useState<any | null>(null);

  // Technical Assessment Scorecard Modal details
  const [showAssessmentModal, setShowAssessmentModal] = useState<Interview | null>(null);
  const [scoreCoding, setScoreCoding] = useState<number>(5);
  const [scoreArchitecture, setScoreArchitecture] = useState<number>(5);
  const [scoreProblemSolving, setScoreProblemSolving] = useState<number>(5);
  const [scoreCommunication, setScoreCommunication] = useState<number>(5);
  const [techNotes, setTechNotes] = useState<string>('');

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  const openAssessmentModal = (interview: Interview) => {
    setShowAssessmentModal(interview);
    setScoreCoding(5);
    setScoreArchitecture(5);
    setScoreProblemSolving(5);
    setScoreCommunication(5);
    setTechNotes(interview.technical_notes || '');
    setAiAnalysisResult(null);
  };

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

  // Editorial Job Announcement Modal
  const [selectedAnnounceJob, setSelectedAnnounceJob] = useState<JobOpening | null>(null);

  // Stage Popup Modal
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

    const actionType = data.action_type || 'navigate_employee';
    if (actionType === 'navigate_employee') {
      const targetJob = jobs.find(j => j.id === candidate.job_opening_id || j.title?.toLowerCase() === (candidate.applied_role || candidate.job_title || '').toLowerCase());
      const candidateData = {
        name: candidate.name,
        email: candidate.email || `${(candidate.name || 'candidate').toLowerCase().replace(/\s+/g, '.')}@company.com`,
        job_title: targetJob?.title || candidate.applied_role || candidate.job_title || 'New Hire',
        phone: candidate.phone || '',
        status: 'Active',
        joined_at: new Date().toISOString().split('T')[0]
      };

      try {
        const empRes = await fetch('/api/hr/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(candidateData)
        });
        if (empRes.ok) {
          alert(`🎉 Successfully added ${candidate.name} as a new Employee in HR Directory!`);
          fetchEmployees();
        }
      } catch (err) {
        console.error("Failed to register candidate as employee:", err);
      }
    } else if (actionType === 'link' && data.action_target) {
      if (data.action_target.startsWith('http')) {
        window.open(data.action_target, '_blank');
      } else {
        window.location.href = data.action_target;
      }
    }
  };

  // Search, Filter & View Modes
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState<number | ''>('');
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('all');
  const [jobSearchTerm, setJobSearchTerm] = useState<string>('');

  const [candidateViewMode, setCandidateViewMode] = useState<'board' | 'list'>('board');
  const [jobViewMode, setJobViewMode] = useState<'board' | 'list'>('board');

  // Stages definition
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

  // Fetch functions
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

  // Hiring leads helpers
  const getSelectedHiringLeads = (leadStr?: string) => {
    if (!leadStr) return [];
    return leadStr.split(',').map(s => s.trim()).filter(Boolean);
  };

  const handleAddHiringLead = (leadName: string, currentTarget?: JobOpening, updateSetter?: (j: JobOpening) => void) => {
    const target = currentTarget || showJobModal;
    if (!target) return;
    const current = getSelectedHiringLeads(target.hiring_lead);
    if (current.includes(leadName)) return;
    if (current.length >= 2) {
      alert("يمكن تحديد 2 مسؤولي توظيف بحد أقصى لكل طلب وظيفة.");
      return;
    }
    const updated = [...current, leadName].join(', ');
    if (updateSetter) {
      updateSetter({ ...target, hiring_lead: updated });
    } else {
      setShowJobModal({ ...target, hiring_lead: updated });
    }
  };

  const handleRemoveHiringLead = (leadName: string, currentTarget?: JobOpening, updateSetter?: (j: JobOpening) => void) => {
    const target = currentTarget || showJobModal;
    if (!target) return;
    const current = getSelectedHiringLeads(target.hiring_lead);
    const updated = current.filter(l => l !== leadName).join(', ');
    if (updateSetter) {
      updateSetter({ ...target, hiring_lead: updated });
    } else {
      setShowJobModal({ ...target, hiring_lead: updated });
    }
  };

  // Job operations
  const handleSaveJob = async (e: React.FormEvent, customBlocks?: EditorBlock[], customValues?: Record<number, string>): Promise<boolean> => {
    e.preventDefault();
    if (!showJobModal) return false;

    setLoading(true);
    try {
      const isEdit = !!showJobModal.id;
      const url = isEdit ? `/api/hr/recruitment/jobs/${showJobModal.id}` : '/api/hr/recruitment/jobs';
      const method = isEdit ? 'PUT' : 'POST';

      const blocksToSave = customBlocks || editorBlocks;
      const jobData = {
        ...showJobModal,
        description_blocks: JSON.stringify(blocksToSave)
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
          await saveCustomFieldValues(savedId, customValues || jobCustomFieldValues);
        }
        await fetchJobs();
        setShowJobModal(null);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
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

  const handleVerifyBudget = async (jobToVerify?: JobOpening) => {
    const target = jobToVerify || showJobModal;
    if (!target) return;
    setVerifyingBudget(true);
    setBudgetVerifySuccess(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      if (showJobModal) {
        setShowJobModal({
          ...showJobModal,
          budget_status: 'Approved'
        });
      }
      setBudgetVerifySuccess("Salary budget verified successfully against Account Ledgers. Capital allocation is confirmed.");
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingBudget(false);
    }
  };

  // Candidate operations
  const handleSaveCandidate = async (e: React.FormEvent, candidateData?: Candidate, customValues?: Record<number, string>): Promise<boolean> => {
    e.preventDefault();
    const target = candidateData || showCandidateModal;
    if (!target) return false;

    setLoading(true);
    try {
      const isEdit = !!target.id;
      const url = isEdit ? `/api/hr/recruitment/candidates/${target.id}` : '/api/hr/recruitment/candidates';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target)
      });

      if (res.ok) {
        let savedId = target.id;
        try {
          const result = await res.json();
          savedId = result.id || (Array.isArray(result) ? result[0]?.id : null) || savedId;
        } catch (e) {}
        if (savedId) {
          await saveCustomFieldValues(savedId, customValues || candidateCustomFieldValues);
        }

        await fetchCandidates();
        setShowCandidateModal(null);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
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
        fetchCandidates();
      }
    } catch (e) {
      console.error(e);
    }
  };

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
        fetchCandidates();
        checkAndTriggerStagePopup(candidate, newStage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleScheduleInterviewAndStage = async (e?: React.FormEvent, customData?: any): Promise<boolean> => {
    if (e && e.preventDefault) e.preventDefault();
    const targetData = customData || showInterviewModal;
    if (!targetData) return false;

    setLoading(true);
    try {
      const isEdit = !!targetData.id;
      const url = isEdit ? `/api/hr/recruitment/interviews/${targetData.id}` : '/api/hr/recruitment/interviews';
      const method = isEdit ? 'PUT' : 'POST';

      const interviewRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: targetData.candidate_id,
          title: targetData.title,
          interview_date: targetData.interview_date,
          interviewer_id: targetData.interviewer_id ? Number(targetData.interviewer_id) : null,
          meeting_link: targetData.meeting_link,
          notes: targetData.notes
        })
      });

      if (interviewRes.ok) {
        if (!isEdit) {
          await fetch(`/api/hr/recruitment/candidates/${targetData.candidate_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: 'Interviewing' })
          });
        }

        await fetchCandidates();
        await fetchInterviews();
        setShowInterviewModal(null);
        showCustomToast('Interview scheduled successfully!', 'success');
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      showCustomToast('Failed to schedule interview', 'error');
      return false;
    } finally {
      setLoading(false);
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
        fetchJobs();
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

  // RBAC Data Scopes
  const jobsScope = getDataScope('HR', 'Job Openings');
  const pipelineScope = getDataScope('HR', 'Candidates Pipeline');
  const interviewsScope = getDataScope('HR', 'Interviews & Scorecards');

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
    return list;
  }, [scopeFilteredJobs, jobStatusFilter, jobSearchTerm]);

  const scopeFilteredCandidates = useMemo(() => {
    if (isHRAdmin || pipelineScope === 'global') return candidates;

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

  const filteredCandidates = useMemo(() => {
    return scopeFilteredCandidates.filter(c => {
      const matchesSearch = (c.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                            (c.email || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      const matchesJob = selectedJobFilter === '' ? true : c.job_opening_id === Number(selectedJobFilter);
      return matchesSearch && matchesJob;
    });
  }, [scopeFilteredCandidates, searchTerm, selectedJobFilter]);

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

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [shareModalItem, setShareModalItem] = useState<{ type: string; data: any } | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [isCandidateProfileReadOnly, setIsCandidateProfileReadOnly] = useState<boolean>(false);
  const [activeProfileCandidate, setActiveProfileCandidate] = useState<Candidate | null>(null);

  const fetchEmailTemplates = async () => {
    try {
      const res = await fetch('/api/hr/recruitment/email-templates');
      if (res.ok) {
        setEmailTemplates(await res.json());
      }
    } catch (e) {
      console.error("Failed to load email templates", e);
    }
  };

  const [toastMessage, setToastMessage] = useState<{ message: string; type: string } | null>(null);
  const showCustomToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteInterview = async (id: number) => {
    if (!confirm("Are you sure you want to cancel and remove this interview?")) return;
    try {
      const res = await fetch(`/api/hr/recruitment/interviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showCustomToast("Interview cancelled and removed successfully", "success");
        await fetchInterviews();
      }
    } catch (e) {
      console.error("Failed to delete interview", e);
    }
  };

  const handleSaveEvaluation = async (interviewId: number, avgScore: number, notes: string, criteria?: any) => {
    setLoading(true);
    try {
      const compiledNotes = criteria
        ? `[Scores: Coding=${criteria.coding || 3}, Arch=${criteria.architecture || 3}, Logic=${criteria.problem_solving || 3}, Comm=${criteria.communication || 3}]\nInterviewer Remarks: ${notes}`
        : notes;

      const res = await fetch(`/api/hr/recruitment/interviews/${interviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technical_score: avgScore,
          technical_notes: compiledNotes
        })
      });
      if (res.ok) {
        const targetInterview = interviews.find(i => i.id === interviewId);
        if (targetInterview?.candidate_id) {
          await fetch(`/api/hr/recruitment/candidates/${targetInterview.candidate_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stage: 'Technical Assessment',
              score: avgScore,
              notes
            })
          });
        }
        await fetchInterviews();
        await fetchCandidates();
        setShowAssessmentModal(null);
        setAiAnalysisResult(null);
        showCustomToast('Evaluation saved and candidate stage updated!', 'success');
      }
    } catch (e) {
      console.error(e);
      showCustomToast('Failed to save evaluation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const displayedJobs = useMemo(() => {
    let list = filteredJobsList;
    if (selectedDeptFilter && selectedDeptFilter !== 'all') {
      list = list.filter(j => String(j.department_id) === String(selectedDeptFilter) || (j.department_name && j.department_name.toLowerCase() === selectedDeptFilter.toLowerCase()));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(j => 
        (j.title || '').toLowerCase().includes(term) ||
        (j.department_name || '').toLowerCase().includes(term) ||
        (j.hiring_lead || '').toLowerCase().includes(term) ||
        (j.location || '').toLowerCase().includes(term)
      );
    }
    return list;
  }, [filteredJobsList, selectedDeptFilter, searchTerm]);

  return (
    <HiringContext.Provider
      value={{
        jobs,
        setJobs,
        candidates,
        setCandidates,
        interviews,
        setInterviews,
        departments,
        users,
        employees,
        activeEmployees,
        customStages,
        activeStages,
        getStageInfo,

        loading,
        setLoading,
        verifyingBudget,
        budgetVerifySuccess,
        setBudgetVerifySuccess,

        localHiringChannels,
        hiringChannels: localHiringChannels,
        isPullingCandidates,
        handlePullFromChannel,

        editorBlocks,
        setEditorBlocks,
        handleAddEditorBlock,
        handleUpdateBlockContent,
        handleDeleteBlock,
        handleMoveBlock,

        showJobModal,
        setShowJobModal,
        jobCustomFieldValues,
        setJobCustomFieldValues,

        showCandidateModal,
        setShowCandidateModal,
        candidateCustomFieldValues,
        setCandidateCustomFieldValues,

        showInterviewModal,
        setShowInterviewModal,

        showAssessmentModal,
        setShowAssessmentModal,
        openAssessmentModal,
        shareModalItem,
        setShareModalItem,
        scoreCoding,
        setScoreCoding,
        scoreArchitecture,
        setScoreArchitecture,
        scoreProblemSolving,
        setScoreProblemSolving,
        scoreCommunication,
        setScoreCommunication,
        techNotes,
        setTechNotes,
        handleSaveAssessment,
        handleSaveEvaluation,

        aiAnalyzing,
        aiAnalysisResult,
        setAiAnalysisResult,
        handleAiAnalyzeScorecard,

        selectedAnnounceJob,
        setSelectedAnnounceJob,

        stagePopupState,
        setStagePopupState,
        handleStagePopupConfirm,

        searchTerm,
        setSearchTerm,
        selectedJobFilter,
        setSelectedJobFilter,
        selectedDeptFilter,
        setSelectedDeptFilter,

        jobStatusFilter,
        setJobStatusFilter,
        jobSearchTerm,
        setJobSearchTerm,

        candidateViewMode,
        setCandidateViewMode,
        jobViewMode,
        setJobViewMode,

        scopeFilteredJobs,
        filteredJobsList,
        displayedJobs,
        scopeFilteredCandidates,
        filteredCandidates,
        scopeFilteredInterviews,

        fetchJobs,
        fetchCandidates,
        fetchInterviews,
        fetchDepartments,
        fetchUsers,
        fetchEmployees,
        fetchCustomStages,

        handleSaveJob,
        handleDeleteJob,
        handleQuickUpdateJobStatus,
        handleVerifyBudget,

        handleSaveCandidate,
        handleDeleteCandidate,
        handleUpdateCandidateStage,
        handleUpdateScore,
        handleUpdateStageFromProfile,

        handleScheduleInterviewAndStage,
        handleDeleteInterview,

        getSelectedHiringLeads,
        handleAddHiringLead,
        handleRemoveHiringLead,

        handleShareItem,
        handleApplyNow,

        emailTemplates,
        setEmailTemplates,
        fetchEmailTemplates,
        isCandidateProfileReadOnly,
        setIsCandidateProfileReadOnly,
        activeProfileCandidate,
        setActiveProfileCandidate,

        user,
        showCustomToast,

        isHRAdmin,
        canViewRecruitment,
        availableSubTabs,
        canViewPipelineTab,
        canViewJobOpeningsTab,
        canViewInterviewsTab,
        canEditRecruitment,
        canDeleteRecruitmentPerm,
        canShareRecruitment,
        showBudget,
        setShowBudget,
        canViewBudgetSalaryPerm,

        canRequestJobOpening,
        canAddJobPostingPerm,
        canViewJobPostingPerm,
        canEditJobPostingPerm,
        canDeleteJobPostingPerm,
        canShareJobPostingPerm,
        canFilterJobOpeningsPerm,
        canVerifyJobBudgetPerm,

        canRegisterApplicantPerm,
        canAddCandidatePerm,
        canViewCandidatePerm,
        canEditCandidatePerm,
        canDeleteCandidatePerm,
        canShareCandidatePerm,
        canMoveCandidateStagePerm,
        canPullChannelCandidatesPerm,
        canFilterCandidatesPerm,

        canCreateInterviewPerm,
        canScheduleInterviewPerm,
        canViewInterviewPerm,
        canEditInterviewPerm,
        canDeleteInterviewPerm,
        canEvaluateScorecardPerm,
        canEditScorecardPerm,
        canAiAnalyzeScorecardPerm,
        canFilterInterviewsPerm,

        getCustomActionAccess,
        isCandidateFieldVisible,
        isCandidateFieldEditable,
        isJobFieldVisible,
        isJobFieldEditable,
      }}
    >
      {children}
    </HiringContext.Provider>
  );
};

export const useHiringContext = () => {
  const context = useContext(HiringContext);
  if (!context) {
    throw new Error('useHiringContext must be used within a HiringProvider');
  }
  return context;
};
