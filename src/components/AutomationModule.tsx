import React, { useState, useEffect } from 'react';
import { 
  Zap, Plus, Play, Pause, Trash2, History, Settings2, 
  CheckCircle2, XCircle, AlertCircle, ChevronRight, 
  Bell, ClipboardList, RefreshCw, UserCheck, Search,
  Filter, Info, Sparkles, Clock, TrendingUp, Activity, Check, ShieldAlert,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend 
} from 'recharts';
import { AutomationRule, AutomationLog } from '../types';
import { cn } from '../lib/utils';
import DeleteConfirmation from './Common/DeleteConfirmation';
import { AutomationDashboard } from './AutomationDashboard';

const MODULE_CATEGORIES = [
  { id: 'crm', name: 'Sales & CRM / المبيعات وإدارة العملاء' },
  { id: 'sop', name: 'Operations & SOPs / العمليات وإجراءات التشغيل' },
  { id: 'kb', name: 'Knowledge Base / قاعدة المعرفة' },
  { id: 'qa', name: 'Quality & Compliance / الجودة والامتثال' },
  { id: 'hr', name: 'HR & Payroll / الموارد البشرية والرواتب' },
  { id: 'kpi', name: 'KPIs & Risk / مؤشرات الأداء والمخاطر' },
  { id: 'kaizen', name: 'Continuous Improvement / التحسين المستمر' }
];

const TRIGGER_TYPES = [
  // CRM & Sales
  { id: 'crm:customer:new', name: 'New CRM Customer / عميل جديد في CRM', category: 'crm', icon: UserCheck },
  { id: 'crm:deal:new', name: 'New CRM Deal / صفقة جديدة في CRM', category: 'crm', icon: ClipboardList },
  { id: 'crm:deal:stage_updated', name: 'Deal Stage Updated / تحديث مرحلة الصفقة', category: 'crm', icon: RefreshCw },
  { id: 'crm:file:uploaded', name: 'File Uploaded to Customer / تم رفع ملف للعميل', category: 'crm', icon: AlertCircle },
  { id: 'crm:deal:won', name: 'Deal Marked Won / تم الفوز بالصفقة', category: 'crm', icon: CheckCircle2 },
  { id: 'leads:new', name: 'New Lead Registered / تسجيل عميل محتمل جديد', category: 'crm', icon: UserCheck },
  { id: 'leads:status_updated', name: 'Lead Status Updated / تحديث حالة العميل المحتمل', category: 'crm', icon: RefreshCw },

  // Operations & SOPs
  { id: 'sop:status:changed', name: 'SOP Status Changed / تغيير حالة إجراء التشغيل SOP', category: 'sop', icon: Settings2 },
  { id: 'sop:revision:added', name: 'SOP Revision Added / إضافة مراجعة جديدة للـ SOP', category: 'sop', icon: RefreshCw },
  { id: 'process_map:created', name: 'New Process Flow Registered / تسجيل مسار عمل جديد', category: 'sop', icon: RefreshCw },
  { id: 'process_map:updated', name: 'Process Flow Updated / تحديث مسار عمل', category: 'sop', icon: Settings2 },
  { id: 'operations:task:escalated', name: 'Operations Task Escalated / تصعيد مهمة تشغيلية', category: 'sop', icon: ShieldAlert },

  // Knowledge Base
  { id: 'kb:article:created', name: 'KB Article Created / تم إنشاء مقالة معرفية', category: 'kb', icon: BookOpen },
  { id: 'kb:article:updated', name: 'KB Article Updated / تم تحديث مقالة معرفية', category: 'kb', icon: RefreshCw },
  { id: 'kb:article:deleted', name: 'KB Article Deleted / تم حذف مقالة معرفية', category: 'kb', icon: Trash2 },
  { id: 'kb:feedback:submitted', name: 'KB Article Feedback Submitted / تم تقييم مقالة معرفية', category: 'kb', icon: Activity },
  { id: 'kb:view:milestone', name: 'Article Viewed 100+ Times / تخطي المقالة 100 مشاهدة', category: 'kb', icon: TrendingUp },

  // Quality & Compliance
  { id: 'qa:audit:failed', name: 'QA Audit Failed / فشل تدقيق الجودة', category: 'qa', icon: ShieldAlert },
  { id: 'qa:audit:passed', name: 'QA Audit Passed / اجتياز تدقيق الجودة', category: 'qa', icon: CheckCircle2 },
  { id: 'qa:incident:reported', name: 'New Quality Incident Reported / تسجيل حادثة جودة جديدة', category: 'qa', icon: AlertCircle },

  // HR & Payroll
  { id: 'hr:leave_request:created', name: 'New Absence Leave Proposed / طلب إجازة غياب جديد', category: 'hr', icon: UserCheck },
  { id: 'hr:leave_request:approved', name: 'Leave Request Approved / تم الموافقة على طلب الإجازة', category: 'hr', icon: CheckCircle2 },
  { id: 'hr:employee:new', name: 'New Employee Onboarded / تعيين موظف جديد', category: 'hr', icon: UserCheck },
  { id: 'accounting:payroll:created', name: 'Payroll Ledger Finalized / اعتماد كشف الرواتب', category: 'hr', icon: Zap },

  // KPIs & Risk
  { id: 'kpi:value:updated', name: 'KPI Value Updated / تحديث قيمة مؤشر الأداء', category: 'kpi', icon: Zap },
  { id: 'kpi:target:reached', name: 'KPI Target Reached / تحقيق هدف مؤشر الأداء', category: 'kpi', icon: CheckCircle2 },
  { id: 'risk:high_risk_alert', name: 'High Risk Alert Triggered / تنبيه بمخاطر عالية', category: 'kpi', icon: AlertCircle },

  // Kaizen
  { id: 'kaizen:suggestion:created', name: 'New Kaizen Idea Proposed / اقتراح فكرة كايزن جديدة', category: 'kaizen', icon: Sparkles }
];

const ACTION_TYPES = [
  { id: 'notification', name: 'Send System Notification / إرسال تنبيه في النظام', icon: Bell },
  { id: 'task_create', name: 'Create Action Task / إنشاء مهمة عمل', icon: ClipboardList },
  { id: 'status_update', name: 'Update Document Status / تحديث حالة المستند', icon: RefreshCw },
  { id: 'auto_assign', name: 'Auto Assign Owner / تعيين تلقائي للمسؤول', icon: UserCheck },
  { id: 'kb_draft_create', name: 'Create KB Draft Article / إنشاء مسودة مقالة معرفية', icon: BookOpen },
  { id: 'kb_status_update', name: 'Update KB Article Status / تحديث حالة المقالة المعرفية', icon: RefreshCw },
  { id: 'kb_link_sop', name: 'Link SOP to KB Article / ربط الـ SOP بالمقالة المعرفية', icon: Settings2 },
  { id: 'crm_lead_status_update', name: 'Update CRM Lead Status / تحديث حالة العميل المحتمل', icon: RefreshCw },
  { id: 'crm_add_deal_note', name: 'Add Activity Note to Deal / إضافة ملاحظة نشاط للصفقة', icon: ClipboardList },
  { id: 'sop_publish', name: 'Auto-Publish SOP Document / نشر تلقائي لمستند الـ SOP', icon: BookOpen },
  { id: 'qa_trigger_audit', name: 'Schedule Quality Audit / جدولة تدقيق تلقائي للجودة', icon: Settings2 },
  { id: 'risk_escalate', name: 'Escalate Risk Mitigation / تصعيد إجراءات التخفيف من المخاطر', icon: ShieldAlert },
  { id: 'kaizen_approve', name: 'Auto-Approve Kaizen Idea / موافقة تلقائية على فكرة كايزن', icon: Sparkles },
  { id: 'send_email_external', name: 'Send External Email Alert / إرسال بريد إلكتروني خارجي', icon: Bell }
];

const AUTOMATION_TEMPLATES = [
  {
    id: 'tpl_welcome_onboarding',
    name: 'Auto-Task Assignment for New Customers',
    category: 'CRM & Sales',
    triggerType: 'crm:customer:new',
    description: 'When a new customer is registered in CRM, immediately send a notification and automatically create an Onboarding kickoff task in the task engine.',
    conditions: [],
    actions: [
      { type: 'notification', params: { channel: 'internal', message: 'Welcome email queue initialized for customer: {{name}}' } },
      { type: 'task_create', params: { title: 'Review CRM Profile & Schedule Intake Call', priority: 'high' } }
    ],
    benefit: 'Saves 15 mins per customer by automating CRM welcome processes instantly.'
  },
  {
    id: 'tpl_crm_high_value',
    name: 'High-Value Deal Escalation Alert',
    category: 'CRM & Sales',
    triggerType: 'crm:deal:new',
    description: 'Whenever a prospective CRM deal is logged with an expected value greater than $50,000, trigger warning Slack alerts and assign priority triage.',
    conditions: [
      { field: 'value', operator: '>', value: '50000' }
    ],
    actions: [
      { type: 'notification', params: { channel: 'slack', message: '🚀 High-Value Deal detected: {{title}} (Value: ${{value}})' } },
      { type: 'task_create', params: { title: 'Draft Executive Proposal & Review RACI Allocations', priority: 'high' } }
    ],
    benefit: 'Ensures immediate executive support on enterprise bids exceeding standard threshold.'
  },
  {
    id: 'tpl_won_congratulate',
    name: 'Automatic Post-Sale Delivery Kickoff',
    category: 'CRM & Sales',
    triggerType: 'crm:deal:stage_updated',
    description: 'Triggers when a CRM prospective deal is moved to Closed-Won. Automatically updates internal departments and enlists operations verification task.',
    conditions: [
      { field: 'stage_name', operator: '==', value: 'Won' }
    ],
    actions: [
      { type: 'notification', params: { channel: 'internal', message: 'Deal Closed-Won: {{title}}! Deploying operations task forces.' } },
      { type: 'task_create', params: { title: 'Trigger Post-Sale SOP Integration checklist & Client Setup', priority: 'medium' } }
    ],
    benefit: 'Eliminates friction between sales cycle end and technical fulfillment delivery.'
  },
  {
    id: 'tpl_sop_published_training',
    name: 'Auto-Enroll Retraining on SOP Update',
    category: 'Operations & SOPs',
    triggerType: 'sop:status:changed',
    description: 'When any Standard Operating Procedure status progresses to "Published", dispatch team notifications and trigger mandatory review checklists for relevant operators.',
    conditions: [
      { field: 'status', operator: '==', value: 'Published' }
    ],
    actions: [
      { type: 'notification', params: { channel: 'internal', message: 'SOP revised and Published: {{title}} v{{version_number}}. Active review mandatory.' } },
      { type: 'task_create', params: { title: 'Implement revised SOP training criteria with Employees', priority: 'medium' } }
    ],
    benefit: 'Maintains instant sync of updated procedural criteria across division stakeholders.'
  },
  {
    id: 'tpl_kpi_underperforming',
    name: 'KPI Remediation & Urgent Audit Trigger',
    category: 'KPIs',
    triggerType: 'kpi:value:updated',
    description: 'Triggers when any registered Key Performance Indicator value falls below critical targets. Instantly triggers alert notifications and queues corrective check plans.',
    conditions: [
      { field: 'value', operator: '<', value: '70' }
    ],
    actions: [
      { type: 'notification', params: { channel: 'slack', message: '⚠️ Alert: KPI under performance target - {{title}} is currently {{value}}%' } },
      { type: 'task_create', params: { title: 'Formulate CAPA root-cause study on KPI target divergence', priority: 'high' } }
    ],
    benefit: 'Sustains continuous risk avoidance with early corrective trigger points.'
  },
  {
    id: 'tpl_qa_angry_response',
    name: 'Urgent Redirection on Negative Feedback',
    category: 'Quality & Compliance',
    triggerType: 'qa:angry_customer:alert',
    description: 'Monitors customer feedback and surveys for extreme scores (angry sentiment). Immediately triggers manager notification and initiates corrective process actions.',
    conditions: [],
    actions: [
      { type: 'notification', params: { channel: 'slack', message: '🚨 Critical Customer Alert: Severe negative feedback captured for process {{process}}!' } },
      { type: 'task_create', params: { title: 'Urgent Customer Recovery outreach by Department Lead', priority: 'high' } }
    ],
    benefit: 'Prevents customer attrition with dynamic active recovery responses.'
  },
  {
    id: 'tpl_risk_high_alert',
    name: 'High Risk Registration Warning Trigger',
    category: 'Risk Management',
    triggerType: 'risk:high_risk_alert',
    description: 'When a Risk is registered with extreme probability or severity, immediately dispatch warning reports and assign action-plan checklists.',
    conditions: [],
    actions: [
      { type: 'notification', params: { channel: 'internal', message: 'Critical High Risk Reported: {{name}} (Score: {{risk_score}}). Review required.' } },
      { type: 'task_create', params: { title: 'Draft countermeasures for risk: {{name}}', priority: 'high' } }
    ],
    benefit: 'Dramatically reduces reaction windows to unexpected threat factors.'
  },
  {
    id: 'tpl_accounting_payroll_alert',
    name: 'Financial Audit setup on Payroll Final',
    category: 'Accounting & HR',
    triggerType: 'accounting:payroll:created',
    description: 'Automatically alert operations and construct a financial ledger validation task when new payroll is registered.',
    conditions: [],
    actions: [
      { type: 'notification', params: { channel: 'internal', message: 'New payroll ledger registered for validation.' } },
      { type: 'task_create', params: { title: 'Verify payroll ledger compliance & tax withholdings', priority: 'medium' } }
    ],
    benefit: 'Protects operational bookkeeping integrity via instant auditing.'
  },
  {
    id: 'tpl_kaizen_pdca_remedy',
    name: 'Auto-Task Review on New Kaizen Proposed',
    category: 'Kaizen Improvement',
    triggerType: 'kaizen:suggestion:created',
    description: 'Automatically notify managers and create a primary review checklist as soon as a Kaizen suggestion gets logged.',
    conditions: [],
    actions: [
      { type: 'notification', params: { channel: 'slack', message: '🚀 New Kaizen Idea proposed: {{title}}.' } },
      { type: 'task_create', params: { title: 'Perform Initial PDCA Scope Review for: {{title}}', priority: 'medium' } }
    ],
    benefit: 'Sustains continuous quality progress loops with prompt review.'
  },
  {
    id: 'tpl_training_failed_quiz',
    name: 'Automated Coaching on Failed Quiz',
    category: 'Training Hub',
    triggerType: 'training:quiz:failed',
    description: 'Monitors Quiz submissions and schedules a personalized training review if an employee falls below passing scores.',
    conditions: [],
    actions: [
      { type: 'notification', params: { channel: 'internal', message: 'Score alert: compliance quiz was not completed. Re-training triggered.' } },
      { type: 'task_create', params: { title: 'Conduct review coaching session with team member', priority: 'low' } }
    ],
    benefit: 'Guarantees continuous personal development and procedural alignment.'
  },
  {
    id: 'tpl_hr_leave_request',
    name: 'Urgent Absence Approval Workflow',
    category: 'HR Management',
    triggerType: 'hr:leave_request:created',
    description: 'Speeds up employee scheduling alignment. Triggers task assignments for department leaders on new leave requests.',
    conditions: [],
    actions: [
      { type: 'notification', params: { channel: 'internal', message: 'Urgent: New employee absence request is waiting for authorization.' } },
      { type: 'task_create', params: { title: 'Review & authorize pending leave request', priority: 'medium' } }
    ],
    benefit: 'Avoids scheduling gaps with active workforce tracking.'
  },
  {
    id: 'tpl_process_map_created',
    name: 'Process Flow Mapping Alignment Checklist',
    category: 'Operations & SOPs',
    triggerType: 'process_map:created',
    description: 'Instantly schedules a standard operating procedure (SOP) compilation as soon as visual process maps are created.',
    conditions: [],
    actions: [
      { type: 'notification', params: { channel: 'internal', message: 'New visual flow created: {{title}}. Preparing SOP layout.' } },
      { type: 'task_create', params: { title: 'Draft corresponding SOP documentation for visual pathway: {{title}}', priority: 'medium' } }
    ],
    benefit: 'Prevents procedural gaps by aligning maps with standard operating documents.'
  },
  {
    id: 'tpl_kb_created_notify',
    name: 'Auto-Notify on New KB Article Creation',
    category: 'Knowledge Base',
    triggerType: 'kb:article:created',
    description: 'When a new Knowledge Base article is successfully created, notify all internal channels and assign an editor to verify the documentation details.',
    conditions: [],
    actions: [
      { type: 'notification', params: { channel: 'internal', message: '📚 New Knowledge Base Article Created: "{{title}}". Verification pending.' } },
      { type: 'task_create', params: { title: 'Review & Verify KB Article: {{title}}', priority: 'medium' } }
    ],
    benefit: 'Ensures standard quality control over published documentation instantly.'
  },
  {
    id: 'tpl_kb_negative_feedback_remedy',
    name: 'Urgent Revision Task on Negative KB Feedback',
    category: 'Knowledge Base',
    triggerType: 'kb:feedback:submitted',
    description: 'When a reader rates a Knowledge Base article as "Not Helpful" (helpful = false), instantly dispatch a warning and schedule a content audit task.',
    conditions: [
      { field: 'helpful', operator: '==', value: 'false' }
    ],
    actions: [
      { type: 'notification', params: { channel: 'internal', message: '⚠️ Article "{{title}}" received negative feedback. Content revision recommended.' } },
      { type: 'task_create', params: { title: 'Revise & Enhance KB Article content: {{title}}', priority: 'high' } }
    ],
    benefit: 'Guarantees continuous refinement of company operational instructions.'
  },
  {
    id: 'tpl_risk_kb_draft_trigger',
    name: 'Auto-Draft KB SOP on High Risk Incident',
    category: 'Risk Management',
    triggerType: 'risk:high_risk_alert',
    description: 'Whenever a critical high-risk alert is triggered, automatically draft a standard incident resolution guide in the Knowledge Base for staff reference.',
    conditions: [],
    actions: [
      { type: 'kb_draft_create', params: { title: 'Incident Resolution SOP: {{name}}', content: '## High Risk Response Plan\n\n**Incident Category**: {{category}}\n**Identified Score**: {{risk_score}}\n\n### Required Action Steps:\n1. Isolate the affected operational branch.\n2. Review risk mitigation directives immediately.\n3. Initiate post-incident review with executive council.', category_id: '1' } }
    ],
    benefit: 'Dramatically reduces reaction lag with standard operational plans.'
  }
];

export const AutomationModule = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<AutomationRule> | null>(null);
  const [selectedModalModule, setSelectedModalModule] = useState<string>('crm');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'logs' | 'templates'>('dashboard');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  
  // Custom states for template library
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [deployingTemplateId, setDeployingTemplateId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rulesRes, logsRes] = await Promise.all([
        fetch('/api/automation/rules'),
        fetch('/api/automation/logs')
      ]);
      const rulesData = await rulesRes.json();
      const logsData = await logsRes.json();
      
      if (Array.isArray(rulesData)) {
        setRules(rulesData);
      }
      if (Array.isArray(logsData)) {
        setLogs(logsData);
      }
    } catch (error) {
      console.error("Failed to fetch automation data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setShowRuleModal(false);
    setEditingRule(null);

    try {
      const method = editingRule.id ? 'PUT' : 'POST';
      const url = editingRule.id ? `/api/automation/rules/${editingRule.id}` : '/api/automation/rules';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRule)
      });

      if (!res.ok) {
        throw new Error(`Failed to save rule: ${res.status}`);
      }

      setEditingRule(null);
      setShowRuleModal(false);
      
      setNotification({
        message: editingRule.id ? "Automation rule revised successfully!" : "Custom automation rule created successfully!",
        type: 'success'
      });
      setTimeout(() => setNotification(null), 4000);
      
      fetchData();
    } catch (error) {
      console.error("Failed to save rule", error);
      setNotification({
        message: error instanceof Error ? error.message : "Failed to save rule",
        type: 'error'
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const toggleRuleStatus = async (rule: AutomationRule) => {
    try {
      const res = await fetch(`/api/automation/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, is_active: !rule.is_active })
      });
      if (res.ok) {
        setNotification({
          message: `Rule "${rule.name}" is now ${!rule.is_active ? 'Active' : 'Paused'}.`,
          type: 'success'
        });
        setTimeout(() => setNotification(null), 3000);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to toggle rule status", error);
    }
  };

  const handleDeleteRule = async () => {
    if (!showDeleteConfirm) return;
    try {
      const res = await fetch(`/api/automation/rules/${showDeleteConfirm}`, { method: 'DELETE' });
      if (res.ok) {
        setShowDeleteConfirm(null);
        setNotification({
          message: "Automation rule removed successfully.",
          type: 'success'
        });
        setTimeout(() => setNotification(null), 3000);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete rule", error);
    }
  };

  const handleDeployTemplate = async (template: typeof AUTOMATION_TEMPLATES[0]) => {
    setDeployingTemplateId(template.id);
    try {
      const res = await fetch('/api/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Preset)`,
          trigger_type: template.triggerType,
          conditions: template.conditions,
          actions: template.actions,
          is_active: true
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to deploy template: ${res.statusText}`);
      }

      setNotification({
        message: `Activated and deployed preset workflow: "${template.name}" successfully!`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 4000);

      await fetchData();
      setActiveTab('rules');
    } catch (error) {
      console.error("Failed to deploy template", error);
      setNotification({
        message: error instanceof Error ? error.message : "Failed to deploy preset template workflow",
        type: 'error'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setDeployingTemplateId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header View (LTR Complete Layout English Only) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Workflow Automation</h1>
          <p className="text-slate-500 mt-1">Automate repetitive tasks, connect your operational modules, and deploy templates with one click.</p>
        </div>
        <button 
          onClick={() => {
            setEditingRule({
              name: '',
              trigger_type: TRIGGER_TYPES[0].id,
              conditions: [],
              actions: [{ type: 'notification', params: { channel: 'internal', message: 'New event: {{name}}' } }],
              is_active: true
            });
            setSelectedModalModule(TRIGGER_TYPES[0].category || 'crm');
            setShowRuleModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/15 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Custom Rule
        </button>
      </div>

      {/* Tabs list & Alerts */}
      <div className="flex flex-col gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-full max-w-3xl overflow-x-auto scrollbar-none" id="automation-navigation-tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-500" />
            Control Dashboard
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'rules' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            Active Rules ({rules.length})
          </button>
          
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'templates' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-4 h-4" />
            Templates Library
            <span className="ml-1 bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-black">Ready</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'logs' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            Execution Logs ({logs.length})
          </button>
        </div>

        {/* Dynamic Alerts Feedback bar */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.98 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.98 }}
              className={`p-3.5 rounded-xl flex items-center justify-between border ${
                notification.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                <span>{notification.message}</span>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600 px-2 py-1 hover:bg-black/5 rounded text-[10px] font-bold"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading automation structures...</p>
        </div>
      ) : activeTab === 'dashboard' ? (
        <AutomationDashboard rules={rules} logs={logs} setActiveTab={setActiveTab} />
      ) : activeTab === 'rules' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule) => (
            <motion.div 
              key={rule.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    rule.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                  )}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingRule(rule);
                        const trig = TRIGGER_TYPES.find(t => t.id === rule.trigger_type);
                        setSelectedModalModule(trig?.category || 'crm');
                        setShowRuleModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{rule.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-full font-semibold text-slate-600">
                    {TRIGGER_TYPES.find(t => t.id === rule.trigger_type)?.name || rule.trigger_type}
                  </span>
                </div>

                <div className="space-y-3 mb-6 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>{rule.conditions?.length || 0} Filter Conditions</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{rule.actions?.length || 0} Auto-Actions Target</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    rule.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                  )} />
                  <span className="text-xs font-semibold text-slate-700">
                    {rule.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <button 
                  onClick={() => toggleRuleStatus(rule)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    rule.is_active ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  )}
                >
                  {rule.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>
            </motion.div>
          ))}
          {rules.length === 0 && (
            <div className="col-span-full py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-slate-500 max-w-xl mx-auto space-y-4">
              <Zap className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700">No Rules Registered Yet</h3>
              <p className="text-xs text-slate-400">
                You do not have any active or passive rules configuration. Create a custom rule or deploy optimized preset workflows from our library!
              </p>
              <button
                onClick={() => setActiveTab('templates')}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition"
              >
                Open Templates Library
              </button>
            </div>
          )}
        </div>
      ) : activeTab === 'templates' ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-900/60 border border-emerald-800/40 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" />
                Zero-Code Deployment
              </div>
              <h2 className="text-xl font-bold">Deploy Prepackaged Workflows</h2>
              <p className="text-slate-300 text-xs mt-1">
                Instantly connect CRM, SOPs, KPIs, and Quality Assurance models. Click any workflow template to activate it instantly inside your workplace.
              </p>
            </div>
            <div className="flex gap-6 text-xs text-slate-300 font-medium">
              <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xl font-black text-emerald-400">{AUTOMATION_TEMPLATES.length}</span>
                <span>Workflows</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xl font-black text-blue-400">4</span>
                <span>Manager Groups</span>
              </div>
            </div>
          </div>

          {/* Filter Pill List */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none border-b border-slate-150">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">Target Area:</span>
            {['All', 'CRM & Sales', 'Operations & SOPs', 'Quality & Compliance', 'KPIs', 'Risk Management', 'Accounting & HR', 'Kaizen Improvement', 'Training Hub', 'HR Management'].map((cat) => {
              const count = cat === 'All' 
                ? AUTOMATION_TEMPLATES.length 
                : AUTOMATION_TEMPLATES.filter(t => t.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/50'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Grid list of templates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {AUTOMATION_TEMPLATES.filter(item => selectedCategory === 'All' || item.category === selectedCategory).map((template) => {
              const triggerObj = TRIGGER_TYPES.find(t => t.id === template.triggerType);
              const TriggerIcon = triggerObj?.icon || Zap;
              const isDeploying = deployingTemplateId === template.id;

              return (
                <div 
                  key={template.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-emerald-200/50 transition-all border-l-4 border-l-emerald-500"
                >
                  <div className="space-y-4">
                    {/* Header: Category Badge and ID */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                        template.category === 'CRM & Sales' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        template.category === 'Operations & SOPs' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        template.category === 'Quality & Compliance' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        template.category === 'Risk Management' ? 'bg-rose-50 text-rose-700 border border-rose-100 font-bold' :
                        template.category === 'Accounting & HR' ? 'bg-amber-50 text-amber-700 border border-amber-100 font-bold' :
                        template.category === 'Kaizen Improvement' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold' :
                        template.category === 'Training Hub' ? 'bg-cyan-50 text-cyan-750 border border-cyan-150 font-bold' :
                        template.category === 'HR Management' ? 'bg-teal-50 text-teal-700 border border-teal-100 font-bold' :
                        'bg-slate-50 text-slate-700 border border-slate-100 font-bold'
                      }`}>
                        {template.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">Preset ID: {template.id}</span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{template.name}</h3>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        {template.description}
                      </p>
                    </div>

                    {/* Visual Pathway Map */}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Real-time automation flow</span>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Trigger node */}
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100/80 shadow-xs font-semibold text-slate-700">
                          <TriggerIcon className="w-3.5 h-3.5 text-amber-500" />
                          <span>{triggerObj?.name || template.triggerType}</span>
                        </div>

                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />

                        {/* Actions nodes */}
                        {template.actions.map((act, aIdx) => {
                          const actionObj = ACTION_TYPES.find(a => a.id === act.type);
                          const ActionIcon = actionObj?.icon || Bell;
                          return (
                            <React.Fragment key={aIdx}>
                              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100/80 shadow-xs font-semibold text-slate-700">
                                <ActionIcon className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{actionObj?.name || act.type}</span>
                              </div>
                              {aIdx < template.actions.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Benefit Highlight info */}
                    <div className="bg-emerald-50/40 border border-emerald-100/30 rounded-lg px-3 py-2 flex items-start gap-2 text-xs text-emerald-800">
                      <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Impact:</strong> {template.benefit}</span>
                    </div>
                  </div>

                  {/* Deploy Button */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No Setup Required</span>
                    <button
                      disabled={isDeploying}
                      onClick={() => handleDeployTemplate(template)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isDeploying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          Deploy Template
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rule</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trigger Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Executed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{log.rule_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                      log.execution_status === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {log.execution_status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {log.execution_status === 'success' ? 'Success' : 'Failed'}
                    </div>
                    {log.error_message && (
                      <p className="text-[10px] text-rose-500 mt-1 max-w-xs truncate">{log.error_message}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.trigger_data)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(log.executed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="py-16 text-center text-slate-450 text-sm font-medium bg-slate-50 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center p-6 rounded-b-xl">
              <History className="w-8 h-8 text-slate-300 mb-2" />
              <span>No workflow execution logs recorded yet.</span>
            </div>
          )}
        </div>
      )}

      {/* Rule Modal */}
      <AnimatePresence>
        {showRuleModal && editingRule && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRuleModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveRule}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {editingRule.id ? 'Edit Automation Rule' : 'Create New Rule'}
                      </h2>
                      <p className="text-xs text-slate-500">Define triggers, conditions, and actions.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowRuleModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">Rule Name</label>
                    <input 
                      type="text"
                      required
                      value={editingRule.name}
                      onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="e.g., Notify Manager on High Value Deal"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-slate-700">Target Module / موديول العمل المستهدف</label>
                      <select 
                        required
                        value={selectedModalModule}
                        onChange={e => {
                          const newMod = e.target.value;
                          setSelectedModalModule(newMod);
                          // Auto select first trigger in new module
                          const firstTrig = TRIGGER_TYPES.find(t => t.category === newMod);
                          if (firstTrig) {
                            setEditingRule({ ...editingRule, trigger_type: firstTrig.id });
                          }
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                      >
                        {MODULE_CATEGORIES.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-slate-700">When this happens (Trigger) / عند حدوث</label>
                      <select 
                        required
                        value={editingRule.trigger_type}
                        onChange={e => setEditingRule({ ...editingRule, trigger_type: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                      >
                        {TRIGGER_TYPES.filter(t => t.category === selectedModalModule).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-slate-700">Status / الحالة</label>
                      <div className="flex items-center gap-3 h-[50px]">
                        <button
                          type="button"
                          onClick={() => setEditingRule({ ...editingRule, is_active: !editingRule.is_active })}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                            editingRule.is_active ? "bg-emerald-500" : "bg-slate-300"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            editingRule.is_active ? "translate-x-6" : "translate-x-1"
                          )} />
                        </button>
                        <span className="text-sm font-medium text-slate-600">
                          {editingRule.is_active ? 'Active / نشط' : 'Inactive / معطل'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-slate-700">If these conditions are met</label>
                      <button 
                        type="button"
                        onClick={() => setEditingRule({
                          ...editingRule,
                          conditions: [...(editingRule.conditions || []), { field: '', operator: '==', value: '' }]
                        })}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Condition
                      </button>
                    </div>
                    <div className="space-y-3">
                      {editingRule.conditions?.map((condition, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <input 
                            placeholder="Field"
                            value={condition.field}
                            onChange={e => {
                              const newConditions = [...editingRule.conditions!];
                              newConditions[idx].field = e.target.value;
                              setEditingRule({ ...editingRule, conditions: newConditions });
                            }}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          />
                          <select 
                            value={condition.operator}
                            onChange={e => {
                              const newConditions = [...editingRule.conditions!];
                              newConditions[idx].operator = e.target.value;
                              setEditingRule({ ...editingRule, conditions: newConditions });
                            }}
                            className="w-24 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="==">==</option>
                            <option value="!=">!=</option>
                            <option value=">">&gt;</option>
                            <option value="<">&lt;</option>
                            <option value="contains">contains</option>
                          </select>
                          <input 
                            placeholder="Value"
                            value={condition.value}
                            onChange={e => {
                              const newConditions = [...editingRule.conditions!];
                              newConditions[idx].value = e.target.value;
                              setEditingRule({ ...editingRule, conditions: newConditions });
                            }}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const newConditions = editingRule.conditions!.filter((_, i) => i !== idx);
                              setEditingRule({ ...editingRule, conditions: newConditions });
                            }}
                            className="p-2 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!editingRule.conditions || editingRule.conditions.length === 0) && (
                        <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-sm text-slate-400">
                          No conditions. This rule will always trigger.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-slate-700">Then perform these actions</label>
                      <button 
                        type="button"
                        onClick={() => setEditingRule({
                          ...editingRule,
                          actions: [...(editingRule.actions || []), { type: 'notification', params: { channel: 'internal', message: '' } }]
                        })}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Action
                      </button>
                    </div>
                    <div className="space-y-4">
                      {editingRule.actions?.map((action, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                          <div className="flex justify-between items-center">
                            <select 
                              value={action.type}
                              onChange={e => {
                                const newActions = [...editingRule.actions!];
                                newActions[idx].type = e.target.value;
                                newActions[idx].params = {};
                                setEditingRule({ ...editingRule, actions: newActions });
                              }}
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium"
                            >
                              {ACTION_TYPES.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                            <button 
                              type="button"
                              onClick={() => {
                                const newActions = editingRule.actions!.filter((_, i) => i !== idx);
                                setEditingRule({ ...editingRule, actions: newActions });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {action.type === 'notification' && (
                            <div className="grid grid-cols-1 gap-3">
                              <select 
                                value={action.params.channel}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.channel = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              >
                                <option value="internal">Internal Message</option>
                                <option value="whatsapp">WhatsApp (API)</option>
                                <option value="slack">Slack (Webhook)</option>
                              </select>
                              <textarea 
                                placeholder="Message (use {{field}} for dynamic data)"
                                value={action.params.message}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.message = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm h-20"
                              />
                            </div>
                          )}

                          {action.type === 'task_create' && (
                            <div className="grid grid-cols-1 gap-3">
                              <input 
                                placeholder="Task Title"
                                value={action.params.title}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.title = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                              <select 
                                value={action.params.priority}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.priority = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                              </select>
                            </div>
                          )}

                          {action.type === 'status_update' && (
                            <div className="grid grid-cols-2 gap-3">
                              <input 
                                placeholder="Table Name"
                                value={action.params.table}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.table = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                              <input 
                                placeholder="Status Value"
                                value={action.params.status_value}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.status_value = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                          )}

                          {action.type === 'kb_draft_create' && (
                            <div className="grid grid-cols-1 gap-3">
                              <input 
                                placeholder="Article Title (e.g., Guide for {{name}})"
                                value={action.params.title || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.title = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold"
                              />
                              <textarea 
                                placeholder="Article Content (Markdown supported, use {{field}} for details)"
                                value={action.params.content || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.content = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm h-24"
                              />
                              <input 
                                placeholder="Category ID (optional, default 1)"
                                value={action.params.category_id || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.category_id = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                          )}

                          {action.type === 'kb_status_update' && (
                            <div className="grid grid-cols-1 gap-3">
                              <input 
                                placeholder="Article ID (or template field like {{id}})"
                                value={action.params.article_id || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.article_id = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                              <select 
                                value={action.params.status || 'Draft'}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.status = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              >
                                <option value="Draft">Draft / مسودة</option>
                                <option value="Published">Published / منشور</option>
                                <option value="Archived">Archived / مؤرشف</option>
                              </select>
                            </div>
                          )}

                          {action.type === 'kb_link_sop' && (
                            <div className="grid grid-cols-2 gap-3">
                              <input 
                                placeholder="Article ID (e.g. {{id}})"
                                value={action.params.article_id || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.article_id = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                              <input 
                                placeholder="SOP ID (or template field)"
                                value={action.params.sop_id || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.sop_id = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                          )}

                          {action.type === 'crm_lead_status_update' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input 
                                placeholder="Lead ID (or field like {{id}})"
                                value={action.params.lead_id || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.lead_id = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                              <select 
                                value={action.params.status || 'Qualified'}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.status = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              >
                                <option value="New">New / جديد</option>
                                <option value="Contacted">Contacted / تم الاتصال</option>
                                <option value="Qualified">Qualified / مؤهل</option>
                                <option value="Unqualified">Unqualified / غير مؤهل</option>
                                <option value="Converted">Converted / تم تحويله</option>
                              </select>
                            </div>
                          )}

                          {action.type === 'crm_add_deal_note' && (
                            <div className="grid grid-cols-1 gap-3">
                              <input 
                                placeholder="Deal ID (or field like {{id}})"
                                value={action.params.deal_id || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.deal_id = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                              <textarea 
                                placeholder="Activity / Note content (use {{field}} for details)"
                                value={action.params.note_content || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.note_content = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm h-20"
                              />
                            </div>
                          )}

                          {action.type === 'sop_publish' && (
                            <div className="grid grid-cols-1 gap-3">
                              <input 
                                placeholder="SOP ID (or field like {{id}})"
                                value={action.params.sop_id || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.sop_id = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                          )}

                          {action.type === 'qa_trigger_audit' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input 
                                placeholder="Audit Title (e.g. Audit for {{name}})"
                                value={action.params.audit_title || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.audit_title = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                              <input 
                                placeholder="Category / القسم (e.g. Finance)"
                                value={action.params.category || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.category = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                          )}

                          {action.type === 'risk_escalate' && (
                            <div className="grid grid-cols-1 gap-3">
                              <input 
                                placeholder="Risk Incident ID (or field like {{id}})"
                                value={action.params.risk_id || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.risk_id = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                          )}

                          {action.type === 'kaizen_approve' && (
                            <div className="grid grid-cols-1 gap-3">
                              <input 
                                placeholder="Kaizen Suggestion ID (or field like {{id}})"
                                value={action.params.suggestion_id || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.suggestion_id = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                          )}

                          {action.type === 'send_email_external' && (
                            <div className="grid grid-cols-1 gap-3">
                              <input 
                                placeholder="Recipient Email (e.g., {{email}} or direct address)"
                                value={action.params.to_email || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.to_email = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                              <input 
                                placeholder="Email Subject / العنوان"
                                value={action.params.subject || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.subject = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              />
                              <textarea 
                                placeholder="Email Body Content / محتوى الرسالة"
                                value={action.params.body || ''}
                                onChange={e => {
                                  const newActions = [...editingRule.actions!];
                                  newActions[idx].params.body = e.target.value;
                                  setEditingRule({ ...editingRule, actions: newActions });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm h-24"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowRuleModal(false)}
                    className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                  >
                    Save Rule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmation 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDeleteRule}
        title="Delete Automation Rule"
        message="Are you sure you want to delete this automation rule? Any linked automatic operations will stop immediately."
      />
    </div>
  );
};
