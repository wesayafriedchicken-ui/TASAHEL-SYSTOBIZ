import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  BarChart3, 
  Plus, 
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  History,
  BookOpen,
  Sparkles,
  Calendar,
  ChevronRight,
  Trash2,
  AlertCircle,
  Wrench,
  GraduationCap,
  TrendingDown,
  Info,
  CheckCircle,
  RotateCcw,
  UserCheck,
  Building,
  Activity,
  User,
  ExternalLink,
  Zap,
  CheckSquare,
  List,
  Kanban,
  Edit2,
  ShieldCheck,
  Settings,
  Database,
  FileSpreadsheet,
  RefreshCw,
  Link,
  Check,
  Radio,
  Layers,
  Table,
  Save,
  X,
  Clock
} from 'lucide-react';
import { TransactionsAudit } from './TransactionsAudit';
import { QualityOverviewDashboard } from './QualityOverviewDashboard';
import { EmployeeQualityTracker } from './EmployeeQualityTracker';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  Legend
} from 'recharts';
import DeleteConfirmation from '../Common/DeleteConfirmation';
import { QAIntegrationSettingsModal } from './QAIntegrationSettingsModal';
import { QAAdvancedFilter } from './QAAdvancedFilter';
import { useNavigate } from 'react-router-dom';

export interface QAProps {
  forcedTab?: 'dashboard' | 'transactions_audit' | 'internal_audit' | 'history';
  forcedDashboardSubTab?: 'overview' | 'employee_quality';
  forcedInternalSubTab?: 'builder' | 'audit' | 'ncr' | 'capa';
  hideTopBanner?: boolean;
  hideMainTabs?: boolean;
  hideInternalTabs?: boolean;
}

interface FormItem {
  id: number;
  text: string;
  max_score: number;
}

interface QAForm {
  id: number;
  title: string;
  department_id: number;
  items: FormItem[];
  created_at: string;
}

interface QAEvaluation {
  id: number;
  form_id: number;
  form_title?: string;
  reviewer_id: number;
  reviewer_name?: string;
  employee_id: number;
  employee_name?: string;
  process_name: string;
  department_id: number;
  scores: Record<number, number>;
  total_score: number;
  comments: string;
  status: string;
  created_at: string;
}

interface NcLog {
  id: number;
  evaluation_id: number | null;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reported_by: number;
  reported_by_name?: string;
  assigned_to: number;
  assigned_to_name?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  risk_id?: number | null;
  department_id?: number;
  department_name?: string;
  created_at: string;
}

interface CapaItem {
  id: number;
  ncr_id: number | null;
  ncr_description?: string;
  title: string;
  department_id: number;
  department_name?: string;
  root_cause: string;
  action_plan: string;
  assigned_to: number;
  assignee_name?: string;
  status: 'open' | 'in_progress' | 'verified' | 'closed';
  created_at: string;
}

interface Department {
  id: number;
  name: string;
  title?: string; // fallback
}

interface Employee {
  id: number;
  name: string;
  job_title?: string;
  department_id?: number;
}

interface Sop {
  id: number;
  title: string;
  department_id: number;
  status: string;
  version_number?: string;
}

const QA: React.FC<QAProps> = ({
  forcedTab,
  forcedDashboardSubTab,
  forcedInternalSubTab,
  hideTopBanner,
  hideMainTabs,
  hideInternalTabs
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions_audit' | 'internal_audit' | 'history'>(forcedTab || 'dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState<'overview' | 'employee_quality'>(forcedDashboardSubTab || 'overview');
  const [internalAuditSubTab, setInternalAuditSubTab] = useState<'builder' | 'audit' | 'ncr' | 'capa'>(forcedInternalSubTab || 'builder');

  useEffect(() => {
    if (forcedTab) setActiveTab(forcedTab);
  }, [forcedTab]);

  useEffect(() => {
    if (forcedDashboardSubTab) setDashboardSubTab(forcedDashboardSubTab);
  }, [forcedDashboardSubTab]);

  useEffect(() => {
    if (forcedInternalSubTab) setInternalAuditSubTab(forcedInternalSubTab);
  }, [forcedInternalSubTab]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: number; type: 'form' | 'evaluation' | 'ncr' | 'capa' } | null>(null);
  
  // View Modes for NCR and CAPA (List View vs Kanban Board)
  const [ncrViewMode, setNcrViewMode] = useState<'list' | 'kanban'>('kanban');
  const [capaViewMode, setCapaViewMode] = useState<'list' | 'kanban'>('kanban');

  // Data States
  const [forms, setForms] = useState<QAForm[]>([]);
  const [evaluations, setEvaluations] = useState<QAEvaluation[]>([]);
  const [ncrs, setNcrs] = useState<NcLog[]>([]);
  const [capas, setCapas] = useState<CapaItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sops, setSops] = useState<Sop[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced Filter States across Internal Audit Sub-Tabs
  const [advancedFilteredEvals, setAdvancedFilteredEvals] = useState<QAEvaluation[] | null>(null);
  const [advancedFilteredNcrs, setAdvancedFilteredNcrs] = useState<NcLog[] | null>(null);
  const [advancedFilteredCapas, setAdvancedFilteredCapas] = useState<CapaItem[] | null>(null);
  const [advancedFilteredAuditLogs, setAdvancedFilteredAuditLogs] = useState<any[] | null>(null);

  // Modal & Creation States
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [selectedSopForForm, setSelectedSopForForm] = useState<number | ''>('');
  const [newForm, setNewForm] = useState({
    title: '',
    department_id: '',
    items: [{ id: Date.now(), text: '', max_score: 10 }] as FormItem[]
  });

  const [isPerformingAudit, setIsPerformingAudit] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<QAEvaluation | null>(null);
  const [auditForm, setAuditForm] = useState({
    form_id: '',
    employee_id: '',
    process_name: '',
    comments: '',
    scores: {} as Record<number, number>
  });

  const [isLoggingNcr, setIsLoggingNcr] = useState(false);
  const [newNcr, setNewNcr] = useState({
    evaluation_id: '' as string | number,
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assigned_to: '',
  });

  const [isManagingCapa, setIsManagingCapa] = useState(false);
  const [selectedCapa, setSelectedCapa] = useState<CapaItem | null>(null);
  const [newCapa, setNewCapa] = useState({
    ncr_id: '' as string | number,
    title: '',
    department_id: '',
    root_cause: '',
    action_plan: '',
    assigned_to: '',
    status: 'open' as 'open' | 'in_progress' | 'verified' | 'closed'
  });

  // QA Integration & Google Sheets Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const displayNcrs = advancedFilteredNcrs !== null ? advancedFilteredNcrs : ncrs;
  const displayCapas = advancedFilteredCapas !== null ? advancedFilteredCapas : capas;
  const displayAuditLogs = advancedFilteredAuditLogs !== null ? advancedFilteredAuditLogs : auditLogs;

  const loadedQaTabsRef = useRef<Set<string>>(new Set());

  const fetchQaTabData = useCallback(async (tab: string, force = false) => {
    if (!force && loadedQaTabsRef.current.has(tab)) {
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      };

      switch (tab) {
        case 'dashboard': {
          try {
            const formsRes = await fetch('/api/qa/forms', { headers });
            if (formsRes.ok) setForms(await formsRes.json());
          } catch {}
          try {
            const evalsRes = await fetch('/api/qa/evaluations', { headers });
            if (evalsRes.ok) setEvaluations(await evalsRes.json());
          } catch {}
          try {
            const ncrRes = await fetch('/api/qa/ncr', { headers });
            if (ncrRes.ok) setNcrs(await ncrRes.json());
          } catch {}
          try {
            const capaRes = await fetch('/api/qa/capa', { headers });
            if (capaRes.ok) setCapas(await capaRes.json());
          } catch {}
          break;
        }
        case 'transactions_audit': {
          try {
            const formsRes = await fetch('/api/qa/forms', { headers });
            if (formsRes.ok) setForms(await formsRes.json());
          } catch {}
          try {
            const evalsRes = await fetch('/api/qa/evaluations', { headers });
            if (evalsRes.ok) setEvaluations(await evalsRes.json());
          } catch {}
          if (departments.length === 0) {
            try {
              const deptRes = await fetch('/api/departments', { headers });
              if (deptRes.ok) {
                const rawDepts = await deptRes.json();
                setDepartments(rawDepts.map((d: any) => ({
                  id: d.id,
                  name: d.name || d.title || `Department #${d.id}`
                })));
              }
            } catch {}
          }
          break;
        }
        case 'internal_audit': {
          try {
            const formsRes = await fetch('/api/qa/forms', { headers });
            if (formsRes.ok) setForms(await formsRes.json());
          } catch {}
          try {
            const evalsRes = await fetch('/api/qa/evaluations', { headers });
            if (evalsRes.ok) setEvaluations(await evalsRes.json());
          } catch {}
          try {
            const ncrRes = await fetch('/api/qa/ncr', { headers });
            if (ncrRes.ok) setNcrs(await ncrRes.json());
          } catch {}
          try {
            const capaRes = await fetch('/api/qa/capa', { headers });
            if (capaRes.ok) setCapas(await capaRes.json());
          } catch {}
          break;
        }
        case 'history': {
          const logsRes = await fetch('/api/qa/audit-logs', { headers });
          if (logsRes.ok) setAuditLogs(await logsRes.json());
          break;
        }
        default:
          break;
      }

      loadedQaTabsRef.current.add(tab);
    } catch (err) {
      console.error("Critical: Failed to sync Quality Assurance dependencies: ", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    await fetchQaTabData(activeTab, true);
  }, [activeTab, fetchQaTabData]);

  useEffect(() => {
    fetchQaTabData(activeTab);
  }, [activeTab, fetchQaTabData]);

  const handleImportSopSteps = async (sopId: number) => {
    if (!sopId) return;
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch(`/api/sops/${sopId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      });
      if (res.ok) {
        const sopData = await res.json();
        if (sopData.steps && Array.isArray(sopData.steps) && sopData.steps.length > 0) {
          const importedItems = sopData.steps.map((step: any, idx: number) => ({
            id: Date.now() + idx,
            text: `Step ${step.step_number || (idx + 1)}: Acknowledge compliance to: ${step.step_description || step.title}`,
            max_score: 10
          }));
          setNewForm(prev => ({
            ...prev,
            title: prev.title || `SOP Verification: ${sopData.title}`,
            department_id: prev.department_id || (sopData.department_id ? String(sopData.department_id) : ''),
            items: importedItems
          }));
        } else {
          alert('This SOP has no registered steps to export.');
        }
      }
    } catch (err) {
      console.error("Failed to import SOP steps", err);
    }
  };

  // Calculations for Real-Time QA Metrics
  const globalQualityScore = evaluations.length > 0 
    ? Math.round(evaluations.reduce((sum, e) => sum + e.total_score, 0) / evaluations.length)
    : 85; 

  const openNcrCount = ncrs.filter(n => n.status !== 'resolved' && n.status !== 'closed').length;
  const criticalNcrCount = ncrs.filter(n => n.severity === 'critical' && n.status !== 'closed').length;
  const activeCapaCount = capas.filter(c => c.status === 'open' || c.status === 'in_progress').length;

  const defectTrendData = (() => {
    const weeks: Record<string, { week: string; count: number; total: number }> = {};
    evaluations.slice().reverse().forEach(e => {
      const date = new Date(e.created_at);
      const weekLabel = `W-${Math.ceil(date.getDate() / 7)}`;
      if (!weeks[weekLabel]) {
        weeks[weekLabel] = { week: weekLabel, count: 0, total: 0 };
      }
      weeks[weekLabel].count += 1;
      weeks[weekLabel].total += e.total_score;
    });
    const mapped = Object.values(weeks);
    if (mapped.length === 0) {
      return [
        { week: 'Week 1', score: 88, errors: 2 },
        { week: 'Week 2', score: 92, errors: 1 },
        { week: 'Week 3', score: 84, errors: 4 },
        { week: 'Week 4', score: 90, errors: 2 }
      ];
    }
    return mapped.map(w => ({
      week: w.week,
      score: Math.round(w.total / w.count),
      errors: ncrs.filter(n => {
        const date = new Date(n.created_at);
        const wl = `W-${Math.ceil(date.getDate() / 7)}`;
        return wl === w.week;
      }).length
    }));
  })();

  const retrainingPriorityData = (() => {
    const counts: Record<string, { name: string; score: number; count: number; defects: number }> = {};
    departments.forEach(d => {
      counts[d.id] = { name: d.name, score: 0, count: 0, defects: 0 };
    });

    evaluations.forEach(e => {
      if (counts[e.department_id]) {
        counts[e.department_id].score += e.total_score;
        counts[e.department_id].count += 1;
      }
    });

    ncrs.forEach(n => {
      if (n.department_id && counts[n.department_id]) {
        counts[n.department_id].defects += 1;
      }
    });

    return Object.values(counts)
      .map(dept => ({
        name: dept.name,
        avg_score: dept.count > 0 ? Math.round(dept.score / dept.count) : 100,
        defects: dept.defects
      }))
      .sort((a, b) => b.defects - a.defects);
  })();

  const pendingAuditsList = [
    { id: 101, process: 'CRM Customer Onboarding Verification', department: 'Sales CRM', due: '2 days overdue', severity: 'high' },
    { id: 102, process: 'Financial Journal Entries Auditing', department: 'Accounting', due: 'Due today', severity: 'medium' },
    { id: 103, process: 'Customer Verification Checklist', department: 'Customer Support', due: 'Due tomorrow', severity: 'low' },
    { id: 104, process: 'Backend Infrastructure Security Audit', department: 'IT Operations', due: '3 days overdue', severity: 'high' }
  ];

  // Action Handlers
  const handleSaveForm = async () => {
    if (!newForm.title || !newForm.department_id) {
      alert("Please enter a name for the form and assign a department.");
      return;
    }
    try {
      const res = await fetch('/api/qa/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newForm.title,
          department_id: Number(newForm.department_id),
          items: newForm.items
        })
      });
      if (res.ok) {
        setIsCreatingForm(false);
        setNewForm({
          title: '',
          department_id: '',
          items: [{ id: Date.now(), text: '', max_score: 10 }]
        });
        setSelectedSopForForm('');
        fetchData();
        alert('Checklist template successfully created and archived!');
      } else {
        alert('Could not save quality checklist template.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!showDeleteConfirm) return;
    const { id, type } = showDeleteConfirm;
    try {
      if (type === 'form') {
        const res = await fetch(`/api/qa/forms/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchData();
        }
      } else if (type === 'evaluation') {
        const res = await fetch(`/api/qa/evaluations/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchData();
        }
      } else if (type === 'ncr') {
        const res = await fetch(`/api/qa/ncr/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchData();
        }
      } else if (type === 'capa') {
        const res = await fetch(`/api/qa/capa/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchData();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const getDeleteModalInfo = () => {
    if (!showDeleteConfirm) return { title: '', message: '' };
    switch (showDeleteConfirm.type) {
      case 'form':
        return {
          title: 'Delete Checklist Template',
          message: 'Are you sure you want to delete this checklist template? This action cannot be undone and will remove all associated checkpoint configurations.'
        };
      case 'evaluation':
        return {
          title: 'Delete Quality Audit Appraisal',
          message: 'Are you sure you want to delete this quality audit appraisal? This will permanently delete the appraisal record and dynamically recalculate defect and compliance rate KPIs.'
        };
      case 'ncr':
        return {
          title: 'Delete NCR Incident Ticket',
          message: 'Are you sure you want to delete and close this NCR ticket permanently? This action will permanently remove the incident record from the ledger.'
        };
      case 'capa':
        return {
          title: 'Delete CAPA Action Plan',
          message: 'Are you sure you want to remove this CAPA roadmap document? This action cannot be undone and will permanently delete the preventive and root-cause analysis roadmap.'
        };
      default:
        return { title: '', message: '' };
    }
  };

  const handleStartEditEvaluation = (evalItem: QAEvaluation) => {
    setEditingEvaluation(evalItem);
    setAuditForm({
      form_id: String(evalItem.form_id),
      employee_id: String(evalItem.employee_id),
      process_name: evalItem.process_name,
      comments: evalItem.comments || '',
      scores: evalItem.scores || {}
    });
    setIsPerformingAudit(true);
  };

  const handleCreateEvaluation = async () => {
    const { form_id, employee_id, process_name, comments, scores } = auditForm;
    if (!form_id || !employee_id || !process_name) {
      alert("Please confirm the checklist template, the audited employee, and the process name.");
      return;
    }

    const form = forms.find(f => f.id === Number(form_id));
    if (!form) return;

    const maxPossible = form.items.reduce((sum, item) => sum + item.max_score, 0);
    const scoreSum = form.items.reduce((sum, item) => sum + (scores[item.id] !== undefined ? scores[item.id] : item.max_score), 0);
    const percentScore = Math.round((scoreSum / maxPossible) * 100);

    try {
      const url = editingEvaluation ? `/api/qa/evaluations/${editingEvaluation.id}` : '/api/qa/evaluations';
      const method = editingEvaluation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: Number(form_id),
          reviewer_id: editingEvaluation ? editingEvaluation.reviewer_id : 1, 
          employee_id: Number(employee_id),
          process_name,
          department_id: form.department_id,
          scores,
          total_score: percentScore,
          comments
        })
      });

      if (res.ok) {
        setIsPerformingAudit(false);
        setEditingEvaluation(null);
        setAuditForm({
          form_id: '',
          employee_id: '',
          process_name: '',
          comments: '',
          scores: {}
        });
        fetchData();
        setActiveTab('dashboard');
        
        if (percentScore < 75) {
          alert(`Audit saved with quality rate of ${percentScore}%. Because this falls under the compliance threshold (75%), the employee has been automatically enrolled in supporting coaching in the Training Hub!`);
        } else {
          alert(`Compliance audit successfully recorded and saved. Quality Rate score: ${percentScore}%`);
        }
      } else {
        alert('Failed to save compliance audit scorecard.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNcr = async () => {
    const { evaluation_id, description, severity, assigned_to } = newNcr;
    if (!description || !assigned_to) {
      alert("Please describe the issue and assign a resolver employee.");
      return;
    }
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id') || '1';

    try {
      const res = await fetch('/api/qa/ncr', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify({
          evaluation_id: evaluation_id ? Number(evaluation_id) : null,
          description,
          severity,
          reported_by: Number(userId),
          assigned_to: Number(assigned_to)
        })
      });

      if (res.ok) {
        setIsLoggingNcr(false);
        setNewNcr({
          evaluation_id: '',
          description: '',
          severity: 'medium',
          assigned_to: ''
        });
        fetchData();
        alert('Non-Conformance Report (NCR) successfully logged. Assignees were alerted for RACI operational compliance!');
      } else {
        alert('Failed to create NCR ticket.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateNcrStatus = async (id: number, statusValue: string) => {
    try {
      const res = await fetch(`/api/qa/ncr/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusValue })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to update NCR status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCapa = async () => {
    const { ncr_id, title, department_id, root_cause, action_plan, assigned_to } = newCapa;
    if (!title || !department_id || !root_cause || !action_plan || !assigned_to) {
      alert("Please complete the title, root cause analysis, prevention plan, and designated owner.");
      return;
    }

    try {
      const method = selectedCapa ? 'PUT' : 'POST';
      const url = selectedCapa ? `/api/qa/capa/${selectedCapa.id}` : '/api/qa/capa';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ncr_id: ncr_id ? Number(ncr_id) : null,
          title,
          department_id: Number(department_id),
          root_cause,
          action_plan,
          assigned_to: Number(assigned_to),
          status: newCapa.status
        })
      });

      if (res.ok) {
        setIsManagingCapa(false);
        setSelectedCapa(null);
        setNewCapa({
          ncr_id: '',
          title: '',
          department_id: '',
          root_cause: '',
          action_plan: '',
          assigned_to: '',
          status: 'open'
        });
        fetchData();
        alert('CAPA (Corrective & Preventive Action) analysis and roadmap successfully saved!');
      } else {
        alert('Failed to save the CAPA action plan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCapaStatus = async (id: number, statusValue: string) => {
    const cap = capas.find(c => c.id === id);
    if (!cap) return;
    try {
      const res = await fetch(`/api/qa/capa/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusValue,
          title: cap.title,
          department_id: cap.department_id,
          root_cause: cap.root_cause,
          action_plan: cap.action_plan,
          assigned_to: cap.assigned_to
        })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Could not update CAPA status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Quality Dashboard', icon: BarChart3 },
    { id: 'transactions_audit', label: 'Transactions Audit', icon: ShieldCheck },
    { id: 'internal_audit', label: 'Internal Audit', icon: ClipboardCheck },
    { id: 'history', label: 'Audit History', icon: History },
  ];

  const internalAuditSubTabs = [
    { id: 'builder', label: 'Checklist Templates', icon: ClipboardCheck },
    { id: 'audit', label: 'Perform Audits', icon: CheckSquare },
    { id: 'ncr', label: 'NCR Incident Log', icon: AlertTriangle },
    { id: 'capa', label: 'CAPA Action Plans', icon: Wrench },
  ];

  const handleMainTabClick = (tabId: string) => {
    const routeMap: Record<string, string> = {
      dashboard: '/qa/dashboard',
      transactions_audit: '/qa/transactions-audit',
      internal_audit: '/qa/internal-audit',
      history: '/qa/audit-history'
    };
    if (routeMap[tabId]) {
      navigate(routeMap[tabId]);
    } else {
      setActiveTab(tabId as any);
    }
  };

  const handleInternalSubTabClick = (subId: string) => {
    const routeMap: Record<string, string> = {
      builder: '/qa/internal-audit/templates',
      audit: '/qa/internal-audit/perform',
      ncr: '/qa/internal-audit/ncr-logs',
      capa: '/qa/internal-audit/capa'
    };
    if (routeMap[subId]) {
      navigate(routeMap[subId]);
    } else {
      setInternalAuditSubTab(subId as any);
    }
  };

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-slate-800 ${hideTopBanner ? 'pt-0 px-0' : ''}`} id="qa-root-container" style={{ direction: 'ltr' }}>
      
      {/* Upper Module Banner with Integrated Main Tabs on the Right */}
      {!hideTopBanner && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden" id="qa-module-banner">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          {/* Left Side: Title & Description */}
          <div className="z-10 max-w-xl">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest bg-indigo-950/60 w-fit px-3 py-1.5 rounded-full border border-indigo-900/50">
              <Sparkles className="w-3.5 h-3.5" />
              Compliance & Complete Operational Control
            </div>
            <h1 className="text-2xl lg:text-3xl font-black mt-2 tracking-tight text-white">Quality Assurance & Compliance Management</h1>
            <p className="text-slate-300 mt-2 text-xs lg:text-sm font-medium leading-relaxed">
              Build audit matrices derived from SOPs, resolve process deviations using RACI models, track Non-Conformance Reports (NCR) in real-time, and auto-deploy corrective CAPA pathways.
            </p>
          </div>

          {/* Right Side: Settings Button & Integrated Main Tabs */}
          <div className="flex flex-col items-start lg:items-end gap-3.5 z-10 shrink-0">
            <button 
              type="button"
              onClick={() => navigate('/qa/settings')} 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer group"
              id="qa-settings-btn"
              title="Configure QA Data Integration & Google Sheets Setup"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-300 group-hover:rotate-90 transition-transform duration-300" />
              <span>Settings</span>
            </button>

            {/* Main Navigation Tabs */}
            {!hideMainTabs && (
              <div className="flex bg-slate-950/60 backdrop-blur-md p-1.5 rounded-2xl gap-1 border border-white/10 shadow-inner overflow-x-auto max-w-full scrollbar-none" id="qa-navigation-tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`tab-btn-${tab.id}`}
                      onClick={() => handleMainTabClick(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30 font-black' 
                          : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Container Render View */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm" id="qa-loader">
          <Activity className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Syncing live compliance ledger...</h3>
          <p className="text-slate-400 mt-1 sm:text-xs">Synchronizing SOP maps, checklists, RACI matrices, and active CAPA plans.</p>
        </div>
      ) : (
        <div id="qa-tab-viewer">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn" id="qa-dashboard-tab">
              
              {/* Dashboard Sub-Tabs Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm" id="qa-dashboard-subtabs-bar">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    id="qa-subtab-btn-overview"
                    onClick={() => setDashboardSubTab('overview')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      dashboardSubTab === 'overview'
                        ? 'bg-white text-indigo-700 shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Overview</span>
                  </button>

                  <button
                    id="qa-subtab-btn-employee-quality"
                    onClick={() => setDashboardSubTab('employee_quality')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      dashboardSubTab === 'employee_quality'
                        ? 'bg-white text-indigo-700 shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Employee Quality Tracking</span>
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 pr-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Live Quality Analytics System</span>
                </div>
              </div>

              {/* View Rendering */}
              {dashboardSubTab === 'overview' ? (
                <QualityOverviewDashboard />
              ) : (
                <EmployeeQualityTracker />
              )}

            </div>
          )}

          {/* TAB: TRANSACTIONS AUDIT */}
          {activeTab === 'transactions_audit' && (
            <div className="space-y-6 animate-fadeIn" id="qa-transactions-audit-tab">
              <TransactionsAudit />
            </div>
          )}

          {/* TAB: INTERNAL AUDIT */}
          {activeTab === 'internal_audit' && (
            <div className="space-y-6 animate-fadeIn" id="qa-internal-audit-tab">
              {/* Internal Audit Sub-Tabs */}
              {!hideInternalTabs && (
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full sm:w-fit overflow-x-auto border border-slate-200/80 shadow-inner" id="internal-audit-sub-tabs">
                  {internalAuditSubTabs.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      id={`internal-subtab-${sub.id}`}
                      onClick={() => handleInternalSubTabClick(sub.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                        internalAuditSubTab === sub.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <sub.icon className="w-4 h-4" />
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* SUB-TAB 1: CHECKLIST TEMPLATES */}
              {internalAuditSubTab === 'builder' && (
                <div className="space-y-6" id="qa-builder-tab">
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Quality Checklist Templates</h2>
                  <p className="text-xs text-slate-500 mt-1">Configure compliance score sheets anchored to departments, processes, and active standard operating procedures (SOPs)</p>
                </div>
                {!isCreatingForm && (
                  <button
                    onClick={() => setIsCreatingForm(true)}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                    id="create-new-form-btn"
                  >
                    <Plus className="w-4 h-4" />
                    New Quality Checklist
                  </button>
                )}
              </div>

              {isCreatingForm ? (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6"
                  id="form-builder-view"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Create Inspection Template</h3>
                    <button 
                      onClick={() => setIsCreatingForm(false)} 
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Cancel and Return
                    </button>
                  </div>

                  {/* SOP selection to autoimport */}
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-indigo-950">Dynamic SOP Step Importer</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Select a Standard Operating Procedure (SOP) to load its structured operational steps as scoreable audit questions instantly:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select 
                        value={selectedSopForForm} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedSopForForm(val === '' ? '' : Number(val));
                        }}
                        className="bg-white rounded-lg border-slate-200 text-xs px-3 py-2 flex-1 focus:ring-1 focus:ring-indigo-500 border"
                      >
                        <option value="">-- Choose SOP to import from --</option>
                        {sops.map(s => (
                          <option key={s.id} value={s.id}>{s.title} (v{s.version_number || '1.0'})</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={() => {
                          if (selectedSopForForm) {
                            handleImportSopSteps(Number(selectedSopForForm));
                          } else {
                            alert('Please choose an SOP first');
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all"
                      >
                        Import Steps
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Checklist Title *</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Sales Customer Journey Check" 
                        value={newForm.title} 
                        onChange={(e) => setNewForm({...newForm, title: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                        id="form-title-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Responsible Division / Department *</label>
                      <select 
                        value={newForm.department_id} 
                        onChange={(e) => setNewForm({...newForm, department_id: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                        id="form-dept-select"
                      >
                        <option value="">Select Division</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Checkpoints (Criteria Points)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewForm({
                            ...newForm,
                            items: [...newForm.items, { id: Date.now(), text: '', max_score: 10 }]
                          });
                        }}
                        className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:text-indigo-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Checklist Item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {newForm.items.map((item, index) => (
                        <div key={item.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                          <span className="text-xs font-bold text-slate-400 bg-white shadow-xs px-2.5 py-1 rounded inline-block self-start sm:self-auto">
                            Point {index + 1}
                          </span>
                          <input 
                            type="text" 
                            placeholder="e.g., Did the employee transparently outline contract parameters?"
                            value={item.text}
                            onChange={(e) => {
                              const updated = newForm.items.map(i => i.id === item.id ? { ...i, text: e.target.value } : i);
                              setNewForm({ ...newForm, items: updated });
                            }}
                            className="flex-1 bg-transparent border-none text-xs font-medium focus:ring-0 text-slate-700"
                          />
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">Max Score</span>
                            <input 
                              type="number" 
                              value={item.max_score}
                              onChange={(e) => {
                                const updated = newForm.items.map(i => i.id === item.id ? { ...i, max_score: Number(e.target.value) } : i);
                                setNewForm({ ...newForm, items: updated });
                              }}
                              className="w-16 bg-white border border-slate-250 text-xs font-bold text-indigo-600 rounded-lg px-2 py-1 text-center border-slate-200"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => {
                              setNewForm({
                                ...newForm,
                                items: newForm.items.filter(i => i.id !== item.id)
                              });
                            }}
                            className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button 
                      onClick={() => setIsCreatingForm(false)} 
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveForm}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/10"
                      id="save-checklist-form-btn"
                    >
                      Archive & Save Checklist Template
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="checklists-grid">
                  {forms.map(form => (
                    <div key={form.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-indigo-650 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/40">
                            {departments.find(d => d.id === form.department_id)?.name || 'General Operations'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(form.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-4">{form.title}</h3>
                        <p className="text-slate-500 text-xs mt-1.5 font-medium leading-relaxed">
                          Tracks <strong>{form.items?.length || 0} checkpoints</strong> designed to audit active standard process parameters.
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                        <button 
                          onClick={() => {
                            setAuditForm({
                              form_id: form.id.toString(),
                              employee_id: employees[0]?.id?.toString() || '',
                              process_name: form.title,
                              comments: '',
                              scores: {}
                            });
                            setIsPerformingAudit(true);
                            setActiveTab('internal_audit');
                            setInternalAuditSubTab('audit');
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-850 flex items-center gap-1"
                        >
                          Launch Compliance Audit
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm({ id: form.id, type: 'form' })}
                          className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {forms.length === 0 && (
                    <div className="bg-slate-50 rounded-2xl p-8 text-center col-span-full border border-dashed text-slate-400">
                      No quality checklist templates registered yet. Click "New Quality Checklist" to begin.
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

              {/* SUB-TAB 2: PERFORM AUDITS */}
              {internalAuditSubTab === 'audit' && (
                <div className="space-y-6" id="qa-audit-tab">
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Conduct Live Quality Appraisals</h2>
                  <p className="text-xs text-slate-500 mt-1">Audit employee behaviors, score compliance with standard checklists, and record performance</p>
                </div>
                {!isPerformingAudit && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuditForm({
                          form_id: forms[0]?.id?.toString() || '',
                          employee_id: employees[0]?.id?.toString() || '',
                          process_name: 'Regular Process Verification',
                          comments: '',
                          scores: {}
                        });
                        setIsPerformingAudit(true);
                      }}
                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      id="quick-start-instant-audit-btn"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Start Instant Audit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (forms.length === 0) {
                          alert('Please create at least one Quality Checklist Template first before performing direct employee appraisals.');
                          return;
                        }
                        setAuditForm({
                          form_id: forms[0]?.id?.toString() || '',
                          employee_id: employees[0]?.id?.toString() || '',
                          process_name: '',
                          comments: '',
                          scores: {}
                        });
                        setIsPerformingAudit(true);
                      }}
                      className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                      id="new-manual-audit-btn"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Inspection Audit</span>
                    </button>
                  </div>
                )}
              </div>

              {isPerformingAudit ? (
                <motion.div 
                   initial={{ opacity: 0, y: 15 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6"
                   id="audit-assessment-view"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">
                      {editingEvaluation ? 'Edit Quality Appraisal Scorecard' : 'Complete Scorecard Assessment'}
                    </h3>
                    <button onClick={() => { setIsPerformingAudit(false); setEditingEvaluation(null); }} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
                      Back
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Checklist Template *</label>
                      <select 
                        value={auditForm.form_id}
                        onChange={(e) => {
                          setAuditForm({ ...auditForm, form_id: e.target.value, scores: {} });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                        id="audit-form-select"
                      >
                        <option value="">-- Choose Template --</option>
                        {forms.map(f => (
                          <option key={f.id} value={f.id}>{f.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Audited Team Employee *</label>
                      <select 
                        value={auditForm.employee_id}
                        onChange={(e) => setAuditForm({ ...auditForm, employee_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                        id="audit-employee-select"
                      >
                        <option value="">-- Choose Employee --</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>{e.name} ({e.job_title || 'Employee'})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Operational Process Name *</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Q3 CRM Process Validation"
                        value={auditForm.process_name}
                        onChange={(e) => setAuditForm({ ...auditForm, process_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                        id="audit-process-input"
                      />
                    </div>
                  </div>

                  {auditForm.form_id && forms.find(f => f.id === Number(auditForm.form_id)) && (
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Inspection Checklist Scoring Parameters</h4>
                      
                      <div className="space-y-3">
                        {forms.find(f => f.id === Number(auditForm.form_id))?.items.map((item, idx) => (
                          <div key={item.id} className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <span className="text-[10px] text-slate-400 font-bold block">Point #{idx+1}</span>
                              <span className="text-xs font-bold text-slate-700 mt-1 block">{item.text}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500">Inspected Score:</span>
                              <input 
                                type="range" 
                                min="0" 
                                max={item.max_score} 
                                value={auditForm.scores[item.id] ?? item.max_score}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setAuditForm({
                                    ...auditForm,
                                    scores: {
                                      ...auditForm.scores,
                                      [item.id]: val
                                    }
                                  });
                                }}
                                className="w-32 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                              />
                              <span className="w-16 text-center text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                                {auditForm.scores[item.id] ?? item.max_score} / {item.max_score}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Audit Comments & Observational Feedback</label>
                    <textarea 
                      placeholder="Comment on execution speed, compliance gaps, clear training gaps or overall positive feedback..."
                      value={auditForm.comments}
                      onChange={(e) => setAuditForm({ ...auditForm, comments: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                      rows={3}
                      id="audit-comments"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button onClick={() => { setIsPerformingAudit(false); setEditingEvaluation(null); }} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateEvaluation}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/15"
                      id="submit-evaluation-btn"
                    >
                      {editingEvaluation ? 'Save Appraisal Updates' : 'Record Audit Scorecard'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="audits-history">
                  <div className="p-6 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase">Audit Appraisals Ledger</h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input 
                          type="text" 
                          placeholder="Search employee or process..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
                        />
                      </div>
                      <QAAdvancedFilter
                        items={evaluations}
                        onFilter={(filtered) => setAdvancedFilteredEvals(filtered as QAEvaluation[] | null)}
                        title="Filter Audit Appraisals"
                        buttonLabel="Filter Records"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Employee / Auditor</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Checklist Template / Process</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Aggregate Quality Rating</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Observations & Insights</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Date Logged</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(advancedFilteredEvals !== null ? advancedFilteredEvals : evaluations)
                          .filter(e => (e.employee_name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || (e.process_name || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
                          .map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                    {e.employee_name?.charAt(0) || 'E'}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900">{e.employee_name}</h4>
                                    <span className="text-[10px] text-slate-400 font-medium">Audited by: {e.reviewer_name || 'System Auto'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-bold text-slate-700">{e.form_title}</span>
                                <span className="block text-[10px] text-slate-400">{e.process_name}</span>
                              </td>
                              <td className="px-6 py-4 col-score">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black inline-block ${
                                  e.total_score >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  e.total_score >= 75 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100 font-extrabold animate-pulse'
                                }`}>
                                  {e.total_score}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500 font-medium max-w-xs truncate">
                                {e.comments || 'No description recorded'}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400 font-bold">
                                {new Date(e.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-xs font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleStartEditEvaluation(e)}
                                    className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit Appraisal"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm({ id: e.id, type: 'evaluation' })}
                                    className="p-1 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete Appraisal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {evaluations.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                              Quality appraisals index is currently empty.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

              {/* SUB-TAB 3: NCR INCIDENT LOG */}
              {internalAuditSubTab === 'ncr' && (
                <div className="space-y-6 animate-fadeIn" id="qa-ncr-tab">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Non-Conformance Reports (NCR)</h2>
                  <p className="text-xs text-slate-500 mt-1">Record process errors, track severity categories, and dispatch RACI correction parameters</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* List vs Kanban Toggles */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border text-slate-600">
                    <button 
                      onClick={() => setNcrViewMode('list')} 
                      className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-bold transition-all ${ncrViewMode === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'hover:bg-slate-50'}`}
                      title="List View Layout"
                    >
                      <List className="w-3.5 h-3.5" />
                      List
                    </button>
                    <button 
                      onClick={() => setNcrViewMode('kanban')} 
                      className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-bold transition-all ${ncrViewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-sm' : 'hover:bg-slate-50'}`}
                      title="Kanban Board Layout"
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      Kanban
                    </button>
                  </div>

                  <QAAdvancedFilter
                    items={ncrs}
                    onFilter={(filtered) => setAdvancedFilteredNcrs(filtered as NcLog[] | null)}
                    title="Filter Non-Conformance Reports (NCR)"
                    buttonLabel="Filter Records"
                  />

                  {!isLoggingNcr && (
                    <button
                      onClick={() => setIsLoggingNcr(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                      id="log-ncr-btn"
                    >
                      <Plus className="w-4 h-4" />
                      Issue NCR Ticket
                    </button>
                  )}
                </div>
              </div>

              {isLoggingNcr ? (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6"
                  id="log-ncr-view"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Create Non-Conformance Report</h3>
                    <button onClick={() => setIsLoggingNcr(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Linked Quality Audit Appraisal (Optional)</label>
                      <select
                        value={newNcr.evaluation_id}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewNcr({...newNcr, evaluation_id: val});
                          
                          // Pre-populate description of the matching issue
                          const evalObj = evaluations.find(ev => ev.id === Number(val));
                          if (evalObj) {
                            setNewNcr((prev) => ({
                              ...prev,
                              evaluation_id: val,
                              description: `Quality non-conformance originated from audit: "${evalObj.process_name}". Comments: ${evalObj.comments}`
                            }));
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                        id="ncr-eval-select"
                      >
                        <option value="">-- No linked audit assessment --</option>
                        {evaluations.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.process_name} - {ev.employee_name} ({ev.total_score}%)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">RACI Designated Resolver *</label>
                      <select 
                        value={newNcr.assigned_to}
                        onChange={(e) => setNewNcr({...newNcr, assigned_to: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                        id="ncr-assignee-select"
                      >
                        <option value="">Select Employee</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>{e.name} ({e.job_title || 'Employee'})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Severity Level *</label>
                      <select 
                        value={newNcr.severity}
                        onChange={(e) => setNewNcr({...newNcr, severity: e.target.value as any})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                        id="ncr-severity-select"
                      >
                        <option value="low">Low Severity Deviation</option>
                        <option value="medium">Medium Process Issue</option>
                        <option value="high">High Operational Obstacle</option>
                        <option value="critical">Critical (Immediate auto-generated Task dispatch)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Deviation Description & Financial/Marketing Impact *</label>
                    <textarea 
                      placeholder="Clearly define the SOP compliance shortfall, missed steps, or unexpected system process failures..."
                      value={newNcr.description}
                      onChange={(e) => setNewNcr({...newNcr, description: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                      rows={4}
                      id="ncr-description-input"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button onClick={() => setIsLoggingNcr(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl font-medium">
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateNcr}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/15"
                      id="submit-ncr-btn"
                    >
                      Log NCR Exception
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div>
                  {/* Render based on selected View Mode (List vs. Kanban) */}
                  {ncrViewMode === 'list' ? (
                    /* NCR LIST VIEW */
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fadeIn" id="ncr-list-layout">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b">
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">NCR Code</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Description</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Severity</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Responsible Owner</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Division</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Status</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Date</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {displayNcrs.map((ncr) => (
                              <tr key={ncr.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-indigo-700">
                                  #NCR-{ncr.id}
                                </td>
                                <td className="px-6 py-4 font-semibold max-w-sm leading-relaxed text-slate-800">
                                  {ncr.description}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${
                                    ncr.severity === 'critical' ? 'bg-rose-500 text-white animate-pulse' :
                                    ncr.severity === 'high' ? 'bg-orange-500 text-white' :
                                    ncr.severity === 'medium' ? 'bg-amber-100 text-amber-800' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {ncr.severity}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-medium">
                                  {ncr.assigned_to_name || 'General Operations'}
                                </td>
                                <td className="px-6 py-4 text-slate-400 font-semibold">
                                  {ncr.department_name || 'General'}
                                </td>
                                <td className="px-6 py-4">
                                  <select 
                                    value={ncr.status || 'open'} 
                                    onChange={(e) => handleUpdateNcrStatus(ncr.id, e.target.value)}
                                    className="bg-slate-50 border border-slate-250 rounded text-xs px-2 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 border-slate-200"
                                  >
                                    <option value="open">Open</option>
                                    <option value="investigating">Investigating</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed Status</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 text-slate-400 font-bold">
                                  {new Date(ncr.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => setShowDeleteConfirm({ id: ncr.id, type: 'ncr' })}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition"
                                    title="Close permanently"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {displayNcrs.length === 0 && (
                              <tr>
                                <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                  No registered deviations recorded in NCR Log.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* NCR KANBAN BOARD VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn" id="ncr-kanban-board">
                      
                      {/* Column 1: Open */}
                      <div className="bg-slate-105 bg-slate-50/75 p-4 rounded-2xl border border-slate-200/50 flex flex-col space-y-3 min-h-[450px]">
                        <div className="flex items-center justify-between border-b pb-2 px-1">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            Open Tickets
                          </span>
                          <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full font-bold text-slate-600">
                            {displayNcrs.filter(n => (!n.status || n.status === 'open')).length}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
                          {displayNcrs.filter(n => (!n.status || n.status === 'open')).map(ncr => (
                            <div key={ncr.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3 hover:shadow transition">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono font-black text-indigo-700">#NCR-{ncr.id}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-wider ${
                                  ncr.severity === 'critical' ? 'bg-rose-500 text-white animate-pulse' :
                                  ncr.severity === 'high' ? 'bg-orange-500 text-white' :
                                  'bg-slate-105 text-slate-600 bg-slate-105'
                                }`}>
                                  {ncr.severity}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-800 line-clamp-3 leading-relaxed">
                                {ncr.description}
                              </p>
                              <div className="text-[10px] text-slate-400 font-medium border-t pt-2 flex justify-between items-center">
                                <span>Owner: {ncr.assigned_to_name || 'Unassigned'}</span>
                                <span className="text-[9px]">{new Date(ncr.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-end gap-1.5 pt-2 border-t border-dashed">
                                <button 
                                  onClick={() => handleUpdateNcrStatus(ncr.id, 'investigating')}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 text-[10px] font-bold rounded"
                                >
                                  Investigate
                                </button>
                                <button 
                                  onClick={() => setShowDeleteConfirm({ id: ncr.id, type: 'ncr' })}
                                  className="p-1 hover:bg-rose-50 text-rose-650 text-rose-600 rounded"
                                  title="Delete NCR"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {ncrs.filter(n => (!n.status || n.status === 'open')).length === 0 && (
                            <p className="text-center text-[11px] text-slate-400 py-6">No open tickets queued.</p>
                          )}
                        </div>
                      </div>

                      {/* Column 2: Investigating */}
                      <div className="bg-slate-105 bg-slate-50/75 p-4 rounded-2xl border border-slate-200/50 flex flex-col space-y-3 min-h-[450px]">
                        <div className="flex items-center justify-between border-b pb-2 px-1">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            Investigating
                          </span>
                          <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full font-bold text-slate-600">
                            {displayNcrs.filter(n => n.status === 'investigating').length}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
                          {displayNcrs.filter(n => n.status === 'investigating').map(ncr => (
                            <div key={ncr.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3 hover:shadow transition">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono font-black text-indigo-700">#NCR-{ncr.id}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-wider ${
                                  ncr.severity === 'critical' ? 'bg-rose-500 text-white animate-pulse' :
                                  'bg-slate-105 text-slate-600 bg-slate-105'
                                }`}>
                                  {ncr.severity}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-800 line-clamp-3 leading-relaxed">
                                {ncr.description}
                              </p>
                              <div className="text-[10px] text-slate-400 font-medium border-t pt-2 flex justify-between items-center">
                                <span>Owner: {ncr.assigned_to_name || 'Unassigned'}</span>
                                <span className="text-[9px]">{new Date(ncr.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-end gap-1.5 pt-2 border-t border-dashed">
                                <button 
                                  onClick={() => handleUpdateNcrStatus(ncr.id, 'resolved')}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded"
                                >
                                  Mark Resolved
                                </button>
                                <button 
                                  onClick={() => handleUpdateNcrStatus(ncr.id, 'open')}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-650 text-[10px] font-medium rounded"
                                >
                                  Reopen
                                </button>
                              </div>
                            </div>
                          ))}
                          {displayNcrs.filter(n => n.status === 'investigating').length === 0 && (
                            <p className="text-center text-[11px] text-slate-400 py-6">No investigations active.</p>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Resolved */}
                      <div className="bg-slate-105 bg-slate-50/75 p-4 rounded-2xl border border-slate-200/50 flex flex-col space-y-3 min-h-[450px]">
                        <div className="flex items-center justify-between border-b pb-2 px-1">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Resolved
                          </span>
                          <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full font-bold text-slate-600">
                            {displayNcrs.filter(n => n.status === 'resolved').length}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
                          {displayNcrs.filter(n => n.status === 'resolved').map(ncr => (
                            <div key={ncr.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3 hover:shadow transition">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono font-black text-indigo-700">#NCR-{ncr.id}</span>
                                <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1 rounded font-bold uppercase">Resolved</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-800 line-clamp-3 leading-relaxed">
                                {ncr.description}
                              </p>
                              <div className="text-[10px] text-slate-400 font-medium border-t pt-2 flex justify-between items-center font-mono">
                                <span>Owner: {ncr.assigned_to_name}</span>
                              </div>
                              <div className="flex justify-end gap-1.5 pt-2 border-t border-dashed">
                                <button 
                                  onClick={() => handleUpdateNcrStatus(ncr.id, 'closed')}
                                  className="px-2 py-1 bg-slate-900 hover:bg-black text-white text-[10px] font-bold rounded"
                                >
                                  Close Ticket
                                </button>
                                <button 
                                  onClick={() => handleUpdateNcrStatus(ncr.id, 'investigating')}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-205 text-slate-600 text-[10px] font-medium rounded"
                                >
                                  Re-investigate
                                </button>
                              </div>
                            </div>
                          ))}
                          {displayNcrs.filter(n => n.status === 'resolved').length === 0 && (
                            <p className="text-center text-[11px] text-slate-400 py-6">No resolved audits waiting signoff.</p>
                          )}
                        </div>
                      </div>

                      {/* Column 4: Closed */}
                      <div className="bg-slate-105 bg-slate-50/75 p-4 rounded-2xl border border-slate-200/50 flex flex-col space-y-3 min-h-[450px]">
                        <div className="flex items-center justify-between border-b pb-2 px-1">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                            Closed Log
                          </span>
                          <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full font-bold text-slate-600">
                            {displayNcrs.filter(n => n.status === 'closed').length}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
                          {displayNcrs.filter(n => n.status === 'closed').map(ncr => (
                            <div key={ncr.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3 hover:shadow transition opacity-80">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono font-black text-slate-450">#NCR-{ncr.id}</span>
                                <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded font-bold uppercase">Archived</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-500 line-clamp-3 leading-relaxed">
                                {ncr.description}
                              </p>
                              <div className="text-[10px] text-slate-400 font-medium border-t pt-2 flex justify-between items-center">
                                <span>Owner: {ncr.assigned_to_name}</span>
                              </div>
                              <div className="flex gap-1 pt-2 border-t">
                                <button 
                                  onClick={() => handleUpdateNcrStatus(ncr.id, 'open')}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded flex-1 text-center"
                                >
                                  Reopen NCR
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm({ id: ncr.id, type: 'ncr' })}
                                  className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {ncrs.filter(n => n.status === 'closed').length === 0 && (
                            <p className="text-center text-[11px] text-slate-400 py-6">No archived NCR entries.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

            </div>
          )}

              {/* SUB-TAB 4: CAPA ACTION PLANS */}
              {internalAuditSubTab === 'capa' && (
                <div className="space-y-6 animate-fadeIn" id="qa-capa-tab">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Corrective & Preventive Actions (CAPA)</h2>
                  <p className="text-xs text-slate-500 mt-1">Deep Root-Cause Analysis (5 Whys) of recurring defects to implement robust prevention plans</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* List vs Kanban Toggles */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border text-slate-600">
                    <button 
                      onClick={() => setCapaViewMode('list')} 
                      className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-bold transition-all ${capaViewMode === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'hover:bg-slate-50'}`}
                      title="List View Layout"
                    >
                      <List className="w-3.5 h-3.5" />
                      List
                    </button>
                    <button 
                      onClick={() => setCapaViewMode('kanban')} 
                      className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-bold transition-all ${capaViewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-sm' : 'hover:bg-slate-50'}`}
                      title="Kanban Board Layout"
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      Kanban
                    </button>
                  </div>

                  <QAAdvancedFilter
                    items={capas}
                    onFilter={(filtered) => setAdvancedFilteredCapas(filtered as CapaItem[] | null)}
                    title="Filter CAPA Action Plans"
                    buttonLabel="Filter Records"
                  />

                  {!isManagingCapa && (
                    <button
                      onClick={() => {
                        setSelectedCapa(null);
                        setNewCapa({
                          ncr_id: '',
                          title: '',
                          department_id: '',
                          root_cause: '',
                          action_plan: '',
                          assigned_to: '',
                          status: 'open'
                        });
                        setIsManagingCapa(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                      id="new-capa-btn"
                    >
                      <Plus className="w-4 h-4" />
                      New CAPA Roadmap
                    </button>
                  )}
                </div>
              </div>

              {isManagingCapa ? (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6"
                  id="capa-editor-view"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedCapa ? 'Update CAPA Document' : 'Initialize CAPA Root-Cause Study'}
                    </h3>
                    <button onClick={() => setIsManagingCapa(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
                      Back
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Linked NCR Deviation Incident (Optional)</label>
                      <select 
                        value={newCapa.ncr_id}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCapa({...newCapa, ncr_id: val});
                          const matchedNcr = ncrs.find(n => n.id === Number(val));
                          if (matchedNcr) {
                            setNewCapa(prev => ({
                              ...prev,
                              ncr_id: val,
                              title: `CAPA Root-Cause Plan: #${matchedNcr.id}`,
                              department_id: String(matchedNcr.department_id || 1),
                              root_cause: `Investigating recurring incidents relating to: "${matchedNcr.description}"`
                            }));
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                        id="capa-ncr-select"
                      >
                        <option value="">-- No linked single NCR incident --</option>
                        {ncrs.map(n => (
                          <option key={n.id} value={n.id}>NCR {n.id}: {n.description.substring(0, 50)}...</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">CAPA Roadmap Title *</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Sales Compliance Standard Calibration"
                        value={newCapa.title}
                        onChange={(e) => setNewCapa({...newCapa, title: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        id="capa-title-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Audited Corporate Division *</label>
                      <select 
                        value={newCapa.department_id}
                        onChange={(e) => setNewCapa({...newCapa, department_id: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        id="capa-dept-select"
                      >
                        <option value="">-- Choose Division --</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Prevention Action Owner *</label>
                      <select 
                        value={newCapa.assigned_to}
                        onChange={(e) => setNewCapa({...newCapa, assigned_to: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        id="capa-assignee-select"
                      >
                        <option value="">-- Choose Owner --</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>{e.name} ({e.job_title || 'Employee'})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Active Implementation Status</label>
                      <select 
                        value={newCapa.status}
                        onChange={(e) => setNewCapa({...newCapa, status: e.target.value as any})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        id="capa-status-select"
                      >
                        <option value="open">Open (Analyzing Context)</option>
                        <option value="in_progress">In Progress (Executing Correction)</option>
                        <option value="verified">Verified (Quality Assured)</option>
                        <option value="closed">Closed (Integrated successfully)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Root Cause Analysis (5 Whys Paradigm Framework) *</label>
                    <textarea 
                      placeholder="Why did the defect occur? Trace the chain of failures from surface symptoms back to the initial procedural loophole..."
                      value={newCapa.root_cause}
                      onChange={(e) => setNewCapa({...newCapa, root_cause: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-medium focus:ring-1 focus:ring-indigo-500 text-slate-700 border-slate-200"
                      rows={3}
                      id="capa-root-cause-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Preventive Action Plan Roadmap *</label>
                    <textarea 
                      placeholder="Formulate concrete procedural integrations: e.g., dual-approver checks, SOP revision, automated linter safeguards, team retraining..."
                      value={newCapa.action_plan}
                      onChange={(e) => setNewCapa({...newCapa, action_plan: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-medium focus:ring-1 focus:ring-indigo-500 text-slate-700 border-slate-200"
                      rows={3}
                      id="capa-action-plan-input"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button onClick={() => setIsManagingCapa(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateCapa}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/15"
                      id="save-capa-btn"
                    >
                      Authorize CAPA Plan
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div>
                  {/* Render based on selected View Mode (List vs. Kanban) */}
                  {capaViewMode === 'list' ? (
                    /* CAPA LIST VIEW */
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fadeIn" id="capa-list-layout">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b">
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">CAPA Code</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Plan Title</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Root Cause Analysis (RCA)</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Action Plan Roadmap</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Owner Assignee</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Status</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {displayCapas.map((cap) => (
                              <tr key={cap.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-indigo-750">
                                  CAPA-{cap.id}
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900">
                                  {cap.title}
                                </td>
                                <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={cap.root_cause}>
                                  {cap.root_cause}
                                </td>
                                <td className="px-6 py-4 text-indigo-950 font-semibold max-w-xs truncate" title={cap.action_plan}>
                                  {cap.action_plan}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-700">
                                  {cap.assignee_name || 'System Support'}
                                </td>
                                <td className="px-6 py-4">
                                  <select 
                                    value={cap.status || 'open'} 
                                    onChange={(e) => handleUpdateCapaStatus(cap.id, e.target.value)}
                                    className="bg-slate-50 border border-slate-250 rounded text-xs px-2 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 border-slate-205"
                                  >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="verified">Verified</option>
                                    <option value="closed">Closed</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 flex gap-2 justify-end">
                                  <button
                                    onClick={() => {
                                      setSelectedCapa(cap);
                                      setNewCapa({
                                        ncr_id: cap.ncr_id || '',
                                        title: cap.title,
                                        department_id: cap.department_id ? cap.department_id.toString() : '',
                                        root_cause: cap.root_cause || '',
                                        action_plan: cap.action_plan || '',
                                        assigned_to: cap.assigned_to ? cap.assigned_to.toString() : '',
                                        status: cap.status
                                      });
                                      setIsManagingCapa(true);
                                    }}
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition"
                                    title="Edit CAPA Analysis"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm({ id: cap.id, type: 'capa' })}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition"
                                    title="Archive CAPA"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {displayCapas.length === 0 && (
                              <tr>
                                <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                                  No preventive action plans queued under CAPA index.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* CAPA KANBAN BOARD VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn" id="capa-kanban-board">
                      
                      {/* Column 1: Open */}
                      <div className="bg-slate-105 bg-slate-50/75 p-4 rounded-2xl border border-slate-200/50 flex flex-col space-y-3 min-h-[450px]">
                        <div className="flex items-center justify-between border-b pb-2 px-1">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                            Open (RCA Active)
                          </span>
                          <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full font-bold text-slate-600 font-mono">
                            {displayCapas.filter(c => c.status === 'open').length}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
                          {displayCapas.filter(c => c.status === 'open').map(cap => (
                            <div key={cap.id} className="bg-white p-4 rounded-xl border border-slate-150 border-slate-100 shadow-xs space-y-3 hover:shadow transition">
                              <span className="text-[9px] font-mono text-indigo-750 block font-bold">CAPA-{cap.id}</span>
                              <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2">{cap.title}</h4>
                              
                              <div className="p-2.5 bg-slate-50 rounded-lg space-y-1 text-[11px] text-slate-500">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono">Root Cause:</span>
                                <p className="line-clamp-2">{cap.root_cause}</p>
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-slate-400 py-1 font-medium">
                                <span>Owner: {cap.assignee_name || 'QA team'}</span>
                              </div>
                              <div className="flex justify-end gap-1.5 border-t pt-2 border-dashed">
                                <button
                                  onClick={() => handleUpdateCapaStatus(cap.id, 'in_progress')}
                                  className="px-2 py-1 bg-indigo-55 bg-indigo-100 hover:bg-indigo-150 text-indigo-700 text-[9px] font-bold rounded"
                                >
                                  Deploy Action Plan
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCapa(cap);
                                    setNewCapa({
                                      ncr_id: cap.ncr_id || '',
                                      title: cap.title,
                                      department_id: cap.department_id ? cap.department_id.toString() : '',
                                      root_cause: cap.root_cause || '',
                                      action_plan: cap.action_plan || '',
                                      assigned_to: cap.assigned_to ? cap.assigned_to.toString() : '',
                                      status: cap.status
                                    });
                                    setIsManagingCapa(true);
                                  }}
                                  className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {displayCapas.filter(c => c.status === 'open').length === 0 && (
                            <p className="text-center text-[11px] text-slate-400 py-6">No opened action roadmaps.</p>
                          )}
                        </div>
                      </div>

                      {/* Column 2: In Progress */}
                      <div className="bg-slate-105 bg-slate-50/75 p-4 rounded-2xl border border-slate-200/50 flex flex-col space-y-3 min-h-[450px]">
                        <div className="flex items-center justify-between border-b pb-2 px-1">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                            In Progress
                          </span>
                          <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full font-bold text-slate-600">
                            {displayCapas.filter(c => c.status === 'in_progress').length}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
                          {displayCapas.filter(c => c.status === 'in_progress').map(cap => (
                            <div key={cap.id} className="bg-white p-4 rounded-xl border border-slate-150 border-slate-100 shadow-xs space-y-3 hover:shadow transition">
                              <span className="text-[9px] font-mono text-indigo-750 block font-bold">CAPA-{cap.id}</span>
                              <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2">{cap.title}</h4>
                              
                              <div className="p-2.5 bg-indigo-50/40 rounded-lg space-y-1 text-[11px] text-slate-650 border border-indigo-100/30">
                                <span className="text-[9px] font-bold text-indigo-400 block uppercase font-mono">Action Roadmap Plan:</span>
                                <p className="line-clamp-2 italic font-medium">{cap.action_plan}</p>
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-slate-400 py-1 font-medium">
                                <span>Owner: {cap.assignee_name}</span>
                              </div>
                              <div className="flex justify-end gap-1.5 border-t pt-2 border-dashed">
                                <button
                                  onClick={() => handleUpdateCapaStatus(cap.id, 'verified')}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded"
                                >
                                  Verify Efficacy
                                </button>
                                <button
                                  onClick={() => handleUpdateCapaStatus(cap.id, 'open')}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-medium rounded"
                                >
                                  Rollback to Open
                                </button>
                              </div>
                            </div>
                          ))}
                          {displayCapas.filter(c => c.status === 'in_progress').length === 0 && (
                            <p className="text-center text-[11px] text-slate-400 py-6">No preventative roadmaps active.</p>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Verified */}
                      <div className="bg-slate-105 bg-slate-50/75 p-4 rounded-2xl border border-slate-200/50 flex flex-col space-y-3 min-h-[450px]">
                        <div className="flex items-center justify-between border-b pb-2 px-1">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                            Verified Corrective
                          </span>
                          <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full font-bold text-slate-600">
                            {displayCapas.filter(c => c.status === 'verified').length}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
                          {displayCapas.filter(c => c.status === 'verified').map(cap => (
                            <div key={cap.id} className="bg-white p-4 rounded-xl border border-slate-150 border-slate-100 shadow-xs space-y-3 hover:shadow transition">
                              <span className="text-[9px] font-mono text-emerald-700 block font-bold">CAPA-{cap.id} - Verified ✓</span>
                              <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2">{cap.title}</h4>
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-semibold">{cap.root_cause}</p>
                              <div className="flex justify-end gap-1.5 border-t pt-2 border-dashed">
                                <button
                                  onClick={() => handleUpdateCapaStatus(cap.id, 'closed')}
                                  className="px-2 py-1 bg-slate-900 hover:bg-black text-white text-[9px] font-bold rounded"
                                >
                                  Archive Closed
                                </button>
                                <button
                                  onClick={() => handleUpdateCapaStatus(cap.id, 'in_progress')}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-205 text-slate-650 text-[9px] font-medium rounded"
                                >
                                  More Work
                                </button>
                              </div>
                            </div>
                          ))}
                          {displayCapas.filter(c => c.status === 'verified').length === 0 && (
                            <p className="text-center text-[11px] text-slate-400 py-6">No verified compliance results pending.</p>
                          )}
                        </div>
                      </div>

                      {/* Column 4: Closed */}
                      <div className="bg-slate-105 bg-slate-50/75 p-4 rounded-2xl border border-slate-200/50 flex flex-col space-y-3 min-h-[450px]">
                        <div className="flex items-center justify-between border-b pb-2 px-1">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                            Closed Ledger
                          </span>
                          <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full font-bold text-slate-600">
                            {displayCapas.filter(c => c.status === 'closed').length}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
                          {displayCapas.filter(c => c.status === 'closed').map(cap => (
                            <div key={cap.id} className="bg-white p-4 rounded-xl border border-slate-150 border-slate-100 shadow-xs space-y-3 hover:shadow transition opacity-80">
                              <span className="text-[9px] font-mono text-slate-400 block">CAPA-{cap.id} (Archived)</span>
                              <h4 className="text-xs font-extrabold text-slate-500 line-clamp-2">{cap.title}</h4>
                              <div className="flex justify-end gap-1.5 border-t pt-2">
                                <button
                                  onClick={() => handleUpdateCapaStatus(cap.id, 'open')}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded flex-1 text-center"
                                >
                                  Reopen CAPA
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm({ id: cap.id, type: 'capa' })}
                                  className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {displayCapas.filter(c => c.status === 'closed').length === 0 && (
                            <p className="text-center text-[11px] text-slate-400 py-6">No archived CAPA roadmaps.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fadeIn" id="qa-history-tab">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">QA Audit History</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Continuous ledger of all checklists, audits completed, non-conformance reports (NCR), and corrective actions (CAPA) status changes.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <QAAdvancedFilter
                    items={auditLogs}
                    onFilter={(filtered) => setAdvancedFilteredAuditLogs(filtered as any[] | null)}
                    title="Filter Audit History Logs"
                    buttonLabel="Filter Records"
                  />
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-100">
                    Total Logs: {displayAuditLogs.length}
                  </span>
                </div>
              </div>

              {/* History Search / Filter bar if desired, but simple is best */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Actor</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Action</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Entity</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Details</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayAuditLogs.map((log, index) => {
                        let parsedDetails = {};
                        try {
                          parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details || {};
                        } catch (e) {
                          parsedDetails = { raw: String(log.details) };
                        }

                        // Map Action names to badges
                        const getActionBadge = (action: string) => {
                          switch (action) {
                            case 'COMPLETE_EVALUATION':
                              return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">Complete Evaluation</span>;
                            case 'UPDATE_EVALUATION':
                              return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100 uppercase tracking-wider">Update Evaluation</span>;
                            case 'DELETE_EVALUATION':
                              return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-100 uppercase tracking-wider">Delete Evaluation</span>;
                            case 'CREATE_NCR':
                              return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100 uppercase tracking-wider">Create NCR</span>;
                            case 'UPDATE_NCR':
                              return <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-[10px] font-bold border border-orange-100 uppercase tracking-wider">Update NCR</span>;
                            case 'DELETE_NCR':
                              return <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-[10px] font-bold border border-red-100 uppercase tracking-wider">Delete NCR</span>;
                            case 'CREATE_CAPA':
                              return <span className="px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full text-[10px] font-bold border border-sky-100 uppercase tracking-wider">Create CAPA</span>;
                            case 'UPDATE_CAPA':
                              return <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full text-[10px] font-bold border border-violet-100 uppercase tracking-wider">Update CAPA</span>;
                            case 'DELETE_CAPA':
                              return <span className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded-full text-[10px] font-bold border border-pink-100 uppercase tracking-wider">Delete CAPA</span>;
                            case 'CREATE_FORM':
                              return <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold border border-teal-100 uppercase tracking-wider">Create Checklist</span>;
                            case 'DELETE_FORM':
                              return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold border border-slate-200 uppercase tracking-wider">Delete Checklist</span>;
                            default:
                              return <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-full text-[10px] font-medium border border-slate-150 uppercase tracking-wider">{action}</span>;
                          }
                        };

                        const formatDetails = (details: any) => {
                          if (!details || typeof details !== 'object') {
                            return <span className="text-slate-400 italic">—</span>;
                          }
                          return (
                            <div className="text-xs text-slate-600 font-medium space-y-1">
                              {details.title && (
                                <div><strong className="text-slate-700">Title:</strong> {details.title}</div>
                              )}
                              {details.process_name && (
                                <div><strong className="text-slate-700">Process:</strong> {details.process_name}</div>
                              )}
                              {details.process && (
                                <div><strong className="text-slate-700">Process:</strong> {details.process}</div>
                              )}
                              {details.score !== undefined && (
                                <div><strong className="text-slate-700">Score:</strong> {details.score}%</div>
                              )}
                              {details.severity && (
                                <div><strong className="text-slate-700">Severity:</strong> <span className="uppercase text-[10px] font-bold">{details.severity}</span></div>
                              )}
                              {details.status && (
                                <div><strong className="text-slate-700">Status:</strong> <span className="uppercase text-[10px] font-bold text-indigo-600">{details.status}</span></div>
                              )}
                              {details.description && (
                                <div className="text-slate-400 italic line-clamp-1">"{details.description}"</div>
                              )}
                              {details.id && (
                                <div className="text-[10px] text-slate-400 font-mono">ID: {details.id}</div>
                              )}
                              {Object.keys(details).length === 0 && (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </div>
                          );
                        };

                        const uniqueKey = log?.id != null 
                          ? `audit-log-${log.id}-${index}` 
                          : `audit-log-idx-${index}-${log?.created_at || ''}`;

                        return (
                          <tr key={uniqueKey} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 border flex items-center justify-center">
                                  <User className="w-3.5 h-3.5 text-slate-600" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">{log.user_name || `User #${log.user_id || 1}`}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getActionBadge(log.action)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {log.entity_type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {formatDetails(parsedDetails)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-semibold">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                      {displayAuditLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium">
                            No QA audit activities have been logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      <DeleteConfirmation 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title={getDeleteModalInfo().title}
        message={getDeleteModalInfo().message}
      />

      {/* QA Integration & Google Sheets Settings Modal */}
      <QAIntegrationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSuccess={() => fetchData()}
      />

    </div>
  );
};

export default QA;
