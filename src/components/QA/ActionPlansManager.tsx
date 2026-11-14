import React, { useState, useEffect } from 'react';
import { 
  Target, 
  ShieldAlert, 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  X, 
  Trash2, 
  Edit3, 
  Layers, 
  CheckSquare, 
  Zap, 
  Building2, 
  UserCheck, 
  Eye, 
  MessageSquare, 
  CreditCard, 
  XCircle, 
  Star, 
  ClipboardList, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  TrendingUp, 
  Check, 
  AlertCircle,
  HelpCircle,
  Settings,
  RefreshCw,
  Award,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { IncidentType, AuditRecord } from './IncidentWorkflowStepper';
import { QualityRemediationForm } from './QualityRemediationForm';
import { SortableColumnHeader } from './SortableColumnHeader';
import { AuditPagination } from './AuditPagination';
import { QAAdvancedFilter } from './QAAdvancedFilter';
import { useNavigate } from 'react-router-dom';

export interface ActionTask {
  id: number;
  title: string;
  type: 'Corrective' | 'Preventive' | 'Containment';
  assignee: string;
  due_date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  verification?: string;
  notes?: string;
}

export interface ActionRuleItem {
  rule_name: string;
  trigger: string;
  severity: string;
  policy: string;
}

export interface FiveWhyItem {
  step: number;
  why: string;
}

export interface ActionPlan {
  id: number;
  plan_code: string;
  title: string;
  incident_type: IncidentType;
  transaction_id: string;
  audit_id?: number | null;
  checklist_id?: number | null;
  customer_name: string;
  agent_name: string;
  agent_id?: string | null;
  owner_id?: string | null;
  reviewer_id?: string | null;
  department: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Draft' | 'Root Cause Analysis' | 'In Progress' | 'Verification' | 'Completed' | 'Closed';
  current_step: number; // 1 to 5
  root_cause_category: string;
  root_cause_name: string;
  root_cause_analysis: string;
  five_whys: FiveWhyItem[];
  action_rules: ActionRuleItem[];
  action_details: ActionTask[];
  verification_notes?: string;
  verified_by?: string | null;
  verified_at?: string | null;
  effectiveness_score: number;
  assigned_to: string;
  target_completion_date: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface ActionRulePreset {
  id?: number;
  rule_name: string;
  incident_type: string;
  trigger_condition: string;
  severity_level: string;
  assigned_department: string;
  assigned_role: string;
  sla_hours: number;
  default_root_cause: string;
  auto_actions: string[];
  is_active: boolean;
}

interface ActionPlansManagerProps {
  initialIncidentType?: IncidentType | 'all';
  onNavigateToTab?: (tab: string) => void;
  auditRecords?: AuditRecord[];
  presets?: any[];
  onTriggerNewFromAudit?: (record: any) => void;
  selectedRecordForActionPlan?: Partial<AuditRecord> | null;
  onClearSelectedRecord?: () => void;
}

export const ActionPlansManager: React.FC<ActionPlansManagerProps> = ({
  initialIncidentType = 'all',
  onNavigateToTab,
  auditRecords = [],
  presets = [],
  selectedRecordForActionPlan = null,
  onClearSelectedRecord
}) => {
  const navigate = useNavigate();
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [actionRules, setActionRules] = useState<ActionRulePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeViewMode, setActiveViewMode] = useState<'stepper_board' | 'table_list' | 'rules_engine'>('stepper_board');
  
  // Filter States
  const [typeFilter, setTypeFilter] = useState<string>(initialIncidentType);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [advancedFilteredPlans, setAdvancedFilteredPlans] = useState<ActionPlan[] | null>(null);

  // Sorting & Pagination States
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Stepper Modal / Drawer State
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<ActionPlan> | null>(null);
  const [stepperStep, setStepperStep] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New Rule Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<ActionRulePreset> | null>(null);

  useEffect(() => {
    fetchActionPlans();
    fetchActionRules();
  }, []);

  useEffect(() => {
    if (selectedRecordForActionPlan) {
      handleOpenNewStepper(selectedRecordForActionPlan);
      if (onClearSelectedRecord) onClearSelectedRecord();
    }
  }, [selectedRecordForActionPlan]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchActionPlans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch('/api/qa/action-plans', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setActionPlans(data);
      }
    } catch (err) {
      console.error("Failed to fetch Action Plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActionRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch('/api/qa/action-rules', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setActionRules(data);
      }
    } catch (err) {
      console.error("Failed to fetch Action Rules:", err);
    }
  };

  const handleOpenNewStepper = (presetRecord?: Partial<AuditRecord>) => {
    const defaultWhys: FiveWhyItem[] = [
      { step: 1, why: presetRecord?.comment || 'Customer experienced service non-conformance or delay.' },
      { step: 2, why: presetRecord?.root_cause ? `Audit observation identified ${presetRecord.root_cause}.` : 'Process execution deviated from SLA standard.' },
      { step: 3, why: presetRecord?.sub_reason ? `Underlying factor: ${presetRecord.sub_reason}.` : 'Checklist compliance validation step missed.' },
      { step: 4, why: 'Lack of automated fail-safe threshold trigger in current workflow.' },
      { step: 5, why: 'Standard Operating Procedure (SOP) control point requires preventive revision.' }
    ];

    const targetType = presetRecord?.type || 'complaint';
    const matchedRules = actionRules
      .filter(r => r.is_active && (r.incident_type === targetType || r.incident_type === 'all'))
      .map(r => ({
        rule_name: r.rule_name,
        trigger: r.trigger_condition,
        severity: r.severity_level,
        policy: `Assigned to ${r.assigned_department || 'Operations'} (${r.sla_hours}h SLA)`
      }));

    const initialPlan: Partial<ActionPlan> = {
      plan_code: `AP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      title: presetRecord 
        ? `Action Plan for ${presetRecord.type?.toUpperCase()} - ${presetRecord.transaction_id}: ${presetRecord.root_cause || 'Audit Deviation'}`
        : 'Quality Non-Conformance Remediation & Action Plan',
      incident_type: targetType as IncidentType,
      transaction_id: presetRecord?.transaction_id || `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      customer_name: presetRecord?.customer_name || 'Client Name',
      agent_name: presetRecord?.agent_name || 'Assigned Representative',
      department: presetRecord?.department || 'Operations',
      severity: (presetRecord?.sla_status === 'Breached SLA' || presetRecord?.type === 'refund') ? 'High' : 'Medium',
      status: 'Root Cause Analysis',
      current_step: 1,
      root_cause_category: presetRecord?.department || 'Operations',
      root_cause_name: presetRecord?.root_cause || 'Process Gap / Execution Delay',
      root_cause_analysis: presetRecord?.comment || 'Detailed root cause investigation initiated following Transaction Audit findings.',
      five_whys: defaultWhys,
      action_rules: matchedRules.length > 0 ? matchedRules : [
        { rule_name: 'Standard QA CAPA Policy', trigger: 'Audit Non-Conformance', severity: 'Medium', policy: 'Containment within 24h & Preventive Update' }
      ],
      action_details: [
        {
          id: 1,
          title: `Direct customer containment communication & SLA status update`,
          type: 'Containment',
          assignee: presetRecord?.agent_name || 'Representative',
          due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          status: 'In Progress',
          priority: 'High',
          verification: 'Customer interaction log verified'
        },
        {
          id: 2,
          title: `Perform 5-Whys Root Cause deep-dive and implement operational corrective patch`,
          type: 'Corrective',
          assignee: presetRecord?.department ? `${presetRecord.department} Lead` : 'QA Specialist',
          due_date: new Date(Date.now() + 259200000).toISOString().slice(0, 10),
          status: 'Pending',
          priority: 'High',
          verification: 'Corrective diagnostic sheet submitted'
        },
        {
          id: 3,
          title: `Revise Audit Checklist and publish refresher training to prevent recurrence`,
          type: 'Preventive',
          assignee: 'QA Lead',
          due_date: new Date(Date.now() + 604800000).toISOString().slice(0, 10),
          status: 'Pending',
          priority: 'Medium',
          verification: 'Audit checklist updated'
        }
      ],
      verification_notes: '',
      verified_by: '',
      effectiveness_score: 95,
      assigned_to: presetRecord?.assigned_manager || 'Operations Lead',
      target_completion_date: new Date(Date.now() + 604800000).toISOString().slice(0, 10),
      created_by: 'QA Officer'
    };

    setEditingPlan(initialPlan);
    setStepperStep(1);
    navigate('/qa/transactions-audit/action-plans/new', { state: { presetRecord } });
  };

  const handleEditPlan = (plan: ActionPlan) => {
    setEditingPlan({ ...plan });
    setStepperStep(plan.current_step || 1);
    navigate(`/qa/transactions-audit/action-plans/${plan.id || plan.plan_code}`);
  };

  const handleSavePlan = async (customPlan?: Partial<ActionPlan>) => {
    const planToSave = customPlan || editingPlan;
    if (!planToSave?.title || !planToSave?.incident_type) {
      alert('Please provide Action Plan Title and Incident Type.');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch('/api/qa/action-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify({
          ...planToSave,
          current_step: planToSave.current_step || stepperStep
        })
      });

      if (res.ok) {
        showToast('✅ Quality Remediation & Action Plan saved successfully!');
        setIsStepperOpen(false);
        setEditingPlan(null);
        fetchActionPlans();
      } else {
        showToast('❌ Failed to save Action Plan.');
      }
    } catch (err) {
      console.error("Save plan error:", err);
      showToast('❌ Error saving Action Plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Action Plan?')) return;
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch(`/api/qa/action-plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': userId }
      });
      if (res.ok) {
        showToast('🗑️ Action Plan deleted.');
        fetchActionPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRule = async () => {
    if (!editingRule?.rule_name || !editingRule?.trigger_condition) {
      alert('Please fill Rule Name and Trigger Condition');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch('/api/qa/action-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify(editingRule)
      });
      if (res.ok) {
        showToast('✅ Action Rule saved successfully!');
        setIsRuleModalOpen(false);
        setEditingRule(null);
        fetchActionRules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Action Rule?')) return;
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      await fetch(`/api/qa/action-rules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': userId }
      });
      showToast('Action Rule deleted.');
      fetchActionRules();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered List
  const filteredPlans = (advancedFilteredPlans !== null ? advancedFilteredPlans : actionPlans).filter(p => {
    if (typeFilter !== 'all' && p.incident_type !== typeFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (severityFilter !== 'all' && p.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (
        p.title?.toLowerCase().includes(q) ||
        p.plan_code?.toLowerCase().includes(q) ||
        p.transaction_id?.toLowerCase().includes(q) ||
        p.customer_name?.toLowerCase().includes(q) ||
        p.agent_name?.toLowerCase().includes(q) ||
        p.root_cause_name?.toLowerCase().includes(q)
      );
      if (!match) return false;
    }
    if (startDate) {
      const itemDate = (p.created_at || p.target_completion_date || '').slice(0, 10);
      if (itemDate && itemDate < startDate) return false;
    }
    if (endDate) {
      const itemDate = (p.created_at || p.target_completion_date || '').slice(0, 10);
      if (itemDate && itemDate > endDate) return false;
    }
    return true;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    let valA: any = a[sortField as keyof ActionPlan] ?? '';
    let valB: any = b[sortField as keyof ActionPlan] ?? '';

    if (sortField === 'tasks_progress') {
      const compA = a.action_details?.filter(t => t.status === 'Completed').length || 0;
      const compB = b.action_details?.filter(t => t.status === 'Completed').length || 0;
      valA = compA;
      valB = compB;
    }

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedPlans = sortedPlans.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Calculate Metrics
  const totalPlans = actionPlans.length;
  const inProgressCount = actionPlans.filter(p => p.status === 'In Progress' || p.status === 'Root Cause Analysis').length;
  const verifiedClosedCount = actionPlans.filter(p => p.status === 'Verification' || p.status === 'Completed' || p.status === 'Closed').length;
  const criticalCount = actionPlans.filter(p => p.severity === 'Critical' || p.severity === 'High').length;
  const avgEffectiveness = totalPlans > 0 
    ? Math.round(actionPlans.reduce((acc, p) => acc + (p.effectiveness_score || 95), 0) / totalPlans)
    : 96;

  // Type helper for styling
  const getTypeBadge = (type: IncidentType) => {
    switch (type) {
      case 'complaint':
        return { label: 'Complaint', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: MessageSquare };
      case 'delay':
        return { label: 'Delay', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      case 'refund':
        return { label: 'Refund', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CreditCard };
      case 'cancellation':
        return { label: 'Cancellation', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: XCircle };
      case 'nps':
        return { label: 'NPS', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Star };
      default:
        return { label: type, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: ShieldAlert };
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-500 text-white font-bold';
      case 'High':
        return 'bg-amber-500 text-white font-bold';
      case 'Medium':
        return 'bg-indigo-100 text-indigo-800 font-semibold';
      case 'Low':
        return 'bg-slate-100 text-slate-700 font-medium';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Closed':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold';
      case 'Verification':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold';
      case 'In Progress':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold';
      case 'Root Cause Analysis':
        return 'bg-amber-50 text-amber-700 border border-amber-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200 font-medium';
    }
  };

  return (
    <div className="space-y-6" id="qa-action-plans-module">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quick Performance & Status KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Total Action Plans</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-800">{totalPlans}</span>
            <span className="text-[11px] text-slate-500 font-medium">All Incidents</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Active Steppers</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-indigo-600">{inProgressCount}</span>
            <span className="text-[11px] text-indigo-600 font-semibold">Under Investigation</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Verified & Closed</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-600">{verifiedClosedCount}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">QA Sign-off</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Critical / High Severity</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-rose-600">{criticalCount}</span>
            <span className="text-[11px] text-rose-600 font-bold">Fast-track SLA</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Effectiveness Score</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-indigo-700">{avgEffectiveness}%</span>
            <span className="text-[11px] text-emerald-600 font-bold">CAPA Compliance</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-View Switcher & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* View Mode Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveViewMode('stepper_board')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeViewMode === 'stepper_board'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>QA Stepper Board (5 Steps)</span>
            </button>

            <button
              onClick={() => setActiveViewMode('table_list')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeViewMode === 'table_list'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Action Plans Table ({filteredPlans.length})</span>
            </button>
          </div>

          {/* Right Controls: All Cases Dropdown + Action Rules Engine + New Action Plan Stepper */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* All Cases Dropdown List */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by Incident Type"
                className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 pl-3.5 pr-8 rounded-xl border border-slate-200 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-xs"
              >
                <option value="all">All Cases</option>
                <option value="complaint">Complaints</option>
                <option value="delay">Delays</option>
                <option value="refund">Refunds</option>
                <option value="cancellation">Cancellations</option>
                <option value="nps">NPS & CSAT</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Action Rules Engine Button */}
            <button
              type="button"
              onClick={() => setActiveViewMode(activeViewMode === 'rules_engine' ? 'stepper_board' : 'rules_engine')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                activeViewMode === 'rules_engine'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Action Rules Engine {actionRules.length > 0 ? `(${actionRules.length})` : ''}</span>
            </button>

            {/* New Action Plan Stepper Button */}
            <button
              type="button"
              onClick={() => handleOpenNewStepper()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Action Plan Stepper</span>
            </button>
          </div>
        </div>

        {/* Search & Granular Dropdown Filters + Date Range */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Action Plans by Title, Code, TRX, Customer, Root Cause, Agent..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-400">From</span>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-0 text-xs font-semibold text-slate-700 outline-none p-0 w-28"
            />
            <span className="text-[10px] font-bold text-slate-400">To</span>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-0 text-xs font-semibold text-slate-700 outline-none p-0 w-28"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 ml-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Status"
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Root Cause Analysis">Root Cause Analysis</option>
              <option value="In Progress">In Progress</option>
              <option value="Verification">Verification</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={severityFilter}
              onChange={e => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Severity"
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <QAAdvancedFilter
              items={actionPlans}
              onFilter={(filtered) => {
                setAdvancedFilteredPlans(filtered as ActionPlan[] | null);
                setCurrentPage(1);
              }}
              title="Filter Action Plans"
              buttonLabel="Filter Records"
            />

            <button
              onClick={fetchActionPlans}
              title="Refresh Data"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: STEPPER BOARD VIEW (5-Stage Incident QA Stepper) */}
      {activeViewMode === 'stepper_board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { step: 1, title: '1. Incident Audit & Detection', subtitle: 'TRX Identification & Scope', color: 'border-slate-300 bg-slate-50/50', badgeColor: 'bg-slate-200 text-slate-800' },
            { step: 2, title: '2. Root Cause & 5-Whys', subtitle: 'Diagnostic & Contributing Factors', color: 'border-amber-300 bg-amber-50/20', badgeColor: 'bg-amber-100 text-amber-800' },
            { step: 3, title: '3. Action Rules Triggered', subtitle: 'Policy & Escalation Matching', color: 'border-indigo-300 bg-indigo-50/20', badgeColor: 'bg-indigo-100 text-indigo-800' },
            { step: 4, title: '4. Action Details & CAPA', subtitle: 'Tasks, Assignees & Deadlines', color: 'border-blue-300 bg-blue-50/20', badgeColor: 'bg-blue-100 text-blue-800' },
            { step: 5, title: '5. Verification & Closure', subtitle: 'Governance & QA Sign-off', color: 'border-emerald-300 bg-emerald-50/20', badgeColor: 'bg-emerald-100 text-emerald-800' }
          ].map(stage => {
            const stagePlans = filteredPlans.filter(p => (p.current_step || 1) === stage.step);

            return (
              <div key={stage.step} className={`rounded-2xl border-2 ${stage.color} p-3.5 flex flex-col min-h-[480px]`}>
                
                {/* Column Header */}
                <div className="pb-3 border-b border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${stage.badgeColor}`}>
                      Step {stage.step}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {stagePlans.length} {stagePlans.length === 1 ? 'Plan' : 'Plans'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 mt-1">{stage.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{stage.subtitle}</p>
                </div>

                {/* Plan Cards List */}
                <div className="flex-1 space-y-3 mt-3 overflow-y-auto max-h-[600px] pr-1">
                  {stagePlans.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-3 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-[11px] font-medium">No action plans in this stage.</p>
                    </div>
                  ) : (
                    stagePlans.map(plan => {
                      const typeBadge = getTypeBadge(plan.incident_type);
                      const TypeIcon = typeBadge.icon;
                      const completedTasks = plan.action_details?.filter(t => t.status === 'Completed').length || 0;
                      const totalTasks = plan.action_details?.length || 0;
                      const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                      return (
                        <div
                          key={plan.id}
                          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer group"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-extrabold text-slate-400 font-mono">
                              {plan.plan_code}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getSeverityBadge(plan.severity)}`}>
                              {plan.severity}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${typeBadge.color}`}>
                              <TypeIcon className="w-2.5 h-2.5" />
                              {typeBadge.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {plan.transaction_id}
                            </span>
                          </div>

                          <h5 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {plan.title}
                          </h5>

                          {plan.root_cause_name && (
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-600">
                              <span className="font-bold text-slate-800">Root Cause:</span> {plan.root_cause_name}
                            </div>
                          )}

                          {/* Task Progress Bar */}
                          {totalTasks > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>Tasks: {completedTasks}/{totalTasks}</span>
                                <span>{progressPct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full transition-all"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Creation and Update Timestamps */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1" title="Creation Date">
                              <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : 'Today'}
                            </span>
                            <span className="flex items-center gap-1" title="Last Updated Date">
                              <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              {plan.updated_at ? new Date(plan.updated_at).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>

                          <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>Assignee: <strong className="text-slate-700">{plan.assigned_to?.split(' ')[0] || 'QA Lead'}</strong></span>
                            <span className="flex items-center gap-1 text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">
                              Open Stepper <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: DETAILED TABLE LIST VIEW */}
      {activeViewMode === 'table_list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <SortableColumnHeader
                    label="Plan Code & Incident"
                    field="plan_code"
                    currentSortField={sortField}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableColumnHeader
                    label="Transaction & Customer"
                    field="transaction_id"
                    currentSortField={sortField}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableColumnHeader
                    label="Title & Root Cause Diagnostic"
                    field="title"
                    currentSortField={sortField}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="p-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action Rules Triggered</th>
                  <SortableColumnHeader
                    label="CAPA Tasks Progress"
                    field="tasks_progress"
                    currentSortField={sortField}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableColumnHeader
                    label="Severity / Status"
                    field="severity"
                    currentSortField={sortField}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableColumnHeader
                    label="Assignee & Target Date"
                    field="target_completion_date"
                    currentSortField={sortField}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="p-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Target className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-bold text-slate-600">No Action Plans Found</p>
                        <p className="text-xs text-slate-400">Try adjusting your search criteria or click "New Action Plan Stepper".</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPlans.map(plan => {
                    const typeBadge = getTypeBadge(plan.incident_type);
                    const TypeIcon = typeBadge.icon;
                    const completedTasks = plan.action_details?.filter(t => t.status === 'Completed').length || 0;
                    const totalTasks = plan.action_details?.length || 0;

                    return (
                      <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-mono font-bold text-slate-900 text-xs">{plan.plan_code}</div>
                          <div className="mt-1 flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${typeBadge.color}`}>
                              <TypeIcon className="w-2.5 h-2.5" />
                              {typeBadge.label}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                              Step {plan.current_step || 1}
                            </span>
                          </div>
                          <div className="mt-1.5 text-[9px] text-slate-400 font-medium flex flex-col gap-0.5">
                            <span className="flex items-center gap-1" title="Creation Date">
                              <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              Created: {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="flex items-center gap-1" title="Last Updated Date">
                              <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              Updated: {plan.updated_at ? new Date(plan.updated_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-bold text-indigo-700 text-xs">{plan.transaction_id}</div>
                          <div className="text-[11px] text-slate-600 font-medium">{plan.customer_name}</div>
                          <div className="text-[10px] text-slate-400">Rep: {plan.agent_name}</div>
                        </td>

                        <td className="py-3 px-3.5 max-w-xs">
                          <div className="font-bold text-slate-800 text-xs truncate" title={plan.title}>{plan.title}</div>
                          <div className="text-[11px] text-slate-500 truncate" title={plan.root_cause_name}>
                            {plan.root_cause_name || 'Investigation in progress'}
                          </div>
                          {plan.five_whys && plan.five_whys.length > 0 && (
                            <span className="inline-block mt-1 text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              5-Whys Diagnostic Active ({plan.five_whys.length} Steps)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 max-w-xs">
                          {plan.action_rules && plan.action_rules.length > 0 ? (
                            <div className="space-y-1">
                              {plan.action_rules.slice(0, 2).map((r, i) => (
                                <div key={i} className="text-[10px] bg-indigo-50/70 border border-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded font-medium truncate">
                                  ⚡ {r.rule_name}
                                </div>
                              ))}
                              {plan.action_rules.length > 2 && (
                                <span className="text-[9px] text-slate-400 font-bold">+{plan.action_rules.length - 2} more rules</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Standard CAPA Rule</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{completedTasks}/{totalTasks}</span>
                            <span className="text-[10px] text-slate-400">done</span>
                          </div>
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="space-y-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getSeverityBadge(plan.severity)}`}>
                              {plan.severity}
                            </span>
                            <div>
                              <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] ${getStatusBadge(plan.status)}`}>
                                {plan.status}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-800 text-xs">{plan.assigned_to || 'QA Lead'}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {plan.target_completion_date ? new Date(plan.target_completion_date).toLocaleDateString() : 'In 7 Days'}
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Stepper</span>
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                              title="Delete Plan"
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

          {/* Pagination for Action Plans */}
          {filteredPlans.length > 0 && (
            <AuditPagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredPlans.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      )}

      {/* VIEW 3: ACTION RULES ENGINE CONFIGURATOR */}
      {activeViewMode === 'rules_engine' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Automated Quality Policy & Trigger Matrix</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">Action Rules & Severity Matrix Engine</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure conditional trigger rules for Complaints, Delays, Refunds, Cancellations, and NPS. When an audit meets these criteria, the QA Stepper automatically maps escalation policies, assignees, and SLA timelines.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingRule({
                  rule_name: '',
                  incident_type: 'all',
                  trigger_condition: '',
                  severity_level: 'Medium',
                  assigned_department: 'Operations',
                  assigned_role: 'Operations Lead',
                  sla_hours: 24,
                  default_root_cause: '',
                  auto_actions: ['Immediate Containment Task', 'Investigate Root Cause with 5-Whys', 'Update Audit Checklist'],
                  is_active: true
                });
                setIsRuleModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Action Rule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actionRules.map(rule => {
              return (
                <div key={rule.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getSeverityBadge(rule.severity_level)}`}>
                        {rule.severity_level} Severity
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {rule.incident_type === 'all' ? 'All Incidents' : rule.incident_type}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900">{rule.rule_name}</h4>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">Trigger Condition:</span>
                      <span className="font-mono text-indigo-700 font-bold">{rule.trigger_condition}</span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Department:</span>
                        <strong className="text-slate-800">{rule.assigned_department || 'Operations'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Escalation SLA:</span>
                        <strong className="text-indigo-600">{rule.sla_hours} Hours</strong>
                      </div>
                    </div>

                    {rule.auto_actions && rule.auto_actions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Auto-Generated Actions:</span>
                        {rule.auto_actions.map((act, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active Rule
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingRule({ ...rule });
                          setIsRuleModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all cursor-pointer"
                        title="Edit Rule"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => rule.id && handleDeleteRule(rule.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUALITY NON-CONFORMANCE REMEDIATION & ACTION PLAN FORM / STEPPER */}
      {/* ========================================================================= */}
      {isStepperOpen && editingPlan && (
        <QualityRemediationForm
          plan={editingPlan}
          isOpen={isStepperOpen}
          onClose={() => {
            setIsStepperOpen(false);
            setEditingPlan(null);
          }}
          onSave={handleSavePlan}
          saving={saving}
          auditRecords={auditRecords}
          presets={presets}
          availableRules={actionRules}
        />
      )}

      {/* ========================================================================= */}
      {/* ACTION RULE MODAL */}
      {/* ========================================================================= */}
      {isRuleModalOpen && editingRule && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                {editingRule.id ? 'Edit Action Rule' : 'New Quality Action Rule'}
              </h3>
              <button
                onClick={() => {
                  setIsRuleModalOpen(false);
                  setEditingRule(null);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rule Name *</label>
                <input
                  type="text"
                  value={editingRule.rule_name || ''}
                  onChange={e => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                  placeholder="e.g. SLA Breach Escalation Rule"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Incident Type</label>
                  <select
                    value={editingRule.incident_type || 'all'}
                    onChange={e => setEditingRule({ ...editingRule, incident_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="complaint">Complaint</option>
                    <option value="delay">Delay</option>
                    <option value="refund">Refund</option>
                    <option value="cancellation">Cancellation</option>
                    <option value="nps">NPS & CSAT</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Severity Level</label>
                  <select
                    value={editingRule.severity_level || 'Medium'}
                    onChange={e => setEditingRule({ ...editingRule, severity_level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Trigger Condition Expression *</label>
                <input
                  type="text"
                  value={editingRule.trigger_condition || ''}
                  onChange={e => setEditingRule({ ...editingRule, trigger_condition: e.target.value })}
                  placeholder="e.g. SLA Breached AND Overpromise == True"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Department</label>
                  <input
                    type="text"
                    value={editingRule.assigned_department || ''}
                    onChange={e => setEditingRule({ ...editingRule, assigned_department: e.target.value })}
                    placeholder="Operations / CS"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Resolution SLA (Hours)</label>
                  <input
                    type="number"
                    value={editingRule.sla_hours || 24}
                    onChange={e => setEditingRule({ ...editingRule, sla_hours: parseInt(e.target.value) || 24 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRule}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Save Action Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
