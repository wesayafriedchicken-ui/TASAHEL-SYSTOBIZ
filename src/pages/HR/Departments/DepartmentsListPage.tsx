import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Tag, Plus, Search, Edit2, Trash2, 
  Eye, Share2, LayoutGrid, List, Check, Copy, AlertCircle, X 
} from 'lucide-react';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';
import { deleteDepartmentAPI } from './deptUtils';

export const DepartmentsListPage: React.FC = () => {
  const { 
    departments, 
    employees, 
    isHRAdmin, 
    canAddDept, 
    canEditDept, 
    canDeleteDept, 
    canShareDept, 
    canViewDept, 
    showCustomToast, 
    fetchData,
    currentUser
  } = useHRContext();

  const navigate = useNavigate();

  const [departmentsViewMode, setDepartmentsViewMode] = useState<'board' | 'list'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeptDeleteConfirm, setShowDeptDeleteConfirm] = useState<number | string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filtered departments
  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const term = searchTerm.toLowerCase();
    return departments.filter(d => 
      d.name?.toLowerCase().includes(term) || 
      d.description?.toLowerCase().includes(term)
    );
  }, [departments, searchTerm]);

  // Overall metrics
  const totalTeamsCount = useMemo(() => {
    return departments.reduce((acc, dept) => {
      let t: any[] = [];
      if (Array.isArray(dept.teams)) t = dept.teams;
      else if (typeof dept.teams === 'string') {
        try { t = JSON.parse(dept.teams); } catch (e) {}
      }
      return acc + t.length;
    }, 0);
  }, [departments]);

  const totalTitlesCount = useMemo(() => {
    return departments.reduce((acc, dept) => {
      let titles: any[] = [];
      if (Array.isArray(dept.job_titles)) titles = dept.job_titles;
      else if (typeof dept.job_titles === 'string') {
        try { titles = JSON.parse(dept.job_titles); } catch (e) {}
      }
      return acc + titles.length;
    }, 0);
  }, [departments]);

  const handleShareDepartment = (dept: any) => {
    const text = `Department: ${dept.name}\nDescription: ${dept.description || 'N/A'}\nTeams: ${Array.isArray(dept.teams) ? dept.teams.length : 0}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showCustomToast('Department info copied to clipboard!', 'success');
    }
  };

  const handleDeleteDept = async () => {
    if (!showDeptDeleteConfirm) return;
    try {
      setDeleting(true);
      await deleteDepartmentAPI(showDeptDeleteConfirm, currentUser?.id);
      showCustomToast('Department deleted successfully', 'success');
      setShowDeptDeleteConfirm(null);
      await fetchData();
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to delete department', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar: Search, Stats, & View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search departments by name or description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Quick Metrics */}
          <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-500 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
            <span><strong className="text-slate-900">{departments.length}</strong> Departments</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span><strong className="text-indigo-600">{totalTeamsCount}</strong> Teams</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span><strong className="text-slate-900">{totalTitlesCount}</strong> Titles</span>
          </div>

          {/* Board / List toggler */}
          <div className="flex bg-slate-100 p-1 border border-slate-200/60 rounded-xl shadow-xs shrink-0">
            <button
              onClick={() => setDepartmentsViewMode('board')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                departmentsViewMode === 'board' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
              title="Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setDepartmentsViewMode('list')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                departmentsViewMode === 'list' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Mode: Board or List */}
      {departmentsViewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept: any) => {
            const memberCount = employees.filter(emp => emp.department_id === dept.id).length;
            const headEmployee = employees.find(emp => emp.id === dept.department_head_id);

            let deptTeams: any[] = [];
            if (dept.teams) {
              if (Array.isArray(dept.teams)) deptTeams = dept.teams;
              else if (typeof dept.teams === 'string') {
                try { deptTeams = JSON.parse(dept.teams); } catch (e) {}
              }
            }

            let deptTitles: string[] = [];
            if (dept.job_titles) {
              if (Array.isArray(dept.job_titles)) deptTitles = dept.job_titles;
              else if (typeof dept.job_titles === 'string') {
                try { deptTitles = JSON.parse(dept.job_titles); } catch (e) {}
              }
            }

            return (
              <div
                key={dept.id}
                onClick={() => navigate(`/hr/departments/${dept.id}`)}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group relative flex flex-col justify-between cursor-pointer space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={!canShareDept}
                        onClick={() => handleShareDepartment(dept)}
                        className={cn(
                          "p-2 rounded-xl transition-colors cursor-pointer",
                          canShareDept ? "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" : "text-slate-200 cursor-not-allowed"
                        )}
                        title="Share Department"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={!canViewDept}
                        onClick={() => navigate(`/hr/departments/${dept.id}`)}
                        className={cn(
                          "p-2 rounded-xl transition-colors cursor-pointer",
                          canViewDept ? "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" : "text-slate-200 cursor-not-allowed"
                        )}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={!canEditDept}
                        onClick={() => navigate(`/hr/departments/${dept.id}?edit=true`)}
                        className={cn(
                          "p-2 rounded-xl transition-colors cursor-pointer",
                          canEditDept ? "text-slate-400 hover:text-blue-600 hover:bg-blue-50" : "text-slate-200 cursor-not-allowed"
                        )}
                        title="Edit Department"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={!canDeleteDept}
                        onClick={() => setShowDeptDeleteConfirm(dept.id)}
                        className={cn(
                          "p-2 rounded-xl transition-colors cursor-pointer",
                          canDeleteDept ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" : "text-slate-200 cursor-not-allowed"
                        )}
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {dept.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1">
                    {dept.description || 'No description provided.'}
                  </p>
                </div>

                {/* Teams Badges Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Teams ({deptTeams.length})</span>
                    <span>{deptTitles.length} Titles</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {deptTeams.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No teams configured</span>
                    ) : (
                      deptTeams.slice(0, 3).map((team: any, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md">
                          {team.name}
                        </span>
                      ))
                    )}
                    {deptTeams.length > 3 && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[11px] font-bold rounded-md">
                        +{deptTeams.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer with Department Head & Member Count */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 uppercase">
                      {headEmployee?.name ? headEmployee.name.charAt(0) : '?'}
                    </div>
                    <span className="text-xs text-slate-600">
                      Head: <span className="font-extrabold text-slate-800">{headEmployee?.name || 'Unassigned'}</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredDepartments.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No departments found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first organizational department to get started.'}
              </p>
              {(isHRAdmin || canAddDept) && (
                <button
                  type="button"
                  onClick={() => navigate('/hr/departments/new')}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Department
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Teams</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Job Titles</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department Head</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      No departments found.
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept: any) => {
                    const memberCount = employees.filter(emp => emp.department_id === dept.id).length;
                    const headEmployee = employees.find(emp => emp.id === dept.department_head_id);

                    let deptTeams: any[] = [];
                    if (dept.teams) {
                      if (Array.isArray(dept.teams)) deptTeams = dept.teams;
                      else if (typeof dept.teams === 'string') {
                        try { deptTeams = JSON.parse(dept.teams); } catch (e) {}
                      }
                    }

                    let deptTitles: string[] = [];
                    if (dept.job_titles) {
                      if (Array.isArray(dept.job_titles)) deptTitles = dept.job_titles;
                      else if (typeof dept.job_titles === 'string') {
                        try { deptTitles = JSON.parse(dept.job_titles); } catch (e) {}
                      }
                    }

                    return (
                      <tr
                        key={dept.id}
                        onClick={() => navigate(`/hr/departments/${dept.id}`)}
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-sm">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-slate-900 block">{dept.name}</span>
                              <span className="text-xs text-slate-400">{dept.description || 'No description'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {deptTeams.length === 0 ? (
                              <span className="text-slate-400 italic">None</span>
                            ) : (
                              deptTeams.map((t: any, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md">
                                  {t.name}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                          {deptTitles.length} Titles
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase shrink-0">
                              {headEmployee?.name ? headEmployee.name.charAt(0) : '?'}
                            </div>
                            <span className="font-semibold text-slate-800">{headEmployee?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-semibold">{memberCount} members</td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-1">
                            <button
                              type="button"
                              disabled={!canShareDept}
                              onClick={() => handleShareDepartment(dept)}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors cursor-pointer",
                                canShareDept ? "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" : "text-slate-200 cursor-not-allowed"
                              )}
                              title="Share Department"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={!canViewDept}
                              onClick={() => navigate(`/hr/departments/${dept.id}`)}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors cursor-pointer",
                                canViewDept ? "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" : "text-slate-200 cursor-not-allowed"
                              )}
                              title="View Department Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={!canEditDept}
                              onClick={() => navigate(`/hr/departments/${dept.id}?edit=true`)}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors cursor-pointer",
                                canEditDept ? "text-slate-400 hover:text-blue-600 hover:bg-blue-50" : "text-slate-200 cursor-not-allowed"
                              )}
                              title="Edit Department"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={!canDeleteDept}
                              onClick={() => setShowDeptDeleteConfirm(dept.id)}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors cursor-pointer",
                                canDeleteDept ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" : "text-slate-200 cursor-not-allowed"
                              )}
                              title="Delete Department"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* Delete Department Confirmation Dialog */}
      {showDeptDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Department?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this department? Employees assigned to this department will have their department assignment cleared.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeptDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteDept}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-200 flex items-center gap-1.5"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsListPage;
