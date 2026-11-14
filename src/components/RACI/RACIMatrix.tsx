import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Info, 
  HelpCircle, 
  Filter, 
  Plus, 
  Trash2, 
  AlertTriangle,
  ChevronRight,
  Search,
  LayoutDashboard,
  Grid3X3,
  UserCheck,
  ClipboardCheck,
  Award,
  TrendingUp,
  AlertOctagon,
  Gauge,
  UserX,
  UserPlus,
  ArrowRight,
  Send,
  Sparkles,
  Flame,
  CheckCircle,
  FolderLock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useHasPermission } from '../Admin/PermissionGate';

interface RACIAssignment {
  id: number;
  sop_id?: number;
  sop_step_id?: number;
  role_type: 'R' | 'A' | 'C' | 'I';
  user_id?: number;
  role_id?: number;
  user_name?: string;
  role_name?: string;
}

interface RACIMatrixData {
  sops: { id: number; title: string; department_id: number }[];
  steps: { id: number; sop_id: number; step_number: number; step_description: string }[];
  roles: { id: number; name: string }[];
  assignments: RACIAssignment[];
}

const RACIMatrix = () => {
  const [data, setData] = useState<RACIMatrixData | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState<string[]>([]);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'matrix' | 'dashboard' | 'directory' | 'audit'>('matrix');

  // Directory State
  const [rolesWithCount, setRolesWithCount] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  
  // Clarity Score Survey State
  const [clarityData, setClarityData] = useState<{ surveys: any[]; average: number }>({ surveys: [], average: 85 });
  const [surveyName, setSurveyName] = useState('');
  const [surveyScore, setSurveyScore] = useState(90);
  const [surveyFeedback, setSurveyFeedback] = useState('');
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  // Search keyword for the Directory & Dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [roleSearchTerm, setRoleSearchTerm] = useState('');

  const canEdit = useHasPermission('RACI Matrix', 'edit');

  const fetchMatrixData = useCallback(async () => {
    try {
      const url = selectedDept ? `/api/raci/matrix?department_id=${selectedDept}` : '/api/raci/matrix';
      const res = await fetch(url);
      const matrixData = await res.json();
      setData(matrixData);
      detectConflicts(matrixData);
    } catch (err) {
      console.error("Failed to fetch RACI data", err);
    }
  }, [selectedDept]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      setDepartments(await res.json());
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const fetchDirectoryAndClarity = useCallback(async () => {
    try {
      const rolesRes = await fetch('/api/raci/roles');
      const rolesData = await rolesRes.json();
      setRolesWithCount(rolesData);

      const empRes = await fetch('/api/raci/employees');
      const empData = await empRes.json();
      setEmployees(empData);

      const clarityRes = await fetch('/api/raci/clarity');
      const clarityResData = await clarityRes.json();
      setClarityData(clarityResData);
    } catch (err) {
      console.error("Failed to fetch RACI directory/clarity", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMatrixData(), fetchDepartments(), fetchDirectoryAndClarity()]).finally(() => {
      setLoading(false);
    });
  }, [fetchMatrixData, fetchDirectoryAndClarity]);

  const detectConflicts = (matrixData: RACIMatrixData) => {
    const newConflicts: string[] = [];
    
    matrixData.sops.forEach(sop => {
      const accountable = (matrixData.assignments || []).filter(a => a.sop_id === sop.id && a.role_type === 'A');
      if (accountable.length === 0) {
        newConflicts.push(`Process "${sop.title}" has no Accountable (A) assigned.`);
      } else if (accountable.length > 1) {
        newConflicts.push(`Process "${sop.title}" has multiple Accountable (A) assignments. Only one is allowed.`);
      }
    });

    matrixData.steps.forEach(step => {
      const accountable = (matrixData.assignments || []).filter(a => a.sop_step_id === step.id && a.role_type === 'A');
      if (accountable.length === 0) {
        newConflicts.push(`Step "${step.step_description}" (Process: ${matrixData.sops.find(s => s.id === step.sop_id)?.title}) has no Accountable (A) assigned.`);
      }
    });

    setConflicts(newConflicts);
  };

  const getAssignment = (sopId: number | null, roleId: number, stepId: number | null = null) => {
    const assignment = (data?.assignments || []).find(a => 
      (stepId ? a.sop_step_id === stepId : a.sop_id === sopId && !a.sop_step_id) && 
      a.role_id === roleId
    );
    return assignment?.role_type || null;
  };

  const handleAssignmentChange = async (sopId: number | null, roleId: number, type: 'R' | 'A' | 'C' | 'I' | null, stepId: number | null = null) => {
    try {
      const existing = (data?.assignments || []).find(a => 
        (stepId ? a.sop_step_id === stepId : a.sop_id === sopId && !a.sop_step_id) && 
        a.role_id === roleId
      );

      if (existing) {
        await fetch(`/api/raci/${existing.id}`, { method: 'DELETE' });
      }

      if (type) {
        const res = await fetch('/api/raci', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sop_id: sopId,
            sop_step_id: stepId,
            role_id: roleId,
            role_type: type
          })
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to update assignment");
        }
      }
      
      fetchMatrixData();
      fetchDirectoryAndClarity();
    } catch (err) {
      console.error("Failed to update assignment", err);
    }
  };

  // KPI calculations
  const calculateFullyDefinedRatio = () => {
    if (!data) return 0;
    const totalTasks = data.sops.length + data.steps.length;
    if (totalTasks === 0) return 0;
    
    let fullyDefinedCount = 0;
    
    // Check SOPs
    data.sops.forEach(sop => {
      const assigns = (data.assignments || []).filter(a => a.sop_id === sop.id && !a.sop_step_id);
      const types = new Set(assigns.map(a => a.role_type));
      if (types.has('R') && types.has('A') && types.has('C') && types.has('I')) {
        fullyDefinedCount++;
      }
    });

    // Check steps
    data.steps.forEach(step => {
      const assigns = (data.assignments || []).filter(a => a.sop_step_id === step.id);
      const types = new Set(assigns.map(a => a.role_type));
      if (types.has('R') && types.has('A') && types.has('C') && types.has('I')) {
        fullyDefinedCount++;
      }
    });

    return Math.round((fullyDefinedCount / totalTasks) * 100);
  };

  const getAccountabilityOverloadRoles = () => {
    if (!data) return [];
    return data.roles.map(role => {
      const colA = (data.assignments || []).filter(a => a.role_id === role.id && a.role_type === 'A');
      return {
        roleId: role.id,
        roleName: role.name,
        count: colA.length,
        items: colA.map(a => {
          if (a.sop_id && !a.sop_step_id) {
            const sop = data.sops.find(s => s.id === a.sop_id);
            return `SOP: ${sop?.title || 'Unknown'}`;
          } else {
            const step = data.steps.find(s => s.id === a.sop_step_id);
            return `Step: ${step?.step_description || 'Unknown'}`;
          }
        })
      };
    }).filter(r => r.count > 2); // alerting if count is more than 2
  };

  // AUDIT Calculations
  const getNoRTasks = () => {
    if (!data) return [];
    const result: { id: number; type: 'sop' | 'step'; title: string; parent?: string }[] = [];
    data.sops.forEach(sop => {
      const assigns = (data.assignments || []).filter(a => a.sop_id === sop.id && !a.sop_step_id && a.role_type === 'R');
      if (assigns.length === 0) {
        result.push({ id: sop.id, type: 'sop', title: sop.title });
      }
    });
    data.steps.forEach(step => {
      const assigns = (data.assignments || []).filter(a => a.sop_step_id === step.id && a.role_type === 'R');
      if (assigns.length === 0) {
        const sop = data.sops.find(s => s.id === step.sop_id);
        result.push({ id: step.id, type: 'step', title: step.step_description, parent: sop?.title });
      }
    });
    return result;
  };

  const getMultipleATasks = () => {
    if (!data) return [];
    const result: { id: number; type: 'sop' | 'step'; title: string; parent?: string; count: number }[] = [];
    data.sops.forEach(sop => {
      const assigns = (data.assignments || []).filter(a => a.sop_id === sop.id && !a.sop_step_id && a.role_type === 'A');
      if (assigns.length > 1) {
        result.push({ id: sop.id, type: 'sop', title: sop.title, count: assigns.length });
      }
    });
    data.steps.forEach(step => {
      const assigns = (data.assignments || []).filter(a => a.sop_step_id === step.id && a.role_type === 'A');
      if (assigns.length > 1) {
        const sop = data.sops.find(s => s.id === step.sop_id);
        result.push({ id: step.id, type: 'step', title: step.step_description, parent: sop?.title, count: assigns.length });
      }
    });
    return result;
  };

  const getBurnoutRoles = () => {
    if (!data) return [];
    return data.roles.map(role => {
      const colR = (data.assignments || []).filter(a => a.role_id === role.id && a.role_type === 'R');
      return {
        roleId: role.id,
        roleName: role.name,
        count: colR.length,
        tasks: colR.map(a => {
          if (a.sop_id && !a.sop_step_id) {
            const sop = data.sops.find(s => s.id === a.sop_id);
            return `${sop?.title || 'Unknown'}`;
          } else {
            const step = data.steps.find(s => s.id === a.sop_step_id);
            return `${step?.step_description || 'Unknown'}`;
          }
        })
      };
    }).filter(r => r.count > 3); // High frequency tasks (> 3) are candidates for burnout
  };

  // Add role
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    try {
      const res = await fetch('/api/raci/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName })
      });
      if (res.ok) {
        setNewRoleName('');
        fetchDirectoryAndClarity();
        fetchMatrixData();
      } else {
        alert("Failed to create role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete role
  const handleDeleteRole = async (id: number) => {
    if (!confirm("Are you sure you want to delete this role/persona? This will remove all their RACI assignments.")) return;
    try {
      const res = await fetch(`/api/raci/roles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDirectoryAndClarity();
        fetchMatrixData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Assign user to role
  const handleUpdateUserRole = async () => {
    if (!selectedEmp) return;
    try {
      const res = await fetch(`/api/raci/employees/${selectedEmp.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: selectedRoleId ? parseInt(selectedRoleId) : null })
      });
      if (res.ok) {
        setSelectedEmp(null);
        setSelectedRoleId('');
        fetchDirectoryAndClarity();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Clarity Survey
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyFeedback.trim()) return;
    setSubmittingSurvey(true);
    try {
      const res = await fetch('/api/raci/clarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: surveyName.trim() || 'Anonymous Employee',
          score: surveyScore,
          feedback: surveyFeedback.trim()
        })
      });
      if (res.ok) {
        setSurveyName('');
        setSurveyFeedback('');
        fetchDirectoryAndClarity();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSurvey(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    (emp.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (emp.role_name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const filteredRoles = rolesWithCount.filter(r => 
    (r.name || '').toLowerCase().includes((roleSearchTerm || '').toLowerCase())
  );

  const overloadAlerts = getAccountabilityOverloadRoles();
  const fullyDefinedPct = calculateFullyDefinedRatio();

  if (loading && !data) return <div className="p-8 text-center text-slate-500">Loading RACI Responsibility System...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Title & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full">Governance & Compliance</span>
          <h2 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">RACI Responsibility Matrix</h2>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">Define company-wide roles, assign operational ownership across custom SOP steps, audit structural bottlenecks, and safeguard continuous accountability.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 self-start md:self-center">
          <button 
            id="tab-raci-matrix"
            onClick={() => setActiveTab('matrix')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
              activeTab === 'matrix' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Grid3X3 className="w-3.5 h-3.5" /> Matrix Grid
          </button>
          <button 
            id="tab-raci-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all position-relative",
              activeTab === 'dashboard' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> RACI Insights
            {overloadAlerts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
            )}
          </button>
          <button 
            id="tab-raci-directory"
            onClick={() => setActiveTab('directory')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
              activeTab === 'directory' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <UserCheck className="w-3.5 h-3.5" /> Personas & Directory
          </button>
          <button 
            id="tab-raci-audit"
            onClick={() => setActiveTab('audit')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
              activeTab === 'audit' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <ClipboardCheck className="w-3.5 h-3.5" /> Audit & Burnout
          </button>
        </div>
      </div>

      {/* VIEW 1: MATRIX GRID */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          
          {/* Legend and Filter row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'R', label: 'Responsible (R)', col: 'bg-blue-500' },
                { type: 'A', label: 'Accountable (A)', col: 'bg-emerald-500' },
                { type: 'C', label: 'Consulted (C)', col: 'bg-amber-500' },
                { type: 'I', label: 'Informed (I)', col: 'bg-slate-500' },
              ].map(role => (
                <div key={role.type} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <span className={cn("w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white", role.col)}>
                    {role.type}
                  </span>
                  <span className="text-xs font-medium text-slate-600">{role.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm z-20">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="text-xs border-none focus:ring-0 bg-transparent py-0.5"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 border-r border-slate-100 w-[300px]">Process SOP / Actions Sequence</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-[120px]">Department</th>
                    {data?.roles.map(role => (
                      <th key={role.id} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center bg-slate-50">
                        <div className="flex flex-col items-center">
                          <span className="text-slate-800 font-bold">{role.name}</span>
                          <span className="text-[9px] text-slate-400 font-normal capitalize">Persona</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.sops.map(sop => (
                    <React.Fragment key={sop.id}>
                      {/* Main SOP Row */}
                      <tr className="bg-slate-50/70 hover:bg-slate-100 transition-colors group">
                        <td className="px-6 py-3.5 sticky left-0 bg-slate-50 group-hover:bg-slate-100 z-10 border-r border-slate-200/65">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-500 text-xs font-bold">●</span>
                            <span className="text-sm font-extrabold text-slate-950 uppercase tracking-wide">{sop.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className="text-[10px] bg-slate-100 font-extrabold text-slate-500 uppercase px-2 py-1 rounded">
                            {departments.find(d => d.id === sop.department_id)?.name || '-'}
                          </span>
                        </td>
                        {data.roles.map(role => {
                          const type = getAssignment(sop.id, role.id);
                          return (
                            <td key={role.id} className="px-6 py-3.5 text-center">
                              <select 
                                value={type || ''}
                                disabled={!canEdit}
                                onChange={(e) => handleAssignmentChange(sop.id, role.id, e.target.value as any || null)}
                                className={cn(
                                  "w-11 h-11 rounded-xl font-black text-center border-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm transition-all appearance-none text-sm",
                                  !canEdit ? "cursor-not-allowed opacity-85" : "cursor-pointer hover:scale-105",
                                  !type ? "bg-slate-50 text-slate-300" :
                                  type === 'R' ? 'bg-blue-600 text-white shadow-blue-200' :
                                  type === 'A' ? 'bg-emerald-600 text-white shadow-emerald-200' :
                                  type === 'C' ? 'bg-amber-500 text-white shadow-amber-200' :
                                  'bg-slate-500 text-white shadow-slate-200'
                                )}
                              >
                                <option value="">-</option>
                                <option value="R">R</option>
                                <option value="A">A</option>
                                <option value="C">C</option>
                                <option value="I">I</option>
                              </select>
                            </td>
                          );
                        })}
                      </tr>
                      {/* Sub Step Rows */}
                      {data.steps.filter(step => step.sop_id === sop.id).map(step => (
                        <tr key={`step-${step.id}`} className="hover:bg-indigo-50/15 transition-colors group">
                          <td className="pl-12 pr-6 py-2.5 sticky left-0 bg-white group-hover:bg-slate-100/30 z-10 border-r border-slate-200/40">
                            <div className="flex items-start gap-2.5">
                              <div className="inline-block px-1.5 py-0.5 bg-slate-50 rounded border text-[9px] text-slate-400 font-mono mt-0.5">Step {step.step_number}</div>
                              <span className="text-xs text-slate-700 font-medium line-clamp-2">{step.step_description}</span>
                            </div>
                          </td>
                          <td className="px-6 py-2.5 text-center">
                            <span className="text-[10px] text-slate-300">-</span>
                          </td>
                          {data.roles.map(role => {
                            const type = getAssignment(null, role.id, step.id);
                            return (
                              <td key={role.id} className="px-6 py-2.5 text-center">
                                <select 
                                  value={type || ''}
                                  disabled={!canEdit}
                                  onChange={(e) => handleAssignmentChange(null, role.id, e.target.value as any || null, step.id)}
                                  className={cn(
                                    "w-9 h-9 rounded-lg font-black text-center border-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all text-xs appearance-none",
                                    !canEdit ? "cursor-not-allowed opacity-85" : "cursor-pointer hover:scale-105",
                                    !type ? "bg-slate-50 text-slate-200" :
                                    type === 'R' ? 'bg-blue-400 text-white' :
                                    type === 'A' ? 'bg-emerald-400 text-white' :
                                    type === 'C' ? 'bg-amber-400 text-white' :
                                    'bg-slate-400 text-white'
                                  )}
                                >
                                  <option value="">-</option>
                                  <option value="R">R</option>
                                  <option value="A">A</option>
                                  <option value="C">C</option>
                                  <option value="I">I</option>
                                </select>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  {(!data || data.sops.length === 0) && (
                    <tr>
                      <td colSpan={2 + (data?.roles.length || 0)} className="text-center py-12 text-slate-400">
                        No SOPs found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: RACI INSIGHTS DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* KPI Display Header card grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* KPI 1: Fully Defined Tasks Ratio */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-bl-full flex items-center justify-center -mr-2 -mt-2 opacity-50">
                <Gauge className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Fully Defined Actions</p>
              <h3 className="text-4xl font-black text-slate-900 mt-2">{fullyDefinedPct}%</h3>
              <p className="text-xs text-slate-400 mt-1">SOP/Steps possessing all R, A, C, and I roles assigned securely without functional deficiency.</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                <div style={{ width: `${fullyDefinedPct}%` }} className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500" />
              </div>
            </div>

            {/* KPI 2: Accountability Overload bottleneck Alert state */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-bl-full flex items-center justify-center -mr-2 -mt-2 opacity-50">
                <AlertOctagon className="w-8 h-8 text-rose-500" />
              </div>
              <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Accountability Overload</p>
              <h3 className="text-4xl font-black text-slate-900 mt-2">
                {overloadAlerts.length} <span className="text-xs text-slate-400 font-normal">Overloaded Persona(s)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Personas/Roles holding Accountable (A) designations in &gt; 2 standard processes, raising micro-management bottlenecks.</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {overloadAlerts.length === 0 ? (
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-lg">✓ Perfect decision leverage. No overloaded roles.</span>
                ) : (
                  overloadAlerts.map(r => (
                    <span key={r.roleId} className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 font-black px-2 py-0.5 rounded-md">
                      ⚠ {r.roleName} ({r.count} A's)
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* KPI 3: Role Clarity Employee Rating Score */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full flex items-center justify-center -mr-2 -mt-2 opacity-50">
                <UserCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Role Clarity Score</p>
              <h3 className="text-4xl font-black text-slate-900 mt-2">{clarityData.average}%</h3>
              <p className="text-xs text-slate-400 mt-1">Mean understanding reported from interactive staff feedback regarding organizational mappings.</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                <div style={{ width: `${clarityData.average}%` }} className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" />
              </div>
            </div>

          </div>

          {/* Detailed Dashboard Area: Surveys & Bottlenecks grid splits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Interactive Survey Submission */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="text-indigo-600 w-5 h-5" /> Rollout Clarity Survey
                </h4>
                <p className="text-slate-500 text-xs mt-1">Submit employee awareness reports or log individual RACI orientation to update compliance transparency.</p>
              </div>

              <form onSubmit={handleSubmitSurvey} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Your Full Name (or Role Title)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sales Specialist"
                    value={surveyName}
                    onChange={(e) => setSurveyName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Clarity Score (1 - 100%)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        step="5"
                        value={surveyScore}
                        onChange={(e) => setSurveyScore(parseInt(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                      <span className="text-xs font-mono font-bold text-indigo-700 shrink-0 w-8">{surveyScore}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Status Class</label>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded inline-block mt-0.5",
                      surveyScore >= 80 ? "bg-emerald-100 text-emerald-800" :
                      surveyScore >= 60 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                    )}>
                      {surveyScore >= 80 ? 'Highly Oriented' : surveyScore >= 60 ? 'Partially Confident' : 'Requires Guidance'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Feedback/Comments *</label>
                  <textarea 
                    rows={2}
                    required
                    placeholder="Are specific responsibilities confusing to find or execute? Let operations know here..."
                    value={surveyFeedback}
                    onChange={(e) => setSurveyFeedback(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submittingSurvey}
                  className="w-full py-2 bg-slate-900 border-none rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Sentiment Report
                </button>
              </form>

              {/* Clarity feed */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider inline-block mb-1">Staff Logs Feed</span>
                {clarityData.surveys.map((log) => (
                  <div key={log.id} className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{log.user_name}</span>
                      <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{log.score}% Clarity</span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">"{log.feedback}"</p>
                  </div>
                ))}
              </div>

            </div>

            {/* Smart bottleneck Alert detail logs */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="text-rose-500 w-5 h-5" /> Bottleneck Risk Center (Accountability Alert Map)
                </h4>
                <p className="text-slate-500 text-xs mt-1">Continuous assessment of operational congestion risk according to extreme Accountable allocation.</p>
              </div>

              {overloadAlerts.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 mt-2">No Bottlenecks Detected</p>
                  <p className="text-xs text-slate-500 mt-1">Excellent! No single organization persona is assigned Accountable for more than 2 process elements.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {overloadAlerts.map(alert => (
                    <div key={alert.roleId} className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-rose-900 uppercase tracking-tight">{alert.roleName} Persona</p>
                          <p className="text-xs text-slate-500 font-medium">Currently accountable for {alert.count} processes</p>
                        </div>
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black uppercase rounded">Overloaded</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-rose-200/50">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Action Paths Mapped to Accountable:</p>
                        <ul className="space-y-1">
                          {alert.items.map((item, index) => (
                            <li key={index} className="text-xs flex items-center gap-2 text-slate-600">
                              <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-[10px] text-rose-500 font-medium leading-relaxed italic">Recommendation: Delegate accountability structure immediately or introduce secondary operational review heads to alleviate processing latency.</p>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* VIEW 3: PERSONA & ROLE DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-8 animate-fade-in">

          {/* Directory Splits */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Role Definitions list & Form (5 columns) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Define Structures</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Define corporate system labels & roles (e.g. Sales Director, Warehouse Agent).</p>
                </div>
                <Users className="w-5 h-5 text-indigo-500" />
              </div>

              {/* Create Role Form */}
              <form onSubmit={handleAddRole} className="flex gap-2">
                <input 
                  type="text" 
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Sales Rep, Customer Success Manager"
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <button 
                  type="submit"
                  className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Define
                </button>
              </form>

              {/* Roles directory search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  value={roleSearchTerm}
                  onChange={(e) => setRoleSearchTerm(e.target.value)}
                  placeholder="Filter defined roles..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Roles display listing */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredRoles.map(role => (
                  <div key={role.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{role.name}</p>
                      <p className="text-[10px] text-indigo-600 font-bold mt-0.5 bg-indigo-50 px-1.5 py-0.5 rounded-full inline-block">
                        {role.employee_count} Current Employee(s)
                      </p>
                    </div>
                    {role.id !== 1 && (
                      <button 
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {filteredRoles.length === 0 && (
                  <p className="text-center py-6 text-xs text-slate-400">No defined roles match search.</p>
                )}
              </div>

            </div>

            {/* Right: Employee Mapping dashboard (7 columns) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Assigned Incomplete Mapping</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Map organic employees to Roles. Changing users immediately propagates dynamic RACI matrix rights.</p>
                </div>
                <UserCheck className="w-5 h-5 text-emerald-500" />
              </div>

              {/* Selected User Management Card */}
              {selectedEmp ? (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black px-1.5 py-0.5 rounded uppercase">Re-assigning Employee</span>
                      <h5 className="text-sm font-bold text-slate-900 mt-1">{selectedEmp.name}</h5>
                      <p className="text-xs text-slate-500">{selectedEmp.email}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedEmp(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 uppercase font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      className="flex-1 text-xs py-2 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">No Role Mapped</option>
                      {rolesWithCount.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={handleUpdateUserRole}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-indigo-700 transition"
                    >
                      Save Mapping
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl text-center text-xs text-slate-400">
                  Click on any employee below to edit their mapped role/persona instantly!
                </div>
              )}

              {/* Roles directory search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Query employees by name or assigned persona..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Employee list query */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                {filteredEmployees.map(emp => (
                  <div 
                    key={emp.id} 
                    onClick={() => {
                      setSelectedEmp(emp);
                      setSelectedRoleId(emp.role_id ? emp.role_id.toString() : '');
                    }}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer",
                      selectedEmp?.id === emp.id ? "bg-indigo-50/50 border-indigo-200 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-2xs"
                    )}
                  >
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">{emp.name}</span>
                      <span className="text-[10px] text-slate-400 block">{emp.email}</span>
                    </div>

                    <div className="text-right">
                      {emp.role_name ? (
                        <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-1 rounded inline-block">
                          {emp.role_name}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-rose-50 text-rose-500 font-bold px-2 py-1 rounded border border-rose-100 inline-block">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* VIEW 4: RACI AUDIT REPORTS */}
      {activeTab === 'audit' && (
        <div className="space-y-8 animate-fade-in pb-12">
          
          <div className="bg-slate-800 border border-slate-900 rounded-3xl p-6 shadow-md text-white">
            <h4 className="text-xl font-bold flex items-center gap-2">
              <FolderLock className="text-amber-400 w-5 h-5 animate-pulse" /> Administration Structural Defect Ledger
            </h4>
            <p className="text-slate-300 text-xs mt-1">Real-time analytical assessment matching organizational configurations against canonical RACI rules to prevent misaligned focus or missing responsibilities.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Audit Left: Missing "R" (Responsible) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Compliance Defect 1</span>
                <h4 className="text-md font-extrabold text-slate-900 mt-2 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-rose-600" /> Missing "R" (No Responsible)
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Tasks or SOP steps that have no persona assigned to perform the execution. Highly hazardous.</p>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                {getNoRTasks().length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 mt-2">Zero defects mapped</p>
                  </div>
                ) : (
                  getNoRTasks().map((item, idx) => (
                    <div key={idx} className="p-3 bg-rose-50/40 border border-rose-100 rounded-2xl flex items-start gap-3">
                      <span className="w-5 h-5 rounded bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">R</span>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block capitalize">{item.title}</span>
                        {item.parent && (
                          <span className="text-[9px] text-slate-400 block italic">SOP Scope: {item.parent}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Audit Center: Conflict Multiple "A"s (Accountable) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Compliance Defect 2</span>
                <h4 className="text-md font-extrabold text-slate-900 mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Cluttered Authority (Multiple A's)
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Action fields with more than one approval head, diluting final operational velocity and responsibility.</p>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                {getMultipleATasks().length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 mt-2">Zero authority leaks</p>
                  </div>
                ) : (
                  getMultipleATasks().map((item, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/40 border border-amber-100 rounded-2xl flex items-start gap-3">
                      <span className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">A</span>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block capitalize">{item.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded">
                            {item.count} Decision Maker Assigned
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Audit Right: Employee Burnout Risk (> 3 R's) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Staff Risk Assessment</span>
                <h4 className="text-md font-extrabold text-slate-900 mt-2 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600 animate-pulse" /> Persona Burnout Risk Check
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Personas holding too many daily execution roles (R) indicating immediate stress points.</p>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                {getBurnoutRoles().length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 mt-2">Zero burnout stresses found</p>
                  </div>
                ) : (
                  getBurnoutRoles().map((item, idx) => (
                    <div key={idx} className="p-4 bg-orange-50/40 border border-orange-100 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-slate-900 block">{item.roleName}</span>
                        <span className="text-[10px] bg-orange-100 text-orange-850 font-black px-2 py-0.5 rounded">
                          {item.count} Active tasks
                        </span>
                      </div>
                      
                      <div className="bg-white p-2.5 rounded-xl border border-orange-100/70 space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Execution Mappings:</span>
                        {item.tasks.map((task, offset) => (
                          <div key={offset} className="text-[10px] text-slate-600 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default RACIMatrix;
