import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  Settings, 
  Layers, 
  Target, 
  Users, 
  Workflow, 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Sliders, 
  ShieldCheck, 
  Award,
  RefreshCw,
  Info,
  ChevronRight,
  TrendingUp,
  Cpu,
  BarChart3
} from 'lucide-react';
import { Department } from '../../../types';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';

export interface PerformanceSettingRule {
  id?: number;
  department_id: number | null;
  department_name?: string;
  team_name: string;
  job_title: string;
  framework_code: '360' | 'okrs' | 'competencies' | 'mbo' | 'hybrid';
  evaluation_weights: {
    manager?: number;
    peers?: number;
    subordinates?: number;
    self?: number;
    okrs?: number;
    kpis?: number;
    competencies?: number;
    mbo?: number;
    [key: string]: number | undefined;
  };
  cycle_frequency: 'Monthly' | 'Quarterly' | 'Annual';
  enable_self_appraisal: boolean;
  approval_workflow: string[];
  competencies: string[];
  created_at?: string;
}

const FRAMEWORK_TYPES = [
  {
    code: 'hybrid',
    name: 'Hybrid Evaluation Model',
    badge: 'Recommended',
    badgeColor: 'bg-emerald-100 text-[#1b5e20] border-emerald-200',
    description: 'Blends data-driven OKRs/KPIs, multi-source 360° feedback, competencies, and manager objectives into a customizable composite score.'
  },
  {
    code: 'okrs',
    name: 'OKRs & KPIs (Key Results & Metrics)',
    badge: 'Data-Driven',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Automatically links live milestone achievements and numeric target numbers directly from the KPI and Goals engine.'
  },
  {
    code: '360',
    name: '360-Degree Feedback',
    badge: 'Multi-Perspective',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Comprehensive evaluation gathering reviews from direct manager, peers, subordinates, and self-appraisal.'
  },
  {
    code: 'competencies',
    name: 'Standard Competencies',
    badge: 'Behavioral & Skills',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Evaluates standardized technical, behavioral, and leadership skills defined for each role and department.'
  },
  {
    code: 'mbo',
    name: 'Management by Objectives (MBO)',
    badge: 'Direct Alignment',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Direct agreement on SMART key objectives set by department head and direct manager for the appraisal cycle.'
  }
];

const DEFAULT_WORKFLOW_STEPS = [
  "Direct Manager",
  "Department Head",
  "HR Director"
];

const DEFAULT_COMPETENCIES = [
  "Leadership & Initiative",
  "Communication & Impact",
  "Teamwork & Collaboration",
  "Problem Solving & Innovation",
  "Productivity & Quality"
];

export const PerformanceAppraisalEnginePage: React.FC = () => {
  const navigate = useNavigate();
  const { departments, employees } = useHRContext();

  const [activeTab, setActiveTab] = useState<'rules' | 'builder' | 'simulator'>('rules');
  const [savedRules, setSavedRules] = useState<PerformanceSettingRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for Matrix Builder
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [frameworkCode, setFrameworkCode] = useState<'360' | 'okrs' | 'competencies' | 'mbo' | 'hybrid'>('hybrid');
  
  // Weights State
  const [weights360, setWeights360] = useState({ manager: 40, peers: 30, subordinates: 15, self: 15 });
  const [weightsOKRs, setWeightsOKRs] = useState({ okrs: 70, kpis: 30 });
  const [weightsHybrid, setWeightsHybrid] = useState({ okrs: 40, 360: 30, competencies: 15, mbo: 15 });

  // Cycle & Workflow State
  const [cycleFrequency, setCycleFrequency] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Quarterly');
  const [enableSelfAppraisal, setEnableSelfAppraisal] = useState<boolean>(true);
  const [workflowSteps, setWorkflowSteps] = useState<string[]>(DEFAULT_WORKFLOW_STEPS);
  const [newStepText, setNewStepText] = useState<string>('');
  
  // Competencies State
  const [competenciesList, setCompetenciesList] = useState<string[]>(DEFAULT_COMPETENCIES);
  const [newCompetencyText, setNewCompetencyText] = useState<string>('');

  // Simulation State
  const [simSelectedUser, setSimSelectedUser] = useState<string>('');
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Active employees only
  const activeEmployees = useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || 'active').toLowerCase().trim();
      return s === 'active';
    });
  }, [employees]);

  useEffect(() => {
    fetchSettingsRules();
  }, []);

  const fetchSettingsRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hr/performance/settings');
      if (res.ok) {
        const data = await res.json();
        setSavedRules(data);
      }
    } catch (err) {
      console.error('Failed to load performance settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setEditingRuleId(null);
    setSelectedDeptId(null);
    setTeamName('');
    setJobTitle('');
    setFrameworkCode('hybrid');
    setWeights360({ manager: 40, peers: 30, subordinates: 15, self: 15 });
    setWeightsOKRs({ okrs: 70, kpis: 30 });
    setWeightsHybrid({ okrs: 40, 360: 30, competencies: 15, mbo: 15 });
    setCycleFrequency('Quarterly');
    setEnableSelfAppraisal(true);
    setWorkflowSteps(DEFAULT_WORKFLOW_STEPS);
    setCompetenciesList(DEFAULT_COMPETENCIES);
  };

  const handleEditRule = (rule: PerformanceSettingRule) => {
    setEditingRuleId(rule.id || null);
    setSelectedDeptId(rule.department_id);
    setTeamName(rule.team_name || '');
    setJobTitle(rule.job_title || '');
    setFrameworkCode(rule.framework_code || 'hybrid');
    setCycleFrequency(rule.cycle_frequency || 'Quarterly');
    setEnableSelfAppraisal(rule.enable_self_appraisal ?? true);

    if (Array.isArray(rule.approval_workflow)) {
      setWorkflowSteps(rule.approval_workflow);
    }
    if (Array.isArray(rule.competencies)) {
      setCompetenciesList(rule.competencies);
    }

    if (rule.evaluation_weights) {
      if (rule.framework_code === '360') {
        setWeights360({
          manager: rule.evaluation_weights.manager ?? 40,
          peers: rule.evaluation_weights.peers ?? 30,
          subordinates: rule.evaluation_weights.subordinates ?? 15,
          self: rule.evaluation_weights.self ?? 15,
        });
      } else if (rule.framework_code === 'okrs') {
        setWeightsOKRs({
          okrs: rule.evaluation_weights.okrs ?? 70,
          kpis: rule.evaluation_weights.kpis ?? 30,
        });
      } else if (rule.framework_code === 'hybrid') {
        setWeightsHybrid({
          okrs: rule.evaluation_weights.okrs ?? 40,
          360: rule.evaluation_weights['360'] ?? 30,
          competencies: rule.evaluation_weights.competencies ?? 15,
          mbo: rule.evaluation_weights.mbo ?? 15,
        });
      }
    }

    setActiveTab('builder');
  };

  const handleDeleteRule = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this performance evaluation rule?')) return;
    try {
      const res = await fetch(`/api/hr/performance/settings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedRules(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    let activeWeights: Record<string, number> = {};
    if (frameworkCode === '360') {
      activeWeights = weights360;
    } else if (frameworkCode === 'okrs') {
      activeWeights = weightsOKRs;
    } else if (frameworkCode === 'competencies') {
      activeWeights = { competencies: 100 };
    } else if (frameworkCode === 'mbo') {
      activeWeights = { mbo: 100 };
    } else if (frameworkCode === 'hybrid') {
      activeWeights = weightsHybrid;
    }

    const payload: PerformanceSettingRule = {
      id: editingRuleId || undefined,
      department_id: selectedDeptId,
      team_name: teamName,
      job_title: jobTitle,
      framework_code: frameworkCode,
      evaluation_weights: activeWeights,
      cycle_frequency: cycleFrequency,
      enable_self_appraisal: enableSelfAppraisal,
      approval_workflow: workflowSteps,
      competencies: competenciesList,
    };

    try {
      const res = await fetch('/api/hr/performance/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchSettingsRules();
        handleResetForm();
        setActiveTab('rules');
      }
    } catch (err) {
      console.error('Error saving performance rule', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!simSelectedUser) return;
    setIsSimulating(true);
    const emp = employees.find(e => String(e.id) === simSelectedUser);

    try {
      const res = await fetch('/api/hr/performance/evaluate-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: emp?.id,
          department_id: emp?.department_id,
          job_title: emp?.job_title,
          team_name: (emp as any)?.team || ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
      }
    } catch (err) {
      console.error('Simulation error', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Helper calculations
  const get360TotalWeight = () => weights360.manager + weights360.peers + weights360.subordinates + weights360.self;
  const getHybridTotalWeight = () => weightsHybrid.okrs + weightsHybrid['360'] + weightsHybrid.competencies + weightsHybrid.mbo;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Page Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/performance')}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Back to Performance Core"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1b5e20] border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                Engine Core & Evaluation Matrix
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Performance Appraisal Engine & Evaluation Rules
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Configure frameworks, cycle intervals, dynamic multi-rater weights, competencies, and approval chains.
            </p>
          </div>
        </div>

        {/* View / Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === 'rules' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Configured Rules ({savedRules.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === 'builder' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{editingRuleId ? 'Edit Matrix Rule' : 'Matrix & Scope Builder'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === 'simulator' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Rule Simulator</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div>
        {/* TAB 1: SAVED RULES LIST */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500">
                Evaluation frameworks and dynamic matrix rules currently deployed across company departments.
              </p>
              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  setActiveTab('builder');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Evaluation Rule</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold">Loading appraisal engine rules...</p>
              </div>
            ) : savedRules.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Sliders className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-800">No Custom Evaluation Rules Configured</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The system is using default hybrid evaluation matrices. Create custom rules to tailor frameworks per department or role.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setActiveTab('builder');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Matrix Rule</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedRules.map(rule => {
                  const dept = departments.find(d => d.id === rule.department_id);
                  const fw = FRAMEWORK_TYPES.find(f => f.code === rule.framework_code) || FRAMEWORK_TYPES[0];

                  return (
                    <div 
                      key={rule.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all space-y-4 flex flex-col justify-between shadow-2xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border", fw.badgeColor)}>
                              {fw.name}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 mt-2">
                              {dept ? dept.name : 'All Departments (Default)'}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Scope: {rule.job_title ? `Role: ${rule.job_title}` : 'All Job Titles'} 
                              {rule.team_name ? ` • Team: ${rule.team_name}` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditRule(rule)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 transition cursor-pointer"
                              title="Edit Rule"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => rule.id && handleDeleteRule(rule.id)}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Delete Rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Weights breakdown */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            Active Weights Matrix:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(rule.evaluation_weights || {}).map(([key, val]) => (
                              <span key={key} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700">
                                {key.toUpperCase()}: <strong className="text-emerald-600">{val}%</strong>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Workflow Chain */}
                        {rule.approval_workflow && rule.approval_workflow.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Workflow className="w-3 h-3 text-indigo-500" />
                              <span>Approval Flow ({rule.approval_workflow.length} stages):</span>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap text-[11px] font-medium text-slate-600">
                              {rule.approval_workflow.map((step, idx) => (
                                <React.Fragment key={idx}>
                                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-bold">{step}</span>
                                  {idx < rule.approval_workflow.length - 1 && <span className="text-slate-300">→</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span>Cycle: {rule.cycle_frequency || 'Quarterly'}</span>
                        <span>Self-Review: {rule.enable_self_appraisal ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MATRIX BUILDER */}
        {activeTab === 'builder' && (
          <form onSubmit={handleSaveRule} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {editingRuleId ? 'Edit Performance Evaluation Rule' : 'Create New Performance Evaluation Rule'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Specify targeting scope, appraisal framework, scoring weights, and approval workflow chain.
                  </p>
                </div>
                {editingRuleId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Cancel & Create New
                  </button>
                )}
              </div>

              {/* 1. Scope Selection */}
              <div className="space-y-3">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>1. Evaluation Targeting Scope (نطاق التطبيق)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Department</label>
                    <select
                      value={selectedDeptId || ''}
                      onChange={e => setSelectedDeptId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                    >
                      <option value="">Global Company Rule (Default)</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Team / Unit</label>
                    <input 
                      type="text"
                      placeholder="e.g. Core Engineering, Inside Sales..."
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Specific Job Title (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Senior Software Engineer"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Framework Selection */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>2. Select Appraisal Framework</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {FRAMEWORK_TYPES.map(fw => {
                    const isSelected = frameworkCode === fw.code;
                    return (
                      <div 
                        key={fw.code}
                        onClick={() => setFrameworkCode(fw.code as any)}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2",
                          isSelected 
                            ? "border-indigo-600 bg-indigo-50/30 shadow-xs" 
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", fw.badgeColor)}>
                              {fw.badge}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-xs font-black text-slate-900">{fw.name}</h4>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{fw.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Dynamic Weight Allocation */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>3. Dynamic Evaluation Weight Distribution (%)</span>
                  </div>
                  {frameworkCode === '360' && (
                    <span className={cn(
                      "text-xs font-black px-2.5 py-0.5 rounded-full border",
                      get360TotalWeight() === 100 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-rose-100 text-rose-800 border-rose-200"
                    )}>
                      Total: {get360TotalWeight()}% {get360TotalWeight() !== 100 && '(Should equal 100%)'}
                    </span>
                  )}
                  {frameworkCode === 'hybrid' && (
                    <span className={cn(
                      "text-xs font-black px-2.5 py-0.5 rounded-full border",
                      getHybridTotalWeight() === 100 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-rose-100 text-rose-800 border-rose-200"
                    )}>
                      Total: {getHybridTotalWeight()}% {getHybridTotalWeight() !== 100 && '(Should equal 100%)'}
                    </span>
                  )}
                </div>

                {/* 360 Weights Sliders */}
                {frameworkCode === '360' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Direct Manager Evaluation</span>
                        <span className="text-indigo-600 font-mono font-black">{weights360.manager}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weights360.manager}
                        onChange={e => setWeights360({ ...weights360, manager: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Peer Reviews Average</span>
                        <span className="text-indigo-600 font-mono font-black">{weights360.peers}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weights360.peers}
                        onChange={e => setWeights360({ ...weights360, peers: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Subordinates / Team Ratings</span>
                        <span className="text-indigo-600 font-mono font-black">{weights360.subordinates}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weights360.subordinates}
                        onChange={e => setWeights360({ ...weights360, subordinates: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Self-Appraisal Score</span>
                        <span className="text-indigo-600 font-mono font-black">{weights360.self}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weights360.self}
                        onChange={e => setWeights360({ ...weights360, self: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                )}

                {/* Hybrid Weights Sliders */}
                {frameworkCode === 'hybrid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>OKRs & Quantitative Targets</span>
                        <span className="text-emerald-700 font-mono font-black">{weightsHybrid.okrs}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weightsHybrid.okrs}
                        onChange={e => setWeightsHybrid({ ...weightsHybrid, okrs: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>360° Multi-Source Feedback</span>
                        <span className="text-emerald-700 font-mono font-black">{weightsHybrid['360']}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weightsHybrid['360']}
                        onChange={e => setWeightsHybrid({ ...weightsHybrid, '360': Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Role Competencies & Skills</span>
                        <span className="text-emerald-700 font-mono font-black">{weightsHybrid.competencies}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weightsHybrid.competencies}
                        onChange={e => setWeightsHybrid({ ...weightsHybrid, competencies: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>MBO (Special Agreed Goals)</span>
                        <span className="text-emerald-700 font-mono font-black">{weightsHybrid.mbo}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weightsHybrid.mbo}
                        onChange={e => setWeightsHybrid({ ...weightsHybrid, mbo: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>
                  </div>
                )}

                {/* OKRs Weights */}
                {frameworkCode === 'okrs' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>OKRs Milestone Completion</span>
                        <span className="text-blue-700 font-mono font-black">{weightsOKRs.okrs}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weightsOKRs.okrs}
                        onChange={e => setWeightsOKRs({ ...weightsOKRs, okrs: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>KPI Numeric Attainment</span>
                        <span className="text-blue-700 font-mono font-black">{weightsOKRs.kpis}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weightsOKRs.kpis}
                        onChange={e => setWeightsOKRs({ ...weightsOKRs, kpis: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Competencies Management */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>4. Role Competencies Library</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Add competency (e.g. Critical Thinking, Client Empathy)..."
                    value={newCompetencyText}
                    onChange={e => setNewCompetencyText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (newCompetencyText.trim()) {
                        setCompetenciesList([...competenciesList, newCompetencyText.trim()]);
                        setNewCompetencyText('');
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {competenciesList.map((comp, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <span>{comp}</span>
                      <button
                        type="button"
                        onClick={() => setCompetenciesList(competenciesList.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 5. Approval Workflow Chain */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Workflow className="w-4 h-4 text-indigo-600" />
                  <span>5. Multi-Stage Approval Workflow Chain</span>
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Add approval role (e.g. Managing Partner, VP Operations)..."
                    value={newStepText}
                    onChange={e => setNewStepText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (newStepText.trim()) {
                        setWorkflowSteps([...workflowSteps, newStepText.trim()]);
                        setNewStepText('');
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stage</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-2">
                  {workflowSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                        <button
                          type="button"
                          onClick={() => setWorkflowSteps(workflowSteps.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 text-sm ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                      {idx < workflowSteps.length - 1 && <span className="text-slate-300 font-bold">→</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Settings toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cycle Frequency</label>
                  <select
                    value={cycleFrequency}
                    onChange={e => setCycleFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                  >
                    <option value="Monthly">Monthly Evaluation</option>
                    <option value="Quarterly">Quarterly Review (Standard)</option>
                    <option value="Annual">Annual Appraisal</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <input 
                    type="checkbox"
                    id="selfAppraisalCheck"
                    checked={enableSelfAppraisal}
                    onChange={e => setEnableSelfAppraisal(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                  <label htmlFor="selfAppraisalCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Enable Employee Self-Appraisal Submission
                  </label>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#1b5e20] hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Matrix Rule...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save & Deploy Appraisal Rule</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Appraisal Engine Scope Rule Simulator
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Test which evaluation rule, framework, weights, and workflow will be automatically resolved for a selected employee.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={simSelectedUser}
                onChange={e => setSimSelectedUser(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
              >
                <option value="">-- Choose Employee to Simulate --</option>
                {activeEmployees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.job_title || 'General Role'})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={!simSelectedUser || isSimulating}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {isSimulating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resolving Scope...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    <span>Simulate Resolution</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulation Result */}
            {simResult && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Resolved Scope Matching Result</span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-[#1b5e20] rounded-full text-[10px] font-black uppercase tracking-wider">
                    {simResult.applied_rule?.framework_code?.toUpperCase() || 'HYBRID'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Matched Rule ID:</span>
                    <span className="font-mono font-black text-slate-800">
                      {simResult.applied_rule?.id ? `#${simResult.applied_rule.id}` : 'Global Default Fallback'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Cycle Frequency:</span>
                    <span className="font-bold text-slate-800">{simResult.applied_rule?.cycle_frequency || 'Quarterly'}</span>
                  </div>
                </div>

                {/* Weights preview */}
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold text-xs block">Evaluation Component Weights:</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(simResult.applied_rule?.evaluation_weights || {}).map(([k, v]) => (
                      <span key={k} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                        {k.toUpperCase()}: <strong className="text-emerald-700">{String(v)}%</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Workflow chain */}
                {simResult.applied_rule?.approval_workflow?.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-200">
                    <span className="text-slate-400 font-bold text-xs block">Resolved Approval Chain:</span>
                    <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-800 pt-1">
                      {simResult.applied_rule.approval_workflow.map((s: string, i: number) => (
                        <React.Fragment key={i}>
                          <span className="px-2.5 py-1 bg-white rounded border border-slate-200">{i + 1}. {s}</span>
                          {i < simResult.applied_rule.approval_workflow.length - 1 && <span className="text-slate-300">→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceAppraisalEnginePage;
