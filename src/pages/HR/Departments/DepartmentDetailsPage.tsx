import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building2, Users, Tag, Briefcase, Plus, Trash2, Edit2, Check, 
  ArrowLeft, Layers, UserCheck, Shield, Sparkles, Share2, Eye, Save, 
  Mail, Phone, AlertCircle, Crown, ExternalLink 
} from 'lucide-react';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';
import { DepartmentTeam } from '../../../types';
import { saveDepartmentAPI, deleteDepartmentAPI, syncJDsForDeptObject, parseJobTitles, parseTeams, extractJobTitleString } from './deptUtils';

export const DepartmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { 
    departments, 
    employees, 
    isHRAdmin, 
    canEditDept, 
    canDeleteDept, 
    canShareDept, 
    showCustomToast, 
    fetchData,
    currentUser 
  } = useHRContext();

  const department = useMemo(() => {
    return departments.find(d => String(d.id) === String(id));
  }, [departments, id]);

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [activeTab, setActiveTab] = useState<'roster' | 'teams' | 'titles' | 'edit'>('roster');

  // Edit form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentHeadId, setDepartmentHeadId] = useState<number | null>(null);
  const [isExecutive, setIsExecutive] = useState(false);
  const [teams, setTeams] = useState<DepartmentTeam[]>([]);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Team sub-form
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeamIndex, setEditingTeamIndex] = useState<number | null>(null);
  const [teamFormName, setTeamFormName] = useState('');
  const [teamFormDesc, setTeamFormDesc] = useState('');
  const [teamFormLeadId, setTeamFormLeadId] = useState<number | null>(null);
  const [teamFormJobTitles, setTeamFormJobTitles] = useState<string[]>([]);
  const [newTeamJobTitleInput, setNewTeamJobTitleInput] = useState('');

  // Job title input
  const [newJobTitleInput, setNewJobTitleInput] = useState('');

  // Initialize form state when department is loaded
  useEffect(() => {
    if (department) {
      setName(department.name || '');
      setDescription(department.description || '');
      setDepartmentHeadId(department.department_head_id ? parseInt(String(department.department_head_id)) : null);
      setTeams(parseTeams(department.teams));
      setJobTitles(parseJobTitles(department.job_titles));
    }
  }, [department]);

  // Sync isEditing with URL search param
  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
      setActiveTab('edit');
    }
  }, [searchParams]);

  // Department members
  const departmentEmployees = useMemo(() => {
    if (!department) return [];
    return employees.filter(e => String(e.department_id) === String(department.id));
  }, [employees, department]);

  const headEmployee = useMemo(() => {
    if (!department?.department_head_id) return null;
    return employees.find(e => String(e.id) === String(department.department_head_id));
  }, [employees, department]);

  const activeEmployees = useMemo(() => {
    return employees.filter(e => {
      const s = (e.status || '').toLowerCase();
      return s !== 'inactive' && s !== 'terminated' && s !== 'archived';
    });
  }, [employees]);

  if (!department) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-700">Department Not Found</h3>
        <p className="text-xs text-slate-400">The department you are looking for may have been removed or does not exist.</p>
        <button
          type="button"
          onClick={() => navigate('/hr/departments')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
        >
          Return to Departments
        </button>
      </div>
    );
  }

  const handleShare = () => {
    const text = `Department: ${department.name}\nHead: ${headEmployee?.name || 'Unassigned'}\nMembers: ${departmentEmployees.length}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showCustomToast('Department details copied to clipboard!', 'success');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showCustomToast('Department name is required.', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id: department.id,
        name: name.trim(),
        description: description.trim(),
        department_head_id: departmentHeadId,
        teams: teams,
        job_titles: jobTitles
      };

      await saveDepartmentAPI(payload, currentUser?.id);
      showCustomToast('Department updated and Job Descriptions synchronized successfully!', 'success');
      await fetchData();
      setIsEditing(false);
      setSearchParams({});
      setActiveTab('roster');
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to update department', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteDepartmentAPI(department.id, currentUser?.id);
      showCustomToast('Department deleted successfully', 'success');
      await fetchData();
      navigate('/hr/departments');
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to delete department', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/departments')}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-md">
                Department #{department.id}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">{department.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canShareDept}
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>

          {(isHRAdmin || canEditDept) && (
            <button
              type="button"
              onClick={() => {
                const next = !isEditing;
                setIsEditing(next);
                setActiveTab(next ? 'edit' : 'roster');
              }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer",
                isEditing ? "bg-slate-200 text-slate-800" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
              )}
            >
              <Edit2 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel Edit' : 'Edit Department'}
            </button>
          )}

          {(isHRAdmin || canDeleteDept) && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Delete Department"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{department.name}</h3>
                <p className="text-xs text-slate-500">{department.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 uppercase">
              {headEmployee?.name ? headEmployee.name.charAt(0) : '?'}
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Department Head</span>
              <span className="text-xs font-black text-slate-800">{headEmployee?.name || 'Unassigned'}</span>
              <span className="text-[10px] text-slate-500 block">{headEmployee?.job_title || 'Leadership'}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-around text-center">
            <div>
              <span className="text-lg font-black text-slate-900 block">{departmentEmployees.length}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Members</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-lg font-black text-indigo-600 block">{teams.length}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Teams</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-lg font-black text-slate-900 block">{jobTitles.length}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Titles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer",
            activeTab === 'roster' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Members ({departmentEmployees.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer",
            activeTab === 'teams' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Work Teams ({teams.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('titles')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer",
            activeTab === 'titles' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Tag className="w-4 h-4" />
          <span>Job Titles ({jobTitles.length})</span>
        </button>
        {(isHRAdmin || canEditDept) && (
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer",
              activeTab === 'edit' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Settings</span>
          </button>
        )}
      </div>

      {/* TAB 1: MEMBERS ROSTER */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Department Staff Roster</h3>
              <p className="text-xs text-slate-500">Employees currently assigned to {department.name}.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/hr/directory/new')}
              className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Staff
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Position / Title</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departmentEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      No employees are currently assigned to this department.
                    </td>
                  </tr>
                ) : (
                  departmentEmployees.map((emp) => (
                    <tr 
                      key={emp.id}
                      onClick={() => navigate(`/hr/directory/${emp.id}`)}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs">
                            {emp.name ? emp.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{emp.name}</span>
                            <span className="text-[10px] text-slate-400">ID #{emp.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">
                        {emp.job_title || 'Staff'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="space-y-0.5">
                          {emp.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {emp.email}</div>}
                          {emp.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {emp.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                          emp.status === 'Active' || !emp.status ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {emp.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(`/hr/directory/${emp.id}`)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                        >
                          Profile <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TEAMS */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team, idx) => {
              const leadEmp = employees.find(e => e.id === team.team_lead_id);
              const teamTitles = Array.isArray(team.job_titles) ? team.job_titles : [];
              return (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{team.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{team.description || 'No description'}</p>
                    </div>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg uppercase">
                      Team #{idx + 1}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {leadEmp?.name ? leadEmp.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Team Lead</span>
                      <span className="text-xs font-bold text-slate-800">{leadEmp?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Assigned Job Titles ({teamTitles.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {teamTitles.map((jt, i) => {
                        const titleStr = extractJobTitleString(jt);
                        if (!titleStr) return null;
                        return (
                          <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                            {titleStr}
                          </span>
                        );
                      })}
                      {teamTitles.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No specific job titles assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {teams.length === 0 && (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-2">
                <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No teams configured</h4>
                <p className="text-xs text-slate-400">Switch to the "Edit Settings" tab to add squads/teams to this department.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: JOB TITLES */}
      {activeTab === 'titles' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Job Titles in {department.name}</h3>
              <p className="text-xs text-slate-500">All registered job roles mapped to this department.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/hr/departments/descriptions')}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all"
            >
              View Full Job Descriptions →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {jobTitles.map((titleItem, idx) => {
              const title = extractJobTitleString(titleItem);
              if (!title) return null;
              const holderCount = departmentEmployees.filter(e => (e.job_title || '').toLowerCase() === title.toLowerCase()).length;
              return (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{title}</h4>
                      <span className="text-[11px] text-slate-500">{holderCount} active employees</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/hr/departments/descriptions`)}
                    className="p-1 text-slate-400 hover:text-indigo-600"
                    title="View JD"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {jobTitles.length === 0 && (
              <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No job titles defined</p>
                <p className="text-[11px] text-slate-400">Add job titles in the "Edit Settings" tab.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EDIT SETTINGS */}
      {activeTab === 'edit' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Edit Department Specifications</h3>
              <p className="text-xs text-slate-500">Update general information, teams structure, and job titles.</p>
            </div>
            <button
              type="button"
              disabled={saving || !name.trim()}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md transition-all"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Department Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Department Head / Director
              </label>
              <select
                value={departmentHeadId || ''}
                onChange={(e) => setDepartmentHeadId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              >
                <option value="">-- Unassigned --</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.job_title || 'Staff'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Description & Purpose
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none resize-none"
            />
          </div>

          {/* Quick Job Titles Manager inside Edit tab */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Manage Job Titles</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newJobTitleInput}
                onChange={(e) => setNewJobTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newJobTitleInput.trim() && !jobTitles.includes(newJobTitleInput.trim())) {
                      setJobTitles([...jobTitles, newJobTitleInput.trim()]);
                      setNewJobTitleInput('');
                    }
                  }
                }}
                placeholder="Add job title..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
              <button
                type="button"
                onClick={() => {
                  if (newJobTitleInput.trim() && !jobTitles.includes(newJobTitleInput.trim())) {
                    setJobTitles([...jobTitles, newJobTitleInput.trim()]);
                    setNewJobTitleInput('');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {jobTitles.map((titleItem, idx) => {
                const title = extractJobTitleString(titleItem);
                if (!title) return null;
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl text-xs font-bold"
                  >
                    {title}
                    <button
                      type="button"
                      onClick={() => setJobTitles(jobTitles.filter((_, i) => i !== idx))}
                      className="text-indigo-400 hover:text-rose-600 ml-1"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setIsEditing(false); setActiveTab('roster'); }}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !name.trim()}
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Department'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Department?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{department.name}</strong>?
                Employees currently assigned will have their department assignment cleared.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-200"
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

export default DepartmentDetailsPage;
