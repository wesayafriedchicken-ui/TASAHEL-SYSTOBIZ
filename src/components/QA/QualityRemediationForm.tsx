import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  ClipboardCheck, 
  AlertTriangle, 
  Search, 
  GraduationCap, 
  FileCheck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Info, 
  Calendar, 
  User, 
  Users, 
  BookOpen, 
  Briefcase, 
  ShieldAlert, 
  Eye, 
  Sliders, 
  UserCheck, 
  MessageSquare, 
  Check, 
  Building2, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  HelpCircle, 
  Zap, 
  Tag,
  Clock 
} from 'lucide-react';
import { IncidentType, AuditRecord } from './IncidentWorkflowStepper';
import { ActionPlan } from './ActionPlansManager';
import { EmployeeSearchSelect, EmployeeOption } from './EmployeeSearchSelect';

interface ActionDetailItem {
  id: number;
  action: string;
  subtext?: string;
  type: string;
  priority: string;
  owner: string;
  due_date: string;
  status: string;
}

interface QualityRemediationFormProps {
  plan: Partial<ActionPlan>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Partial<ActionPlan>) => Promise<void> | void;
  saving?: boolean;
  auditRecords?: AuditRecord[];
  presets?: any[];
  availableRules?: any[];
  isFullPage?: boolean;
}

const ROOT_CAUSE_CATEGORIES = [
  'People',
  'Process',
  'System',
  'Facilitation',
  'Operations',
  'Laborers'
];

const ROOT_CAUSE_OPTIONS: Record<string, string[]> = {
  'People': [
    'Lack of Knowledge',
    'Control / Training Gap',
    'Wrong Provision / Procedure',
    'Cost Impact / Non-compliance',
    'Wrong Processes Followed',
    'Complication in Communication'
  ],
  'Process': [
    'Lack of Standard SOP',
    'Workflow Bottleneck',
    'Unclear Escalation Path',
    'Policy Deviation',
    'Incomplete Checklist Validation',
    'SLA Calculation Mismatch'
  ],
  'System': [
    'System Slowness / Outage',
    'UI / UX Data Entry Glitch',
    'Missing Integration Tool',
    'Access / Permission Barrier',
    'Database Sync Delay',
    'Input Validation Failure'
  ],
  'Facilitation': [
    'Outdated KB / Guidance Article',
    'Training Material Incomplete',
    'Quality Calibration Discrepancy',
    'Inadequate Supervisor Briefing',
    'Unclear Policy Clarification',
    'Missing Job Aid Checklist'
  ],
  'Operations': [
    'Peak Volume / Queue Pressure',
    'Shift Handover Communication Gap',
    'Staffing / Resource Shortage',
    'Priority Conflict',
    'Cross-Department Delay',
    'Exception Handling Complexity'
  ],
  'Laborers': [
    'New Hire Learning Curve',
    'Fatigue / Concentration Lapse',
    'Language / Tone Barrier',
    'Technical Workspace Setup',
    'Coaching Feedback Not Applied',
    'Case Difficulty Overload'
  ]
};

const ACTION_LIBRARY_ITEMS = [
  { num: 1, label: 'Feedback', icon: MessageSquare, bg: 'bg-emerald-500', defaultType: 'Communication', defaultPriority: 'Low' },
  { num: 2, label: 'SOP / KB Review', icon: BookOpen, bg: 'bg-blue-500', defaultType: 'Development', defaultPriority: 'Medium' },
  { num: 3, label: '1:1 Coaching', icon: Users, bg: 'bg-purple-600', defaultType: 'Development', defaultPriority: 'Medium' },
  { num: 4, label: 'Case Practice', icon: Briefcase, bg: 'bg-amber-500', defaultType: 'Development', defaultPriority: 'Medium' },
  { num: 5, label: 'Knowledge Assessment', icon: ClipboardCheck, bg: 'bg-yellow-500', defaultType: 'Assessment', defaultPriority: 'High' },
  { num: 6, label: 'Targeted Retraining', icon: GraduationCap, bg: 'bg-teal-500', defaultType: 'Development', defaultPriority: 'High' },
  { num: 7, label: 'Mandatory Retraining', icon: ShieldAlert, bg: 'bg-rose-500', defaultType: 'Development', defaultPriority: 'High' },
  { num: 8, label: 'Increased Monitoring', icon: Eye, bg: 'bg-sky-500', defaultType: 'Monitoring', defaultPriority: 'Medium' },
  { num: 9, label: 'Calibration', icon: Sliders, bg: 'bg-indigo-600', defaultType: 'Assessment', defaultPriority: 'High' },
  { num: 10, label: 'Manager Escalation', icon: UserCheck, bg: 'bg-slate-700', defaultType: 'Preventive', defaultPriority: 'Critical' }
];

export const QualityRemediationForm: React.FC<QualityRemediationFormProps> = ({
  plan: initialPlan,
  isOpen,
  onClose,
  onSave,
  saving = false,
  auditRecords = [],
  presets = [],
  availableRules = [],
  isFullPage = false
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Section 1: General Information
  const [validationId, setValidationId] = useState<string>(initialPlan?.plan_code || '');
  const [validationDate, setValidationDate] = useState<string>(initialPlan?.created_at ? String(initialPlan.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [agent, setAgent] = useState<string>(initialPlan?.agent_name || '');
  const [agentId, setAgentId] = useState<string | null>(initialPlan?.agent_id || null);
  const [team, setTeam] = useState<string>(initialPlan?.department || '');
  const [evaluator, setEvaluator] = useState<string>(initialPlan?.created_by || '');
  const [ownerId, setOwnerId] = useState<string | null>(initialPlan?.owner_id || null);
  const [createdAt, setCreatedAt] = useState<string>(initialPlan?.created_at || new Date().toISOString());
  const [updatedAt, setUpdatedAt] = useState<string>(initialPlan?.updated_at || new Date().toISOString());

  // Section 2: QA Review
  const [qaScore, setQaScore] = useState<string>(initialPlan?.effectiveness_score ? `${initialPlan.effectiveness_score}%` : '');
  const [validationResult, setValidationResult] = useState<string>(initialPlan?.status || 'Pending');
  const [qualityCategory, setQualityCategory] = useState<string>('');
  const [caseId, setCaseId] = useState<string>(initialPlan?.transaction_id || '');
  const [discoveredDate, setDiscoveredDate] = useState<string>(() => {
    if ((initialPlan as any)?.discovered_date) return String((initialPlan as any).discovered_date).slice(0, 10);
    if (initialPlan?.created_at) return String(initialPlan.created_at).slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  });

  // Section 3: Error Classification
  const [errorType, setErrorType] = useState<string>('');
  const [severity, setSeverity] = useState<string>(initialPlan?.severity || 'Medium');
  const [recurrence, setRecurrence] = useState<string>('First Occurrence');
  const [errorDescription, setErrorDescription] = useState<string>('');

  // Section 4: Root Cause (Connected to Categories & Checkbox items)
  const [activeRootCategory, setActiveRootCategory] = useState<string>('');
  const [selectedRootCauseItems, setSelectedRootCauseItems] = useState<string[]>([]);
  const [rootCause, setRootCause] = useState<string>(initialPlan?.root_cause_name || '');
  const [rootCauseDescription, setRootCauseDescription] = useState<string>(initialPlan?.root_cause_analysis || '');

  // Section 5: Training Action (Auto Recommended & Action Details)
  const [actionOwner, setActionOwner] = useState<string>(initialPlan?.assigned_to || '');
  const [targetDate, setTargetDate] = useState<string>(initialPlan?.target_completion_date ? String(initialPlan.target_completion_date).slice(0, 10) : '');
  const [actionStatus, setActionStatus] = useState<string>('Pending');
  const [actionNotes, setActionNotes] = useState<string>('');

  // Action Details Table Items with Due Date & Owner
  const [actionTasks, setActionTasks] = useState<ActionDetailItem[]>(() => {
    if (initialPlan?.action_details && initialPlan.action_details.length > 0) {
      return initialPlan.action_details.map((t: any, idx: number) => ({
        id: t.id || idx + 1,
        action: t.title || t.action || '',
        subtext: t.subtext || '',
        type: t.type || 'Corrective',
        priority: t.priority || 'Medium',
        owner: t.assignee || t.owner || '',
        due_date: t.due_date ? String(t.due_date).slice(0, 10) : '',
        status: t.status || 'Pending'
      }));
    }
    return [];
  });

  // Section 6: Review & Close
  const [reviewer, setReviewer] = useState<string>(initialPlan?.verified_by || '');
  const [reviewerId, setReviewerId] = useState<string | null>(initialPlan?.reviewer_id || null);
  const [reviewDate, setReviewDate] = useState<string>(() => {
    if ((initialPlan as any)?.review_date) return String((initialPlan as any).review_date).slice(0, 10);
    if (initialPlan?.created_at) return String(initialPlan.created_at).slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  });
  const [finalStatus, setFinalStatus] = useState<string>('Pending');
  const [closureNotes, setClosureNotes] = useState<string>('');

  // HR Employees list for directory search (Search Name, ID, Ext, Dept)
  const [hrEmployees, setHrEmployees] = useState<EmployeeOption[]>([]);

  // Fetch live HR Directory employees on load
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('user_id') || '1';
        const res = await fetch('/api/hr/employees', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': userId }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const formatted: EmployeeOption[] = data.map((emp: any) => ({
              id: emp.id || emp.user_id || emp.employee_id,
              name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || 'Employee',
              email: emp.email || emp.work_email,
              department: emp.department_name || emp.department || emp.team_name || emp.personal_info?.department_name || 'Operations',
              job_title: emp.job_title || emp.personal_info?.job_title || '',
              id_number: emp.id_number || emp.personal_info?.employee_number || emp.personal_info?.employee_id || emp.personal_info?.nin || String(emp.id),
              ext: emp.personal_info?.ext || emp.personal_info?.extension || emp.ext || '',
              phone: emp.phone || emp.mobile_phone || emp.personal_info?.mobile_phone || emp.personal_info?.work_phone || '',
              user_id: emp.user_id || emp.id,
              avatar_url: emp.avatar_url
            }));
            setHrEmployees(formatted);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live HR employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  // Dynamically extract all Action Rules and auto actions from Action Rules tab
  const actionRulesList = useMemo(() => {
    const list: { name: string; type: string; priority: string; source: string; ruleId?: number; dept?: string }[] = [];
    
    if (Array.isArray(availableRules) && availableRules.length > 0) {
      availableRules.forEach(rule => {
        // Add rule name
        if (rule.rule_name && !list.some(item => item.name.toLowerCase() === rule.rule_name.toLowerCase())) {
          list.push({
            name: rule.rule_name,
            type: rule.severity_level === 'Critical' ? 'Corrective' : 'Development',
            priority: rule.severity_level || 'High',
            source: `Rule: ${rule.rule_name}`,
            ruleId: rule.id,
            dept: rule.assigned_department
          });
        }
        // Add auto_actions if array
        if (Array.isArray(rule.auto_actions)) {
          rule.auto_actions.forEach((act: string) => {
            if (act && !list.some(item => item.name.toLowerCase() === act.toLowerCase())) {
              list.push({
                name: act,
                type: rule.severity_level === 'Critical' ? 'Corrective' : 'Development',
                priority: rule.severity_level || 'High',
                source: `Rule: ${rule.rule_name}`,
                ruleId: rule.id,
                dept: rule.assigned_department
              });
            }
          });
        }
      });
    }
    
    return list;
  }, [availableRules]);

  // Initialize from initialPlan if editing
  useEffect(() => {
    if (initialPlan) {
      if (initialPlan.plan_code !== undefined) setValidationId(initialPlan.plan_code || '');
      if (initialPlan.agent_name !== undefined) setAgent(initialPlan.agent_name || '');
      if (initialPlan.agent_id !== undefined) setAgentId(initialPlan.agent_id || null);
      if (initialPlan.department !== undefined) setTeam(initialPlan.department || '');
      if (initialPlan.transaction_id !== undefined) setCaseId(initialPlan.transaction_id || '');
      if (initialPlan.severity !== undefined) setSeverity(initialPlan.severity || 'Medium');
      if (initialPlan.root_cause_name !== undefined) setRootCause(initialPlan.root_cause_name || '');
      if (initialPlan.root_cause_analysis !== undefined) setRootCauseDescription(initialPlan.root_cause_analysis || '');
      if (initialPlan.assigned_to !== undefined) setActionOwner(initialPlan.assigned_to || '');
      if (initialPlan.owner_id !== undefined) setOwnerId(initialPlan.owner_id || null);
      if (initialPlan.verified_by !== undefined) setReviewer(initialPlan.verified_by || '');
      if (initialPlan.reviewer_id !== undefined) setReviewerId(initialPlan.reviewer_id || null);
      if (initialPlan.target_completion_date !== undefined) setTargetDate(initialPlan.target_completion_date ? initialPlan.target_completion_date.slice(0, 10) : '');
      if (initialPlan.current_step !== undefined) setCurrentStep(initialPlan.current_step || 1);
      if (initialPlan.created_at !== undefined) setCreatedAt(initialPlan.created_at || new Date().toISOString());
      if (initialPlan.updated_at !== undefined) setUpdatedAt(initialPlan.updated_at || new Date().toISOString());
      if (initialPlan.action_details && initialPlan.action_details.length > 0) {
        setActionTasks(initialPlan.action_details.map((t: any, idx: number) => ({
          id: t.id || (idx + 1),
          action: t.title || t.action || '',
          subtext: t.verification || t.subtext || '',
          type: t.type || 'Development',
          priority: t.priority || 'High',
          owner: t.assignee || t.owner || '',
          due_date: t.due_date ? String(t.due_date).slice(0, 10) : '',
          status: t.status || 'Pending'
        })));
      }
    }
  }, [initialPlan]);

  // Auto-calculated Recommended Action based on Auto Action Rules matrix
  const getAutoRecommendedAction = () => {
    if (severity === 'Critical') {
      if (recurrence === 'First Occurrence') return 'Mandatory Retraining + Knowledge Assessment + Increased QA Monitoring';
      if (recurrence === 'Second Occurrence') return 'Mandatory Retraining + Intensive 1:1 Coaching + Increased Monitoring';
      return 'Calibration + Manager Escalation + Suspension of Complex Cases';
    }
    if (severity === 'Major') {
      if (recurrence === 'First Occurrence') return '1:1 Coaching + Knowledge Assessment';
      if (recurrence === 'Second Occurrence') return 'Targeted Retraining + Case Practice';
      return 'Mandatory Retraining + Increased QA Monitoring';
    }
    // Minor
    if (recurrence === 'First Occurrence') return 'Direct Feedback + SOP / KB Review';
    if (recurrence === 'Second Occurrence') return '1:1 Coaching + Case Practice';
    return 'Targeted Retraining + Knowledge Assessment';
  };

  // Toggle Root Cause checkbox
  const handleToggleRootCauseItem = (item: string) => {
    let updated: string[];
    if (selectedRootCauseItems.includes(item)) {
      updated = selectedRootCauseItems.filter(i => i !== item);
    } else {
      updated = [...selectedRootCauseItems, item];
    }
    setSelectedRootCauseItems(updated);
    setRootCause(updated.length > 0 ? `${activeRootCategory}: ${updated.join(', ')}` : activeRootCategory);
    
    // Dynamically update root cause description
    if (updated.length > 0) {
      setRootCauseDescription(`Identified ${activeRootCategory} root cause factors: ${updated.join(', ')}. Action plan required to address underlying knowledge and execution gap.`);
    }
  };

  // Add new Action Row in table
  const handleAddActionRow = (defaultActionName?: string, defaultType?: string, defaultPriority?: string) => {
    const nextId = actionTasks.length > 0 ? Math.max(...actionTasks.map(t => t.id)) + 1 : 1;
    const actionName = defaultActionName || '1:1 Coaching';
    
    // Check Action Rules first, then Action Library
    const ruleMatch = actionRulesList.find(r => r.name.toLowerCase() === actionName.toLowerCase());
    const foundLib = ACTION_LIBRARY_ITEMS.find(lib => lib.label.toLowerCase() === actionName.toLowerCase());
    
    const newRow: ActionDetailItem = {
      id: nextId,
      action: actionName,
      subtext: ruleMatch ? `From Action Rule: ${ruleMatch.source}` : `Remediation Task #${nextId}`,
      type: defaultType || ruleMatch?.type || foundLib?.defaultType || 'Development',
      priority: defaultPriority || ruleMatch?.priority || foundLib?.defaultPriority || (severity === 'Critical' ? 'High' : 'Medium'),
      owner: actionOwner || agent || '',
      due_date: targetDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: 'Pending'
    };

    setActionTasks(prev => [...prev, newRow]);
  };

  // Update specific row cell
  const handleUpdateActionRow = (id: number, field: keyof ActionDetailItem, value: any) => {
    setActionTasks(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // If action changed, auto-suggest type, priority, and subtext from Action Rules or Library
        if (field === 'action') {
          const ruleMatch = actionRulesList.find(r => r.name.toLowerCase() === String(value).toLowerCase());
          if (ruleMatch) {
            updated.type = ruleMatch.type;
            updated.priority = ruleMatch.priority;
            updated.subtext = `Linked to Action Rule (${ruleMatch.dept || 'QA'})`;
          } else {
            const found = ACTION_LIBRARY_ITEMS.find(lib => lib.label.toLowerCase() === String(value).toLowerCase());
            if (found) {
              updated.type = found.defaultType;
              updated.priority = found.defaultPriority;
            }
          }
        }
        return updated;
      }
      return item;
    }));
  };

  // Delete Action row
  const handleDeleteActionRow = (id: number) => {
    if (actionTasks.length <= 1) {
      alert('Action Details table must contain at least one action.');
      return;
    }
    setActionTasks(prev => prev.filter(t => t.id !== id));
  };

  // Helper colors for badges
  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'Development': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Assessment': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Monitoring': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Preventive': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Communication': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'Critical': return 'text-rose-600 font-bold';
      case 'High': return 'text-rose-500 font-bold';
      case 'Medium': return 'text-amber-600 font-bold';
      case 'Low': return 'text-slate-600 font-bold';
      default: return 'text-slate-600 font-bold';
    }
  };

  const getStatusBadgeStyle = (s: string) => {
    switch (s) {
      case 'Completed':
      case 'Verified': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const steps = [
    { number: 1, title: 'General Information', icon: FileText },
    { number: 2, title: 'QA Review', icon: ClipboardCheck },
    { number: 3, title: 'Error Classification', icon: AlertTriangle },
    { number: 4, title: 'Root Cause', icon: Search },
    { number: 5, title: 'Actions', icon: Zap },
    { number: 6, title: 'Review & Close', icon: FileCheck }
  ];

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinalSave();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinalSave = () => {
    const safeValidationIso = validationDate ? new Date(validationDate + 'T12:00:00Z').toISOString() : (createdAt || new Date().toISOString());
    const payload: any = {
      ...initialPlan,
      title: `${errorType || 'Action Plan'} - ${caseId || validationId} (${agent || 'Unassigned'})`,
      plan_code: validationId,
      agent_name: agent,
      agent_id: agentId,
      owner_id: ownerId,
      reviewer_id: reviewerId,
      department: team,
      transaction_id: caseId,
      severity: severity as any,
      root_cause_name: rootCause,
      root_cause_analysis: rootCauseDescription,
      assigned_to: actionOwner,
      verified_by: reviewer,
      target_completion_date: targetDate || null,
      discovered_date: discoveredDate || null,
      review_date: reviewDate || null,
      status: finalStatus === 'Approved' || finalStatus === 'Closed' ? 'Closed' : 'In Progress',
      current_step: currentStep,
      created_at: safeValidationIso,
      updated_at: new Date().toISOString(),
      action_details: actionTasks.map(t => ({
        id: t.id,
        title: t.action,
        type: t.type === 'Development' ? 'Corrective' : t.type === 'Assessment' ? 'Containment' : 'Preventive',
        assignee: t.owner || actionOwner,
        due_date: t.due_date || targetDate,
        status: t.status as any,
        priority: t.priority as any,
        verification: t.subtext || 'Quality Validation'
      }))
    };
    onSave(payload);
  };

  if (!isOpen) return null;

  const outerContainerClass = isFullPage
    ? "w-full animate-fadeIn"
    : "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn";

  const innerContainerClass = isFullPage
    ? "bg-[#f8fafc] rounded-2xl shadow-sm border border-slate-200 w-full flex flex-col overflow-hidden"
    : "bg-[#f8fafc] rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[1360px] max-h-[96vh] flex flex-col overflow-hidden";

  return (
    <div className={outerContainerClass}>
      {/* Main Container */}
      <div className={innerContainerClass}>
        
        {/* ========================================================================= */}
        {/* PROMINENT TITLE HEADER: "Action Plan" */}
        {/* ========================================================================= */}
        <div className="bg-white px-6 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Action Plan
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Quality Non-Conformance Remediation
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500 mt-0.5">
                <span>{validationId}</span>
                <span>•</span>
                <span>Agent: <strong className="text-slate-800">{agent}</strong></span>
                <span>•</span>
                <span>Severity: <strong className="text-rose-600">{severity}</strong></span>
                <span>•</span>
                <span className="text-slate-600 font-semibold inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Created: {createdAt ? new Date(createdAt).toLocaleDateString() : 'Today'}
                </span>
                <span>•</span>
                <span className="text-slate-600 font-semibold inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Updated: {updatedAt ? new Date(updatedAt).toLocaleDateString() : 'Now'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TOP STEPPER BAR */}
        {/* ========================================================================= */}
        <div className="bg-white px-6 py-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-0.5">
            {steps.map((step, idx) => {
              const isCurrent = currentStep === step.number;
              const isDone = currentStep > step.number;
              const Icon = step.icon;

              return (
                <React.Fragment key={step.number}>
                  {/* Step Item */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.number)}
                    className={`flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all cursor-pointer text-left shrink-0 ${
                      isCurrent 
                        ? 'bg-blue-50/80 border border-blue-300 text-blue-700 shadow-xs' 
                        : isDone
                        ? 'text-slate-700 hover:bg-slate-50'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    {/* Circle Icon Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isDone
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Step Title and Number */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-black ${isCurrent ? 'text-blue-700' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.number}
                        </span>
                      </div>
                      <p className={`text-xs font-bold leading-tight whitespace-nowrap ${
                        isCurrent ? 'text-blue-700' : isDone ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </button>

                  {/* Connecting Arrow Line */}
                  {idx < steps.length - 1 && (
                    <div className="text-slate-300 px-1 shrink-0 flex items-center">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP CONTENT BODY */}
        {/* ========================================================================= */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#f8fafc]">
          <div className="max-w-[1240px] mx-auto space-y-6">

            {/* Quick Audit Link Notification if available */}
            {auditRecords.length > 0 && currentStep === 1 && (
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-blue-800 font-semibold">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Link from Audit Log:</span>
                </div>
                <select
                  onChange={e => {
                    const rec = auditRecords.find(a => a.transaction_id === e.target.value);
                    if (rec) {
                      setCaseId(rec.transaction_id);
                      if (rec.agent_name) setAgent(rec.agent_name);
                      if (rec.department) setTeam(rec.department);
                      if (rec.root_cause) setRootCause(rec.root_cause);
                    }
                  }}
                  className="bg-white border border-blue-300 rounded-lg px-3 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">Choose recent audit transaction...</option>
                  {auditRecords.map(a => (
                    <option key={a.id || a.transaction_id} value={a.transaction_id}>
                      {a.transaction_id} - {a.customer_name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ===================================================================== */}
            {/* STEP 1: GENERAL INFORMATION */}
            {/* ===================================================================== */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-fadeIn space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-blue-900 tracking-tight">General Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Validation ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Validation ID</label>
                    <input
                      type="text"
                      value={validationId}
                      onChange={e => setValidationId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Validation Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Validation Date</label>
                    <input
                      type="date"
                      value={validationDate}
                      onChange={e => setValidationDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Agent */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Agent</label>
                    <EmployeeSearchSelect
                      value={agent}
                      onChange={(name, emp) => {
                        setAgent(name);
                        setAgentId(emp?.id ? String(emp.id) : null);
                        if (emp?.department) setTeam(emp.department);
                      }}
                      employees={hrEmployees}
                      placeholder="Select Agent..."
                      size="sm"
                      allowCustom={true}
                    />
                  </div>

                  {/* Team */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Team</label>
                    <input
                      type="text"
                      value={team}
                      onChange={e => setTeam(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Evaluator */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Evaluator</label>
                    <EmployeeSearchSelect
                      value={evaluator}
                      onChange={(name, emp) => {
                        setEvaluator(name);
                        setOwnerId(emp?.id ? String(emp.id) : null);
                      }}
                      employees={hrEmployees}
                      placeholder="Select Evaluator..."
                      size="sm"
                      allowCustom={true}
                    />
                  </div>
                </div>

                {/* Creation and Update Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Creation Date (Created At)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={createdAt ? new Date(createdAt).toISOString().slice(0, 16) : ''}
                      onChange={e => setCreatedAt(e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Last Update Date (Updated At)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={updatedAt ? new Date(updatedAt).toISOString().slice(0, 16) : ''}
                      onChange={e => setUpdatedAt(e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* STEP 2: QA REVIEW */}
            {/* ===================================================================== */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-fadeIn space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-blue-900 tracking-tight">QA Review</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* QA Score */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">QA Score</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={qaScore}
                        onChange={e => setQaScore(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-black text-rose-600 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="absolute right-3 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black pointer-events-none">
                        Fail
                      </span>
                    </div>
                  </div>

                  {/* Validation Result */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Validation Result</label>
                    <select
                      value={validationResult}
                      onChange={e => setValidationResult(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="Fail">Fail</option>
                      <option value="Pass with Exceptions">Pass with Exceptions</option>
                      <option value="Critical Non-Conformance">Critical Non-Conformance</option>
                    </select>
                  </div>

                  {/* Quality Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Quality Category</label>
                    <select
                      value={qualityCategory}
                      onChange={e => setQualityCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="Applications">Applications</option>
                      <option value="Customer Experience">Customer Experience</option>
                      <option value="Documentation">Documentation</option>
                      <option value="Process SLA">Process SLA</option>
                      <option value="Compliance">Compliance</option>
                    </select>
                  </div>

                  {/* Call / Case ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Call / Case ID</label>
                    <input
                      type="text"
                      value={caseId}
                      onChange={e => setCaseId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Discovered Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Discovered Date</label>
                    <input
                      type="date"
                      value={discoveredDate}
                      onChange={e => setDiscoveredDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* STEP 3: ERROR CLASSIFICATION */}
            {/* ===================================================================== */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-fadeIn space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                    3
                  </div>
                  <h3 className="text-sm font-bold text-blue-900 tracking-tight">Error Classification</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Error Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Error Type</label>
                    <select
                      value={errorType}
                      onChange={e => setErrorType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="Wrong Information">Wrong Information</option>
                      <option value="Process Deviation">Process Deviation</option>
                      <option value="Documentation Incomplete">Documentation Incomplete</option>
                      <option value="SLA Breach">SLA Breach</option>
                      <option value="Communication Error">Communication Error</option>
                      <option value="System Failure">System Failure</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Severity</label>
                    <div className="relative">
                      <select
                        value={severity}
                        onChange={e => setSeverity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      >
                        <option value="Critical">🔴 Critical</option>
                        <option value="Major">🟠 Major</option>
                        <option value="Minor">🟡 Minor</option>
                        <option value="Low">⚪ Low</option>
                      </select>
                    </div>
                  </div>

                  {/* Recurrence */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Recurrence</label>
                    <select
                      value={recurrence}
                      onChange={e => setRecurrence(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="First Occurrence">First Occurrence</option>
                      <option value="Second Occurrence">Second Occurrence</option>
                      <option value="Third Occurrence or More">Third Occurrence or More</option>
                    </select>
                  </div>
                </div>

                {/* Error Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-600">Error Description</label>
                    <span className="text-[10px] text-slate-400">{errorDescription.length} / 500</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={errorDescription}
                    onChange={e => setErrorDescription(e.target.value)}
                    placeholder="Describe the error in detail..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* STEP 4: ROOT CAUSE (EXACT REPLICA OF ATTACHED IMAGE) */}
            {/* ===================================================================== */}
            {currentStep === 4 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-fadeIn space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                      4
                    </div>
                    <h3 className="text-sm font-bold text-blue-900 tracking-tight">Root Cause Analysis</h3>
                  </div>

                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    {selectedRootCauseItems.length} Factors Selected
                  </span>
                </div>

                {/* =================================================================== */}
                {/* ROOT CAUSE CATEGORY PILLS TABS - EXACTLY MATCHING USER SCREENSHOT */}
                {/* =================================================================== */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {ROOT_CAUSE_CATEGORIES.map(category => {
                      const isActive = activeRootCategory === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setActiveRootCategory(category);
                            setRootCause(`${category} Gap`);
                          }}
                          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                              : 'bg-blue-50/80 text-blue-700 border border-blue-200 hover:bg-blue-100/70'
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sub-items Checkbox Dropdown / Selection Card - Matching Attached Image */}
                  <div className="bg-slate-50/70 border border-blue-200/80 rounded-2xl p-5 shadow-xs transition-all animate-fadeIn">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                        <span>Select {activeRootCategory} Root Causes:</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">Click items to toggle and link with Root Cause</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      {(ROOT_CAUSE_OPTIONS[activeRootCategory] || []).map((opt) => {
                        const isChecked = selectedRootCauseItems.includes(opt);
                        return (
                          <label
                            key={opt}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-blue-50/90 border-blue-300 text-blue-900 font-bold shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-blue-200 text-slate-700 font-medium'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleRootCauseItem(opt)}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-xs">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Selected Root Cause & Detailed Description */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Primary Root Cause Category</label>
                    <input
                      type="text"
                      value={rootCause}
                      onChange={e => setRootCause(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-600">Root Cause Description / Analysis</label>
                      <span className="text-[10px] text-slate-400">{rootCauseDescription.length} / 500</span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={rootCauseDescription}
                      onChange={e => setRootCauseDescription(e.target.value)}
                      placeholder="Describe the underlying root cause and corrective context..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* STEP 5: ACTIONS (AUTO RECOMMENDED & EDITABLE ACTION DETAILS) */}
            {/* ===================================================================== */}
            {currentStep === 5 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-fadeIn space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                      5
                    </div>
                    <h3 className="text-sm font-bold text-blue-900 tracking-tight">Actions (Auto Recommended)</h3>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {actionTasks.length} Action Items
                  </span>
                </div>

                {/* Green Recommended Action Banner */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-800 block">Recommended Action (Auto Calculated)</span>
                      <h4 className="text-sm font-black text-slate-900 mt-0.5">
                        {getAutoRecommendedAction()}
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const auto = getAutoRecommendedAction();
                      const parts = auto.split(' + ');
                      parts.forEach(p => handleAddActionRow(p.trim()));
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Apply to Table</span>
                  </button>
                </div>

                {/* =================================================================== */}
                {/* ACTION DETAILS TABLE (WITH ADD BUTTON, DUE DATE, OWNER & INLINE EDITING) */}
                {/* =================================================================== */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Action Details</h4>
                      <p className="text-[11px] text-slate-500 font-medium">All columns are editable inline. Linked directly with Action Rules tab & HR Directory.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddActionRow()}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Action</span>
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3 w-10 text-center">#</th>
                            <th className="py-2.5 px-3 min-w-[220px]">Action</th>
                            <th className="py-2.5 px-3 min-w-[130px]">Type</th>
                            <th className="py-2.5 px-3 min-w-[110px]">Priority</th>
                            <th className="py-2.5 px-3 min-w-[210px]">Owner (HR Directory)</th>
                            <th className="py-2.5 px-3 min-w-[130px]">Due Date</th>
                            <th className="py-2.5 px-3 min-w-[120px]">Status</th>
                            <th className="py-2.5 px-3 w-16 text-center">Action</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {actionTasks.map((item, index) => (
                            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                              {/* # */}
                              <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                                {index + 1}
                              </td>
                              
                              {/* Action (Linked with Action Rules / Library options) */}
                              <td className="py-2.5 px-3">
                                <div className="space-y-1">
                                  <select
                                    value={item.action}
                                    onChange={e => handleUpdateActionRow(item.id, 'action', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                                  >
                                    {actionRulesList.length > 0 && (
                                      <optgroup label="⚡ From Action Rules (Action Rules Tab)">
                                        {actionRulesList.map((ruleItem, rIdx) => (
                                          <option key={`rule-${rIdx}`} value={ruleItem.name}>
                                            ⚡ {ruleItem.name} ({ruleItem.priority})
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                    <optgroup label="📚 Action Library Presets">
                                      {ACTION_LIBRARY_ITEMS.map(lib => (
                                        <option key={lib.num} value={lib.label}>{lib.num}. {lib.label}</option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="⚙️ Custom Action Items">
                                      <option value="Process SLA Adjustment">Process SLA Adjustment</option>
                                      <option value="Policy Exception Documentation">Policy Exception Documentation</option>
                                      <option value="Customer Call-Back & Remediation">Customer Call-Back & Remediation</option>
                                      <option value="Supervisor Review">Supervisor Review</option>
                                      <option value="Root Cause Investigation Report">Root Cause Investigation Report</option>
                                    </optgroup>
                                  </select>
                                  <input
                                    type="text"
                                    value={item.subtext || ''}
                                    onChange={e => handleUpdateActionRow(item.id, 'subtext', e.target.value)}
                                    placeholder="Task notes / verification criteria..."
                                    className="w-full bg-transparent border-0 text-[10px] text-slate-500 placeholder-slate-400 focus:ring-0 p-0"
                                  />
                                </div>
                              </td>

                              {/* Type */}
                              <td className="py-2.5 px-3">
                                <select
                                  value={item.type}
                                  onChange={e => handleUpdateActionRow(item.id, 'type', e.target.value)}
                                  className={`w-full border rounded-lg px-2 py-1 text-[11px] font-bold outline-none cursor-pointer ${getTypeBadgeStyle(item.type)}`}
                                >
                                  <option value="Development">Development</option>
                                  <option value="Assessment">Assessment</option>
                                  <option value="Monitoring">Monitoring</option>
                                  <option value="Preventive">Preventive</option>
                                  <option value="Communication">Communication</option>
                                  <option value="Corrective">Corrective</option>
                                </select>
                              </td>

                              {/* Priority */}
                              <td className="py-2.5 px-3">
                                <select
                                  value={item.priority}
                                  onChange={e => handleUpdateActionRow(item.id, 'priority', e.target.value)}
                                  className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none cursor-pointer ${getPriorityStyle(item.priority)}`}
                                >
                                  <option value="Critical">🔴 Critical</option>
                                  <option value="High">High</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Low">Low</option>
                                </select>
                              </td>

                              {/* Owner (Connected to HR Directory: Search by Name, ID, Ext, Dept) */}
                              <td className="py-2.5 px-3 min-w-[210px]">
                                <EmployeeSearchSelect
                                  value={item.owner}
                                  onChange={(name) => handleUpdateActionRow(item.id, 'owner', name)}
                                  employees={hrEmployees}
                                  placeholder="Select Owner..."
                                  size="sm"
                                  allowCustom={true}
                                />
                              </td>

                              {/* Due Date (New Column) */}
                              <td className="py-2.5 px-3">
                                <input
                                  type="date"
                                  value={item.due_date}
                                  onChange={e => handleUpdateActionRow(item.id, 'due_date', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                              </td>

                              {/* Status */}
                              <td className="py-2.5 px-3">
                                <select
                                  value={item.status}
                                  onChange={e => handleUpdateActionRow(item.id, 'status', e.target.value)}
                                  className={`w-full border rounded-lg px-2 py-1 text-[11px] font-bold outline-none cursor-pointer ${getStatusBadgeStyle(item.status)}`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Verified">Verified</option>
                                </select>
                              </td>

                              {/* Action Delete */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteActionRow(item.id)}
                                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-all cursor-pointer"
                                  title="Delete Action"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Action Plan Controls */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Overall Plan Configuration</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Action Plan Lead (Connected to HR Directory) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Action Plan Lead</label>
                      <EmployeeSearchSelect
                        value={actionOwner}
                        onChange={(name, emp) => {
                          setActionOwner(name);
                          setOwnerId(emp?.id ? String(emp.id) : null);
                        }}
                        employees={hrEmployees}
                        placeholder="Search Lead by Name, ID, Ext, Dept..."
                        allowCustom={true}
                      />
                    </div>

                    {/* Target Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Target Completion Date</label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={e => setTargetDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    {/* Action Status */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Plan Status</label>
                      <select
                        value={actionStatus}
                        onChange={e => setActionStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Verified">Verified</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes / Instructions */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-600">Notes / Instructions</label>
                      <span className="text-[10px] text-slate-400">{actionNotes.length} / 500</span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={actionNotes}
                      onChange={e => setActionNotes(e.target.value)}
                      placeholder="Enter specific instructions or training outcomes..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* STEP 6: REVIEW & CLOSE */}
            {/* ===================================================================== */}
            {currentStep === 6 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-fadeIn space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                    6
                  </div>
                  <h3 className="text-sm font-bold text-blue-900 tracking-tight">Review & Close</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Reviewer (Connected to HR Directory) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Reviewer</label>
                    <EmployeeSearchSelect
                      value={reviewer}
                      onChange={(name, emp) => {
                        setReviewer(name);
                        setReviewerId(emp?.id ? String(emp.id) : null);
                      }}
                      employees={hrEmployees}
                      placeholder="Select Reviewer..."
                      allowCustom={true}
                    />
                  </div>

                  {/* Review Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Review Date</label>
                    <input
                      type="date"
                      value={reviewDate}
                      onChange={e => setReviewDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Final Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Final Status</label>
                    <select
                      value={finalStatus}
                      onChange={e => setFinalStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Closed">Closed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Closure Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Closure Notes / Sign-off Remarks</label>
                  <textarea
                    rows={3}
                    value={closureNotes}
                    onChange={e => setClosureNotes(e.target.value)}
                    placeholder="Enter closing evaluation remarks..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  />
                </div>

                {/* Audit Lifecycle Metadata Footer */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Plan Code:</span>
                    <span className="font-mono font-bold text-blue-600">{validationId}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Created: <strong className="text-slate-700">{createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Last Updated: <strong className="text-slate-700">{updatedAt ? new Date(updatedAt).toLocaleString() : 'N/A'}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* BOTTOM REFERENCE PANELS - DISPLAYED ONLY ON ACTIONS STEP 5 */}
            {/* ===================================================================== */}
            {currentStep === 5 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 animate-fadeIn">
                
                {/* Left Reference Card: Action Rules (Active Rules & Matrix) */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-blue-900 tracking-tight flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Configured Action Rules & Matrix</span>
                    </h4>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      Click rule to add row
                    </span>
                  </div>

                  {/* Active Action Rules from Action Rules Tab */}
                  {availableRules && availableRules.length > 0 && (
                    <div className="space-y-2 pb-2 border-b border-slate-100">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Active Action Rules (From Action Rules Tab):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableRules.map(rule => (
                          <button
                            key={rule.id}
                            type="button"
                            onClick={() => handleAddActionRow(rule.rule_name, rule.severity_level === 'Critical' ? 'Corrective' : 'Development', rule.severity_level || 'High')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 transition-colors cursor-pointer"
                            title={`Add "${rule.rule_name}" to Action Details`}
                          >
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span>{rule.rule_name}</span>
                            <span className="text-[10px] px-1 py-0.2 bg-amber-200/60 rounded text-amber-800">{rule.severity_level || 'Rule'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
                    <div className="grid grid-cols-4 bg-slate-50 px-3 py-2 font-bold text-slate-500 border-b border-slate-200">
                      <div>Severity</div>
                      <div>1st Occurrence</div>
                      <div>2nd Occurrence</div>
                      <div>3rd Occurrence+</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {/* Minor */}
                      <div className="grid grid-cols-4 px-3 py-2 items-center font-medium">
                        <div className="font-bold text-emerald-600">Minor</div>
                        <button
                          type="button"
                          onClick={() => handleAddActionRow('Feedback', 'Communication', 'Low')}
                          className="text-left text-emerald-700 hover:underline cursor-pointer"
                        >
                          Feedback
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddActionRow('1:1 Coaching', 'Development', 'Medium')}
                          className="text-left text-blue-600 hover:underline cursor-pointer"
                        >
                          Coaching
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddActionRow('Targeted Retraining', 'Development', 'High')}
                          className="text-left text-teal-600 hover:underline cursor-pointer"
                        >
                          Targeted Training
                        </button>
                      </div>

                      {/* Major */}
                      <div className="grid grid-cols-4 px-3 py-2 items-center font-medium">
                        <div className="font-bold text-amber-600">Major</div>
                        <button
                          type="button"
                          onClick={() => handleAddActionRow('1:1 Coaching', 'Development', 'Medium')}
                          className="text-left text-blue-600 hover:underline cursor-pointer"
                        >
                          Coaching
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddActionRow('Targeted Retraining', 'Development', 'High')}
                          className="text-left text-teal-600 hover:underline cursor-pointer"
                        >
                          Targeted Training
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddActionRow('Mandatory Retraining', 'Development', 'High')}
                          className="text-left text-rose-600 hover:underline cursor-pointer"
                        >
                          Mandatory Retraining
                        </button>
                      </div>

                      {/* Critical */}
                      <div className="grid grid-cols-4 px-3 py-2 items-center font-medium bg-rose-50/20">
                        <div className="font-bold text-rose-600">Critical</div>
                        <button
                          type="button"
                          onClick={() => handleAddActionRow('Mandatory Retraining', 'Development', 'High')}
                          className="text-left text-rose-600 hover:underline cursor-pointer"
                        >
                          Mandatory Retraining
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleAddActionRow('Mandatory Retraining', 'Development', 'High');
                            handleAddActionRow('Increased Monitoring', 'Monitoring', 'Medium');
                          }}
                          className="text-left text-rose-600 hover:underline cursor-pointer"
                        >
                          Retraining + Monitoring
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleAddActionRow('Calibration', 'Assessment', 'High');
                            handleAddActionRow('Manager Escalation', 'Preventive', 'Critical');
                          }}
                          className="text-left text-purple-700 font-bold hover:underline cursor-pointer"
                        >
                          Calibration + Escalation
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Reference Card: Action Library (10 Badges) */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-blue-900 tracking-tight flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>Action Library (Reference)</span>
                    </h4>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      Click any action to add row
                    </span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 text-center">
                    {ACTION_LIBRARY_ITEMS.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.num}
                          type="button"
                          onClick={() => handleAddActionRow(item.label, item.defaultType, item.defaultPriority)}
                          className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-blue-50/80 transition-all cursor-pointer group"
                          title={`Click to add ${item.label} to Action Details`}
                        >
                          <div className={`w-8 h-8 rounded-full ${item.bg} text-white font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                            {item.num}
                          </div>
                          <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 mt-0.5" />
                          <span className="text-[10px] font-semibold text-slate-700 group-hover:text-blue-700 leading-tight">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleFinalSave}
              disabled={saving}
              className="px-5 py-2.5 border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSave}
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit & Close</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
