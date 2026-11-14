import React, { useState, useEffect, useMemo } from 'react';
import { 
  Workflow, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Save, 
  RefreshCw, 
  Plus, 
  ChevronRight, 
  UserCheck, 
  Coins, 
  HelpCircle,
  FileSpreadsheet,
  Edit,
  Trash2,
  Settings,
  Award,
  Grid,
  List,
  Search,
  Calendar,
  Activity,
  ShieldAlert,
  BarChart2,
  Sparkles,
  Zap,
  AlertTriangle,
  FileText,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../types';
import DeleteConfirmation from '../Common/DeleteConfirmation';

interface WorkOrderItem {
  id: string;
  name: string;
  sale_price: number;
  quantity: number;
  default_cost: number;
  actual_cost: number;
  category: string;
}

interface WorkOrder {
  id: number;
  deal_id: number | null;
  customer_name: string;
  title: string;
  status: string;
  execution_agent_id: number | null;
  delivery_agent_id: number | null;
  items: WorkOrderItem[];
  actual_cost_total: number;
  sale_value: number;
  created_at: string;
  updated_at: string;
  qa_status?: string | null;
  qa_feedback?: string | null;
}

interface CatalogProduct {
  id: number;
  name: string;
  cost: number;
  price: number;
}

interface CRMDeal {
  id: number;
  title: string;
  value: number;
  stage_name?: string;
  customer_name?: string;
}

interface OperationsHubModuleProps {
  users: User[];
  onDataChange?: () => void;
}

export function OperationsHubModule({ users, onDataChange }: OperationsHubModuleProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'assignment' | 'cost-override' | 'auto-assign' | 'performance' | 'qa-review'>('pipeline');
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [crmDeals, setCrmDeals] = useState<CRMDeal[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [selectedWOForCost, setSelectedWOForCost] = useState<WorkOrder | null>(null);
  const [editingItemCosts, setEditingItemCosts] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Operations Quality Assurance States
  const [qaTickets, setQaTickets] = useState<any[]>([]);
  const [reviewingWO, setReviewingWO] = useState<WorkOrder | null>(null);
  const [qaFeedback, setQaFeedback] = useState('');
  const [qaSeverity, setQaSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [assignedToUser, setAssignedToUser] = useState<number>(0);
  const [isQaModalOpen, setIsQaModalOpen] = useState(false);
  const [submittingQa, setSubmittingQa] = useState(false);

  // View & Filter States
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [execAgentFilter, setExecAgentFilter] = useState('all');
  const [deliveryAgentFilter, setDeliveryAgentFilter] = useState('all');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');

  const [baseCurrency, setBaseCurrency] = useState<string>(() => {
    return localStorage.getItem('acct_base_currency') || 'SAR';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setBaseCurrency(localStorage.getItem('acct_base_currency') || 'SAR');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Modals
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [stageForm, setStageForm] = useState({ id: null as number | null, name: '', color: '#3b82f6', order_index: 1, is_completed: false });

  // Delete Confirmation States
  const [deleteConfirmWoId, setDeleteConfirmWoId] = useState<number | null>(null);
  const [deleteConfirmStageId, setDeleteConfirmStageId] = useState<number | null>(null);
  const [deleteConfirmRuleId, setDeleteConfirmRuleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<'pipeline' | 'assignment' | 'cost' | 'auto-assign' | 'performance' | 'qa'>('pipeline');
  const [autoAssignStrategy, setAutoAssignStrategy] = useState<'round-robin' | 'workload-balance'>('round-robin');
  const [workOrderForm, setWorkOrderForm] = useState({
    id: null as number | null,
    title: '',
    customer_name: '',
    status: '',
    execution_agent_id: null as number | null,
    delivery_agent_id: null as number | null,
    sale_value: 0,
    actual_cost_total: 0,
    items: [] as WorkOrderItem[],
    expected_start_date: '',
    due_date: '',
    supervisor_id: null as number | null,
    assignment_date: null as string | null,
    completion_date: null as string | null,
    qa_status: 'Pending Review',
    qa_feedback: ''
  });

  // Auto Assign State
  const [autoAssignRules, setAutoAssignRules] = useState<any[]>(() => {
    const saved = localStorage.getItem('operations_auto_assign_rules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'ops-rule-1',
        targetRole: 'executor',
        userIds: [],
        triggerType: 'always',
        stageName: 'any',
        serviceFilter: 'any',
        maxCapacity: 8,
        isActive: true
      },
      {
        id: 'ops-rule-2',
        targetRole: 'delivery',
        userIds: [],
        triggerType: 'always',
        stageName: 'any',
        serviceFilter: 'any',
        maxCapacity: 8,
        isActive: true
      }
    ];
  });

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    id: null as string | null,
    targetRole: 'executor' as 'executor' | 'delivery',
    userIds: [] as number[],
    triggerType: 'always' as 'always' | 'on_stage',
    stageName: 'any',
    serviceFilter: 'any',
    maxCapacity: 8,
    isActive: true
  });

  const [assignmentLogs, setAssignmentLogs] = useState<string[]>([]);

  // Fetch all backend data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operations/work-orders');
      if (res.ok) {
        const data = await res.json();
        setWorkOrders(data.workOrders || []);
        setCatalogProducts(data.products || []);
        setQaTickets(data.qaTickets || []);
      }

      // Also grab deals from crm to allow manual triggering if needed
      const crmRes = await fetch('/api/crm/deals');
      if (crmRes.ok) {
        const dealsData = await crmRes.json();
        setCrmDeals(dealsData || []);
      }
    } catch (err) {
      console.error('Failed to fetch operations hub data:', err);
      showToast('⚠️ Failed to sync with real-time operations server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const res = await fetch('/api/operations/stages');
      if (res.ok) {
        const data = await res.json();
        setStages(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch stages:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchStages();
  }, []);

  useEffect(() => {
    localStorage.setItem('operations_auto_assign_rules', JSON.stringify(autoAssignRules));
  }, [autoAssignRules]);

  useEffect(() => {
    if (isWorkOrderModalOpen) {
      setModalActiveTab('pipeline');
    }
  }, [isWorkOrderModalOpen]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const defaultStages = [
    { name: 'Pending', color: '#f59e0b', id: 1, is_completed: false },
    { name: 'Executing', color: '#3b82f6', id: 2, is_completed: false },
    { name: 'Ready for Delivery', color: '#8b5cf6', id: 3, is_completed: false },
    { name: 'Delivered Successfully', color: '#10b981', id: 4, is_completed: true }
  ];

  const displayStages = stages.length > 0 ? stages : defaultStages;

  // Trigger manual creation
  const handleTriggerWorkOrder = async (dealId: number) => {
    try {
      const res = await fetch('/api/operations/work-orders/trigger-won-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId })
      });
      if (res.ok) {
        showToast('🚀 Work Order created successfully and synchronized with direct operational expenses!', 'success');
        fetchData();
        if (onDataChange) onDataChange();
      } else {
        const err = await res.json();
        showToast(`❌ Error: ${err.error || 'Failed to trigger'}`, 'error');
      }
    } catch (err) {
      showToast('❌ Server request failed', 'error');
    }
  };

  // Update Work Order status or assignment
  const handleUpdateWorkOrder = async (
    woId: number, 
    payload: { 
      status?: string; 
      execution_agent_id?: number | null; 
      delivery_agent_id?: number | null;
      items?: WorkOrderItem[];
      actual_cost_total?: number;
      title?: string;
      customer_name?: string;
      sale_value?: number;
    }
  ) => {
    try {
      const res = await fetch(`/api/operations/work-orders/${woId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': '1' // System Admin fallback
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkOrders(prev => prev.map(wo => wo.id === woId ? updated : wo));
        if (selectedWOForCost && selectedWOForCost.id === woId) {
          setSelectedWOForCost(updated);
        }
        showToast('✅ Work Order updated successfully!', 'success');
        if (onDataChange) onDataChange();
      } else {
        showToast('❌ Failed to update work order', 'error');
      }
    } catch (err) {
      showToast('❌ Server communication error', 'error');
    }
  };

  // Save Item Cost Override
  const handleSaveCostOverride = (wo: WorkOrder) => {
    const updatedItems = wo.items.map(item => {
      const overrideVal = editingItemCosts[item.id];
      if (overrideVal !== undefined) {
        return { ...item, actual_cost: parseFloat(overrideVal) || 0 };
      }
      return item;
    });

    const newTotal = updatedItems.reduce((sum, item) => sum + (item.actual_cost * item.quantity), 0);

    handleUpdateWorkOrder(wo.id, {
      items: updatedItems,
      actual_cost_total: newTotal
    });
  };

  const handleCostInputChange = (itemId: string, value: string) => {
    setEditingItemCosts(prev => ({ ...prev, [itemId]: value }));
  };

  // Auto-Assign trigger logic
  const handleTriggerAutoAssign = () => {
    if (autoAssignStrategy === 'round-robin') {
      const activeStaff = users.filter(u => u.job_title?.toLowerCase().includes('coordinator') || u.job_title?.toLowerCase().includes('engineer') || u.job_title?.toLowerCase().includes('technician') || true);
      if (activeStaff.length > 0) {
        const nextIndex = workOrders.length % activeStaff.length;
        const selectedUser = activeStaff[nextIndex];
        setWorkOrderForm(prev => ({ ...prev, execution_agent_id: selectedUser.id }));
        showToast(`Smart Round-Robin allocated Execution Employee: ${selectedUser.name}!`, 'success');
      }
    } else {
      // Workload Balance: count how many active orders each user has
      const activeStaff = users.filter(u => u.job_title?.toLowerCase().includes('coordinator') || u.job_title?.toLowerCase().includes('engineer') || u.job_title?.toLowerCase().includes('technician') || true);
      const userWorkloads: Record<number, number> = {};
      activeStaff.forEach(u => {
        userWorkloads[u.id] = 0;
      });
      workOrders.forEach(wo => {
        if (wo.status !== 'Delivered Successfully' && wo.execution_agent_id) {
          if (userWorkloads[wo.execution_agent_id] !== undefined) {
            userWorkloads[wo.execution_agent_id]++;
          }
        }
      });
      // Find staff with minimum workload
      let minUser = activeStaff[0];
      let minCount = Infinity;
      activeStaff.forEach(u => {
        if (userWorkloads[u.id] < minCount) {
          minCount = userWorkloads[u.id];
          minUser = u;
        }
      });
      if (minUser) {
        setWorkOrderForm(prev => ({ ...prev, execution_agent_id: minUser.id }));
        showToast(`Workload Balance allocated to ${minUser.name} (${minCount} open tasks)!`, 'success');
      }
    }
  };

  // Save Work Order Form (Create/Edit)
  const handleSaveWorkOrderForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!workOrderForm.id;
      const url = isEdit ? `/api/operations/work-orders/${workOrderForm.id}` : '/api/operations/work-orders';
      const method = isEdit ? 'PUT' : 'POST';
      const payload = {
        title: workOrderForm.title,
        customer_name: workOrderForm.customer_name,
        status: workOrderForm.status || displayStages[0]?.name || 'Pending',
        execution_agent_id: workOrderForm.execution_agent_id,
        delivery_agent_id: workOrderForm.delivery_agent_id,
        sale_value: Number(workOrderForm.sale_value),
        actual_cost_total: Number(workOrderForm.actual_cost_total),
        items: workOrderForm.items,
        expected_start_date: workOrderForm.expected_start_date,
        due_date: workOrderForm.due_date,
        supervisor_id: workOrderForm.supervisor_id,
        assignment_date: workOrderForm.assignment_date,
        completion_date: workOrderForm.completion_date,
        qa_status: workOrderForm.qa_status,
        qa_feedback: workOrderForm.qa_feedback
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(isEdit ? 'Work order updated successfully!' : 'Work order created successfully!', 'success');
        fetchData();
        setIsWorkOrderModalOpen(false);
        if (onDataChange) onDataChange();
      } else {
        showToast('Failed to save work order', 'error');
      }
    } catch (err) {
      showToast('Error communicating with server', 'error');
    }
  };

  // Delete Work Order
  const handleDeleteWorkOrder = async (woId: number) => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || '1';
      const res = await fetch(`/api/operations/work-orders/${woId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-user-id': userId
        }
      });
      if (res.ok) {
        showToast('Work order deleted successfully!', 'success');
        fetchData();
        if (onDataChange) onDataChange();
      } else {
        showToast('Failed to delete work order', 'error');
      }
    } catch (err) {
      showToast('Error communicating with server', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmWoId(null);
    }
  };

  // Save Stage Form (Create/Edit)
  const handleSaveStageForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!stageForm.id;
      const url = isEdit ? `/api/operations/stages/${stageForm.id}` : '/api/operations/stages';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageForm)
      });

      if (res.ok) {
        showToast(isEdit ? 'Stage updated successfully!' : 'Stage created successfully!', 'success');
        fetchStages();
        setIsStageModalOpen(false);
        setStageForm({ id: null, name: '', color: '#3b82f6', order_index: stages.length + 1, is_completed: false });
      } else {
        showToast('Failed to save stage', 'error');
      }
    } catch (err) {
      showToast('Error communicating with server', 'error');
    }
  };

  // Delete Stage
  const handleDeleteStage = async (stageId: number) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/operations/stages/${stageId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Stage deleted successfully!', 'success');
        fetchStages();
        fetchData();
      } else {
        showToast('Failed to delete stage', 'error');
      }
    } catch (err) {
      showToast('Error communicating with server', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmStageId(null);
    }
  };

  // --- AUTO ASSIGN CORE ENGINE FOR OPERATIONS ---
  const triggerAutoAssignForWO = (wo: WorkOrder) => {
    const activeRules = autoAssignRules.filter(r => r.isActive);
    if (activeRules.length === 0) return { execAgentId: wo.execution_agent_id, deliveryAgentId: wo.delivery_agent_id, logs: [] };

    let execAgentId: number | null = wo.execution_agent_id;
    let deliveryAgentId: number | null = wo.delivery_agent_id;
    const logs: string[] = [];

    // Evaluate Executor rules
    const executorRules = activeRules.filter(r => r.targetRole === 'executor');
    if (!execAgentId && executorRules.length > 0) {
      const candidates: { user: User; currentWorkload: number }[] = [];
      executorRules.forEach(rule => {
        const stageMatch = rule.stageName === 'any' || wo.status === rule.stageName;
        if (!stageMatch) return;

        let serviceMatch = rule.serviceFilter === 'any';
        if (!serviceMatch) {
          const title = (wo.title || '').toLowerCase();
          serviceMatch = title.includes(rule.serviceFilter.toLowerCase());
        }
        if (!serviceMatch) return;

        const uIds = rule.userIds || [];
        uIds.forEach((uId: number) => {
          const targetUser = users.find(u => u.id === uId);
          if (targetUser) {
            const workload = workOrders.filter(w => w.execution_agent_id === uId && w.status !== 'Delivered Successfully').length;
            if (workload < (rule.maxCapacity || 999)) {
              candidates.push({ user: targetUser, currentWorkload: workload });
            }
          }
        });
      });

      if (candidates.length > 0) {
        const selected = candidates.reduce((prev, curr) => prev.currentWorkload <= curr.currentWorkload ? prev : curr);
        execAgentId = selected.user.id;
        logs.push(`[Executor] Automatically assigned ${selected.user.name} to "${wo.title}" (WO #${wo.id}) based on rule.`);
      }
    }

    // Evaluate Delivery rules
    const deliveryRules = activeRules.filter(r => r.targetRole === 'delivery');
    if (!deliveryAgentId && deliveryRules.length > 0) {
      const candidates: { user: User; currentWorkload: number }[] = [];
      deliveryRules.forEach(rule => {
        const stageMatch = rule.stageName === 'any' || wo.status === rule.stageName;
        if (!stageMatch) return;

        let serviceMatch = rule.serviceFilter === 'any';
        if (!serviceMatch) {
          const title = (wo.title || '').toLowerCase();
          serviceMatch = title.includes(rule.serviceFilter.toLowerCase());
        }
        if (!serviceMatch) return;

        const uIds = rule.userIds || [];
        uIds.forEach((uId: number) => {
          const targetUser = users.find(u => u.id === uId);
          if (targetUser) {
            const workload = workOrders.filter(w => w.delivery_agent_id === uId && w.status !== 'Delivered Successfully').length;
            if (workload < (rule.maxCapacity || 999)) {
              candidates.push({ user: targetUser, currentWorkload: workload });
            }
          }
        });
      });

      if (candidates.length > 0) {
        const selected = candidates.reduce((prev, curr) => prev.currentWorkload <= curr.currentWorkload ? prev : curr);
        deliveryAgentId = selected.user.id;
        logs.push(`[Delivery] Automatically assigned ${selected.user.name} to "${wo.title}" (WO #${wo.id}) based on rule.`);
      }
    }

    return { execAgentId, deliveryAgentId, logs };
  };

  const runBulkAutoAssign = async () => {
    let count = 0;
    const allLogs: string[] = [];
    
    for (const wo of workOrders) {
      if (!wo.execution_agent_id || !wo.delivery_agent_id) {
        const { execAgentId, deliveryAgentId, logs } = triggerAutoAssignForWO(wo);
        if (execAgentId !== wo.execution_agent_id || deliveryAgentId !== wo.delivery_agent_id) {
          await handleUpdateWorkOrder(wo.id, {
            execution_agent_id: execAgentId,
            delivery_agent_id: deliveryAgentId
          });
          count++;
          allLogs.push(...logs);
        }
      }
    }

    setAssignmentLogs(prev => [...allLogs, ...prev]);
    if (count > 0) {
      showToast(`Successfully auto-assigned ${count} work orders!`, 'success');
      fetchData();
    } else {
      showToast('All eligible orders are already assigned or no matching rules found.', 'success');
    }
  };

  const handleSaveRuleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (ruleForm.id) {
      setAutoAssignRules(prev => prev.map(r => r.id === ruleForm.id ? { ...ruleForm } : r));
      showToast('Auto Assign rule updated successfully!', 'success');
    } else {
      const newRule = {
        ...ruleForm,
        id: `ops-rule-${Math.random().toString(36).substr(2, 9)}`
      };
      setAutoAssignRules(prev => [...prev, newRule]);
      showToast('New Auto Assign rule created!', 'success');
    }
    setIsRuleModalOpen(false);
    setRuleForm({ id: null, targetRole: 'executor', userIds: [], triggerType: 'always', stageName: 'any', serviceFilter: 'any', maxCapacity: 8, isActive: true });
  };

  const handleDeleteRule = (ruleId: string) => {
    setAutoAssignRules(prev => prev.filter(r => r.id !== ruleId));
    showToast('Rule deleted successfully', 'success');
    setDeleteConfirmRuleId(null);
  };

  // --- OPERATIONS QUALITY ASSURANCE EVENT HANDLERS ---
  const handleQaApprove = async (woId: number) => {
    try {
      const res = await fetch(`/api/operations/work-orders/${woId}/qa-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', feedback: 'Approved by Quality Officer.' })
      });
      if (res.ok) {
        showToast('✅ Work Order approved successfully!', 'success');
        fetchData();
        if (onDataChange) onDataChange();
      } else {
        showToast('❌ Failed to approve work order', 'error');
      }
    } catch (err) {
      showToast('❌ Server error during approval', 'error');
    }
  };

  const handleQaRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingWO) return;
    setSubmittingQa(true);
    try {
      const res = await fetch(`/api/operations/work-orders/${reviewingWO.id}/qa-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          feedback: qaFeedback,
          ticket_title: ticketTitle || `خلل في جودة: ${reviewingWO.title}`,
          ticket_description: ticketDescription || qaFeedback,
          severity: qaSeverity,
          assigned_to: assignedToUser || reviewingWO.execution_agent_id || 1,
          reported_by: 1
        })
      });
      if (res.ok) {
        showToast('⚠️ Rejection registered. High-priority correction ticket created.', 'success');
        setIsQaModalOpen(false);
        setReviewingWO(null);
        setQaFeedback('');
        setTicketTitle('');
        setTicketDescription('');
        fetchData();
        if (onDataChange) onDataChange();
      } else {
        showToast('❌ Failed to submit rejection', 'error');
      }
    } catch (err) {
      showToast('❌ Server error during rejection submission', 'error');
    } finally {
      setSubmittingQa(false);
    }
  };

  const handleResolveTicket = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/operations/qa-tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' })
      });
      if (res.ok) {
        showToast('✅ QA Ticket marked as RESOLVED and task closed.', 'success');
        fetchData();
        if (onDataChange) onDataChange();
      } else {
        showToast('❌ Failed to resolve ticket', 'error');
      }
    } catch (err) {
      showToast('❌ Server error resolving ticket', 'error');
    }
  };

  // --- OPERATIONS QUALITY ASSURANCE MEMOS & HELPERS ---
  const pendingReviewWOs = useMemo(() => {
    return workOrders.filter(wo => {
      const isCompletedStage = stages.some(s => s.name === wo.status && s.is_completed);
      return isCompletedStage && (wo.qa_status === 'Pending Review' || !wo.qa_status);
    });
  }, [workOrders, stages]);

  const getUserName = (id: number | null) => {
    if (!id) return 'Unassigned';
    return users.find(u => u.id === id)?.name || `User #${id}`;
  };

  // --- OPERATIONS PERFORMANCE ANALYTICS LEDGER ---
  const operationsPerformance = useMemo(() => {
    return users.map(user => {
      // Find all work orders where user is Executor
      const execWOs = workOrders.filter(wo => wo.execution_agent_id === user.id);
      const completedExec = execWOs.filter(wo => {
        const st = (wo.status || '').toLowerCase();
        return st.includes('completed') || st.includes('deliver') || st.includes('نجاح');
      });

      // Find all work orders where user is Delivery
      const delivWOs = workOrders.filter(wo => wo.delivery_agent_id === user.id);
      const completedDeliv = delivWOs.filter(wo => {
        const st = (wo.status || '').toLowerCase();
        return st.includes('completed') || st.includes('deliver') || st.includes('نجاح');
      });

      const totalAssigned = execWOs.length + delivWOs.length;
      const totalCompleted = completedExec.length + completedDeliv.length;

      // Cost efficiency: calculate average actual cost vs average default cost for executor's orders
      let totalDefaultCost = 0;
      let totalActualCost = 0;
      execWOs.forEach(wo => {
        const costTotal = wo.actual_cost_total || 0;
        totalActualCost += costTotal;
        
        // default cost sum from items
        let defCostSum = 0;
        if (Array.isArray(wo.items)) {
          wo.items.forEach(item => {
            defCostSum += ((item.default_cost || 0) * (item.quantity || 1));
          });
        }
        totalDefaultCost += defCostSum || costTotal;
      });

      const costSavings = totalDefaultCost > 0 ? ((totalDefaultCost - totalActualCost) / totalDefaultCost) * 100 : 0;
      const onTimeRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 100;

      // Performance Score: combines completion rate and cost savings (with safety caps)
      let score = 75; // baseline
      if (totalAssigned > 0) {
        const completionWeight = (totalCompleted / totalAssigned) * 60; // up to 60 points
        const costWeight = 20 + Math.min(Math.max(costSavings * 0.5, -20), 20); // baseline 20, +/- 10 based on savings
        score = Math.min(Math.max(Math.round(completionWeight + costWeight + 20), 0), 100);
      }

      return {
        ...user,
        totalAssigned,
        totalCompleted,
        execCount: execWOs.length,
        delivCount: delivWOs.length,
        costSavings,
        onTimeRate,
        score
      };
    }).filter(p => p.totalAssigned > 0 || (p.job_title || '').toLowerCase().includes('oper') || (p.job_title || '').toLowerCase().includes('execut') || (p.job_title || '').toLowerCase().includes('deliv'));
  }, [users, workOrders]);

  // --- FILTERED WORK ORDERS ---
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(wo => {
      // search term (title or customer name)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = (wo.title || '').toLowerCase().includes(term) || (wo.customer_name || '').toLowerCase().includes(term);
        if (!matches) return false;
      }

      // execution agent filter
      if (execAgentFilter !== 'all') {
        if (String(wo.execution_agent_id) !== String(execAgentFilter)) return false;
      }

      // delivery agent filter
      if (deliveryAgentFilter !== 'all') {
        if (String(wo.delivery_agent_id) !== String(deliveryAgentFilter)) return false;
      }

      // status filter
      if (statusFilter !== 'all') {
        if (wo.status !== statusFilter) return false;
      }

      // date filter
      if (dateFilterStart) {
        const start = new Date(dateFilterStart);
        const created = new Date(wo.created_at);
        if (created < start) return false;
      }
      if (dateFilterEnd) {
        const end = new Date(dateFilterEnd);
        end.setDate(end.getDate() + 1); // make inclusive
        const created = new Date(wo.created_at);
        if (created > end) return false;
      }

      return true;
    });
  }, [workOrders, searchTerm, execAgentFilter, deliveryAgentFilter, statusFilter, dateFilterStart, dateFilterEnd]);

  // Calculate Metrics
  const totalSales = workOrders.reduce((sum, wo) => sum + (wo.sale_value || 0), 0);
  const totalActualCost = workOrders.reduce((sum, wo) => sum + (wo.actual_cost_total || 0), 0);
  const realNetProfit = totalSales - totalActualCost;
  const netMarginPercent = totalSales > 0 ? (realNetProfit / totalSales) * 100 : 0;

  // Filter won deals that don't have work orders yet to offer quick trigger
  const eligibleDeals = crmDeals.filter(deal => {
    const stage = String(deal.stage_name || '').toLowerCase();
    const isWonStage = stage.includes('won') || stage.includes('implementation') || stage.includes('نجاح') || stage.includes('تنفيذ');
    const hasWO = workOrders.some(wo => wo.deal_id === deal.id);
    return isWonStage && !hasWO;
  });

  return (
    <div className="space-y-6" id="operations-hub-root">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {alert && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 border ${
              alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span className="font-bold text-xs">{alert.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section with Arabized terms */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Operations Hub <span className="text-sm font-normal text-slate-400">| مركز المتابعة والتشغيل الذكي</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Protect margins, coordinate workforce operations, update direct costs on-the-fly, and drive live net profits.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setWorkOrderForm({ id: null, title: '', customer_name: '', status: displayStages[0]?.name || 'Pending', execution_agent_id: null, delivery_agent_id: null, sale_value: 0, actual_cost_total: 0, items: [], expected_start_date: '', due_date: '', supervisor_id: null, assignment_date: null, completion_date: null, qa_status: 'Pending Review', qa_feedback: '' });
              setIsWorkOrderModalOpen(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Work Order | أمر تشغيل جديد</span>
          </button>
          <button 
            onClick={() => {
              setStageForm({ id: null, name: '', color: '#3b82f6', order_index: displayStages.length + 1, is_completed: false });
              setIsStageModalOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4" />
            <span>Configure Stages | إعداد المراحل</span>
          </button>
          <button 
            onClick={() => {
              fetchData();
              fetchStages();
            }} 
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-50"
            title="Reload real-time data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dynamic profit margins cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Contract Revenue (Sale Price) */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Won Deals Sales Revenue | إجمالي مبيعات العقود</span>
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 font-mono">
              {baseCurrency} {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Direct from Won Deals & Direct Work Orders</p>
          </div>
        </div>

        {/* Total Actual Execution Expense */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Direct Operational Costs | المصروفات التشغيلية المباشرة</span>
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 font-mono">
              {baseCurrency} {totalActualCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-teal-600 font-black mt-1">✓ Posted dynamically in Accounting Ledger</p>
          </div>
        </div>

        {/* Net Profits Margin */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Realized Net Profits | صافي الأرباح المحققة الفعلي</span>
            <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-teal-600 font-mono">
              {baseCurrency} {realNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-md font-black">
                {netMarginPercent.toFixed(1)}% Net Margin
              </span>
              <span className="text-[10px] text-slate-400">calculated in real-time</span>
            </div>
          </div>
        </div>

      </div>

      {/* Manuel triggers helper - won deals waiting execution */}
      {eligibleDeals.length > 0 && (
        <div className="bg-teal-50/50 border border-teal-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
              {eligibleDeals.length}
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">New Won Deals Pending Operations Setup | صفقات جديدة مغلقة بانتظار إطلاق أمر التشغيل</p>
              <p className="text-[10px] text-slate-500">The system automatically creates work orders, but you can force trigger any outstanding won opportunities here.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {eligibleDeals.map(deal => (
              <button
                key={deal.id}
                onClick={() => handleTriggerWorkOrder(deal.id)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Trigger: {deal.title} ({deal.customer_name || 'Contract'})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`pb-3 text-xs font-black transition-all border-b-2 whitespace-nowrap relative ${
              activeTab === 'pipeline' ? 'text-teal-600 border-teal-600' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            Work Orders Pipeline | لوحة تتبع أوامر التشغيل
          </button>
          <button
            onClick={() => setActiveTab('assignment')}
            className={`pb-3 text-xs font-black transition-all border-b-2 whitespace-nowrap relative ${
              activeTab === 'assignment' ? 'text-teal-600 border-teal-600' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            Multi-Role Assignment Desk | توزيع الأدوار والمهام
          </button>
          <button
            onClick={() => setActiveTab('cost-override')}
            className={`pb-3 text-xs font-black transition-all border-b-2 whitespace-nowrap relative ${
              activeTab === 'cost-override' ? 'text-teal-600 border-teal-600' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            Operational Cost Override Desk | جدول التكاليف وتعديل الهوامش
          </button>
          <button
            onClick={() => setActiveTab('auto-assign')}
            className={`pb-3 text-xs font-black transition-all border-b-2 whitespace-nowrap relative ${
              activeTab === 'auto-assign' ? 'text-teal-600 border-teal-600' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            Auto Assign System | التوزيع التلقائي للموظفين
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`pb-3 text-xs font-black transition-all border-b-2 whitespace-nowrap relative ${
              activeTab === 'performance' ? 'text-teal-600 border-teal-600' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            Operations Performance Desk | أداء فريق العمليات
          </button>
          <button
            onClick={() => setActiveTab('qa-review')}
            className={`pb-3 text-xs font-black transition-all border-b-2 whitespace-nowrap relative ${
              activeTab === 'qa-review' ? 'text-teal-600 border-teal-600' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            Quality Assurance & Review | مراجعة وضمان الجودة
          </button>
        </div>
      </div>

      {/* Loading state spinner */}
      {loading ? (
        <div className="bg-white p-12 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-4">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading operations network data...</p>
        </div>
      ) : (
        <div>
          
          {/* TAB 1: Pipeline (Board & List View + Advanced Filters) */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              
              {/* FILTERS AND VIEW TOGGLE RAIL */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-2xs">
                
                {/* Advanced Filter Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
                  
                  {/* Search Term */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by title, client, or items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    />
                  </div>

                  {/* Executor Filter */}
                  <select
                    value={execAgentFilter}
                    onChange={(e) => setExecAgentFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer"
                  >
                    <option value="all">All Executors</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>

                  {/* Delivery Filter */}
                  <select
                    value={deliveryAgentFilter}
                    onChange={(e) => setDeliveryAgentFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer"
                  >
                    <option value="all">All Deliveries</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    {displayStages.map(st => (
                      <option key={st.name} value={st.name}>{st.name}</option>
                    ))}
                  </select>

                  {/* Date range filter */}
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="date"
                      value={dateFilterStart}
                      onChange={(e) => setDateFilterStart(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 outline-none cursor-pointer"
                      title="From Date"
                    />
                    <span className="text-slate-400 text-xs">to</span>
                    <input
                      type="date"
                      value={dateFilterEnd}
                      onChange={(e) => setDateFilterEnd(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 outline-none cursor-pointer"
                      title="To Date"
                    />
                  </div>

                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setViewMode('board')} 
                      className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${viewMode === 'board' ? 'bg-white shadow-2xs text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Kanban Board</span>
                    </button>
                    <button 
                      onClick={() => setViewMode('list')} 
                      className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${viewMode === 'list' ? 'bg-white shadow-2xs text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Table List</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* VIEW MODE A: KANBAN BOARD */}
              {viewMode === 'board' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 overflow-x-auto pb-4">
                  {displayStages.map(stage => {
                    const stageOrders = filteredWorkOrders.filter(wo => wo.status === stage.name);
                    const isLastStage = stage.is_completed;

                    return (
                      <div key={stage.id || stage.name} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/50 flex flex-col h-[650px] min-w-[270px]">
                        
                        {/* Stage Column Header */}
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || '#3b82f6' }}></span>
                            <div>
                              <p className="text-xs font-black text-slate-800">{stage.name}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                            {stageOrders.length}
                          </span>
                        </div>

                        {/* Cards container */}
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                          {stageOrders.length === 0 ? (
                            <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 flex flex-col items-center justify-center h-40">
                              <HelpCircle className="w-5 h-5 mb-2 opacity-50 text-slate-300" />
                              <p className="text-[10px] font-bold">No Orders in this stage</p>
                              <p className="text-[8px] text-slate-400">لا توجد أوامر تشغيل في هذه المرحلة</p>
                            </div>
                          ) : (
                            stageOrders.map(wo => {
                              const execAgent = users.find(u => u.id === wo.execution_agent_id);
                              const delivAgent = users.find(u => u.id === wo.delivery_agent_id);

                              return (
                                <div 
                                  key={wo.id} 
                                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-500 transition-all shadow-2xs hover:shadow-xs group relative"
                                >
                                  {/* Quick Actions (Edit/Delete) */}
                                  <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1.5 bg-white/95 py-1 px-2 rounded-lg shadow-2xs border">
                                    <button
                                      onClick={() => {
                                        setWorkOrderForm({
                                          id: wo.id,
                                          title: wo.title,
                                          customer_name: wo.customer_name,
                                          status: wo.status,
                                          execution_agent_id: wo.execution_agent_id,
                                          delivery_agent_id: wo.delivery_agent_id,
                                          sale_value: wo.sale_value,
                                          actual_cost_total: wo.actual_cost_total,
                                          items: wo.items || [],
                                          expected_start_date: (wo as any).expected_start_date || '',
                                          due_date: (wo as any).due_date || '',
                                          supervisor_id: (wo as any).supervisor_id || null,
                                          assignment_date: (wo as any).assignment_date || null,
                                          completion_date: (wo as any).completion_date || null,
                                          qa_status: (wo as any).qa_status || 'Pending Review',
                                          qa_feedback: (wo as any).qa_feedback || ''
                                        });
                                        setIsWorkOrderModalOpen(true);
                                      }}
                                      className="flex items-center gap-1 px-1.5 py-0.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                      title="Edit Order"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      <span className="text-[9px] font-bold uppercase">Edit</span>
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmWoId(wo.id)}
                                      className="flex items-center gap-1 px-1.5 py-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                      title="Delete Order"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span className="text-[9px] font-bold uppercase">Delete</span>
                                    </button>
                                  </div>

                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-[9px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded font-bold">
                                      WO #{wo.id}
                                    </span>
                                    <span className="text-[10px] font-black text-teal-600 font-mono">
                                      {baseCurrency} {wo.sale_value}
                                    </span>
                                  </div>

                                  <h3 className="text-xs font-black text-slate-800 mt-2 line-clamp-1">{wo.title}</h3>
                                  <p className="text-[10px] text-slate-500 font-medium">{wo.customer_name}</p>

                                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[10px]">
                                    <div className="flex items-center justify-between text-slate-500">
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5 text-slate-400" /> Executor:
                                      </span>
                                      <span className="font-bold text-slate-700 truncate max-w-[120px]">
                                        {execAgent ? execAgent.name : <span className="text-rose-500 text-[9px]">Unassigned ⚠</span>}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-500">
                                      <span className="flex items-center gap-1">
                                        <Truck className="w-3.5 h-3.5 text-slate-400" /> Shipper:
                                      </span>
                                      <span className="font-bold text-slate-700 truncate max-w-[120px]">
                                        {delivAgent ? delivAgent.name : <span className="text-rose-500 text-[9px]">Unassigned ⚠</span>}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-500">
                                      <span className="flex items-center gap-1">
                                        <Coins className="w-3.5 h-3.5 text-slate-400" /> Actual Cost:
                                      </span>
                                      <span className="font-bold text-slate-900 font-mono text-[9.5px]">
                                        {baseCurrency} {wo.actual_cost_total}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Quick Stage Progression */}
                                  {!isLastStage && (
                                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                                      <button
                                        onClick={() => {
                                          const currentIndex = displayStages.findIndex(s => s.name === stage.name);
                                          if (currentIndex !== -1 && currentIndex < displayStages.length - 1) {
                                            const nextStage = displayStages[currentIndex + 1];
                                            handleUpdateWorkOrder(wo.id, { status: nextStage.name });
                                          }
                                        }}
                                        className="w-full bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 hover:border-teal-300 text-slate-600 font-bold py-1 px-2 rounded text-[9px] flex items-center justify-center gap-1 transition-all"
                                      >
                                        <span>Advance Stage | مرحلة متقدمة</span>
                                        <ChevronRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] uppercase font-black text-slate-400 bg-slate-50">
                          <th className="py-3.5 px-4">Order ID</th>
                          <th className="py-3.5 px-4">Work Order Title / Client</th>
                          <th className="py-3.5 px-4">Pipeline Status</th>
                          <th className="py-3.5 px-4">Execution Employee</th>
                          <th className="py-3.5 px-4">Shipping Employee</th>
                          <th className="py-3.5 px-4 text-right">Value</th>
                          <th className="py-3.5 px-4 text-right">Cost</th>
                          <th className="py-3.5 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWorkOrders.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-xs font-bold text-slate-400">
                              No work orders found matching the filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredWorkOrders.map(wo => {
                            const execAgent = users.find(u => u.id === wo.execution_agent_id);
                            const delivAgent = users.find(u => u.id === wo.delivery_agent_id);

                            return (
                              <tr key={wo.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4 font-mono text-xs font-bold text-slate-600">
                                  WO #{wo.id}
                                </td>
                                <td className="py-4 px-4">
                                  <p className="text-xs font-black text-slate-800">{wo.title}</p>
                                  <p className="text-[10px] text-slate-500">{wo.customer_name}</p>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="text-[9px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold uppercase">
                                    {wo.status}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-xs font-bold text-slate-700">
                                  {execAgent ? execAgent.name : <span className="text-rose-500">Unassigned</span>}
                                </td>
                                <td className="py-4 px-4 text-xs font-bold text-slate-700">
                                  {delivAgent ? delivAgent.name : <span className="text-rose-500">Unassigned</span>}
                                </td>
                                <td className="py-4 px-4 text-right font-mono text-xs font-black text-teal-600">
                                  {baseCurrency} {wo.sale_value.toLocaleString()}
                                </td>
                                <td className="py-4 px-4 text-right font-mono text-xs font-bold text-slate-700">
                                  {baseCurrency} {wo.actual_cost_total.toLocaleString()}
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <div className="flex justify-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        setWorkOrderForm({
                                          id: wo.id,
                                          title: wo.title,
                                          customer_name: wo.customer_name,
                                          status: wo.status,
                                          execution_agent_id: wo.execution_agent_id,
                                          delivery_agent_id: wo.delivery_agent_id,
                                          sale_value: wo.sale_value,
                                          actual_cost_total: wo.actual_cost_total,
                                          items: wo.items || [],
                                          expected_start_date: (wo as any).expected_start_date || '',
                                          due_date: (wo as any).due_date || '',
                                          supervisor_id: (wo as any).supervisor_id || null,
                                          assignment_date: (wo as any).assignment_date || null,
                                          completion_date: (wo as any).completion_date || null,
                                          qa_status: (wo as any).qa_status || 'Pending Review',
                                          qa_feedback: (wo as any).qa_feedback || ''
                                        });
                                        setIsWorkOrderModalOpen(true);
                                      }}
                                      className="flex items-center gap-1 px-2.5 py-1.5 text-teal-600 hover:bg-teal-50 rounded-lg border border-teal-100 transition-colors"
                                      title="Edit Order"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      <span className="text-[10px] font-bold uppercase">Edit</span>
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmWoId(wo.id)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-100 transition-colors"
                                      title="Delete Order"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span className="text-[10px] font-bold uppercase">Delete</span>
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
            </div>
          )}

          {/* TAB 2: Multi-Role Assignment Desk */}
          {activeTab === 'assignment' && (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs">
              <div className="mb-6">
                <h2 className="text-sm font-black text-slate-800">Supervisors Assignment Desk | شاشة المشرف لتوزيع الأدوار والمهام</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Assign execution employees and shipping personnel for each work order according to your RACI/Process Matrix.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase font-black text-slate-400 bg-slate-50">
                      <th className="py-3.5 px-4">Order ID</th>
                      <th className="py-3.5 px-4">Work Order Title / Client</th>
                      <th className="py-3.5 px-4">Pipeline Status</th>
                      <th className="py-3.5 px-4 text-teal-700 font-bold">Execution Employee (موظف التنفيذ)</th>
                      <th className="py-3.5 px-4 text-purple-700 font-bold">Shipping/Delivery Employee (موظف التوصيل)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs font-bold text-slate-400">
                          No active work orders found. Ensure deals are closed won in Sales CRM or create directly.
                        </td>
                      </tr>
                    ) : (
                      workOrders.map(wo => (
                        <tr key={wo.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded font-black">
                              WO #{wo.id}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-xs font-black text-slate-800">{wo.title}</p>
                            <p className="text-[10px] text-slate-500">{wo.customer_name}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[9px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                              {wo.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                              <select
                                value={wo.execution_agent_id || ''}
                                onChange={(e) => {
                                  const val = e.target.value ? parseInt(e.target.value) : null;
                                  handleUpdateWorkOrder(wo.id, { execution_agent_id: val });
                                }}
                                className="bg-slate-50 border border-slate-200 hover:border-teal-500 text-slate-800 text-xs rounded-lg p-1.5 focus:ring-1 focus:ring-teal-500 transition-colors"
                              >
                                <option value="">-- Unassigned --</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.job_title || 'Staff'})</option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-purple-600" />
                              <select
                                value={wo.delivery_agent_id || ''}
                                onChange={(e) => {
                                  const val = e.target.value ? parseInt(e.target.value) : null;
                                  handleUpdateWorkOrder(wo.id, { delivery_agent_id: val });
                                }}
                                className="bg-slate-50 border border-slate-200 hover:border-purple-500 text-slate-800 text-xs rounded-lg p-1.5 focus:ring-1 focus:ring-purple-500 transition-colors"
                              >
                                <option value="">-- Unassigned --</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.job_title || 'Delivery'})</option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Operational Cost Override Desk */}
          {activeTab === 'cost-override' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column: List of Work Orders with Cost summaries */}
              <div className="xl:col-span-1 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Select Work Order</h3>
                  <p className="text-[10px] text-slate-400">انقر على أمر التشغيل لتعديل تفاصيل تكاليفه الفعلية</p>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {workOrders.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">No work orders available</p>
                  ) : (
                    workOrders.map(wo => {
                      const isSelected = selectedWOForCost?.id === wo.id;
                      return (
                        <div
                          key={wo.id}
                          onClick={() => {
                            setSelectedWOForCost(wo);
                            const initialInputCosts: Record<string, string> = {};
                            (wo.items || []).forEach(item => {
                              initialInputCosts[item.id] = String(item.actual_cost);
                            });
                            setEditingItemCosts(initialInputCosts);
                          }}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-teal-50/50 border-teal-500 shadow-2xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                            <span>WO #{wo.id}</span>
                            <span className="font-bold text-slate-600">{wo.status}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-800 mt-1.5">{wo.title}</h4>
                          <p className="text-[10px] text-slate-500 font-semibold">{wo.customer_name}</p>

                          <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">Margin Cost:</span>
                            <span className="font-bold text-teal-700 font-mono">{baseCurrency} {wo.actual_cost_total}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Cost Itemization & Live Cost Override Table */}
              <div className="xl:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs">
                {selectedWOForCost ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] bg-teal-100 text-teal-800 font-mono px-2 py-0.5 rounded font-black">
                          Active Override: WO #{selectedWOForCost.id}
                        </span>
                        <h3 className="text-sm font-black text-slate-800 mt-2">{selectedWOForCost.title}</h3>
                        <p className="text-xs text-slate-400">Customer: {selectedWOForCost.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Operational Cost</span>
                        <span className="text-lg font-mono font-black text-teal-600">
                          {baseCurrency} {selectedWOForCost.actual_cost_total.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                            <th className="py-2 pb-3">Item / Service Name</th>
                            <th className="py-2 pb-3 text-right">Quantity</th>
                            <th className="py-2 pb-3 text-right">Sale Price (Read-only)</th>
                            <th className="py-2 pb-3 text-right">Default Catalog Cost</th>
                            <th className="py-2 pb-3 text-right text-teal-700">Actual Execution Cost (Override)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedWOForCost.items || []).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-xs text-slate-400">
                                No items found. You can add items by editing this work order.
                              </td>
                            </tr>
                          ) : (
                            selectedWOForCost.items.map(item => (
                              <tr key={item.id} className="border-b border-slate-100/50">
                                <td className="py-3">
                                  <p className="text-xs font-bold text-slate-800">{item.name}</p>
                                  <span className="text-[9px] text-slate-400">{item.category}</span>
                                </td>
                                <td className="py-3 text-right font-mono text-xs">{item.quantity}</td>
                                <td className="py-3 text-right font-mono text-xs text-slate-500">
                                  {baseCurrency} {item.sale_price}
                                </td>
                                <td className="py-3 text-right font-mono text-xs text-slate-500">
                                  {baseCurrency} {item.default_cost}
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="text-xs text-slate-400 font-mono">{baseCurrency}</span>
                                    <input
                                      type="number"
                                      step="any"
                                      value={editingItemCosts[item.id] !== undefined ? editingItemCosts[item.id] : item.actual_cost}
                                      onChange={(e) => handleCostInputChange(item.id, e.target.value)}
                                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-right font-mono text-xs font-black rounded-lg p-1.5 w-24 focus:ring-1 focus:ring-teal-500"
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-700">Direct Operational expense (Account 50500)</p>
                        <p className="text-[9px] text-slate-400">Saving this override will instantly write back a ledger journal entry to balance company P&L sheets.</p>
                      </div>
                      <button
                        onClick={() => handleSaveCostOverride(selectedWOForCost)}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors self-end md:self-auto"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save & Synchronize Profit Margins</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center">
                    <FileSpreadsheet className="w-8 h-8 mb-3 opacity-40 text-slate-400" />
                    <p className="text-xs font-bold">No Work Order Selected</p>
                    <p className="text-[10px] text-slate-400">Select an order from the left column to inspect items and override execution costs.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: Auto Assign System */}
          {activeTab === 'auto-assign' && (
            <div className="space-y-6">
              
              {/* Introduction & Global Trigger Button */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-teal-600" />
                    التوزيع التلقائي للموظفين (Operations Auto Assign Desk)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Set rule policies to automatically route work orders to Execution Employees (موظف التنفيذ) and Shipping Employees (موظف التوصيل) according to workloads and category expertise.
                  </p>
                </div>
                <button
                  onClick={runBulkAutoAssign}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-xs"
                >
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>Execute Auto Assignment | تفعيل التوزيع التلقائي</span>
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Left side: Rules configuration list */}
                <div className="xl:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-800 uppercase">Routing Policy Matrix | قواعد التوزيع الفعالة</h4>
                    <button
                      onClick={() => {
                        setRuleForm({ id: null, targetRole: 'executor', userIds: [], triggerType: 'always', stageName: 'any', serviceFilter: 'any', maxCapacity: 8, isActive: true });
                        setIsRuleModalOpen(true);
                      }}
                      className="text-xs font-black text-teal-600 hover:text-teal-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Routing Rule
                    </button>
                  </div>

                  <div className="space-y-3">
                    {autoAssignRules.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 border border-dashed rounded-xl">
                        No custom rules specified. Standard fallback assignment in place.
                      </div>
                    ) : (
                      autoAssignRules.map((rule, idx) => {
                        const countOfUsers = rule.userIds?.length || 0;
                        return (
                          <div key={rule.id} className="p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  rule.targetRole === 'executor' ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-purple-100 text-purple-800 border border-purple-200'
                                }`}>
                                  {rule.targetRole === 'executor' ? 'Execution Agent' : 'Shipping Agent'}
                                </span>
                                <span className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                <span className="text-[10px] text-slate-400 font-mono">Rule ID: {rule.id}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-800">
                                Target Team: {countOfUsers > 0 ? `${countOfUsers} Selected Employees` : 'No employees chosen'}
                              </p>
                              <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                                <span>• Stage Trigger: <strong className="text-slate-700">{rule.stageName === 'any' ? 'Any Stage' : rule.stageName}</strong></span>
                                <span>• Service keyword: <strong className="text-slate-700">{rule.serviceFilter === 'any' ? 'Any' : `"${rule.serviceFilter}"`}</strong></span>
                                <span>• Max Load Cap: <strong className="text-slate-700">{rule.maxCapacity} active WOs</strong></span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setRuleForm({ ...rule });
                                  setIsRuleModalOpen(true);
                                }}
                                className="p-1.5 bg-white border rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmRuleId(rule.id)}
                                className="p-1.5 bg-white border rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
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

                {/* Right side: Real-time routing logger */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase">Neural Routing Log | سجل الحركة والتوزيع</h4>
                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[10px] h-[300px] overflow-y-auto space-y-1.5 shadow-inner">
                    <p className="text-emerald-500/80 mb-2">// System routing engine active...</p>
                    {assignmentLogs.length === 0 ? (
                      <p className="text-slate-500 italic">// No auto assignment logs in this session yet.</p>
                    ) : (
                      assignmentLogs.map((log, lIdx) => (
                        <p key={lIdx} className="leading-relaxed">✓ {log}</p>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: Operations Performance Desk */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Award className="w-5 h-5 text-teal-600" />
                      Operations Employee Performance Desk | تقييم ومتابعة أداء موظفي العمليات
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Live audit of employee execution and delivery performance, tracking work loads, on-time rate, and operational cost savings.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase font-black text-slate-400 bg-slate-50">
                        <th className="py-3.5 px-4">Employee Name</th>
                        <th className="py-3.5 px-4">Job Title / Dept</th>
                        <th className="py-3.5 px-4 text-center">Assigned WOs</th>
                        <th className="py-3.5 px-4 text-center">Completed WOs</th>
                        <th className="py-3.5 px-4 text-center">Exec / Deliver Roles</th>
                        <th className="py-3.5 px-4 text-right">Cost Savings %</th>
                        <th className="py-3.5 px-4 text-right">Completion Rate %</th>
                        <th className="py-3.5 px-4 text-center">Performance Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operationsPerformance.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-xs font-bold text-slate-400">
                            No Operations performance data found. Assign some work orders first.
                          </td>
                        </tr>
                      ) : (
                        operationsPerformance.map((emp, index) => {
                          let scoreColor = 'bg-rose-50 text-rose-700 border-rose-200';
                          if (emp.score >= 85) scoreColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          else if (emp.score >= 70) scoreColor = 'bg-amber-50 text-amber-700 border-amber-200';

                          return (
                            <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-4">
                                <span className="font-bold text-xs text-slate-900 block">{emp.name}</span>
                                <span className="text-[9px] text-slate-400 font-mono">{emp.email}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-xs text-slate-700">{emp.job_title || 'Operations Specialist'}</span>
                              </td>
                              <td className="py-4 px-4 text-center font-mono text-xs font-bold text-slate-700">
                                {emp.totalAssigned}
                              </td>
                              <td className="py-4 px-4 text-center font-mono text-xs font-bold text-slate-700">
                                {emp.totalCompleted}
                              </td>
                              <td className="py-4 px-4 text-center text-[10px] text-slate-500">
                                {emp.execCount} Exec / {emp.delivCount} Deliv
                              </td>
                              <td className={`py-4 px-4 text-right font-mono text-xs font-bold ${emp.costSavings >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {emp.costSavings >= 0 ? '+' : ''}{emp.costSavings.toFixed(1)}%
                              </td>
                              <td className="py-4 px-4 text-right font-mono text-xs font-black text-slate-800">
                                {emp.onTimeRate.toFixed(1)}%
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${scoreColor}`}>
                                  {emp.score} / 100
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: Quality Assurance & Review Desk */}
          {activeTab === 'qa-review' && (
            <div className="space-y-8">
              
              {/* QA Summary Stats Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Pending QA Review | بانتظار التدقيق</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-slate-800">{pendingReviewWOs.length}</span>
                    <span className="text-xs font-bold text-slate-400">Orders</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Approved Clean | تم قبولها بنجاح</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-emerald-600">
                      {workOrders.filter(wo => wo.qa_status === 'Approved').length}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Orders</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Rejected with Tickets | مرفوضة بخلل</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-rose-600">
                      {workOrders.filter(wo => wo.qa_status === 'Rejected').length}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Orders</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Active QA Issues | تذاكر الأخطاء النشطة</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-amber-600">
                      {qaTickets.filter(t => t.status === 'Open').length}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Active Tickets</span>
                  </div>
                </div>
              </div>

              {/* TWO SECTIONS: Left (Work Orders Waiting Review), Right (Active QA Tickets) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* SECTION 1: Pending Review */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs">
                  <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    Pending Work Order Reviews | تدقيق مخرجات أوامر التشغيل المنجزة
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    The execution and delivery agents have marked these orders as completed. Review them carefully before releasing to customers.
                  </p>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {pendingReviewWOs.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">All completed work orders are thoroughly reviewed!</p>
                        <p className="text-[10px] text-slate-400">لا يوجد أوامر معلقة بانتظار مراجعة الجودة حالياً.</p>
                      </div>
                    ) : (
                      pendingReviewWOs.map(wo => (
                        <div key={wo.id} className="bg-slate-50 border p-4 rounded-2xl space-y-3 hover:border-teal-500/50 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-black text-slate-800">#{wo.id} - {wo.title}</h4>
                              <p className="text-[10px] font-bold text-slate-500 mt-1">Client: {wo.customer_name || 'N/A'}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                              {wo.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2.5 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-slate-400 block font-bold">Executor | المنفذ:</span>
                              <span className="text-slate-700 font-bold">{getUserName(wo.execution_agent_id)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-bold">Delivery | المسلّم:</span>
                              <span className="text-slate-700 font-bold">{getUserName(wo.delivery_agent_id)}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] font-bold text-slate-500">
                              Value: {wo.sale_value} {baseCurrency} | Cost: {wo.actual_cost_total} {baseCurrency}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleQaApprove(wo.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
                              >
                                Approve (مقبول)
                              </button>
                              <button
                                onClick={() => {
                                  setReviewingWO(wo);
                                  setTicketTitle(`خلل في جودة: ${wo.title}`);
                                  setTicketDescription('');
                                  setQaFeedback('');
                                  setAssignedToUser(wo.execution_agent_id || 0);
                                  setIsQaModalOpen(true);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
                              >
                                Reject (مرفوض)
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* SECTION 2: Active QA Tickets List */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs">
                  <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-teal-600" />
                    Quality Tickets & Correction Desk | تذاكر العيوب التشغيلية وإعادة التوجيه
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Track reported errors, assigned employees, correction efforts, and resolution statuses of previous failures.
                  </p>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {qaTickets.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-500">No QA Tickets have been recorded yet.</p>
                        <p className="text-[10px] text-slate-400">لم يتم تسجيل أي تذاكر أخطاء جودة.</p>
                      </div>
                    ) : (
                      qaTickets.map(ticket => (
                        <div key={ticket.id} className={`p-4 border rounded-2xl space-y-3 transition-all ${
                          ticket.status === 'Resolved' ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white shadow-xs border-amber-200'
                        }`}>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-slate-800">QA-{ticket.id}: {ticket.title}</h4>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                  ticket.severity === 'critical' ? 'bg-red-50 text-red-700 border border-red-100' :
                                  ticket.severity === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  ticket.severity === 'medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                  'bg-slate-50 text-slate-700 border border-slate-100'
                                }`}>
                                  {ticket.severity}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Related Work Order: <span className="font-bold">#{ticket.work_order_id} - {ticket.work_order_title}</span> ({ticket.work_order_customer_name})
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 font-semibold leading-relaxed">
                            {ticket.description}
                          </p>

                          <div className="flex justify-between items-center pt-1 text-[10px]">
                            <div>
                              <span className="text-slate-400 block font-bold">Assigned to fix | المكلّف بالإصلاح:</span>
                              <span className="text-slate-700 font-bold">{ticket.assigned_to_name || 'Unassigned'}</span>
                            </div>
                            {ticket.status === 'Open' && (
                              <button
                                onClick={() => handleResolveTicket(ticket.id)}
                                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-xl transition-all shadow-xs"
                              >
                                Mark Resolved (تم الحل)
                              </button>
                            )}
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
      )}

      {/* MODAL A: CONFIGURE PIPELINE STAGES */}
      {isStageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest pb-2 border-b">Configure Pipeline Stages | إعداد مراحل العمل</h3>
            
            {/* Existing custom stage badges */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border max-h-40 overflow-y-auto">
              {stages.map(st => (
                <div key={st.id} className="flex justify-between items-center bg-white p-2 border rounded-lg text-xs font-semibold">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }}></span>
                    <span className="truncate">{st.name} (Index: {st.order_index})</span>
                    {st.is_completed && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Completed
                      </span>
                    )}
                  </span>
                  <div className="flex gap-1.5">
                    <button 
                      type="button"
                      onClick={() => setStageForm({ id: st.id, name: st.name, color: st.color, order_index: st.order_index, is_completed: !!st.is_completed })}
                      className="text-teal-600 hover:text-teal-800 font-bold"
                    >
                      Edit
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDeleteConfirmStageId(st.id)}
                      className="text-rose-500 hover:text-rose-700 font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSaveStageForm} className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500">
                  {stageForm.id ? 'Editing Stage / تعديل مرحلة' : 'New Stage / مرحلة جديدة'}
                </span>
                {stageForm.id && (
                  <button 
                    type="button"
                    onClick={() => setStageForm({ id: null, name: '', color: '#3b82f6', order_index: stages.length + 1, is_completed: false })}
                    className="text-[9px] text-teal-600 font-bold underline"
                  >
                    Switch to Create | إنشاء جديد
                  </button>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Stage Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. In Testing / Ready to Ship"
                  value={stageForm.name}
                  onChange={e => setStageForm({ ...stageForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Color Color</label>
                  <input 
                    type="color"
                    value={stageForm.color}
                    onChange={e => setStageForm({ ...stageForm, color: e.target.value })}
                    className="w-full h-9 bg-slate-50 border rounded-xl p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Sort Order</label>
                  <input 
                    type="number"
                    value={stageForm.order_index}
                    onChange={e => setStageForm({ ...stageForm, order_index: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="is_completed"
                  checked={stageForm.is_completed}
                  onChange={e => setStageForm({ ...stageForm, is_completed: e.target.checked })}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                />
                <label htmlFor="is_completed" className="text-xs font-bold text-slate-700">
                  Mark as Final Completed Stage (e.g. Delivered)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsStageModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                >
                  {stageForm.id ? 'Save Changes' : 'Create Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL B: WORK ORDER CRUD (CREATE & EDIT) */}
      {isWorkOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveWorkOrderForm}
            className="bg-white rounded-[32px] border w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[620px]"
          >
            {/* Sidebar Tabs */}
            <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-6 flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <span className="text-[10px] font-black uppercase text-teal-600 tracking-wider">Work Order Workspace</span>
                  <h3 className="text-base font-black text-slate-800 leading-tight mt-0.5">
                    {workOrderForm.id ? 'Edit Work Order' : 'Create Work Order'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">ID: {workOrderForm.id || 'NEW_ORDER'}</p>
                </div>

                {/* Vertical Tabs */}
                <div className="space-y-1.5">
                  {[
                    { id: 'pipeline', label_en: 'Work Orders Pipeline', label_ar: 'لوحة تتبع المراحل', icon: Activity },
                    { id: 'assignment', label_en: 'Multi-Role Assignment', label_ar: 'توزيع الأدوار والمهام', icon: Users },
                    { id: 'cost', label_en: 'Cost Override Desk', label_ar: 'التكاليف وتعديل الهوامش', icon: TrendingUp },
                    { id: 'auto-assign', label_en: 'Auto Assign System', label_ar: 'التوزيع التلقائي', icon: Zap },
                    { id: 'performance', label_en: 'Performance Desk', label_ar: 'أداء فريق العمليات', icon: Clock },
                    { id: 'qa', label_en: 'Quality & Review', label_ar: 'مراجعة وضمان الجودة', icon: CheckCircle2 }
                  ].map(tab => {
                    const IconComp = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setModalActiveTab(tab.id as any)}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 border ${
                          modalActiveTab === tab.id
                            ? 'bg-white border-slate-200 shadow-sm text-teal-600 font-bold'
                            : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 ${modalActiveTab === tab.id ? 'text-teal-600' : 'text-slate-400'}`} />
                        <div className="flex-1 text-xs">
                          <p className="font-bold leading-none">{tab.label_en}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-semibold text-right" dir="rtl">{tab.label_ar}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Action Buttons */}
              <div className="pt-4 border-t border-slate-200 mt-4 md:mt-0">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWorkOrderModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition-all hover:shadow-sm"
                  >
                    {workOrderForm.id ? 'Save Changes' : 'Create Order'}
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {modalActiveTab === 'pipeline' && 'Work Orders Pipeline | لوحة التتبع'}
                    {modalActiveTab === 'assignment' && 'Multi-Role Assignment Desk | توزيع الأدوار'}
                    {modalActiveTab === 'cost' && 'Operational Cost Override Desk | الهوامش المباشرة'}
                    {modalActiveTab === 'auto-assign' && 'Auto Assign System | التوزيع التلقائي'}
                    {modalActiveTab === 'performance' && 'Operations Performance Desk | مؤشرات الأداء'}
                    {modalActiveTab === 'qa' && 'Quality Assurance & Review | ضبط الجودة'}
                  </h4>
                  <h2 className="text-sm font-bold text-slate-800 mt-0.5">
                    {modalActiveTab === 'pipeline' && 'متابعة مراحل سير الطلب خطوة بخطوة والتوقيتات'}
                    {modalActiveTab === 'assignment' && 'توزيع المسؤوليات بناءً على RACI Matrix'}
                    {modalActiveTab === 'cost' && 'مقارنة القيمة البيعية بالتكلفة الفعلية وحساب الربح'}
                    {modalActiveTab === 'auto-assign' && 'التوزيع الذكي والآلي للمهام لتخفيف الضغط'}
                    {modalActiveTab === 'performance' && 'إحصاءات زمن الإنجاز الفعلي ورصد اختراقات SLA'}
                    {modalActiveTab === 'qa' && 'شيك-ليست مراجعة وتدقيق معايير الجودة والتسليم'}
                  </h2>
                </div>
                
                {/* Context badge */}
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-800">{workOrderForm.title || "Untitled Work Order"}</p>
                  <p className="text-[10px] text-slate-400">{workOrderForm.customer_name || "New Client"}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/20">
                
                {/* 1. PIPELINE TAB */}
                {modalActiveTab === 'pipeline' && (
                  <div className="space-y-6">
                    {/* Interactive Progress Timeline */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs">
                      <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-teal-600" />
                        <span>Interactive Timeline | خط سير الطلب (اضغط للتعديل)</span>
                      </h3>
                      <div className="relative flex items-center justify-between px-4 py-2">
                        {/* Connector Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                        <div 
                          className="absolute top-1/2 left-0 h-1 bg-teal-500 -translate-y-1/2 z-0 transition-all duration-500" 
                          style={{
                            width: `${
                              (() => {
                                const idx = displayStages.findIndex(s => s.name === workOrderForm.status);
                                if (idx === -1) return 0;
                                return (idx / (displayStages.length - 1)) * 100;
                              })()
                            }%`
                          }}
                        />

                        {displayStages.map((stage, idx) => {
                          const currentIdx = displayStages.findIndex(s => s.name === workOrderForm.status);
                          const isCurrent = stage.name === workOrderForm.status;
                          const isCompleted = idx < currentIdx || stage.is_completed;
                          
                          return (
                            <button
                              key={stage.name}
                              type="button"
                              onClick={() => setWorkOrderForm({ ...workOrderForm, status: stage.name })}
                              className="relative z-10 flex flex-col items-center group focus:outline-none"
                            >
                              <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${
                                  isCurrent 
                                    ? 'bg-teal-50 border-teal-500 text-teal-600 scale-110 shadow-xs' 
                                    : isCompleted
                                      ? 'bg-teal-500 border-teal-500 text-white'
                                      : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'
                                }`}
                              >
                                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                              </div>
                              <span className={`text-[9px] font-black mt-2 transition-colors ${isCurrent ? 'text-teal-600 font-bold' : 'text-slate-500'}`}>
                                {stage.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Read-Only Core Fields & Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-2 right-2 bg-slate-200 text-slate-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                          Read-Only
                        </div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Work Order Title | اسم أمر التشغيل</label>
                        <p className="text-xs font-bold text-slate-700 mt-1">{workOrderForm.title || "Untitled Work Order"}</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-2 right-2 bg-slate-200 text-slate-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                          Read-Only
                        </div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Customer Name | اسم العميل</label>
                        <p className="text-xs font-bold text-slate-700 mt-1">{workOrderForm.customer_name || "New Client"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Pipeline Status | الحالة الإستراتيجية</label>
                        <select
                          value={workOrderForm.status || (displayStages[0]?.name || 'Pending')}
                          onChange={e => setWorkOrderForm({ ...workOrderForm, status: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500 transition-colors font-bold text-slate-700"
                        >
                          {displayStages.map(st => (
                            <option key={st.name} value={st.name}>{st.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Expected Start | تاريخ البدء المتوقع</label>
                        <input 
                          type="date"
                          value={workOrderForm.expected_start_date ? workOrderForm.expected_start_date.substring(0, 10) : ''}
                          onChange={e => setWorkOrderForm({ ...workOrderForm, expected_start_date: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500 transition-colors font-semibold text-slate-700"
                        />
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Final Delivery | تاريخ التسليم النهائي</label>
                        <input 
                          type="date"
                          value={workOrderForm.due_date ? workOrderForm.due_date.substring(0, 10) : ''}
                          onChange={e => setWorkOrderForm({ ...workOrderForm, due_date: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500 transition-colors font-semibold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. RACI ASSIGNMENT TAB */}
                {modalActiveTab === 'assignment' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs mb-2">
                      <span className="text-[9px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">RACI Matrix Layout</span>
                      <h3 className="text-xs font-bold text-slate-800 mt-1">Multi-Role Assignment Desk | توزيع المسؤوليات والأدوار</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Designate the correct engineers, drivers, and overseers for ultimate accountability.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* RESPONSIBLE (R) */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-teal-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl">
                          R - Responsible
                        </div>
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                            <UserCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Execution Employee</h4>
                            <p className="text-[9px] text-slate-400">المسؤول عن التنفيذ والمتابعة الفنية</p>
                          </div>
                        </div>
                        <div>
                          <select
                            value={workOrderForm.execution_agent_id || ''}
                            onChange={e => setWorkOrderForm({ ...workOrderForm, execution_agent_id: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500 transition-colors font-bold text-slate-700"
                          >
                            <option value="">-- Unassigned --</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.job_title || 'Staff'})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* ACCOUNTABLE (A) */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-purple-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl">
                          A - Accountable
                        </div>
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Supervisor</h4>
                            <p className="text-[9px] text-slate-400">المشرف العام المسؤول عن مراجعة الفلو</p>
                          </div>
                        </div>
                        <div>
                          <select
                            value={workOrderForm.supervisor_id || ''}
                            onChange={e => setWorkOrderForm({ ...workOrderForm, supervisor_id: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500 transition-colors font-bold text-slate-700"
                          >
                            <option value="">-- Unassigned --</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.job_title || 'Supervisor'})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* INFORMED (I) */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl">
                          I - Informed
                        </div>
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Shipping / Delivery</h4>
                            <p className="text-[9px] text-slate-400">المسؤول عن الشحن والتوصيل للعميل</p>
                          </div>
                        </div>
                        <div>
                          <select
                            value={workOrderForm.delivery_agent_id || ''}
                            onChange={e => setWorkOrderForm({ ...workOrderForm, delivery_agent_id: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 transition-colors font-bold text-slate-700"
                          >
                            <option value="">-- Unassigned --</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.job_title || 'Delivery'})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. COST OVERRIDE TAB */}
                {modalActiveTab === 'cost' && (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
                      <h3 className="text-xs font-bold text-slate-800 mb-1">Operational Cost Override Desk | جدول التكاليف وتعديل الهوامش</h3>
                      <p className="text-[10px] text-slate-400">Compare CRM deal values against real field expenses to protect operational profit margins.</p>
                    </div>

                    {/* Financial Comparison Table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Metric | البند المالي</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">Value | القيمة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-4 text-xs font-bold text-slate-700">
                              <div>Contract Sales Value (CRM)</div>
                              <div className="text-[9px] text-slate-400">القيمة التعاقدية من الـ CRM (Read-Only)</div>
                            </td>
                            <td className="p-4 text-right font-mono text-sm font-black text-teal-600">
                              {baseCurrency} {workOrderForm.sale_value.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-4 text-xs font-bold text-slate-700">
                              <div>Actual Operational Cost [Override]</div>
                              <div className="text-[9px] text-slate-400">التكلفة الفعلية الحالية على أرض الواقع</div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="inline-flex items-center gap-2 bg-slate-50 border rounded-xl px-2.5 py-1 focus-within:ring-1 focus-within:ring-teal-500">
                                <span className="text-[10px] font-bold text-slate-400">{baseCurrency}</span>
                                <input 
                                  type="number"
                                  step="any"
                                  value={workOrderForm.actual_cost_total || ''}
                                  onChange={e => setWorkOrderForm({ ...workOrderForm, actual_cost_total: parseFloat(e.target.value) || 0 })}
                                  className="bg-transparent text-right outline-none text-xs font-black text-slate-800 w-28"
                                  placeholder="0.00"
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Live Badges (Reactive) */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Live Net Profit */}
                      {(() => {
                        const profit = workOrderForm.sale_value - workOrderForm.actual_cost_total;
                        const isLoss = profit < 0;
                        return (
                          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase block">Live Net Profit | صافي الربح الفعلي</span>
                              <p className={`text-lg font-black mt-1 font-mono ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {profit >= 0 ? '+' : ''}{baseCurrency} {profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLoss ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              <TrendingUp className="w-5 h-5" />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Live Profit Margin */}
                      {(() => {
                        const profit = workOrderForm.sale_value - workOrderForm.actual_cost_total;
                        const margin = workOrderForm.sale_value > 0 ? (profit / workOrderForm.sale_value) * 100 : 0;
                        let marginColorClass = 'text-emerald-600 bg-emerald-50 border-emerald-100';
                        if (margin < 10) {
                          marginColorClass = 'text-rose-600 bg-rose-50 border-rose-100';
                        } else if (margin < 25) {
                          marginColorClass = 'text-amber-600 bg-amber-50 border-amber-100';
                        }

                        return (
                          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase block">Live Profit Margin | هامش الربح</span>
                              <p className="text-lg font-black mt-1 font-mono text-slate-800">
                                {margin.toFixed(1)}%
                              </p>
                            </div>
                            <div className={`text-xs font-black px-3 py-1.5 rounded-xl border ${marginColorClass}`}>
                              {margin >= 25 ? 'High Margin ✨' : margin >= 10 ? 'Healthy Margin 👍' : 'Low Margin 🚨'}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* 4. AUTO ASSIGN TAB */}
                {modalActiveTab === 'auto-assign' && (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
                      <span className="text-[9px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">AI allocation engine</span>
                      <h3 className="text-xs font-bold text-slate-800 mt-1">Auto Assign System | التوزيع التلقائي للموظفين</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Instantly distribute tasks based on optimized load balance or uniform distribution without supervisory delay.</p>
                    </div>

                    {/* Allocation Strategies */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Round Robin */}
                      <button
                        type="button"
                        onClick={() => setAutoAssignStrategy('round-robin')}
                        className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between h-40 ${
                          autoAssignStrategy === 'round-robin'
                            ? 'bg-teal-50 border-teal-200 ring-2 ring-teal-500/10'
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${autoAssignStrategy === 'round-robin' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <RefreshCw className="w-5 h-5" />
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${autoAssignStrategy === 'round-robin' ? 'border-teal-500 bg-teal-500' : 'border-slate-300'}`}>
                            {autoAssignStrategy === 'round-robin' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-xs font-bold text-slate-800">Round Robin (بالتساوي)</h4>
                          <p className="text-[9px] text-slate-400 mt-1 leading-snug">Distribute orders sequentially among employees to maintain balanced numbers of assignments.</p>
                        </div>
                      </button>

                      {/* Workload Balance */}
                      <button
                        type="button"
                        onClick={() => setAutoAssignStrategy('workload-balance')}
                        className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between h-40 ${
                          autoAssignStrategy === 'workload-balance'
                            ? 'bg-teal-50 border-teal-200 ring-2 ring-teal-500/10'
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${autoAssignStrategy === 'workload-balance' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <BarChart2 className="w-5 h-5" />
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${autoAssignStrategy === 'workload-balance' ? 'border-teal-500 bg-teal-500' : 'border-slate-300'}`}>
                            {autoAssignStrategy === 'workload-balance' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-xs font-bold text-slate-800">Workload Balance (الأقل ضغطاً)</h4>
                          <p className="text-[9px] text-slate-400 mt-1 leading-snug">Scans live queue lengths and routes to the engineer with the least current open tasks.</p>
                        </div>
                      </button>
                    </div>

                    {/* Magic Trigger Action */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center text-center space-y-4">
                      <Sparkles className="w-8 h-8 text-teal-600 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-black text-slate-800">Optimize Workforce Allocation | التخصيص التلقائي الفوري</h4>
                        <p className="text-[10px] text-slate-500 max-w-md mt-1">
                          Click below to execute the selected algorithm. This will instantly select the best suited staff and update the field values on the fly.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerAutoAssign}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Run Auto-Assign | تشغيل التوزيع التلقائي</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. PERFORMANCE TAB */}
                {modalActiveTab === 'performance' && (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
                      <h3 className="text-xs font-bold text-slate-800 mb-1">Operations Performance Desk | أداء فريق العمليات</h3>
                      <p className="text-[10px] text-slate-400">Monitor live cycle durations, turnaround metrics, and verify SLA threshold compliance.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Assignment Tracker Card */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Task Lifecycle | دورة حياة الطلب</h4>
                            <p className="text-[8px] text-slate-400">تاريخ ووقت التعيين والإغلاق</p>
                          </div>
                        </div>
                        <div className="space-y-2 border-l-2 border-slate-100 pl-4 ml-4">
                          <div>
                            <span className="text-[8px] font-black text-slate-400 block uppercase">Assignment Timestamp</span>
                            <span className="text-xs font-bold text-slate-700">
                              {workOrderForm.assignment_date 
                                ? new Date(workOrderForm.assignment_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) 
                                : "Not Assigned Yet ➡️ Pending"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black text-slate-400 block uppercase">Completion Timestamp</span>
                            <span className="text-xs font-bold text-slate-700">
                              {workOrderForm.completion_date 
                                ? new Date(workOrderForm.completion_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) 
                                : "In Progress / Active"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Turnaround Duration Card */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Turnaround Time (TAT)</span>
                          <span className="text-[8px] font-bold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full">Live Stats</span>
                        </div>
                        <div className="my-3">
                          <p className="text-2xl font-black font-mono text-slate-800 leading-none">
                            {(() => {
                              if (!workOrderForm.assignment_date) return "N/A";
                              const start = new Date(workOrderForm.assignment_date).getTime();
                              const end = workOrderForm.completion_date ? new Date(workOrderForm.completion_date).getTime() : Date.now();
                              const diffMs = end - start;
                              const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                              const diffDays = Math.floor(diffHours / 24);
                              if (diffDays > 0) {
                                return `${diffDays}d ${diffHours % 24}h`;
                              }
                              return `${diffHours} hours`;
                            })()}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1">Elapsed cycle duration from assignment to current stage.</p>
                        </div>
                        <div className="text-[9px] text-slate-400 border-t pt-2 mt-2">
                          Assigned to: <span className="font-bold text-slate-700">{users.find(u => u.id === workOrderForm.execution_agent_id)?.name || "Unassigned"}</span>
                        </div>
                      </div>
                    </div>

                    {/* SLA Alert Desk */}
                    {(() => {
                      const isOverdue = workOrderForm.due_date && new Date(workOrderForm.due_date).getTime() < Date.now() && workOrderForm.status !== 'Delivered Successfully';
                      return (
                        <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${
                          isOverdue 
                            ? 'bg-rose-50 border-rose-100 text-rose-800 animate-pulse' 
                            : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        }`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-black uppercase tracking-wider">
                              {isOverdue ? 'SLA Breach Alert 🚨' : 'SLA Compliance Status ✅'}
                            </h4>
                            <p className="text-[10px] mt-1 leading-relaxed opacity-90">
                              {isOverdue 
                                ? `CRITICAL SLA BREACH: The final delivery deadline of ${new Date(workOrderForm.due_date).toLocaleDateString()} was missed. Immediate supervisorial intervention is required.` 
                                : 'All standard service level agreements (SLA) are fully met. Turnaround cycle within the targeted healthy range.'}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 6. QA TAB */}
                {modalActiveTab === 'qa' && (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
                      <h3 className="text-xs font-bold text-slate-800 mb-1">Quality Assurance & Review | مراجعة وضمان الجودة</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Perform final checklist inspection and register quality approvals or rejections prior to order archiving.</p>
                    </div>

                    {/* QA checklist */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Final Inspection Checklist | شيك-ليست مراجعة الجودة</h4>
                      
                      <div className="space-y-2.5 pt-1">
                        <label className="flex items-start gap-3 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                          <input type="checkbox" defaultChecked className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300" />
                          <div>
                            <span>Functional Requirements Met</span>
                            <p className="text-[8px] text-slate-400 leading-none mt-0.5">تطابق المنتج/الخدمة مع المواصفات الفنية المتفق عليها</p>
                          </div>
                        </label>
                        
                        <label className="flex items-start gap-3 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                          <input type="checkbox" defaultChecked className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300" />
                          <div>
                            <span>Aesthetic Polish Completed</span>
                            <p className="text-[8px] text-slate-400 leading-none mt-0.5">مراجعة اللمسات النهائية وخلو البند من العيوب البصرية</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                          <input type="checkbox" className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300" />
                          <div>
                            <span>Delivery Destination Validated</span>
                            <p className="text-[8px] text-slate-400 leading-none mt-0.5">تأكيد عنوان العميل ورقم التواصل ومندوب الشحن المعين</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                          <input type="checkbox" className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300" />
                          <div>
                            <span>Financial & Margin Audit</span>
                            <p className="text-[8px] text-slate-400 leading-none mt-0.5">مراجعة التكاليف الفعلية ومقارنتها بالقيمة البيعية للتأكد من ربحية الطلب</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* QA Decision & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">QA Review Status | حالة الجودة</label>
                        <select
                          value={workOrderForm.qa_status || 'Pending Review'}
                          onChange={e => setWorkOrderForm({ ...workOrderForm, qa_status: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500 font-bold text-slate-700"
                        >
                          <option value="Pending Review">Pending Review | قيد المراجعة</option>
                          <option value="Approved">Approved | معتمد ومقبول</option>
                          <option value="Rejected">Rejected | مرفوض ومحتاج تعديل</option>
                        </select>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">QA Feedback & Issue Notes | ملاحظات الجودة</label>
                        <textarea
                          rows={2}
                          value={workOrderForm.qa_feedback || ''}
                          onChange={e => setWorkOrderForm({ ...workOrderForm, qa_feedback: e.target.value })}
                          placeholder="Enter notes, detected issues, or error tickets to link directly to Kaizen..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500 font-medium text-slate-700 resize-none"
                        />
                      </div>
                    </div>

                    {/* Interactive Kaizen Trigger when rejected */}
                    {workOrderForm.qa_status === 'Rejected' && (
                      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-rose-800">Create Kaizen Issue Ticket | تذكرة كايزن لتصحيح الخطأ</h4>
                            <p className="text-[9px] text-rose-600">Instantly route this quality failure to continuous improvement flows.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingWO(workOrderForm as any);
                            setQaFeedback(workOrderForm.qa_feedback || 'Quality Review Rejection');
                            setTicketTitle(`Issue: ${workOrderForm.title}`);
                            setTicketDescription(`Detected QA Rejection: ${workOrderForm.qa_feedback || 'No description provided.'}`);
                            setIsQaModalOpen(true);
                            showToast('Loaded into Kaizen Issue Tracker! Finish creating the ticket in the opened panel.', 'success');
                          }}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                        >
                          Generate Ticket 🚀
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL C: AUTO ASSIGN RULE CONFIG */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest pb-2 border-b">
              {ruleForm.id ? 'Edit Auto Assign Rule | تعديل قاعدة التوزيع' : 'Add Auto Assign Rule | إضافة قاعدة توزيع'}
            </h3>

            <form onSubmit={handleSaveRuleForm} className="space-y-4">
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Target Department Role</label>
                <select
                  value={ruleForm.targetRole}
                  onChange={e => setRuleForm({ ...ruleForm, targetRole: e.target.value as 'executor' | 'delivery' })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs outline-none"
                >
                  <option value="executor">Execution Employee (موظف التنفيذ)</option>
                  <option value="delivery">Shipping/Delivery Employee (موظف التوصيل)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                  Assign Pool of Employees (Select Multiple)
                </label>
                <div className="bg-slate-50 border rounded-xl p-3 max-h-32 overflow-y-auto space-y-1.5">
                  {users.map(u => {
                    const isChecked = ruleForm.userIds.includes(u.id);
                    return (
                      <label key={u.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const updatedUserIds = isChecked
                              ? ruleForm.userIds.filter(id => id !== u.id)
                              : [...ruleForm.userIds, u.id];
                            setRuleForm({ ...ruleForm, userIds: updatedUserIds });
                          }}
                          className="rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                        />
                        <span>{u.name} ({u.job_title || 'Specialist'})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Trigger condition</label>
                  <select
                    value={ruleForm.triggerType}
                    onChange={e => setRuleForm({ ...ruleForm, triggerType: e.target.value as 'always' | 'on_stage' })}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs outline-none"
                  >
                    <option value="always">Always | دائمًا</option>
                    <option value="on_stage">At specific status | مرحلة معينة</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Target Stage</label>
                  <select
                    value={ruleForm.stageName}
                    disabled={ruleForm.triggerType === 'always'}
                    onChange={e => setRuleForm({ ...ruleForm, stageName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs outline-none disabled:opacity-50"
                  >
                    <option value="any">Any Stage | أي مرحلة</option>
                    {displayStages.map(st => (
                      <option key={st.name} value={st.name}>{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Product keyword filter</label>
                  <input
                    type="text"
                    value={ruleForm.serviceFilter}
                    onChange={e => setRuleForm({ ...ruleForm, serviceFilter: e.target.value })}
                    placeholder="e.g. Software, Shipping or any"
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Max active load cap</label>
                  <input
                    type="number"
                    value={ruleForm.maxCapacity}
                    onChange={e => setRuleForm({ ...ruleForm, maxCapacity: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="isActive"
                  checked={ruleForm.isActive}
                  onChange={e => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-700">
                  Rule is active / تفعيل القاعدة
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                >
                  {ruleForm.id ? 'Save Rule' : 'Create Rule'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Deletion Confirmations */}
      <DeleteConfirmation 
        isOpen={deleteConfirmWoId !== null}
        onClose={() => setDeleteConfirmWoId(null)}
        onConfirm={() => deleteConfirmWoId !== null && handleDeleteWorkOrder(deleteConfirmWoId)}
        title="Delete Work Order"
        message="Are you sure you want to delete this work order? This will also remove associated journal entries and tasks."
        loading={isDeleting}
      />

      <DeleteConfirmation 
        isOpen={deleteConfirmStageId !== null}
        onClose={() => setDeleteConfirmStageId(null)}
        onConfirm={() => deleteConfirmStageId !== null && handleDeleteStage(deleteConfirmStageId)}
        title="Delete Stage"
        message="Are you sure you want to delete this stage? Associated work orders will be reassigned to the first stage."
        loading={isDeleting}
      />

      <DeleteConfirmation 
        isOpen={deleteConfirmRuleId !== null}
        onClose={() => setDeleteConfirmRuleId(null)}
        onConfirm={() => deleteConfirmRuleId !== null && handleDeleteRule(deleteConfirmRuleId)}
        title="Delete Auto Assign Rule"
        message="Are you sure you want to delete this automatic assignment rule?"
        loading={isDeleting}
      />

      {/* MODAL D: QA REJECTION & ERROR TICKET CREATION */}
      {isQaModalOpen && reviewingWO && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-start pb-2 border-b">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  Reject Work & Open Correction Ticket | رفض العمل وفتح تذكرة تصحيح الأخطاء
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Work Order #{reviewingWO.id} - {reviewingWO.title}</p>
              </div>
              <button
                onClick={() => {
                  setIsQaModalOpen(false);
                  setReviewingWO(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQaRejectSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                  Ticket Title | عنوان التذكرة
                </label>
                <input
                  type="text"
                  required
                  value={ticketTitle}
                  onChange={e => setTicketTitle(e.target.value)}
                  placeholder="e.g. خلل في تسليم التقارير الفنية"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                  Error Details & Rejection Feedback | تفاصيل العيب التشغيلي والملاحظات المرفوضة
                </label>
                <textarea
                  required
                  rows={3}
                  value={qaFeedback}
                  onChange={e => {
                    setQaFeedback(e.target.value);
                    setTicketDescription(e.target.value);
                  }}
                  placeholder="اكتب هنا تفاصيل المشكلة أو الخطأ والمطلوب تعديله بالتحديد..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                    Severity | درجة الأهمية والخطورة
                  </label>
                  <select
                    value={qaSeverity}
                    onChange={e => setQaSeverity(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                  >
                    <option value="low">Low | منخفضة</option>
                    <option value="medium">Medium | متوسطة</option>
                    <option value="high">High | عالية</option>
                    <option value="critical">Critical | حرجة جداً</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                    Assign to Fix | مكلف بمعالجة الخطأ
                  </label>
                  <select
                    value={assignedToUser}
                    onChange={e => setAssignedToUser(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                  >
                    <option value={0}>Select Employee...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.job_title || 'Specialist'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsQaModalOpen(false);
                    setReviewingWO(null);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                >
                  Cancel | إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submittingQa}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:bg-slate-300"
                >
                  {submittingQa ? 'Submitting...' : 'Register Rejection & Open Ticket | تسجيل الرفض'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
