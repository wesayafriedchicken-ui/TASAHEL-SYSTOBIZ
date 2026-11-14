import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
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
import { Department, User } from '../../types';
import { cn } from '../../lib/utils';

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

interface PerformanceAppraisalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  employees?: any[];
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

export const PerformanceAppraisalSettingsModal: React.FC<PerformanceAppraisalSettingsModalProps> = ({
  isOpen,
  onClose,
  departments,
  employees = []
}) => {
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
  const activeEmployees = React.useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || 'active').toLowerCase().trim();
      return s === 'active';
    });
  }, [employees]);

  useEffect(() => {
    if (isOpen) {
      fetchSettingsRules();
    }
  }, [isOpen]);

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

  // Helper calculation for total weight percent
  const get360TotalWeight = () => weights360.manager + weights360.peers + weights360.subordinates + weights360.self;
  const getHybridTotalWeight = () => weightsHybrid.okrs + weightsHybrid['360'] + weightsHybrid.competencies + weightsHybrid.mbo;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[160] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-slate-800"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#1b5e20] text-white p-6 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
                  Engine Core & Evaluation Matrix
                </span>
              </div>
              <h2 className="text-xl font-black font-serif text-white tracking-tight mt-0.5">
                Performance Appraisal Engine & Evaluation Rules
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Configure evaluation scopes, weight distributions, cycle frequencies, and multi-tier approvals.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rules')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border",
                activeTab === 'rules' 
                  ? "bg-white text-slate-900 border-slate-300 shadow-xs" 
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-200/60"
              )}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Evaluation Rules Matrix ({savedRules.length})</span>
            </button>

            <button
              onClick={() => {
                if (activeTab !== 'builder') handleResetForm();
                setActiveTab('builder');
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border",
                activeTab === 'builder' 
                  ? "bg-[#1b5e20] text-white border-[#1b5e20] shadow-xs" 
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-200/60"
              )}
            >
              <Plus className="w-4 h-4" />
              <span>{editingRuleId ? 'Edit Evaluation Rule' : 'Build New Scope Rule'}</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab('simulator')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border",
              activeTab === 'simulator' 
                ? "bg-indigo-600 text-white border-indigo-700 shadow-xs" 
                : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            )}
          >
            <Sparkles className="w-4 h-4" />
            <span>Scope Engine Simulator</span>
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">

          {/* TAB 1: SAVED RULES MATRIX */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Configured Department & Role Appraisal Rules
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Rules mapped by target department, team, and job titles for automated performance reviews.
                  </p>
                </div>

                <button
                  onClick={() => {
                    handleResetForm();
                    setActiveTab('builder');
                  }}
                  className="px-4 py-2 bg-[#1b5e20] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Rule
                </button>
              </div>

              {isLoading ? (
                <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Loading appraisal rules from backend...</p>
                </div>
              ) : savedRules.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#1b5e20] mx-auto border border-emerald-100">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">No Custom Evaluation Rules Defined Yet</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    By default, the system applies a standard <strong>Hybrid Model (40% OKRs, 30% Manager, 15% Peers, 15% Self)</strong>. Click below to customize rules for specific departments.
                  </p>
                  <button
                    onClick={() => {
                      handleResetForm();
                      setActiveTab('builder');
                    }}
                    className="px-5 py-2.5 bg-[#1b5e20] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer hover:bg-emerald-900 transition inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create First Appraisal Rule
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedRules.map((rule) => {
                    const fw = FRAMEWORK_TYPES.find(f => f.code === rule.framework_code) || FRAMEWORK_TYPES[0];

                    return (
                      <div 
                        key={rule.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="space-y-1">
                            <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border", fw.badgeColor)}>
                              {fw.name}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 pt-1">
                              {rule.department_name || 'All Company Departments'}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                              <span>Team: {rule.team_name || 'All Teams'}</span>
                              <span>•</span>
                              <span>Title: {rule.job_title || 'All Job Titles'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditRule(rule)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Edit Rule"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id!)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Weights pill preview */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            Weight Allocation Breakdown:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(rule.evaluation_weights || {}).map(([key, val]) => (
                              <span key={key} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-bold border border-slate-200/60">
                                {key.toUpperCase()}: <strong className="text-emerald-700">{val}%</strong>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Cycle & Workflow info */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold text-slate-600">
                          <div className="flex items-center gap-1.5 text-emerald-800">
                            <Workflow className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Frequency: {rule.cycle_frequency}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Self-Appraisal: {rule.enable_self_appraisal ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPRAISAL MATRIX BUILDER */}
          {activeTab === 'builder' && (
            <form onSubmit={handleSaveRule} className="space-y-8">
              
              {/* SECTION 1: TARGET SCOPE */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#1b5e20] flex items-center justify-center font-black text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Part 1: Target Scope (تحديد النطاق)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Specify which department, team, or job title this performance rule applies to.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Target Department
                    </label>
                    <select
                      value={selectedDeptId ?? ''}
                      onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                    >
                      <option value="">All Departments (Global Default Rule)</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Target Team Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Frontend, Backend, Telesales"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Target Job Title (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Developer, Account Executive"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: EVALUATION METHOD & FRAMEWORK */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#1b5e20] flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Part 2: Evaluation Framework & Weighting (طريقة التقييم والأوزان)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Select the core methodology and configure percentage weights for each component.
                    </p>
                  </div>
                </div>

                {/* Framework Selector Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {FRAMEWORK_TYPES.map((fw) => {
                    const isSelected = frameworkCode === fw.code;
                    return (
                      <div
                        key={fw.code}
                        onClick={() => setFrameworkCode(fw.code as any)}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 flex flex-col justify-between",
                          isSelected 
                            ? "bg-emerald-50/60 border-[#1b5e20] shadow-xs" 
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                        )}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", fw.badgeColor)}>
                              {fw.badge}
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#1b5e20] text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
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

                {/* Framework Specific Weight Controls */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                  {/* 360-DEGREE CONFIG */}
                  {frameworkCode === '360' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-purple-600" />
                          360-Degree Evaluation Weight Distribution
                        </h4>
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-black",
                          get360TotalWeight() === 100 ? "bg-emerald-100 text-[#1b5e20]" : "bg-amber-100 text-amber-800"
                        )}>
                          Total: {get360TotalWeight()}% {get360TotalWeight() === 100 ? '✓ Balanced' : '(Should total 100%)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Manager Weight %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weights360.manager}
                            onChange={(e) => setWeights360({ ...weights360, manager: Number(e.target.value) })}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Peers Weight %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weights360.peers}
                            onChange={(e) => setWeights360({ ...weights360, peers: Number(e.target.value) })}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Subordinates %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weights360.subordinates}
                            onChange={(e) => setWeights360({ ...weights360, subordinates: Number(e.target.value) })}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Self Appraisal %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weights360.self}
                            onChange={(e) => setWeights360({ ...weights360, self: Number(e.target.value) })}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OKRS / KPIS CONFIG */}
                  {frameworkCode === 'okrs' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                        <Target className="w-4 h-4 text-blue-600" />
                        OKRs & Live KPI Metrics Weighting
                      </div>
                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <p>
                          The engine automatically pulls live target numbers and milestone percentages from the company's KPI table and goal entries to compute real-time scores without manual data entry.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">OKRs Weight %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weightsOKRs.okrs}
                            onChange={(e) => setWeightsOKRs({ ...weightsOKRs, okrs: Number(e.target.value) })}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Live KPIs Weight %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weightsOKRs.kpis}
                            onChange={(e) => setWeightsOKRs({ ...weightsOKRs, kpis: Number(e.target.value) })}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HYBRID CONFIG */}
                  {frameworkCode === 'hybrid' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Hybrid Composite Weight Breakdown
                        </h4>
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-black",
                          getHybridTotalWeight() === 100 ? "bg-emerald-100 text-[#1b5e20]" : "bg-amber-100 text-amber-800"
                        )}>
                          Total: {getHybridTotalWeight()}% {getHybridTotalWeight() === 100 ? '✓ Balanced' : '(Should total 100%)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">OKRs & KPIs %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weightsHybrid.okrs}
                            onChange={(e) => setWeightsHybrid({ ...weightsHybrid, okrs: Number(e.target.value) })}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">360° Feedback %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weightsHybrid['360']}
                            onChange={(e) => setWeightsHybrid({ ...weightsHybrid, 360: Number(e.target.value) })}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Competencies %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weightsHybrid.competencies}
                            onChange={(e) => setWeightsHybrid({ ...weightsHybrid, competencies: Number(e.target.value) })}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">MBO Direct Goals %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weightsHybrid.mbo}
                            onChange={(e) => setWeightsHybrid({ ...weightsHybrid, mbo: Number(e.target.value) })}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Competency Tags Editor */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Standard Evaluation Competencies (الجدارات والمهارات السلوكية)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {competenciesList.map((comp, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-2xs">
                          {comp}
                          <button
                            type="button"
                            onClick={() => setCompetenciesList(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 max-w-md">
                      <input
                        type="text"
                        placeholder="Add new competency skill..."
                        value={newCompetencyText}
                        onChange={(e) => setNewCompetencyText(e.target.value)}
                        className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCompetencyText.trim()) {
                            setCompetenciesList([...competenciesList, newCompetencyText.trim()]);
                            setNewCompetencyText('');
                          }
                        }}
                        className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: EVALUATION CYCLE & WORKFLOW */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#1b5e20] flex items-center justify-center font-black text-xs">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Part 3: Evaluation Cycle & Workflow (دورة وسير التقييم)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Configure evaluation periodicity, self-appraisals, and multi-step review approvals.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Frequency & Self Appraisal */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Evaluation Frequency (دورية التقييم)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Monthly', 'Quarterly', 'Annual'] as const).map((freq) => (
                          <button
                            key={freq}
                            type="button"
                            onClick={() => setCycleFrequency(freq)}
                            className={cn(
                              "py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center",
                              cycleFrequency === freq 
                                ? "bg-[#1b5e20] text-white border-[#1b5e20] shadow-xs" 
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            )}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Enable Employee Self-Appraisal (التقييم الذاتي)</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Allows employees to submit self-ratings before manager review.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnableSelfAppraisal(!enableSelfAppraisal)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative cursor-pointer",
                          enableSelfAppraisal ? "bg-emerald-600" : "bg-slate-300"
                        )}
                      >
                        <span className={cn(
                          "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-xs",
                          enableSelfAppraisal ? "left-6.5" : "left-0.5"
                        )} />
                      </button>
                    </div>
                  </div>

                  {/* Approval Workflow Chain */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Approval Workflow Chain (الموافقات واعتماد النتيجة)
                    </label>
                    <div className="space-y-2">
                      {workflowSteps.map((step, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-emerald-100 text-[#1b5e20] text-[10px] flex items-center justify-center font-black">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </div>
                          {workflowSteps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setWorkflowSteps(workflowSteps.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-600 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add step (e.g. VP Operations)..."
                        value={newStepText}
                        onChange={(e) => setNewStepText(e.target.value)}
                        className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newStepText.trim()) {
                            setWorkflowSteps([...workflowSteps, newStepText.trim()]);
                            setNewStepText('');
                          }
                        }}
                        className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer shrink-0"
                      >
                        Add Step
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setActiveTab('rules');
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#1b5e20] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Rule...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingRuleId ? 'Update Appraisal Rule' : 'Save & Activate Evaluation Rule'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SCOPE ENGINE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
              <div className="border-b border-slate-100 pb-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
                    Backend Rule Resolution Test
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Performance Scope & Appraisal Rule Tester
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Select an employee to simulate how the backend engine reads department rules and computes customized appraisal components.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-end gap-3 max-w-xl">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee to Test</label>
                  <select
                    value={simSelectedUser}
                    onChange={(e) => setSimSelectedUser(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5"
                  >
                    <option value="">-- Choose Employee --</option>
                    {activeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.job_title || 'No Title'})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={!simSelectedUser || isSimulating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2 shrink-0"
                >
                  {isSimulating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>Execute Rule Resolution</span>
                    </>
                  )}
                </button>
              </div>

              {simResult && (
                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                  <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Engine Resolution Output for User ID: {simResult.user_id}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                    <div className="p-4 bg-white rounded-xl border border-indigo-200/60 space-y-2">
                      <span className="text-[10px] font-black text-indigo-600 uppercase">Resolved Rule Framework</span>
                      <p className="font-bold text-slate-900 text-sm">
                        Framework Code: {simResult.applied_rule?.framework_code?.toUpperCase()}
                      </p>
                      <p className="text-slate-600">
                        Cycle Frequency: {simResult.applied_rule?.cycle_frequency}
                      </p>
                      <p className="text-slate-600">
                        Self Appraisal: {simResult.applied_rule?.enable_self_appraisal ? 'Yes' : 'No'}
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-indigo-200/60 space-y-2">
                      <span className="text-[10px] font-black text-indigo-600 uppercase">Calculated Composite Components</span>
                      <div className="space-y-1 font-bold text-slate-800">
                        <div className="flex justify-between">
                          <span>Live OKRs/KPIs Metric:</span>
                          <span className="text-emerald-700">{simResult.calculated_components?.okr_score}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Manager Review:</span>
                          <span className="text-emerald-700">{simResult.calculated_components?.manager_score}%</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1">
                          <span>Composite Live Score:</span>
                          <span className="text-indigo-700 font-black text-sm">{simResult.calculated_components?.composite_score}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

