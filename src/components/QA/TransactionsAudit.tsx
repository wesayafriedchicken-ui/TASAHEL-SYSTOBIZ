import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  Clock, 
  CreditCard, 
  XCircle, 
  Star, 
  ClipboardList, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  UserCheck, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  Building2, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Eye, 
  Save, 
  X,
  Target,
  Zap,
  FileText,
  Wallet,
  Calendar,
  Layers,
  Check
} from 'lucide-react';
import { IncidentWorkflowStepper, AuditRecord, IncidentType } from './IncidentWorkflowStepper';
import { ActionPlansManager } from './ActionPlansManager';
import { AuditControlsBar, AuditFilterState } from './AuditControlsBar';
import { AuditPagination } from './AuditPagination';
import { SortableColumnHeader } from './SortableColumnHeader';
import { 
  AuditListTableView, 
  AuditBoardCardsView, 
  NpsListTableView, 
  NpsBoardCardsView 
} from './AuditRecordViews';
import { PresetRootCauseModal, PresetFormModel, PresetSubReasonItem } from './PresetRootCauseModal';
import { useNavigate } from 'react-router-dom';

export interface TransactionsAuditProps {
  forcedSubTab?: 'complaints' | 'delays' | 'refunds' | 'cancellations' | 'nps' | 'action_plans' | 'checklists';
  hideSubNav?: boolean;
}

export const TransactionsAudit: React.FC<TransactionsAuditProps> = ({ forcedSubTab, hideSubNav }) => {
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<'complaints' | 'delays' | 'refunds' | 'cancellations' | 'nps' | 'action_plans' | 'checklists'>(forcedSubTab || 'complaints');
  
  const effectiveSubTab = forcedSubTab || subTab;
  
  useEffect(() => {
    if (forcedSubTab) {
      setSubTab(forcedSubTab);
    }
  }, [forcedSubTab]);
  
  // Data States
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<string[]>([
    'Operations',
    'Customer Service',
    'Sales',
    'Finance',
    'IT & Systems',
    'Quality & QA',
    'HR Management',
    'Logistics & Warehouse',
    'Supplier Management'
  ]);
  const [npsRecords, setNpsRecords] = useState<any[]>([]);
  const [actionPlansCount, setActionPlansCount] = useState<number>(0);
  const [selectedRecordForActionPlan, setSelectedRecordForActionPlan] = useState<Partial<AuditRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stepper Modal State
  const [activeStepperType, setActiveStepperType] = useState<IncidentType | null>(null);
  const [selectedAuditForStepper, setSelectedAuditForStepper] = useState<AuditRecord | null>(null);

  // View Mode ('list' | 'board')
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // Filter & Search
  const [filters, setFilters] = useState<AuditFilterState>({
    searchQuery: '',
    deptFilter: 'All',
    approvalFilter: 'All',
    qaStatusFilter: 'All',
    slaFilter: 'All',
    datePreset: 'all',
    startDate: '',
    endDate: '',
  });

  // Sorting
  const [sortField, setSortField] = useState<string>('order_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Advanced Filter state for Transactions Audit & NPS
  const [advancedFilteredAudits, setAdvancedFilteredAudits] = useState<AuditRecord[] | null>(null);
  const [advancedFilteredNps, setAdvancedFilteredNps] = useState<any[] | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Presets Edit Modal
  const [isEditingPreset, setIsEditingPreset] = useState(false);
  const [selectedPresetForModal, setSelectedPresetForModal] = useState<PresetFormModel | null>(null);
  const [savingPreset, setSavingPreset] = useState(false);

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<{ id: number | string; type: 'audit' | 'nps'; label: string; code?: string } | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);

  // NPS Edit Modal
  const [isAddingNps, setIsAddingNps] = useState(false);
  const [npsForm, setNpsForm] = useState({
    id: undefined as number | undefined,
    transaction_id: '',
    customer_name: '',
    agent_name: '',
    rating: 10,
    feedback_text: '',
    delay_linked: false,
    root_cause: '',
    corrective_action: '',
    status: 'Reviewed'
  });

  useEffect(() => {
    fetchAuditData();
  }, [effectiveSubTab]);

  // Reset pagination when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveSubTab, filters]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFilterUpdate = (updates: Partial<AuditFilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      deptFilter: 'All',
      approvalFilter: 'All',
      qaStatusFilter: 'All',
      slaFilter: 'All',
      datePreset: 'all',
      startDate: '',
      endDate: '',
    });
    setAdvancedFilteredAudits(null);
    setAdvancedFilteredNps(null);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const headers = { 'Authorization': `Bearer ${token}`, 'x-user-id': userId };
      const currentTab = effectiveSubTab;

      // Isolated progressive data fetching per sub-route (Zero Promise.all pool starvation)
      const fetchDeptsLazy = async () => {
        if (departmentsList.length > 0) return;
        try {
          const deptsRes = await fetch('/api/departments', { headers });
          if (deptsRes.ok) {
            const deptsData = await deptsRes.json();
            if (Array.isArray(deptsData) && deptsData.length > 0) {
              const names = Array.from(new Set(deptsData.map((d: any) => d.name || d.department_name || d.title).filter(Boolean)));
              if (names.length > 0) setDepartmentsList(names as string[]);
            }
          }
        } catch {}
      };

      if (currentTab === 'complaints' || currentTab === 'delays' || currentTab === 'refunds' || currentTab === 'cancellations') {
        const typeParam = currentTab === 'complaints' ? 'complaint' 
          : currentTab === 'delays' ? 'delay' 
          : currentTab === 'refunds' ? 'refund' 
          : 'cancellation';

        // 1. Primary audits data
        try {
          const auditsRes = await fetch(`/api/qa/transactions-audit?type=${typeParam}`, { headers });
          if (auditsRes.ok) setAudits(await auditsRes.json());
        } catch {}

        // 2. Secondary presets data
        try {
          const presetsRes = await fetch('/api/qa/presets', { headers });
          if (presetsRes.ok) setPresets(await presetsRes.json());
        } catch {}

        await fetchDeptsLazy();
      } else if (currentTab === 'nps') {
        try {
          const npsRes = await fetch('/api/qa/nps', { headers });
          if (npsRes.ok) setNpsRecords(await npsRes.json());
        } catch {}
        await fetchDeptsLazy();
      } else if (currentTab === 'action_plans') {
        try {
          const plansRes = await fetch('/api/qa/action-plans', { headers });
          if (plansRes.ok) {
            const plansData = await plansRes.json();
            setActionPlansCount(Array.isArray(plansData) ? plansData.length : 0);
          }
        } catch {}
        await fetchDeptsLazy();
      } else if (currentTab === 'checklists') {
        try {
          const presetsRes = await fetch('/api/qa/presets', { headers });
          if (presetsRes.ok) setPresets(await presetsRes.json());
        } catch {}
        await fetchDeptsLazy();
      } else {
        // Default / All Overview: Fetch primary audits first
        try {
          const auditsRes = await fetch('/api/qa/transactions-audit', { headers });
          if (auditsRes.ok) setAudits(await auditsRes.json());
        } catch {}

        // Progressively fetch presets
        try {
          const presetsRes = await fetch('/api/qa/presets', { headers });
          if (presetsRes.ok) setPresets(await presetsRes.json());
        } catch {}

        await fetchDeptsLazy();
      }
    } catch (err) {
      console.error("Failed to load Transactions Audit data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerActionPlan = (rec: Partial<AuditRecord>) => {
    setSelectedRecordForActionPlan(rec);
    setSubTab('action_plans');
  };

  // Smart Pull Engine Runner
  const handlePullData = async (targetType: IncidentType) => {
    setPulling(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch('/api/qa/transactions-audit/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify({ type: targetType })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`📥 ${data.message || 'Orders successfully pulled from Sales CRM & Operations Hub!'}`);
        fetchAuditData();
      } else {
        showToast('⚠️ Failed to pull orders from system.');
      }
    } catch (err) {
      console.error("Error pulling data:", err);
      showToast('⚠️ Error executing Pull Orders engine.');
    } finally {
      setPulling(false);
    }
  };

  // Export Audits to Excel / CSV
  const handleExportAudits = () => {
    const recordsToExport = filteredAudits.length > 0 ? filteredAudits : currentTypeAudits;
    if (recordsToExport.length === 0) {
      showToast('⚠️ No audit records available to export');
      return;
    }

    const headers = [
      'Transaction ID',
      'QA Reference',
      'Type',
      'Order Date',
      'Customer Name',
      'Agent Name',
      'Department',
      'SLA Status',
      'QA Status',
      'Auditor Name',
      'Root Cause',
      'Sub Reason',
      'Order Amount',
      'Refund Amount',
      'Manager Approval',
      'Workflow Status'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = recordsToExport.map(r => [
      escapeCsv(r.transaction_id),
      escapeCsv(r.qa_reference_number || ''),
      escapeCsv(r.type),
      escapeCsv(r.order_date ? new Date(r.order_date).toLocaleDateString() : ''),
      escapeCsv(r.customer_name),
      escapeCsv(r.agent_name),
      escapeCsv(r.department),
      escapeCsv(r.sla_status),
      escapeCsv(r.qa_status),
      escapeCsv(r.auditor_name),
      escapeCsv(r.root_cause || ''),
      escapeCsv(r.sub_reason || ''),
      escapeCsv(r.order_amount ?? 0),
      escapeCsv(r.refund_amount ?? 0),
      escapeCsv(r.manager_approval || 'Pending'),
      escapeCsv(r.workflow_status || '')
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentIncidentType || 'transactions'}_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`📊 Exported ${recordsToExport.length} audits to Excel/CSV`);
  };

  // Export NPS Records to Excel / CSV
  const handleExportNps = () => {
    const recordsToExport = filteredNps.length > 0 ? filteredNps : npsRecords;
    if (recordsToExport.length === 0) {
      showToast('⚠️ No NPS feedback records available to export');
      return;
    }

    const headers = [
      'Transaction ID',
      'QA Reference',
      'Customer Name',
      'Agent Name',
      'Rating',
      'Category',
      'Feedback Text',
      'Delay Linked',
      'Root Cause',
      'Corrective Action',
      'Status',
      'Auditor Name',
      'Created At'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = recordsToExport.map(r => [
      escapeCsv(r.transaction_id),
      escapeCsv(r.qa_reference_number || ''),
      escapeCsv(r.customer_name),
      escapeCsv(r.agent_name),
      escapeCsv(r.rating ?? ''),
      escapeCsv(r.category || ''),
      escapeCsv(r.feedback_text || ''),
      escapeCsv(r.delay_linked ? 'Yes' : 'No'),
      escapeCsv(r.root_cause || ''),
      escapeCsv(r.corrective_action || ''),
      escapeCsv(r.status || ''),
      escapeCsv(r.auditor_name || ''),
      escapeCsv(r.created_at ? new Date(r.created_at).toLocaleDateString() : '')
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nps_feedback_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`📊 Exported ${recordsToExport.length} NPS records to Excel/CSV`);
  };

  // Save Record via Stepper
  const handleSaveAuditRecord = async (record: AuditRecord) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';

      if (record.type === 'nps') {
        const npsPayload = {
          id: record.id,
          transaction_id: record.transaction_id,
          qa_reference_number: record.qa_reference_number || record.details?.qa_reference_number,
          customer_name: record.customer_name || 'Customer Name',
          agent_name: record.agent_name || 'Sara Mohamed',
          rating: record.rating ?? 8,
          category: record.category || ((record.rating ?? 8) >= 9 ? 'Promoter' : (record.rating ?? 8) >= 7 ? 'Passive' : 'Detractor'),
          feedback_text: record.comment || record.details?.feedback_text || '',
          delay_linked: record.switches?.over_promise || false,
          root_cause: record.bucket_3_root_cause || record.root_cause || 'Wrong Evaluation',
          corrective_action: record.action_required || record.corrective_action || 'Coaching Required',
          status: record.manager_approval || 'Pending',
          auditor_name: record.auditor_name || 'Sarah Jenkins',
          survey_date: record.survey_date || record.request_date || (record.date ? String(record.date).slice(0, 10) : null),
          date: record.survey_date || record.request_date || (record.date ? String(record.date).slice(0, 10) : null),
          created_at: record.created_at || (record.survey_date ? new Date(record.survey_date + 'T12:00:00Z').toISOString() : null)
        };

        const res = await fetch('/api/qa/nps', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-user-id': userId
          },
          body: JSON.stringify(npsPayload)
        });

        if (res.ok) {
          showToast('⭐ Customer NPS Feedback saved successfully!');
          setActiveStepperType(null);
          setSelectedAuditForStepper(null);
          fetchAuditData();
        }
        return;
      }

      const res = await fetch('/api/qa/transactions-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify(record)
      });

      if (res.ok) {
        // If Flagged for Action Plan, auto-trigger into Action Plans workspace
        if (record.action_plan_required && record.action_plan_type) {
          try {
            await fetch('/api/qa/action-plans/trigger-from-audit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-user-id': userId
              },
              body: JSON.stringify({
                audit_id: record.id,
                incident_type: record.type,
                transaction_id: record.transaction_id,
                customer_name: record.customer_name,
                agent_name: record.agent_name,
                department: record.department,
                root_cause: record.root_cause || record.bucket_3_root_cause,
                sub_reason: record.sub_reason,
                reason_comment: record.comment || record.corrective_action,
                severity_override: record.qa_status === 'Fail' ? 'Critical' : 'High',
                action_plan_type: record.action_plan_type,
                action_required: record.action_required,
                created_at: record.created_at || (record.request_date ? new Date(record.request_date + 'T12:00:00Z').toISOString() : (record.survey_date ? new Date(record.survey_date + 'T12:00:00Z').toISOString() : (record.order_date ? new Date(record.order_date + 'T12:00:00Z').toISOString() : new Date().toISOString())))
              })
            });
            showToast(`✅ Audit saved & ${record.action_plan_type} automatically sent to Action Plans!`);
          } catch (planErr) {
            console.error("Auto trigger plan failed:", planErr);
            showToast('✅ Transaction Audit record updated successfully!');
          }
        } else if (record.type === 'refund' && record.lose_on_employee && record.lose_amount) {
          showToast(`✅ Refund audit saved & penalty deduction of EGP ${record.lose_amount} logged to employee HR record!`);
        } else {
          showToast('✅ Transaction Audit record updated successfully!');
        }

        setActiveStepperType(null);
        setSelectedAuditForStepper(null);
        fetchAuditData();
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to save audit record.');
    }
  };

  // Parse helper for sub-reasons
  const parseSubReasonsList = (raw: any): PresetSubReasonItem[] => {
    if (!raw) return [];
    let parsed = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(parsed)) return [];
    const basePct = Math.floor(100 / Math.max(1, parsed.length));
    return parsed.map((item: any, idx: number) => {
      if (typeof item === 'string') {
        return {
          id: `sr-${idx}`,
          name: item,
          weight_percentage: basePct,
          is_active: true
        };
      }
      return {
        id: item.id || `sr-${idx}`,
        name: item.name || '',
        weight_percentage: typeof item.weight_percentage === 'number' ? item.weight_percentage : (typeof item.weight === 'number' ? item.weight : basePct),
        is_active: item.is_active !== undefined ? item.is_active : true
      };
    });
  };

  // Save Preset from Modal
  const handleSavePresetModal = async (presetData: PresetFormModel) => {
    setSavingPreset(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';

      const res = await fetch('/api/qa/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify({
          id: presetData.id,
          type: presetData.type,
          department: presetData.department,
          root_cause_name: presetData.root_cause_name,
          weight: presetData.weight,
          sub_reasons: presetData.sub_reasons,
          is_active: true
        })
      });

      if (res.ok) {
        showToast('✅ Preset Root Cause saved successfully with weighted checklist!');
        setIsEditingPreset(false);
        setSelectedPresetForModal(null);
        fetchAuditData();
      } else {
        showToast('❌ Failed to save preset root cause.');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error saving preset root cause.');
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePreset = async (id: number) => {
    if (!confirm('Are you sure you want to delete this preset root cause?')) return;
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      await fetch(`/api/qa/presets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': userId }
      });
      showToast('Preset deleted.');
      fetchAuditData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Audit Record Trigger
  const handleDeleteAudit = (record: AuditRecord) => {
    if (!record.id) return;
    setItemToDelete({
      id: record.id,
      type: 'audit',
      label: `${record.customer_name || 'Customer'} - ${record.agent_name || 'Agent'} (${record.department || 'Operations'})`,
      code: record.transaction_id
    });
  };

  // Delete NPS Record Trigger
  const handleDeleteNps = (record: any) => {
    if (!record.id) return;
    setItemToDelete({
      id: record.id,
      type: 'nps',
      label: `${record.customer_name || 'Customer'} (${record.rating}/10 - ${record.category || 'Feedback'})`,
      code: record.transaction_id
    });
  };

  // Confirm and execute record deletion
  const confirmDeleteRecord = async () => {
    if (!itemToDelete) return;
    setIsDeletingRecord(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const headers = { 'Authorization': `Bearer ${token}`, 'x-user-id': userId };

      const endpoint = itemToDelete.type === 'audit'
        ? `/api/qa/transactions-audit/${itemToDelete.id}`
        : `/api/qa/nps/${itemToDelete.id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        showToast(`🗑️ ${itemToDelete.type === 'audit' ? 'Transaction audit record' : 'Customer NPS feedback'} deleted successfully!`);
        setItemToDelete(null);
        fetchAuditData();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(`⚠️ ${errData.error || 'Failed to delete record'}`);
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      showToast('⚠️ Network error deleting record');
    } finally {
      setIsDeletingRecord(false);
    }
  };

  // Save NPS Feedback
  const handleSaveNps = async () => {
    if (!npsForm.transaction_id || !npsForm.customer_name) return alert('Please fill required fields');
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch('/api/qa/nps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify(npsForm)
      });

      if (res.ok) {
        showToast('⭐ NPS Feedback saved successfully!');
        setIsAddingNps(false);
        fetchAuditData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Map subTab string to IncidentType
  const currentIncidentType = effectiveSubTab === 'complaints' ? 'complaint'
    : effectiveSubTab === 'delays' ? 'delay'
    : effectiveSubTab === 'refunds' ? 'refund'
    : effectiveSubTab === 'cancellations' ? 'cancellation'
    : null;

  // Audits belonging to the current subTab
  const currentTypeAudits = useMemo(() => {
    return currentIncidentType ? audits.filter(a => a.type === currentIncidentType) : audits;
  }, [audits, currentIncidentType]);

  // Filter audits for current subTab
  const filteredAudits = useMemo(() => {
    const baseSource = advancedFilteredAudits !== null ? advancedFilteredAudits : audits;
    return baseSource.filter(a => {
      if (currentIncidentType && a.type !== currentIncidentType) return false;
      if (filters.deptFilter !== 'All' && a.department !== filters.deptFilter) return false;
      if (filters.approvalFilter !== 'All' && a.manager_approval !== filters.approvalFilter) return false;
      if (filters.qaStatusFilter !== 'All' && a.qa_status !== filters.qaStatusFilter) return false;
      if (filters.slaFilter !== 'All' && a.sla_status !== filters.slaFilter) return false;

      // Date Range Filter
      if (filters.startDate || filters.endDate) {
        const dateStr = a.order_date || a.created_at;
        if (dateStr) {
          const recTime = new Date(dateStr).getTime();
          if (!isNaN(recTime)) {
            if (filters.startDate) {
              const startT = new Date(filters.startDate + 'T00:00:00').getTime();
              if (recTime < startT) return false;
            }
            if (filters.endDate) {
              const endT = new Date(filters.endDate + 'T23:59:59').getTime();
              if (recTime > endT) return false;
            }
          }
        }
      }

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          a.transaction_id?.toLowerCase().includes(q) ||
          a.agent_name?.toLowerCase().includes(q) ||
          a.auditor_name?.toLowerCase().includes(q) ||
          a.customer_name?.toLowerCase().includes(q) ||
          a.root_cause?.toLowerCase().includes(q) ||
          a.sub_reason?.toLowerCase().includes(q) ||
          a.department?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [audits, advancedFilteredAudits, currentIncidentType, filters]);

  // Sort Audits
  const sortedAudits = useMemo(() => {
    return [...filteredAudits].sort((a, b) => {
      let valA: any = a[sortField as keyof AuditRecord];
      let valB: any = b[sortField as keyof AuditRecord];

      if (sortField === 'order_date') {
        valA = new Date(a.order_date || a.created_at || 0).getTime();
        valB = new Date(b.order_date || b.created_at || 0).getTime();
      } else if (sortField === 'refund_amount' || sortField === 'order_amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA ?? '').toString().toLowerCase();
        valB = (valB ?? '').toString().toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAudits, sortField, sortDirection]);

  // Paginated Audits
  const paginatedAudits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAudits.slice(start, start + pageSize);
  }, [sortedAudits, currentPage, pageSize]);

  // Filter NPS
  const filteredNps = useMemo(() => {
    const baseSource = advancedFilteredNps !== null ? advancedFilteredNps : npsRecords;
    return baseSource.filter(r => {
      if (filters.deptFilter !== 'All' && r.department && r.department !== filters.deptFilter) return false;
      if (filters.approvalFilter !== 'All' && r.status && r.status !== filters.approvalFilter) return false;

      // Date Range Filter
      if (filters.startDate || filters.endDate) {
        const dateStr = r.survey_date || r.order_date || r.created_at;
        if (dateStr) {
          const recTime = new Date(dateStr).getTime();
          if (!isNaN(recTime)) {
            if (filters.startDate) {
              const startT = new Date(filters.startDate + 'T00:00:00').getTime();
              if (recTime < startT) return false;
            }
            if (filters.endDate) {
              const endT = new Date(filters.endDate + 'T23:59:59').getTime();
              if (recTime > endT) return false;
            }
          }
        }
      }

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          r.transaction_id?.toLowerCase().includes(q) ||
          r.agent_name?.toLowerCase().includes(q) ||
          r.auditor_name?.toLowerCase().includes(q) ||
          r.customer_name?.toLowerCase().includes(q) ||
          r.root_cause?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.feedback_text?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [npsRecords, advancedFilteredNps, filters]);

  // Sort NPS
  const sortedNps = useMemo(() => {
    return [...filteredNps].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'rating') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA ?? '').toString().toLowerCase();
        valB = (valB ?? '').toString().toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredNps, sortField, sortDirection]);

  // Paginated NPS
  const paginatedNps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedNps.slice(start, start + pageSize);
  }, [sortedNps, currentPage, pageSize]);

  // Calculate NPS Metrics from actual database records
  const totalNps = filteredNps.length;
  const promoters = filteredNps.filter(r => Number(r.rating) >= 9).length;
  const passives = filteredNps.filter(r => Number(r.rating) >= 7 && Number(r.rating) <= 8).length;
  const detractors = filteredNps.filter(r => Number(r.rating) <= 6).length;
  const npsScore = totalNps > 0 ? Math.round(((promoters - detractors) / totalNps) * 100) : 0;
  const avgCsat = totalNps > 0 ? (filteredNps.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / totalNps) * 10 : 0;

  // Calculate Refunds Specific Metrics from actual database records
  const refundAudits = useMemo(() => {
    return filteredAudits.filter(a => a.type === 'refund');
  }, [filteredAudits]);

  const refundTotalCount = refundAudits.length;
  const refundTotalAmountVal = useMemo(() => {
    return refundAudits.reduce((acc, a) => {
      const amt = Number(a.refund_amount) || Number(a.order_amount) || 0;
      return acc + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [refundAudits]);
  const refundTotalAmount = `${refundTotalAmountVal.toLocaleString()} EGP`;

  const avoidableRefundsCount = useMemo(() => {
    return refundAudits.filter(a => {
      let sw: any = a.switches;
      if (typeof sw === 'string') {
        try { sw = JSON.parse(sw); } catch { sw = {}; }
      }
      const errCls = (a.error_classification || '').toLowerCase();
      const rc = (a.root_cause || '').toLowerCase();
      return sw?.avoidable_refund === true || 
             errCls.includes('avoidable') || 
             rc.includes('avoidable') || 
             rc.includes('overpromise');
    }).length;
  }, [refundAudits]);

  const avoidableRefundsPct = refundTotalCount > 0 ? ((avoidableRefundsCount / refundTotalCount) * 100).toFixed(1) : '0';
  const avoidableRefundsDisplay = `${avoidableRefundsCount} (${avoidableRefundsPct}%)`;

  const pendingRefundsCount = useMemo(() => {
    return refundAudits.filter(a => {
      const mApp = (a.manager_approval || '').toLowerCase();
      const wf = (a.workflow_status || '').toLowerCase();
      const qa = (a.qa_status || '').toLowerCase();
      const op = (a.operations_status || '').toLowerCase();
      return mApp === 'pending' || wf === 'under review' || wf === 'pending' || qa === 'pending' || op === 'in progress' || op === 'pending';
    }).length;
  }, [refundAudits]);
  const pendingRefundsDisplay = pendingRefundsCount;

  const handleTabClick = (tabId: string) => {
    const routeMap: Record<string, string> = {
      complaints: '/qa/transactions-audit/complaints',
      delays: '/qa/transactions-audit/delays',
      refunds: '/qa/transactions-audit/refunds',
      cancellations: '/qa/transactions-audit/cancellations',
      nps: '/qa/transactions-audit/nps',
      action_plans: '/qa/transactions-audit/action-plans',
      checklists: '/qa/transactions-audit/checklists',
    };
    if (routeMap[tabId]) {
      navigate(routeMap[tabId]);
    } else {
      setSubTab(tabId as any);
    }
  };

  return (
    <div className="space-y-6" id="transactions-audit-container">

      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs Header (Hidden if routed layout provides tabs) */}
      {!hideSubNav && (
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full overflow-x-auto scrollbar-none border border-slate-200">
          {[
            { id: 'complaints', label: 'Complaints', icon: MessageSquare, badge: audits.filter(a => a.type === 'complaint').length },
            { id: 'delays', label: 'Delays', icon: Clock, badge: audits.filter(a => a.type === 'delay').length },
            { id: 'refunds', label: 'Refunds', icon: CreditCard, badge: audits.filter(a => a.type === 'refund').length },
            { id: 'cancellations', label: 'Cancellations', icon: XCircle, badge: audits.filter(a => a.type === 'cancellation').length },
            { id: 'nps', label: 'NPS', icon: Star, badge: npsRecords.length },
            { id: 'action_plans', label: 'Action Plans', icon: Target, badge: actionPlansCount },
            { id: 'checklists', label: 'Audit Checklists', icon: ClipboardList, badge: presets.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80' 
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* RENDERING SUB-TABS (Complaints / Delays / Refunds / Cancellations) */}
      {currentIncidentType && (
        <div className="space-y-6">

          {/* Quick Metrics Cards */}
          {currentIncidentType === 'refund' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Refund Requests */}
              <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-700 block">Total Refund Requests</span>
                  <p className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{refundTotalCount}</p>
                  <span className="text-xs text-slate-400 font-medium block mt-0.5">This Month</span>
                </div>
              </div>

              {/* Card 2: Total Refund Amount */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-700 block">Total Refund Amount</span>
                  <p className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{refundTotalAmount}</p>
                  <span className="text-xs text-slate-400 font-medium block mt-0.5">This Month</span>
                </div>
              </div>

              {/* Card 3: Avoidable Refunds */}
              <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-10 h-10 text-amber-500 fill-amber-500 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Avoidable Refunds</span>
                  <p className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{avoidableRefundsDisplay}</p>
                  <span className="text-xs text-slate-400 font-medium block mt-0.5">This Month</span>
                </div>
              </div>

              {/* Card 4: Pending Requests */}
              <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Clock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Pending Requests</span>
                  <p className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{pendingRefundsDisplay}</p>
                  <span className="text-xs text-slate-400 font-medium block mt-0.5">This Month</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Audited Cases</span>
                <p className="text-2xl font-black text-slate-800 mt-2">{filteredAudits.length}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Auto-synced from CRM</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">QA Pass Rate</span>
                <p className="text-2xl font-black text-emerald-600 mt-2">
                  {filteredAudits.length > 0 
                    ? `${Math.round((filteredAudits.filter(a => a.qa_status === 'Pass').length / filteredAudits.length) * 100)}%` 
                    : '0%'}
                </p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">SLA & Quality Gate Compliant</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Manager Sign-off</span>
                <p className="text-2xl font-black text-amber-600 mt-2">
                  {filteredAudits.filter(a => a.manager_approval === 'Pending').length}
                </p>
                <p className="text-[10px] text-amber-600 font-bold mt-1">Awaiting Manager Approval</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">SLA Breaches</span>
                <p className="text-2xl font-black text-indigo-600 mt-2">
                  {filteredAudits.filter(a => a.sla_status === 'Breached SLA').length}
                </p>
                <p className="text-[10px] text-indigo-600 font-bold mt-1">Quality Gate Metric</p>
              </div>
            </div>
          )}

          {/* Search, Filter, Date Range, & View Mode Controls Bar */}
          <AuditControlsBar
            filters={filters}
            onFilterChange={handleFilterUpdate}
            onResetFilters={handleResetFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalCount={filteredAudits.length}
            showQAPassFilter={true}
            showSLAFilter={true}
            items={currentTypeAudits}
            onAdvancedFilter={(filtered) => {
              setAdvancedFilteredAudits(filtered as AuditRecord[] | null);
              setCurrentPage(1);
            }}
            onRefresh={fetchAuditData}
            loading={loading}
            onNewItem={() => {
              const routeType = currentIncidentType === 'complaint' ? 'complaints'
                : currentIncidentType === 'delay' ? 'delays'
                : currentIncidentType === 'refund' ? 'refunds'
                : 'cancellations';
              navigate(`/qa/transactions-audit/${routeType}/new`);
            }}
            newItemLabel="New Incident Audit"
            onImport={() => handlePullData(currentIncidentType)}
            importing={pulling}
            importTooltip="Pull Orders / Import Sheet"
            onExport={handleExportAudits}
            exportTooltip="Export to Excel / CSV"
          />

          {/* Records View (List Table or Board Cards) */}
          {viewMode === 'list' ? (
            <AuditListTableView
              audits={paginatedAudits}
              currentIncidentType={currentIncidentType}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onTriggerActionPlan={handleTriggerActionPlan}
              onOpenStepper={(item) => {
                const routeType = currentIncidentType === 'complaint' ? 'complaints'
                  : currentIncidentType === 'delay' ? 'delays'
                  : currentIncidentType === 'refund' ? 'refunds'
                  : 'cancellations';
                navigate(`/qa/transactions-audit/${routeType}/${encodeURIComponent(item.transaction_id || item.id)}`);
              }}
              onDeleteAudit={handleDeleteAudit}
            />
          ) : (
            <AuditBoardCardsView
              audits={paginatedAudits}
              currentIncidentType={currentIncidentType}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onTriggerActionPlan={handleTriggerActionPlan}
              onOpenStepper={(item) => {
                const routeType = currentIncidentType === 'complaint' ? 'complaints'
                  : currentIncidentType === 'delay' ? 'delays'
                  : currentIncidentType === 'refund' ? 'refunds'
                  : 'cancellations';
                navigate(`/qa/transactions-audit/${routeType}/${encodeURIComponent(item.transaction_id || item.id)}`);
              }}
              onDeleteAudit={handleDeleteAudit}
            />
          )}

          {/* Pagination Controls */}
          {filteredAudits.length > 0 && (
            <AuditPagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredAudits.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}

        </div>
      )}

      {/* SUB-TAB: NPS & CSAT */}
      {subTab === 'nps' && (
        <div className="space-y-6 animate-fadeIn">

          {/* Top KPI Metrics Bar - 5 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total NPS Surveys</span>
              <p className="text-3xl font-black text-slate-800 mt-2">{totalNps}</p>
              <span className="text-[10px] text-slate-500 font-bold mt-1 block flex items-center justify-center gap-1">
                {totalNps > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span>{totalNps} total responses</span>
                  </>
                ) : (
                  <span>No survey records</span>
                )}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm text-center">
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider block">Promoters (9-10)</span>
              <p className="text-3xl font-black text-emerald-600 mt-2">{promoters}</p>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" /> {totalNps > 0 ? `${Math.round((promoters / totalNps) * 100)}% of total` : '0% of total'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm text-center">
              <span className="text-amber-700 text-xs font-bold uppercase tracking-wider block">Passives (7-8)</span>
              <p className="text-3xl font-black text-amber-600 mt-2">{passives}</p>
              <span className="text-[10px] text-amber-600 font-bold mt-1 block flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" /> {totalNps > 0 ? `${Math.round((passives / totalNps) * 100)}% of total` : '0% of total'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm text-center">
              <span className="text-rose-700 text-xs font-bold uppercase tracking-wider block">Detractors (0-6)</span>
              <p className="text-3xl font-black text-rose-600 mt-2">{detractors}</p>
              <span className="text-[10px] text-rose-600 font-bold mt-1 block flex items-center justify-center gap-1">
                <TrendingDown className="w-3 h-3 text-rose-500" /> {totalNps > 0 ? `${Math.round((detractors / totalNps) * 100)}% of total` : '0% of total'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm text-center">
              <span className="text-indigo-700 text-xs font-bold uppercase tracking-wider block">Net Promoter Score</span>
              <p className={`text-3xl font-black mt-2 ${totalNps === 0 ? 'text-slate-800' : npsScore >= 50 ? 'text-emerald-600' : npsScore >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                {totalNps > 0 ? (npsScore > 0 ? `+${npsScore}` : `${npsScore}`) : '0'}
              </p>
              <span className="text-[10px] text-indigo-600 font-bold mt-1 block flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> Benchmark Target: +50
              </span>
            </div>
          </div>

          {/* Search, Filter, Date Range & View Mode for NPS */}
          <AuditControlsBar
            filters={filters}
            onFilterChange={handleFilterUpdate}
            onResetFilters={handleResetFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalCount={filteredNps.length}
            showQAPassFilter={false}
            showSLAFilter={false}
            items={npsRecords}
            onAdvancedFilter={(filtered) => {
              setAdvancedFilteredNps(filtered);
              setCurrentPage(1);
            }}
            onRefresh={fetchAuditData}
            loading={loading}
            onNewItem={() => navigate('/qa/transactions-audit/nps/new')}
            newItemLabel="Log Customer Feedback"
            onImport={() => handlePullData('nps')}
            importing={pulling}
            importTooltip="Pull Orders / Import Sheet"
            onExport={handleExportNps}
            exportTooltip="Export to Excel / CSV"
          />

          {/* Feedback Records View (List Table or Board Cards) */}
          {viewMode === 'list' ? (
            <NpsListTableView
              npsRecords={paginatedNps}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onTriggerActionPlan={handleTriggerActionPlan}
              onOpenStepper={(item) => {
                navigate(`/qa/transactions-audit/nps/${encodeURIComponent(item.transaction_id || item.id)}`);
              }}
              onDeleteNps={handleDeleteNps}
            />
          ) : (
            <NpsBoardCardsView
              npsRecords={paginatedNps}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onTriggerActionPlan={handleTriggerActionPlan}
              onOpenStepper={(item) => {
                navigate(`/qa/transactions-audit/nps/${encodeURIComponent(item.transaction_id || item.id)}`);
              }}
              onDeleteNps={handleDeleteNps}
            />
          )}

          {/* NPS Pagination */}
          {filteredNps.length > 0 && (
            <AuditPagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredNps.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      )}

      {/* SUB-TAB: ACTION PLANS (Incident Audit & QA Stepper) */}
      {subTab === 'action_plans' && (
        <ActionPlansManager
          auditRecords={audits}
          presets={presets}
          selectedRecordForActionPlan={selectedRecordForActionPlan}
          onClearSelectedRecord={() => setSelectedRecordForActionPlan(null)}
          onNavigateToTab={(tab) => setSubTab(tab as any)}
        />
      )}

      {/* SUB-TAB: AUDIT CHECKLISTS / PRESETS */}
      {subTab === 'checklists' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <ClipboardList className="w-3.5 h-3.5" />
                Dynamic Root Cause Buckets & Audit Checklists Configuration
              </div>
              <h2 className="text-xl font-black mt-1 text-white">Preset Root Cause Buckets</h2>
              <p className="text-slate-300 text-xs mt-1 font-medium">
                Configure customizable root causes and sub-reasons for each incident type (Complaints, Delays, Refunds, Cancellations) to seamlessly adapt the QA system to any enterprise.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedPresetForModal(null);
                setIsEditingPreset(true);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Root Cause Preset</span>
            </button>
          </div>

          {/* Root Causes Grid per Incident Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['complaint', 'delay', 'refund', 'cancellation'] as IncidentType[]).map((incType) => {
              const typePresets = presets.filter(p => p.type === incType);

              return (
                <div key={incType} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        incType === 'complaint' ? 'bg-amber-500' :
                        incType === 'delay' ? 'bg-sky-500' :
                        incType === 'refund' ? 'bg-indigo-500' : 'bg-rose-500'
                      }`} />
                      <h3 className="font-black text-slate-800 text-sm capitalize">{incType} Root Causes</h3>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {typePresets.length} Buckets
                    </span>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {typePresets.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-4 text-center">No presets configured for {incType}.</p>
                    ) : (
                      typePresets.map((preset) => {
                        const subArr = parseSubReasonsList(preset.sub_reasons);
                        const presetWeight = preset.weight !== undefined && preset.weight !== null ? Number(preset.weight) : 25;

                        return (
                          <div key={preset.id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start justify-between gap-3 hover:border-slate-300 transition-all">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-md border border-indigo-100">
                                  {preset.department}
                                </span>
                                <span className="font-bold text-xs text-slate-900">{preset.root_cause_name}</span>
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-black rounded-md border border-rose-100" title="QA Deduction Weight">
                                  Weight: {presetWeight} pts
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {subArr.map((sub, i: number) => {
                                  const impactVal = ((sub.weight_percentage / 100) * presetWeight).toFixed(1);
                                  return (
                                    <span 
                                      key={sub.id || i} 
                                      className={`text-[9.5px] border px-2 py-0.5 rounded-md font-semibold flex items-center gap-1.5 ${
                                        sub.is_active 
                                          ? 'bg-white border-slate-200 text-slate-700' 
                                          : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                      }`}
                                    >
                                      <span>{sub.name}</span>
                                      <span className="text-indigo-600 font-bold bg-indigo-50 px-1 py-0.2 rounded text-[8.5px]">
                                        {sub.weight_percentage}%
                                      </span>
                                      <span className="text-rose-600 font-bold text-[8.5px]">
                                        -{impactVal}p
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleTriggerActionPlan({
                                  type: preset.type,
                                  root_cause: preset.root_cause_name,
                                  department: preset.department,
                                  comment: `Action Plan initiated from Preset Root Cause [${preset.root_cause_name}]`
                                })}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                                title="Create Action Plan from this Preset"
                              >
                                <Target className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPresetForModal({
                                    id: preset.id,
                                    type: preset.type,
                                    department: preset.department,
                                    root_cause_name: preset.root_cause_name,
                                    weight: presetWeight,
                                    sub_reasons: subArr
                                  });
                                  setIsEditingPreset(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                title="Edit Preset Root Cause"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePreset(preset.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Delete Preset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      )}

      {/* RENDER WORKFLOW STEPPER MODAL */}
      {activeStepperType && (
        <IncidentWorkflowStepper
          type={activeStepperType}
          initialRecord={selectedAuditForStepper}
          presets={presets}
          onSave={handleSaveAuditRecord}
          onClose={() => {
            setActiveStepperType(null);
            setSelectedAuditForStepper(null);
          }}
        />
      )}

      {/* PRESET ROOT CAUSE MODAL */}
      <PresetRootCauseModal
        isOpen={isEditingPreset}
        onClose={() => {
          setIsEditingPreset(false);
          setSelectedPresetForModal(null);
        }}
        preset={selectedPresetForModal}
        departmentsList={departmentsList}
        onSave={handleSavePresetModal}
        saving={savingPreset}
      />

      {/* NPS ADD MODAL */}
      {isAddingNps && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-sm">Log Customer NPS / CSAT Feedback</h3>
              <button onClick={() => setIsAddingNps(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Transaction ID</label>
                  <input
                    type="text"
                    value={npsForm.transaction_id}
                    onChange={(e) => setNpsForm({ ...npsForm, transaction_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1">Rating (1 - 10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={npsForm.rating}
                    onChange={(e) => setNpsForm({ ...npsForm, rating: parseInt(e.target.value) || 10 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={npsForm.customer_name}
                    onChange={(e) => setNpsForm({ ...npsForm, customer_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block mb-1">Agent Name</label>
                  <input
                    type="text"
                    value={npsForm.agent_name}
                    onChange={(e) => setNpsForm({ ...npsForm, agent_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Feedback / Comment</label>
                <textarea
                  rows={2}
                  value={npsForm.feedback_text}
                  onChange={(e) => setNpsForm({ ...npsForm, feedback_text: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="delayCheck"
                  checked={npsForm.delay_linked}
                  onChange={(e) => setNpsForm({ ...npsForm, delay_linked: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="delayCheck" className="text-slate-800">Feedback linked to SLA Delivery Delay</label>
              </div>

              <div>
                <label className="block mb-1">Root Cause</label>
                <input
                  type="text"
                  value={npsForm.root_cause}
                  onChange={(e) => setNpsForm({ ...npsForm, root_cause: e.target.value })}
                  placeholder="e.g. Courier Dispatch Delay"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block mb-1">Corrective Action</label>
                <input
                  type="text"
                  value={npsForm.corrective_action}
                  onChange={(e) => setNpsForm({ ...npsForm, corrective_action: e.target.value })}
                  placeholder="e.g. Coached agent on proactive updates"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddingNps(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNps}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-slate-800 text-base">
                {itemToDelete.type === 'audit' ? 'Delete Audit Record' : 'Delete NPS Record'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to delete this record ({itemToDelete.code || `#${itemToDelete.id}`})? This action cannot be undone.
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 break-words">
                {itemToDelete.label}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeletingRecord}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteRecord}
                disabled={isDeletingRecord}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingRecord ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
