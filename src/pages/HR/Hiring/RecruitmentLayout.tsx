import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Users,
  Calendar,
  Plus,
  RefreshCw,
  Sliders,
  ShieldAlert,
  ArrowLeft,
  UserPlus,
  CalendarPlus
} from 'lucide-react';
import { HiringProvider, useHiringContext } from './HiringContext';
import { HiringModals } from './HiringModals';
import { cn } from '../../../lib/utils';
import { ModuleCustomizeLayoutDropdown } from '../../../components/HR/ModuleSchema';
import { ActionGuard } from '../../../components/Common/Guard';

const RecruitmentLayoutContent: React.FC = () => {
  const {
    jobs,
    candidates,
    scopeFilteredInterviews,
    hiringChannels,
    isPullingCandidates,
    handlePullFromChannel,
    canViewJobOpeningsTab,
    canViewPipelineTab,
    canViewInterviewsTab,
    canCreateInterviewPerm,
    setShowInterviewModal,
    isHRAdmin,
    canRequestJobOpening
  } = useHiringContext();

  const location = useLocation();
  const navigate = useNavigate();

  const recruitmentSubTabs = [
    {
      id: 'jobs',
      path: '/hr/recruitment/jobs',
      label: 'Job Openings',
      icon: Briefcase,
      count: jobs.length,
      visible: canViewJobOpeningsTab
    },
    {
      id: 'candidates',
      path: '/hr/recruitment/candidates',
      label: 'Candidates Pipeline',
      icon: Users,
      count: candidates.length,
      visible: canViewPipelineTab
    },
    {
      id: 'interviews',
      path: '/hr/recruitment/interviews',
      label: 'Interviews & Scorecards',
      icon: Calendar,
      count: scopeFilteredInterviews.length,
      visible: canViewInterviewsTab
    }
  ].filter((t) => t.visible);

  const currentPath = location.pathname;

  // Determine dynamic CTA button
  let dynamicAction: { label: string; action: () => void } | null = null;

  if (currentPath.startsWith('/hr/recruitment/interviews')) {
    if (canCreateInterviewPerm) {
      dynamicAction = {
        label: 'Schedule Interview',
        action: () =>
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
      };
    }
  } else if (
    currentPath.startsWith('/hr/recruitment/candidates') &&
    !currentPath.includes('/register')
  ) {
    dynamicAction = {
      label: 'Register Candidate',
      action: () => navigate('/hr/recruitment/candidates/register')
    };
  } else if (
    (currentPath.startsWith('/hr/recruitment/jobs') || currentPath === '/hr/recruitment') &&
    !currentPath.includes('/request')
  ) {
    if (canRequestJobOpening) {
      dynamicAction = {
        label: 'Request Job Opening',
        action: () => navigate('/hr/recruitment/jobs/request')
      };
    }
  }

  if (!canViewPipelineTab && !canViewJobOpeningsTab && !canViewInterviewsTab) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs my-6">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-800 mb-2">Access Restricted / غير مسموح بالعرض</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          You do not have permission to view any of the Recruitment sub-tabs. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Sub-Tabs Navigation */}
      <div className="space-y-4 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Back to HR Hub Button */}
            <button
              type="button"
              onClick={() => navigate('/hr')}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-600 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0 flex items-center justify-center"
              title="Back to HR Hub / الرجوع إلى لوحة الموارد البشرية"
              aria-label="Back to HR Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-xl font-black text-slate-800">Recruitment & Talent Acquisition</h3>
              <p className="text-xs text-slate-500 font-medium">
                Oversee talent acquisition pipelines, headcount budgeting, candidate dossiers, and technical interviews.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Customize Layout Dropdown - Icon Only */}
            <ActionGuard actionKey="hr:hiring:customize_layout" module="HR" screen="recruitment">
              <ModuleCustomizeLayoutDropdown targetPage="recruitment" iconOnly={true} />
            </ActionGuard>

            {/* Request Job Opening - Icon Only */}
            {canRequestJobOpening && (
              <button
                type="button"
                onClick={() => navigate('/hr/recruitment/jobs/request')}
                className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shrink-0"
                title="Request Job Opening"
                aria-label="Request Job Opening"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {/* Register Candidate - Icon Only */}
            <button
              type="button"
              onClick={() => navigate('/hr/recruitment/candidates/register')}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shrink-0"
              title="Register Candidate"
              aria-label="Register Candidate"
            >
              <UserPlus className="w-4 h-4" />
            </button>

            {/* Schedule Interview - Icon Only */}
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
                className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shrink-0"
                title="Schedule Interview"
                aria-label="Schedule Interview"
              >
                <CalendarPlus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 bg-slate-100 rounded-2xl w-full sm:w-fit overflow-x-auto max-w-full scrollbar-none">
            {recruitmentSubTabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive =
                location.pathname === tab.path ||
                location.pathname.startsWith(`${tab.path}/`) ||
                (tab.id === 'jobs' && location.pathname === '/hr/recruitment');

              return (
                <NavLink
                  key={tab.id}
                  to={tab.path}
                  className={cn(
                    'px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer no-underline',
                    isActive
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                  )}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                    )}
                  >
                    {tab.count}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Connected Hiring Channels Bar */}
      {hiringChannels.length > 0 && (
        <div className="bg-slate-50/80 border border-slate-200/80 px-3 py-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs w-full max-w-full overflow-x-auto scrollbar-none text-left">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
              Active Hiring Channels
            </span>
            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-black uppercase tracking-wider">
              {hiringChannels.length} Linked
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-full">
            {hiringChannels.map((channel) => (
              <div
                key={channel.id}
                className="bg-white border border-slate-200 hover:border-emerald-300 transition-all px-2.5 py-1 rounded-xl flex items-center gap-2 text-[11px] shrink-0 shadow-2xs"
              >
                <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[10px] shrink-0">
                  {channel.source_platform?.[0] || 'P'}
                </div>
                <div className="flex items-center gap-1 max-w-[150px] truncate">
                  <span className="font-bold text-slate-800 text-[11px] truncate">
                    {channel.name_ar || channel.name_en}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    ({channel.source_platform})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePullFromChannel(channel)}
                  disabled={isPullingCandidates !== null}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                    isPullingCandidates === channel.id
                      ? 'bg-slate-50 text-slate-400 border-slate-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100'
                  }`}
                >
                  {isPullingCandidates === channel.id ? (
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-600" />
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

      {/* Sub-Route View Content Container */}
      <div className="w-full max-w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Shared Modals and Popups */}
      <HiringModals />
    </div>
  );
};

export const RecruitmentLayout: React.FC = () => {
  return (
    <HiringProvider>
      <RecruitmentLayoutContent />
    </HiringProvider>
  );
};

export default RecruitmentLayout;
