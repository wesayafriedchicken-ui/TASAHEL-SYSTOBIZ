import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Briefcase,
  Search,
  LayoutGrid,
  List,
  Eye,
  Edit2,
  Trash2,
  Share2,
  DollarSign,
  FileText,
  Plus,
  Lock,
  Unlock,
  Users
} from 'lucide-react';
import { useHiringContext } from './HiringContext';
import { getJobSlug } from './types';
import { CustomFieldsDisplay, CustomFieldsListDisplay } from '../../../components/HR/CustomFieldsManager';

export const JobOpeningsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    displayedJobs,
    jobViewMode,
    setJobViewMode,
    searchTerm,
    setSearchTerm,
    selectedDeptFilter,
    setSelectedDeptFilter,
    departments,
    showBudget,
    setShowBudget,
    canViewBudgetSalaryPerm,
    canShareJobPostingPerm,
    canViewJobPostingPerm,
    canEditJobPostingPerm,
    canDeleteJobPostingPerm,
    handleDeleteJob,
    handleShareItem,
    setSelectedAnnounceJob,
    setShowJobModal,
    isHRAdmin,
    canRequestJobOpening
  } = useHiringContext();

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-emerald-800 font-serif">
            Job Openings Directory & Headcount Budget
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage personnel hire requests, salary ranges, and active position requisitions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Salary Visibility */}
          {canViewBudgetSalaryPerm && (
            <button
              type="button"
              onClick={() => setShowBudget(!showBudget)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200"
              title="Toggle Ledger Salary View"
            >
              {showBudget ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Salary Visible</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salary Hidden</span>
                </>
              )}
            </button>
          )}

          {/* Request Job Opening button - Icon Only */}
          {canRequestJobOpening && (
            <button
              type="button"
              onClick={() => navigate('/hr/recruitment/jobs/request')}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-200 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shrink-0"
              title="Request Job Opening"
              aria-label="Request Job Opening"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and View Toggles Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title, department..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher: Board / List */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setJobViewMode('board')}
            className={`p-1.5 rounded-lg transition-colors ${
              jobViewMode === 'board'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Card Board View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setJobViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              jobViewMode === 'list'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Table List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
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
            <h3 className="font-bold text-slate-700">No Job Openings Found</h3>
            <p className="text-slate-400 text-xs mt-1">
              Request new personnel hires or create dynamic postings to populate this view.
            </p>
          </div>
        ) : jobViewMode === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-emerald-400 hover:shadow-xl hover:shadow-slate-100 transition-all space-y-4 text-left relative flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <span
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider ${
                          job.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-600'
                            : job.status === 'Paused'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {job.status}
                      </span>

                      <span
                        className={`px-2 py-0.5 text-[8px] font-black rounded border flex items-center gap-0.5 uppercase ${
                          job.budget_status === 'Approved'
                            ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border-rose-200'
                        }`}
                      >
                        <DollarSign className="w-2.5 h-2.5" />
                        {job.budget_status || 'Pending Approval'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!canShareJobPostingPerm}
                        onClick={() => handleShareItem('Job Posting', job)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          canShareJobPostingPerm
                            ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                            : 'text-slate-200 cursor-not-allowed'
                        }`}
                        title={canShareJobPostingPerm ? 'Share Job Posting' : 'Permission Required'}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={!canViewJobPostingPerm}
                        onClick={() => navigate(`/hr/recruitment/jobs/${getJobSlug(job)}/view`)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          canViewJobPostingPerm
                            ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer'
                            : 'text-slate-200 cursor-not-allowed'
                        }`}
                        title={canViewJobPostingPerm ? 'View Job Post' : 'Permission Required'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={!canEditJobPostingPerm}
                        onClick={() => navigate(`/hr/recruitment/jobs/${getJobSlug(job)}/edit`)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          canEditJobPostingPerm
                            ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                            : 'text-slate-200 cursor-not-allowed'
                        }`}
                        title={canEditJobPostingPerm ? 'Edit Job Posting' : 'Permission Required'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={!canDeleteJobPostingPerm}
                        onClick={() => handleDeleteJob(job.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          canDeleteJobPostingPerm
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                            : 'text-slate-200 cursor-not-allowed'
                        }`}
                        title={canDeleteJobPostingPerm ? 'Delete Job Posting' : 'Permission Required'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3
                    onClick={() => navigate(`/hr/recruitment/jobs/${getJobSlug(job)}`)}
                    className="text-base font-black text-slate-900 font-sans tracking-tight leading-tight hover:text-emerald-700 cursor-pointer transition-colors hover:underline"
                  >
                    {job.title}
                  </h3>
                  <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                    {job.department_name || 'General Org'}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-3 text-xs border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Headcount Needed</span>
                    <span className="font-bold text-slate-800">{job.headcount_needed} Needed</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Salary Range</span>
                    <span className="font-bold text-slate-800">
                      {showBudget ? job.salary_range || 'Not Disclosed' : 'Confidential (🔐 Locked)'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Experience Target</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {job.experience_requirements || 'Any Level'}
                    </span>
                  </div>
                </div>

                {/* Custom Fields Relations Display */}
                <CustomFieldsDisplay entityType="job_opening" entityId={job.id} />

                {/* Custom Fields marked with In List View */}
                <CustomFieldsListDisplay entityType="job_opening" entityId={job.id} layout="badges" />

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/hr/recruitment/jobs/${getJobSlug(job)}/view`)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    View Job Post
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/hr/recruitment/jobs/${getJobSlug(job)}`)}
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 border border-emerald-200 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    Candidates ({job.candidate_count || 0})
                  </button>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Candidate Pipeline
                  </span>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    {job.candidate_count || 0} Registered
                  </span>
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
                  {displayedJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-4 px-6">
                        <span
                          onClick={() => navigate(`/hr/recruitment/jobs/${getJobSlug(job)}`)}
                          className="font-black text-slate-900 block hover:text-emerald-700 cursor-pointer transition-colors hover:underline"
                        >
                          {job.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          ID: #{job.id}
                        </span>
                        <CustomFieldsListDisplay entityType="job_opening" entityId={job.id} layout="row" />
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-600">{job.department_name || 'General Org'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-blue-50/50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black">
                          {job.headcount_needed} Needed
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span>
                          {showBudget ? job.salary_range || 'Not Disclosed' : 'Confidential (🔐)'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-500 font-medium max-w-[150px] truncate block">
                          {job.experience_requirements || 'Any Level'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black">
                          {job.candidate_count || 0} Applied
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider ${
                            job.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-600'
                              : job.status === 'Paused'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-0.5 text-[8px] font-black rounded border inline-flex items-center gap-0.5 uppercase ${
                            job.budget_status === 'Approved'
                              ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border-rose-200'
                          }`}
                        >
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
                            className={`p-1.5 rounded-lg transition-colors ${
                              canShareJobPostingPerm
                                ? 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                                : 'text-slate-200 cursor-not-allowed'
                            }`}
                            title={canShareJobPostingPerm ? 'Share Job Posting' : 'Permission Required'}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!canViewJobPostingPerm}
                            onClick={() => navigate(`/hr/recruitment/jobs/${getJobSlug(job)}/view`)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              canViewJobPostingPerm
                                ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer'
                                : 'text-slate-200 cursor-not-allowed'
                            }`}
                            title={canViewJobPostingPerm ? 'View Job Post' : 'Permission Required'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!canEditJobPostingPerm}
                            onClick={() => navigate(`/hr/recruitment/jobs/${getJobSlug(job)}/edit`)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              canEditJobPostingPerm
                                ? 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                                : 'text-slate-200 cursor-not-allowed'
                            }`}
                            title={canEditJobPostingPerm ? 'Edit Job Posting' : 'Permission Required'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!canDeleteJobPostingPerm}
                            onClick={() => handleDeleteJob(job.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              canDeleteJobPostingPerm
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                                : 'text-slate-200 cursor-not-allowed'
                            }`}
                            title={canDeleteJobPostingPerm ? 'Delete Job Posting' : 'Permission Required'}
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
    </div>
  );
};

export default JobOpeningsPage;
