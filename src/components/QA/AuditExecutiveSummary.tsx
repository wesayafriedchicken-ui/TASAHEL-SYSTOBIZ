import React, { useState } from 'react';
import { 
  AuditRecord, 
  IncidentType, 
  ParsedPreset, 
  ParsedSubReason 
} from './IncidentWorkflowStepper';
import { 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Building2, 
  ShieldAlert, 
  User, 
  Layers, 
  Tag, 
  FileText, 
  MessageSquare, 
  Sparkles, 
  CheckSquare, 
  GraduationCap, 
  Users, 
  Zap, 
  AlertCircle, 
  Copy, 
  Check, 
  CheckCheck, 
  Activity, 
  ArrowRight, 
  FileCheck2, 
  CornerDownRight,
  TrendingDown,
  Scale,
  Headphones,
  Calendar,
  Star,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  ListChecks,
  UserCheck
} from 'lucide-react';

interface AuditExecutiveSummaryProps {
  formData: AuditRecord;
  type: IncidentType;
  currentSelectedPreset?: ParsedPreset | null;
  checkedSubReasonIds?: string[];
}

export const AuditExecutiveSummary: React.FC<AuditExecutiveSummaryProps> = ({
  formData,
  type,
  currentSelectedPreset,
  checkedSubReasonIds = []
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'findings' | 'forward'>('all');

  // Parse Action Required items
  const actionsList: string[] = React.useMemo(() => {
    const raw = formData.action_required;
    if (!raw) return ['Coaching Required'];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // not JSON
    }
    if (typeof raw === 'string') {
      if (raw.includes(';')) return raw.split(';').map(s => s.trim()).filter(Boolean);
      if (raw.includes(',')) return raw.split(',').map(s => s.trim()).filter(Boolean);
      return [raw.trim()].filter(Boolean);
    }
    return [];
  }, [formData.action_required]);

  // Selected sub-reasons list
  const selectedSubReasonsList: ParsedSubReason[] = React.useMemo(() => {
    if (!currentSelectedPreset || !Array.isArray(currentSelectedPreset.sub_reasons)) {
      if (formData.sub_reason) {
        return [{
          id: 'custom-1',
          name: formData.sub_reason,
          weight_percentage: 100,
          is_active: true
        }];
      }
      return [];
    }

    return currentSelectedPreset.sub_reasons.filter(sr => 
      checkedSubReasonIds.includes(sr.id) || 
      checkedSubReasonIds.includes(sr.name) ||
      (formData.sub_reason && formData.sub_reason.toLowerCase().includes(sr.name.toLowerCase()))
    );
  }, [currentSelectedPreset, checkedSubReasonIds, formData.sub_reason]);

  const presetWeight = currentSelectedPreset?.weight ?? 25;
  const totalChecklistDeduction = selectedSubReasonsList.reduce(
    (sum, sr) => sum + ((sr.weight_percentage / 100) * presetWeight), 
    0
  );

  // Type labels and styles
  const typeConfig = {
    complaint: {
      label: 'Customer Complaint Audit',
      color: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: MessageSquare
    },
    delay: {
      label: 'SLA Delay Audit',
      color: 'from-blue-500 to-indigo-600',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Clock
    },
    refund: {
      label: 'Financial Refund Audit',
      color: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: DollarSign
    },
    cancellation: {
      label: 'Request Cancellation Audit',
      color: 'from-rose-500 to-red-600',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: AlertTriangle
    },
    nps: {
      label: 'NPS Customer Survey Audit',
      color: 'from-purple-500 to-violet-600',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Star
    }
  }[type] || {
    label: 'Incident QA Audit',
    color: 'from-blue-500 to-indigo-600',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: ShieldAlert
  };

  const TypeIcon = typeConfig.icon;

  // Copy structured text summary
  const handleCopySummary = () => {
    const summaryText = `================================================
EXECUTIVE AUDIT & FORWARD REMEDIATION SUMMARY
================================================
Incident Type: ${typeConfig.label}
Transaction ID: ${formData.transaction_id || 'N/A'}
Request Type: ${formData.request_type || 'N/A'}
Request Date: ${formData.request_date || 'N/A'}
Customer: ${formData.customer_name || 'N/A'} (${formData.customer_phone || 'N/A'})
Operations Owner / Agent: ${formData.agent_name || formData.operations_owner || 'N/A'}
QA Auditor: ${formData.auditor_name || 'N/A'}
QA Status: ${formData.qa_status || 'Evaluated'}

--- AUDIT FINDINGS & ROOT CAUSE ---
Department / Area: ${formData.department || formData.bucket_2_area || 'N/A'}
Category (Bucket 1): ${formData.bucket_1_category || 'Agent'}
Root Cause (Bucket 3): ${formData.root_cause || formData.bucket_3_root_cause || 'N/A'}
Sub-Reason Details: ${formData.sub_reason || 'N/A'}
${selectedSubReasonsList.length > 0 ? `Selected Checklist Items: ${selectedSubReasonsList.map(s => `${s.name} (${s.weight_percentage}%)`).join('; ')}` : ''}
${totalChecklistDeduction > 0 ? `Point Impact: -${totalChecklistDeduction.toFixed(1)} pts / ${presetWeight} pts` : ''}
${formData.comment ? `Customer Feedback / Remarks: "${formData.comment}"` : ''}
${formData.system_remarks ? `System Remarks: "${formData.system_remarks}"` : ''}

--- FORWARD CORRECTIVE ACTIONS & GOVERNANCE ---
Actions Required: ${actionsList.join(', ')}
Corrective Action Plan: ${formData.corrective_action || 'N/A'}
Action Plan Routing: ${formData.action_plan_required ? `Flagged -> ${formData.action_plan_type || 'Training Action'}` : 'Not Flagged'}
Assigned Reviewer Manager: ${formData.assigned_manager || 'N/A'}
Manager Approval Status: ${formData.manager_approval || 'Pending'}
================================================`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-6 animate-fadeIn ring-1 ring-slate-100 dark:ring-transparent">
      {/* 1. Header Banner & Metadata Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${typeConfig.color} flex items-center justify-center shadow-sm text-white shrink-0`}>
            <TypeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black tracking-wider uppercase border ${typeConfig.badgeBg}`}>
                {typeConfig.label}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                #{formData.transaction_id || 'TRX-UNKNOWN'}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold ${
                formData.qa_status === 'Pass' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
              }`}>
                QA Status: {formData.qa_status || 'Pass'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
              Executive Audit & Remediation Summary
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Consolidated intelligence of QA audit findings and scheduled forward corrective actions.
            </p>
          </div>
        </div>

        {/* Action Controls & Tab Filters */}
        <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
          {/* Tab Filter */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-black' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Full Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('findings')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'findings' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-black' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1. Findings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('forward')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'forward' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-black' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2. Forward Actions
            </button>
          </div>

          {/* Copy Summary Button */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
            title="Copy structured audit notes to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1: Department & Area */}
        <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between gap-1 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            Department / Area
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate" title={formData.department || formData.bucket_2_area || 'Operations'}>
            {formData.department || formData.bucket_2_area || 'Operations'}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            Category: {formData.bucket_1_category || 'Agent'}
          </span>
        </div>

        {/* KPI 2: Primary Root Cause */}
        <div className="bg-amber-50/40 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-amber-200/60 dark:border-slate-700/60 flex flex-col justify-between gap-1 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            Root Cause
          </span>
          <span className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-300 truncate" title={formData.root_cause || formData.bucket_3_root_cause || 'Wrong Evaluation'}>
            {formData.root_cause || formData.bucket_3_root_cause || 'Wrong Evaluation'}
          </span>
          <span className="text-[10px] font-semibold text-amber-700/80 dark:text-slate-400">
            {selectedSubReasonsList.length} sub-reasons mapped
          </span>
        </div>

        {/* KPI 3: Point / Financial Impact */}
        <div className="bg-rose-50/40 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-rose-200/60 dark:border-slate-700/60 flex flex-col justify-between gap-1 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-rose-500" />
            Audit Score Impact
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs sm:text-sm font-black text-rose-700 dark:text-rose-400">
              {totalChecklistDeduction > 0 ? `-${totalChecklistDeduction.toFixed(1)} pts` : (formData.order_amount ? `$${formData.order_amount}` : 'Evaluated')}
            </span>
            {totalChecklistDeduction > 0 && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">/ {presetWeight} max</span>
            )}
          </div>
          <span className="text-[10px] font-semibold text-rose-700/80 dark:text-slate-400">
            {formData.lose_on_employee && formData.lose_amount ? `$${formData.lose_amount} Lose on Agent` : 'Policy Evaluated'}
          </span>
        </div>

        {/* KPI 4: Forward Actions Count */}
        <div className="bg-cyan-50/40 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-cyan-200/60 dark:border-slate-700/60 flex flex-col justify-between gap-1 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Actions Queued
          </span>
          <span className="text-xs sm:text-sm font-black text-cyan-900 dark:text-cyan-300">
            {actionsList.length} Action Items
          </span>
          <span className="text-[10px] font-semibold text-cyan-700/80 dark:text-slate-400">
            {formData.action_plan_required ? `Routed: ${formData.action_plan_type || 'Action Plan'}` : 'Direct Execution'}
          </span>
        </div>

        {/* KPI 5: Manager Approval Status */}
        <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between gap-1 col-span-2 sm:col-span-1 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Manager Status
          </span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-black ${
              formData.manager_approval === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400' :
              formData.manager_approval === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400' :
              'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300'
            }`}>
              {formData.manager_approval || 'Pending'}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate" title={formData.assigned_manager || 'Bassam Mohamed'}>
            Mgr: {formData.assigned_manager || 'Bassam Mohamed'}
          </span>
        </div>
      </div>

      {/* 3. Main Dual-Section View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* SECTION 1: WHAT HAPPENED (COMPLETED AUDIT & ROOT CAUSE FINDINGS) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'findings') && (
          <div className="bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-200 dark:border-indigo-500/30">
                  1
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Audit Findings & Root Cause Analysis (What Happened)
                </h4>
              </div>
              <span className="text-[10.5px] text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                Completed Audit
              </span>
            </div>

            {/* Case & Agent Context Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-white dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Customer</span>
                <span className="font-extrabold text-slate-900 dark:text-white truncate block">{formData.customer_name || 'Acme Corp'}</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{formData.customer_phone || '01012345678'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Responsible Agent</span>
                <span className="font-extrabold text-slate-900 dark:text-white truncate block">{formData.agent_name || formData.operations_owner || 'Ahmed Ramadan'}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Owner: {formData.operations_owner || 'Operations'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">QA Auditor</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-300 truncate block">{formData.auditor_name || 'Mohamed Hassan'}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Date: {formData.request_date || formData.survey_date || '2026-07-24'}</span>
              </div>
            </div>

            {/* Verification Flags & Switches Matrix */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Verification Verdicts & Quality Switches
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {type === 'complaint' && (
                  <>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Complaint Validity</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        formData.switches?.complaint_accuracy ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {formData.switches?.complaint_accuracy ? 'Valid Finding' : 'Invalid'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Overpromise</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        formData.switches?.over_promise ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                      }`}>
                        {formData.switches?.over_promise ? 'Yes (Breach)' : 'No'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Doc Accuracy</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        formData.switches?.document_accuracy ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300'
                      }`}>
                        {formData.switches?.document_accuracy ? 'Accurate' : 'Inaccurate'}
                      </span>
                    </div>
                  </>
                )}

                {type === 'delay' && (
                  <>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">SLA Status</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        formData.sla_status === 'Breached' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                      }`}>
                        {formData.sla_status || 'Breached'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Ops Progress</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300">
                        {formData.operations_status || 'In Progress'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">On System</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        formData.status_on_system === 'Yes' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300'
                      }`}>
                        {formData.status_on_system || 'Yes'}
                      </span>
                    </div>
                  </>
                )}

                {type === 'refund' && (
                  <>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Avoidable Refund</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        formData.switches?.avoidable_refund ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                      }`}>
                        {formData.switches?.avoidable_refund ? 'Yes (Avoidable)' : 'No (Genuine)'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Refund Amount</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300">
                        ${formData.refund_amount || formData.order_amount || 0}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Agent Penalty</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        formData.lose_on_employee ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {formData.lose_on_employee ? `$${formData.lose_amount || 0}` : 'None'}
                      </span>
                    </div>
                  </>
                )}

                {type === 'cancellation' && (
                  <>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Reason</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 truncate max-w-[120px]">
                        {formData.department || formData.error_classification || 'Late Assign'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Error Class</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 truncate max-w-[120px]">
                        {formData.error_classification || 'Late Ticket Assign'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Loss on Agent</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        formData.lose_on_employee ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {formData.lose_on_employee ? `$${formData.lose_amount || 0}` : 'None'}
                      </span>
                    </div>
                  </>
                )}

                {type === 'nps' && (
                  <>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">NPS Rating</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        (formData.rating || 8) >= 9 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300' : (formData.rating || 8) >= 7 ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300'
                      }`}>
                        {formData.rating ?? 8} / 10
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Category</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300">
                        {formData.category || 'Promoter'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Survey Date</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
                        {formData.survey_date || '2026-06-22'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3-Level Root Cause Hierarchy */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                3-Level Root Cause Taxonomy
              </span>
              <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-700">
                    L1: {formData.bucket_1_category || 'Agent'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-[10.5px] border border-indigo-200 dark:border-indigo-800">
                    L2: {formData.department || formData.bucket_2_area || 'Operations'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="px-2.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] border border-amber-200 dark:border-amber-800">
                    L3: {formData.root_cause || formData.bucket_3_root_cause || 'Wrong Evaluation'}
                  </span>
                </div>

                {/* Sub-Reasons Checklist Items */}
                {selectedSubReasonsList.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Evaluated Sub-Reason Checklist:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {selectedSubReasonsList.map((sr) => {
                        const ptDeduction = ((sr.weight_percentage / 100) * presetWeight).toFixed(1);
                        return (
                          <div key={sr.id} className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-[11px]">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{sr.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9.5px] font-bold font-mono">
                                {sr.weight_percentage}%
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 text-[9.5px] font-bold border border-rose-200 dark:border-rose-800">
                                -{ptDeduction} pts
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-reason qualitative note */}
                {formData.sub_reason && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Sub-Reason Notes & Findings:</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 mt-1">
                      "{formData.sub_reason}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Voice / System Remarks */}
            {(formData.comment || formData.system_remarks) && (
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Remarks & Customer Quotation
                </span>
                <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs shadow-2xs">
                  {formData.comment && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Customer Feedback:</span>
                        <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic mt-0.5">
                          "{formData.comment}"
                        </p>
                      </div>
                    </div>
                  )}
                  {formData.system_remarks && (
                    <div className="flex items-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">System / SLA Log:</span>
                        <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-0.5">
                          {formData.system_remarks}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: WHAT WILL HAPPEN NEXT (FORWARD CORRECTIVE ACTIONS & REMEDIATION) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'forward') && (
          <div className="bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-200 dark:border-emerald-500/30">
                  2
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Forward Actions & Remediation Plan (What Will Happen Next)
                </h4>
              </div>
              <span className="text-[10.5px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                Forward Roadmap
              </span>
            </div>

            {/* Selected Action Items List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mandatory Forward Actions ({actionsList.length} Selected)
                </span>
                <span className="text-[10.5px] text-cyan-700 dark:text-cyan-400 font-bold">
                  Action Required
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {actionsList.map((action, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/90 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-600/40 text-blue-900 dark:text-white text-xs font-black shadow-2xs"
                  >
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </div>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Corrective Action Plan Box */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Corrective Action & Remediation Directive
              </span>
              <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-blue-200 dark:border-blue-500/30 relative overflow-hidden shadow-2xs">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-start gap-2.5">
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                      Operational Action Plan
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      {formData.corrective_action || formData.manager_notes || 'Agent to undergo targeted coaching regarding SLA guidelines, standard operating procedures, and clear communication standards.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Plan Workspace Auto-Routing */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Remediation Workspace Sync
              </span>
              <div className={`p-3.5 rounded-xl border transition-all shadow-2xs ${
                formData.action_plan_required 
                  ? 'bg-blue-50/60 border-blue-200 dark:bg-blue-950/40 dark:border-blue-500/40 text-blue-900 dark:text-blue-100' 
                  : 'bg-white border-slate-200/80 dark:bg-slate-900/60 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Zap className={`w-4 h-4 ${formData.action_plan_required ? 'text-amber-500' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        Action Plan Routing Status
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formData.action_plan_required 
                          ? `Flagged -> Auto-syncing to Action Plans workspace as "${formData.action_plan_type || 'Training Action'}"`
                          : 'Not flagged for dedicated Action Plan ticket (Direct resolution)'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black border ${
                    formData.action_plan_required 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>
                    {formData.action_plan_required ? 'Flagged & Active' : 'Direct Close'}
                  </span>
                </div>
              </div>
            </div>

            {/* Governance, Ownership & Manager Approval */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Governance, Sign-Off & Approvals
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Assigned Reviewing Manager</span>
                  <span className="font-extrabold text-slate-900 dark:text-white truncate block mt-0.5">{formData.assigned_manager || 'Bassam Mohamed'}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Department Lead / QA Manager</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Approval Status</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-black ${
                      formData.manager_approval === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      formData.manager_approval === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400' :
                      'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300'
                    }`}>
                      {formData.manager_approval || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Stage Forward Lifecycle Flow */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Forward Incident Resolution Lifecycle
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                {/* Stage 1 */}
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/40 flex flex-col items-center gap-1 shadow-2xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px]">
                    ✓
                  </div>
                  <span className="text-[10.5px] font-black text-emerald-800 dark:text-emerald-300">1. QA Recorded</span>
                  <span className="text-[9px] text-emerald-600/80 dark:text-slate-400">Findings logged</span>
                </div>

                {/* Stage 2 */}
                <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 shadow-2xs ${
                  formData.manager_approval === 'Approved' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-500/50 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/50'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                    formData.manager_approval === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {formData.manager_approval === 'Approved' ? '✓' : '2'}
                  </div>
                  <span className="text-[10.5px] font-black">2. Manager Sign-Off</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400">{formData.manager_approval || 'In Review'}</span>
                </div>

                {/* Stage 3 */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center gap-1 text-slate-400 shadow-2xs">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-[10px]">
                    3
                  </div>
                  <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400">3. Action Executed</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">Coaching & CAPA</span>
                </div>

                {/* Stage 4 */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center gap-1 text-slate-400 shadow-2xs">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-[10px]">
                    4
                  </div>
                  <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400">4. Audit Closed</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">Resolved & archived</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
