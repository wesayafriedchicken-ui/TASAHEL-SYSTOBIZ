import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Database,
  Layers,
  Link,
  Table,
  RefreshCw,
  Clock,
  Zap,
  Save,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Copy,
  FolderSync,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ListOrdered,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type CaseType = 'Complaints' | 'Delays' | 'Refunds' | 'Cancellations' | 'NPS';

export interface CaseTypeConfig {
  spreadsheet_mode: 'shared' | 'custom';
  sheet_url: string;
  sheet_tab_name: string;
  sync_frequency: string;
  status: 'Active' | 'Connected' | 'Pending' | 'Disabled';
  fetched_columns: string[];
  column_mapping: Record<string, string>;
}

export interface QAIntegrationSettingsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  isPage?: boolean;
}

// Core field definition with case-type restrictions and contextual configurations
export interface MappingFieldDefinition {
  key: string;
  label: string;
  arLabel: string;
  category: string;
  required: boolean;
  sample: string;
  aliases: string[];
  applicableCases?: CaseType[]; // If undefined, applies to all 5 case types
  caseOverrides?: Partial<Record<CaseType, {
    label?: string;
    arLabel?: string;
    sample?: string;
    aliases?: string[];
  }>>;
}

export const MAPPING_FIELDS: MappingFieldDefinition[] = [
  // 1. Core ID Category
  {
    key: 'transaction_id',
    label: 'Transaction / Request ID',
    arLabel: 'معرف المعاملة / رقم الطلب',
    category: 'Core ID',
    required: true,
    sample: 'TRX-10928 / REQ-4402',
    aliases: ['order_id', 'request_id', 'id', 'transaction_id', 'transaction_ref', 'survey_response_id', 'refund_order_id', 'order_number', 'ticket_id', 'رقم_الطلب', 'معرف_الطلب', 'رقم_المعاملة', 'كود_المعاملة', 'معرف_الحالة', 'رقم_التذكرة'],
    caseOverrides: {
      'Complaints': { label: 'Complaint / Request ID', arLabel: 'معرف الشكوى / رقم الطلب (Request_ID)', sample: 'REQ-2026-091' },
      'Delays': { label: 'Transaction Ref / Order ID', arLabel: 'معرف التأخير / رقم المعاملة (Transaction_Ref)', sample: 'TRX-DL-8831' },
      'Refunds': { label: 'Refund Order ID', arLabel: 'معرف طلب الاسترداد (Refund_Order_ID)', sample: 'REF-ORD-4402' },
      'Cancellations': { label: 'Cancelled Order ID', arLabel: 'رقم الطلب الملغي (Order_ID)', sample: 'ORD-CN-5519' },
      'NPS': { label: 'Survey Response ID', arLabel: 'معرف استجابة الاستبيان (Survey_Response_ID)', sample: 'SRV-RESP-1092' }
    }
  },
  {
    key: 'qa_reference_number',
    label: 'QA Reference Number',
    arLabel: 'الرقم المرجعي للجودة (QA_Ref_No)',
    category: 'Core ID',
    required: false,
    sample: 'QA-REF-2026-088',
    aliases: ['qa_reference_number', 'qa_ref', 'qa_ref_no', 'reference_number', 'ref_no', 'qa_id', 'qa_code', 'الرقم_المرجعي', 'كود_الجودة', 'مرجع_الجودة', 'رقم_المراجعة']
  },

  // 2. Customer Category
  {
    key: 'customer_name',
    label: 'Customer Name',
    arLabel: 'اسم العميل',
    category: 'Customer',
    required: true,
    sample: 'Acme International / Mohamed Ali',
    aliases: ['customer_name', 'customer_full_name', 'client_name', 'name', 'customer', 'client', 'اسم_العميل', 'العميل', 'اسم_المشتري', 'اسم_المستلم'],
    caseOverrides: {
      'Delays': { label: 'Client / Customer Name', arLabel: 'اسم العميل / المستلم (Client_Name)', sample: 'Global Logistics LLC' },
      'Refunds': { label: 'Customer Full Name', arLabel: 'الاسم الكامل للعميل (Customer_Full_Name)', sample: 'Sarah Mohamed' },
      'NPS': { label: 'Respondent / Client Name', arLabel: 'اسم العميل المجيب (Client_Name)', sample: 'Nour El-Din' }
    }
  },
  {
    key: 'customer_phone',
    label: 'Customer Phone',
    arLabel: 'رقم هاتف / جوال العميل',
    category: 'Customer',
    required: false,
    sample: '+20 100 123 4567',
    aliases: ['customer_phone', 'phone', 'phone_number', 'contact_number', 'customer_mobile', 'mobile', 'tel', 'phone_no', 'رقم_الهاتف', 'الهاتف', 'الموبايل', 'الجوال', 'رقم_التواصل'],
    caseOverrides: {
      'Delays': { label: 'Contact Number', arLabel: 'رقم التواصل للعميل (Contact_Number)' },
      'Refunds': { label: 'Customer Phone Number', arLabel: 'رقم هاتف العميل المسترد (Phone_Number)' },
      'NPS': { label: 'Customer Mobile', arLabel: 'رقم جوال العميل (Customer_Mobile)' }
    }
  },

  // 3. Staff & Ownership Category
  {
    key: 'agent_name',
    label: 'Agent / Staff Name',
    arLabel: 'اسم الموظف / الوكيل المعني',
    category: 'Staff & Ownership',
    required: true,
    sample: 'Ahmed Ramadan',
    aliases: ['agent_name', 'staff_name', 'assigned_agent', 'finance_officer', 'sales_rep', 'support_agent', 'customer_support_agent', 'employee_name', 'agent', 'اسم_الموظف', 'الموظف', 'الوكيل', 'المسؤول', 'الموظف_المعني'],
    caseOverrides: {
      'Delays': { label: 'Assigned Agent / Courier', arLabel: 'الموظف / السائق المعني (Assigned_Agent)' },
      'Refunds': { label: 'Finance Officer / Agent', arLabel: 'المسؤول المالي / الوكيل (Finance_Officer)' },
      'Cancellations': { label: 'Sales Rep / Staff', arLabel: 'مندوب المبيعات / الموظف (Sales_Rep)' },
      'NPS': { label: 'Customer Support Agent', arLabel: 'موظف خدمة العملاء المقيم (Customer_Support_Agent)' }
    }
  },
  {
    key: 'agent_id',
    label: 'Agent ID / Employee Code',
    arLabel: 'كود الموظف / الرقم الوظيفي (Agent_ID)',
    category: 'Staff & Ownership',
    required: false,
    sample: 'EMP-4401',
    aliases: ['agent_id', 'employee_id', 'agent_code', 'staff_id', 'emp_no', 'emp_id', 'كود_الموظف', 'رقم_الموظف', 'الرقم_الوظيفي', 'معرف_الموظف']
  },
  {
    key: 'handled_by',
    label: 'Handled By / Executor',
    arLabel: 'الموظف المعالج / منفذ الطلب (Handled_By)',
    category: 'Staff & Ownership',
    required: false,
    sample: 'Kareem Tarek',
    aliases: ['handled_by', 'processor', 'handler', 'executor', 'fulfilled_by', 'processed_by', 'المنفذ', 'معالج_الطلب', 'معالجة_بواسطة', 'مسؤول_التنفيذ']
  },
  {
    key: 'owner',
    label: 'Owner / Supervisor',
    arLabel: 'المشرف / مسؤول الحالة (Owner)',
    category: 'Staff & Ownership',
    required: false,
    sample: 'Operations Lead',
    aliases: ['owner', 'ticket_owner', 'case_owner', 'account_owner', 'survey_owner', 'lead_owner', 'lead', 'supervisor', 'المالك', 'المشرف', 'مسؤول_الحالة', 'مالك_الملف'],
    caseOverrides: {
      'Delays': { label: 'Ticket Owner', arLabel: 'مسؤول تذكرة التأخير (Ticket_Owner)' },
      'Refunds': { label: 'Case Owner', arLabel: 'مالك ملف الاسترداد (Case_Owner)' },
      'Cancellations': { label: 'Account Owner', arLabel: 'مسؤول حساب العميل (Account_Owner)' },
      'NPS': { label: 'Survey Owner', arLabel: 'مسؤول الاستبيان (Survey_Owner)' }
    }
  },
  {
    key: 'operation_owner',
    label: 'Operation Owner / Lead',
    arLabel: 'مسؤول العمليات والتشغيل (Operation_Owner)',
    category: 'Staff & Ownership',
    required: false,
    sample: 'Warehouse Dispatcher',
    aliases: ['operation_owner', 'operations_owner', 'operations_lead', 'finance_supervisor', 'ops_manager', 'qa_lead', 'operations_manager', 'مسؤول_العمليات', 'مشرف_العمليات', 'المشرف_المالي', 'قائد_التشغيل'],
    caseOverrides: {
      'Delays': { label: 'Operations Lead', arLabel: 'قائد عمليات الشحن والتنفيذ (Operations_Lead)' },
      'Refunds': { label: 'Finance Supervisor', arLabel: 'المشرف المالي للاسترداد (Finance_Supervisor)' },
      'Cancellations': { label: 'Ops Manager', arLabel: 'مدير عمليات الإلغاء (Ops_Manager)' },
      'NPS': { label: 'QA Lead', arLabel: 'قائد الجودة والمتابعة (QA_Lead)' }
    }
  },
  {
    key: 'auditor_name',
    label: 'Auditor / Evaluator Name',
    arLabel: 'اسم مراجع الجودة / المدقق (Auditor_Name)',
    category: 'Staff & Ownership',
    required: false,
    sample: 'Sarah Jenkins',
    aliases: ['auditor_name', 'auditor', 'reviewer', 'qa_auditor', 'evaluator', 'اسم_المراجع', 'المدقق', 'مراجع_الجودة', 'فاحص_الجودة', 'المقيم']
  },
  {
    key: 'assigned_manager',
    label: 'Assigned Manager',
    arLabel: 'المدير المسؤول عن الاعتماد (Assigned_Manager)',
    category: 'Staff & Ownership',
    required: false,
    sample: 'Mostafa Kamel',
    aliases: ['assigned_manager', 'manager', 'approver', 'supervisor', 'المدير_المسؤول', 'المشرف_المعتمد', 'المدير_المباشر', 'مدير_القطاع']
  },

  // 4. Timeline Category
  {
    key: 'order_date',
    label: 'Date / Timestamp',
    arLabel: 'التاريخ والوقت الرئيسي للمعاملة',
    category: 'Timeline',
    required: true,
    sample: '2026-08-16 14:30',
    aliases: ['date', 'timestamp', 'date_time', 'process_date', 'cancellation_timestamp', 'submission_time', 'created_at', 'order_date', 'التاريخ', 'الوقت', 'تاريخ_الطلب', 'وقت_التسجيل', 'تاريخ_المعاملة'],
    caseOverrides: {
      'Complaints': { label: 'Date & Time', arLabel: 'تاريخ ووقت تسجيل الشكوى (Date_Time)' },
      'Delays': { label: 'Delay Timestamp', arLabel: 'تاريخ ووقت تسجيل التأخير (Timestamp)' },
      'Refunds': { label: 'Process Date', arLabel: 'تاريخ معالجة الاسترداد (Process_Date)' },
      'Cancellations': { label: 'Cancellation Timestamp', arLabel: 'تاريخ ووقت الإلغاء (Cancellation_Timestamp)' },
      'NPS': { label: 'Submission Time', arLabel: 'وقت تقديم التقييم (Submission_Time)' }
    }
  },
  {
    key: 'request_date',
    label: 'Request / Creation Date',
    arLabel: 'تاريخ إنشاء الطلب (Request_Date)',
    category: 'Timeline',
    required: false,
    sample: '2026-08-15',
    aliases: ['request_date', 'order_date', 'submission_date', 'booking_date', 'interaction_date', 'creation_date', 'created_date', 'تاريخ_الطلب', 'تاريخ_الإنشاء', 'تاريخ_الحجز', 'تاريخ_التقديم'],
    caseOverrides: {
      'Delays': { label: 'Order / Dispatch Date', arLabel: 'تاريخ الطلب أو الشحن الأصلي (Order_Date)' },
      'Refunds': { label: 'Submission Date', arLabel: 'تاريخ تقديم طلب الاسترداد (Submission_Date)' },
      'Cancellations': { label: 'Booking Date', arLabel: 'تاريخ حجز الطلب الملغي (Booking_Date)' },
      'NPS': { label: 'Interaction Date', arLabel: 'تاريخ تفاعل العميل (Interaction_Date)' }
    }
  },
  {
    key: 'survey_date',
    label: 'Survey / Audit Date',
    arLabel: 'تاريخ التدقيق / التقييم (Survey_Date)',
    category: 'Timeline',
    required: false,
    sample: '2026-08-16',
    aliases: ['survey_date', 'evaluation_date', 'audit_date', 'feedback_date', 'survey_timestamp', 'تاريخ_التقييم', 'تاريخ_الاستبيان', 'تاريخ_التدقيق', 'تاريخ_المراجعة'],
    caseOverrides: {
      'Delays': { label: 'Evaluation Date', arLabel: 'تاريخ تقييم التأخير (Evaluation_Date)' },
      'Refunds': { label: 'Audit Date', arLabel: 'تاريخ تدقيق الاسترداد (Audit_Date)' },
      'Cancellations': { label: 'Feedback Date', arLabel: 'تاريخ تسجيل سبب الإلغاء (Feedback_Date)' },
      'NPS': { label: 'Survey Timestamp', arLabel: 'التوقيت الدقيق للاستبيان (Survey_Timestamp)' }
    }
  },

  // 5. Classification Category
  {
    key: 'department',
    label: 'Department',
    arLabel: 'القسم / الإدارة المعنية (Department)',
    category: 'Classification',
    required: false,
    sample: 'Operations / Customer Service / Finance',
    aliases: ['department', 'dept', 'division', 'team', 'business_unit', 'القسم', 'الإدارة', 'الفريق', 'الوحدة', 'جهة_العمل']
  },
  {
    key: 'request_type',
    label: 'Request / Service Type',
    arLabel: 'نوع الطلب / الخدمة (Request_Type)',
    category: 'Classification',
    required: false,
    sample: 'Billing Dispute / Delivery Delay',
    aliases: ['request_type', 'service_type', 'incident_type', 'service_category', 'refund_category', 'product_type', 'service_delivered', 'type', 'category', 'نوع_الطلب', 'نوع_الخدمة', 'التصنيف', 'النوع', 'فئة_الخدمة'],
    caseOverrides: {
      'Complaints': { label: 'Request Type (Complaint)', arLabel: 'نوع الشكوى / المشكلة (Request_Type)' },
      'Delays': { label: 'Service Category', arLabel: 'تصنيف خدمة التأخير (Service_Category)' },
      'Refunds': { label: 'Refund Category', arLabel: 'فئة الاسترداد (Refund_Category)' },
      'Cancellations': { label: 'Product / Service Type', arLabel: 'نوع المنتج / الخدمة الملغاة (Product_Type)' },
      'NPS': { label: 'Service Delivered', arLabel: 'الخدمة المقدمة الخاضعة للتقييم (Service_Delivered)' }
    }
  },
  {
    key: 'request_sub_type',
    label: 'Request Sub Type',
    arLabel: 'النوع الفرعي للطلب / السبب التفصيلي (Sub_Type)',
    category: 'Classification',
    required: false,
    sample: 'Double Charge / Late Pickup',
    aliases: ['request_sub_type', 'sub_type', 'delay_sub_reason', 'refund_sub_type', 'cancellation_sub_reason', 'feedback_sub_category', 'sub_category', 'reason', 'النوع_الفرعي', 'التصنيف_الفرعي', 'سبب_فرعي', 'الفئة_الفرعية'],
    caseOverrides: {
      'Complaints': { label: 'Request Sub Type', arLabel: 'التصنيف الفرعي للشكوى (Request_Sub_Type)' },
      'Delays': { label: 'Delay Sub Reason', arLabel: 'السبب الفرعي للتأخير (Delay_Sub_Reason)' },
      'Refunds': { label: 'Refund Sub Type', arLabel: 'النوع الفرعي للاسترداد (Refund_Sub_Type)' },
      'Cancellations': { label: 'Cancellation Sub Reason', arLabel: 'السبب الفرعي للإلغاء (Cancellation_Sub_Reason)' },
      'NPS': { label: 'Feedback Sub Category', arLabel: 'الفئة الفرعية للملاحظة (Feedback_Sub_Category)' }
    }
  },
  {
    key: 'root_cause',
    label: 'Root Cause',
    arLabel: 'السبب الجذري للمشكلة (Root_Cause)',
    category: 'Classification',
    required: false,
    sample: 'Courier Vehicle Breakdown / SLA Failure',
    aliases: ['root_cause', 'primary_cause', 'main_reason', 'cause', 'problem_cause', 'السبب_الجذري', 'سبب_المشكلة', 'السبب_الرئيسي', 'أصل_الخلل']
  },
  {
    key: 'sub_reason',
    label: 'Sub Reason',
    arLabel: 'السبب الفرعي للخطأ (Sub_Reason)',
    category: 'Classification',
    required: false,
    sample: 'Address Ambiguity / Dispatch Delay',
    aliases: ['sub_reason', 'secondary_reason', 'detailed_reason', 'sub_cause', 'السبب_الفرعي', 'تفصيل_السبب', 'سبب_ثانوي']
  },
  {
    key: 'error_classification',
    label: 'Error Classification',
    arLabel: 'تصنيف الخطأ (Human / Process / System)',
    category: 'Classification',
    required: false,
    sample: 'Process Gap / Human Error / Tech Defect',
    aliases: ['error_classification', 'error_type', 'defect_type', 'failure_category', 'error_category', 'تصنيف_الخطأ', 'نوع_الخطأ', 'فئة_الخلل', 'تصنيف_العيب']
  },

  // 6. Performance & QA Category
  {
    key: 'sla_status',
    label: 'SLA Status',
    arLabel: 'حالة الالتزام باتفاقية الخدمة (SLA_Status)',
    category: 'Performance & QA',
    required: true,
    sample: 'Met SLA / Breached SLA / At Risk',
    aliases: ['sla_status', 'sla_compliance', 'sla_state', 'sla_response', 'sla', 'sla_result', 'حالة_sla', 'الالتزام_بالوقت', 'مستوى_الخدمة', 'امتثال_sla'],
    caseOverrides: {
      'Delays': { label: 'SLA Compliance', arLabel: 'مستوى الامتثال لـ SLA (SLA_Compliance)' },
      'Refunds': { label: 'SLA State', arLabel: 'حالة SLA للاسترداد (SLA_State)' },
      'NPS': { label: 'SLA Response', arLabel: 'سرعة الاستجابة لـ SLA (SLA_Response)' }
    }
  },
  {
    key: 'qa_status',
    label: 'QA Audit Status',
    arLabel: 'نتيجة تدقيق الجودة (Pass / Fail / Pending)',
    category: 'Performance & QA',
    required: false,
    sample: 'Pass / Fail / Critical Defect',
    aliases: ['qa_status', 'audit_status', 'audit_result', 'evaluation_status', 'audit_score', 'حالة_الجودة', 'نتيجة_التدقيق', 'نتيجة_التقييم', 'حالة_المراجعة']
  },

  // 7. Operations Category
  {
    key: 'operations_status',
    label: 'Operations Status',
    arLabel: 'حالة العمليات والتشغيل (Operations_Status)',
    category: 'Operations',
    required: false,
    sample: 'In Progress / Resolved / Dispatched',
    aliases: ['operations_status', 'fulfillment_status', 'accounting_status', 'ops_status', 'operations_health', 'status', 'delivery_status', 'حالة_العمليات', 'حالة_التشغيل', 'الحالة_المحاسبية', 'حالة_التنفيذ'],
    caseOverrides: {
      'Delays': { label: 'Fulfillment Status', arLabel: 'حالة تنفيذ وتسليم الشحنة (Fulfillment_Status)' },
      'Refunds': { label: 'Accounting Status', arLabel: 'الحالة المحاسبية والصرف (Accounting_Status)' },
      'Cancellations': { label: 'Ops Status', arLabel: 'حالة العمليات للإلغاء (Ops_Status)' },
      'NPS': { label: 'Operations Health', arLabel: 'صحة العمليات والخدمة (Operations_Health)' }
    }
  },
  {
    key: 'workflow_status',
    label: 'Workflow / Ticket Status',
    arLabel: 'حالة التذكرة ومسار العمل (Workflow_Status)',
    category: 'Operations',
    required: false,
    sample: 'Under Review / Resolved / Closed',
    aliases: ['workflow_status', 'case_status', 'ticket_status', 'ticket_state', 'status', 'resolution_status', 'حالة_التذكرة', 'مسار_العمل', 'حالة_الحالة', 'مرحلة_المعالجة']
  },
  {
    key: 'manager_approval',
    label: 'Manager Approval',
    arLabel: 'اعتماد وموافقة المدير (Manager_Approval)',
    category: 'Operations',
    required: false,
    sample: 'Approved / Pending / Rejected',
    aliases: ['manager_approval', 'approval_status', 'manager_status', 'approval', 'approval_state', 'موافقة_المدير', 'اعتماد_المدير', 'حالة_الاعتماد']
  },
  {
    key: 'status_on_system',
    label: 'Status on Main System',
    arLabel: 'هل مسجل على النظام الرئيسي؟ (Status_On_System)',
    category: 'Operations',
    required: false,
    sample: 'Yes / No',
    aliases: ['status_on_system', 'system_status', 'logged_on_system', 'registered_on_system', 'in_system', 'مسجل_بالنظام', 'مسجل_على_السيستم', 'حالة_النظام']
  },

  // 8. Financials & Liability Category
  {
    key: 'order_amount',
    label: 'Order / Transaction Value ($)',
    arLabel: 'قيمة الطلب / المعاملة المالية (Order_Amount)',
    category: 'Financials & Liability',
    required: false,
    sample: '1850.00',
    aliases: ['order_amount', 'order_value', 'amount', 'total_amount', 'transaction_value', 'price', 'total', 'قيمة_الطلب', 'المبلغ', 'قيمة_المعاملة', 'المبلغ_الكلي', 'سعر_الطلب'],
    caseOverrides: {
      'Delays': { label: 'Order Value ($)', arLabel: 'قيمة الطلب / الشحنة المتأخرة (Order_Value)' },
      'Refunds': { label: 'Original Order Amount ($)', arLabel: 'قيمة الطلب الأصلي (Order_Amount)' },
      'Cancellations': { label: 'Amount Lost ($)', arLabel: 'المبلغ المفقود من الإلغاء (Amount_Lost)' },
      'NPS': { label: 'Ticket Cost / Fee ($)', arLabel: 'تكلفة التذكرة / رسوم الخدمة (Ticket_Cost)' }
    }
  },
  {
    key: 'refund_amount',
    label: 'Refund Amount ($)',
    arLabel: 'مبلغ الاسترداد المالي (Refund_Amount)',
    category: 'Financials & Liability',
    required: false,
    sample: '1850.00',
    aliases: ['refund_amount', 'amount_refunded', 'refunded_sum', 'refund_value', 'مبلغ_الاسترداد', 'قيمة_الاسترداد', 'المبلغ_المسترد']
  },
  {
    key: 'lose_on_employee',
    label: 'Financial Penalty on Employee',
    arLabel: 'تحميل الخطأ المالي على الموظف (Lose_On_Employee)',
    category: 'Financials & Liability',
    required: false,
    sample: 'Yes / No',
    aliases: ['lose_on_employee', 'employee_deduction', 'penalty_applied', 'charge_employee', 'liable_employee', 'تحميل_على_الموظف', 'خصم_الموظف', 'تحميل_الخسارة', 'غرامة_الموظف']
  },
  {
    key: 'lose_employee_name',
    label: 'Liable Employee Name',
    arLabel: 'اسم الموظف المتحمل للخصم (Lose_Employee_Name)',
    category: 'Financials & Liability',
    required: false,
    sample: 'Kareem Tarek',
    aliases: ['lose_employee_name', 'penalized_employee', 'liable_staff', 'employee_penalized', 'الموظف_المتحمل', 'اسم_الموظف_المخصوم_منه', 'الموظف_المسؤول_ماليا']
  },
  {
    key: 'lose_employee_id',
    label: 'Liable Employee ID',
    arLabel: 'كود الموظف المتحمل للخصم (Lose_Employee_ID)',
    category: 'Financials & Liability',
    required: false,
    sample: 'EMP-1049',
    aliases: ['lose_employee_id', 'penalized_emp_id', 'liable_emp_id', 'كود_الموظف_المتحمل', 'رقم_الموظف_المخصوم']
  },
  {
    key: 'lose_amount',
    label: 'Penalty / Deduction Amount ($)',
    arLabel: 'قيمة المبلغ المحمل على الموظف (Lose_Amount)',
    category: 'Financials & Liability',
    required: false,
    sample: '250.00',
    aliases: ['lose_amount', 'penalty_amount', 'deduction_amount', 'charge_amount', 'مبلغ_الخصم', 'قيمة_التحميل', 'مبلغ_الغرامة']
  },
  {
    key: 'lose_status',
    label: 'Penalty Status',
    arLabel: 'حالة الخصم (Lose_Status)',
    category: 'Financials & Liability',
    required: false,
    sample: 'Accepted / Disputed / Waived',
    aliases: ['lose_status', 'deduction_status', 'penalty_status', 'charge_status', 'حالة_الخصم', 'حالة_التحميل', 'حالة_الغرامة']
  },

  // 9. Actions & Notes Category
  {
    key: 'corrective_action',
    label: 'Corrective Action (CAPA)',
    arLabel: 'الإجراء التصحيحي المعتمد (Corrective_Action)',
    category: 'Actions & Notes',
    required: false,
    sample: 'Refresher training on SLA rules / Process Revision',
    aliases: ['corrective_action', 'capa', 'action_taken', 'fix_action', 'remedy', 'الإجراء_التصحيحي', 'الإجراء_المتخذ', 'خطة_المعالجة', 'التصحيح']
  },
  {
    key: 'action_required',
    label: 'Immediate Action Required',
    arLabel: 'الإجراء الفوري المطلوب (Action_Required)',
    category: 'Actions & Notes',
    required: false,
    sample: 'Issue expedited dispatch / Call client back',
    aliases: ['action_required', 'required_action', 'immediate_action', 'next_step', 'الإجراء_المطلوب', 'العمل_المطلوب', 'الخطوة_المطلوبة']
  },
  {
    key: 'action_plan_required',
    label: 'Action Plan Required',
    arLabel: 'هل تتطلب الحالة خطة عمل رسمية؟ (Action_Plan_Required)',
    category: 'Actions & Notes',
    required: false,
    sample: 'Yes / No',
    aliases: ['action_plan_required', 'requires_plan', 'capa_required', 'need_action_plan', 'خطة_عمل_مطلوبة', 'يلزم_خطة_عمل']
  },
  {
    key: 'action_plan_type',
    label: 'Action Plan Type',
    arLabel: 'نوع خطة العمل (Action_Plan_Type)',
    category: 'Actions & Notes',
    required: false,
    sample: 'Training Action / Quality Action / HR Action',
    aliases: ['action_plan_type', 'plan_type', 'capa_type', 'نوع_خطة_العمل', 'نوع_الخطة']
  },
  {
    key: 'manager_notes',
    label: 'Manager Notes',
    arLabel: 'توجيهات وملاحظات المدير (Manager_Notes)',
    category: 'Actions & Notes',
    required: false,
    sample: 'Follow up within 24 hours with supervisor',
    aliases: ['manager_notes', 'supervisor_notes', 'admin_remarks', 'leadership_notes', 'ملاحظات_المدير', 'توجيهات_المدير', 'توجيهات_الإدارة']
  },
  {
    key: 'system_remarks',
    label: 'System Remarks',
    arLabel: 'ملاحظات النظام الآلية (System_Remarks)',
    category: 'Actions & Notes',
    required: false,
    sample: 'Auto-flagged due to SLA threshold breach',
    aliases: ['system_remarks', 'system_notes', 'automated_remarks', 'ملاحظات_النظام', 'تنبيه_النظام']
  },
  {
    key: 'comment',
    label: 'Details / Description',
    arLabel: 'الملاحظات والتفاصيل الكاملة (Details)',
    category: 'Actions & Notes',
    required: false,
    sample: 'Customer reported delayed fulfillment and missing items...',
    aliases: ['comment', 'details', 'complaint_details', 'delay_notes', 'refund_justification', 'cancellation_details', 'feedback_comment', 'notes', 'description', 'الملاحظات', 'التفاصيل', 'تفاصيل_الشكوى', 'ملاحظات_التأخير', 'مبررات_الاسترداد', 'الوصف'],
    caseOverrides: {
      'Complaints': { label: 'Complaint Details / Notes', arLabel: 'تفاصيل وملاحظات الشكوى (Complaint_Details)' },
      'Delays': { label: 'Delay Notes & Justification', arLabel: 'ملاحظات وأسباب التأخير (Delay_Notes)' },
      'Refunds': { label: 'Refund Justification', arLabel: 'مبررات وأسباب الاسترداد (Refund_Justification)' },
      'Cancellations': { label: 'Cancellation Details', arLabel: 'تفاصيل وأسباب الإلغاء (Cancellation_Details)' },
      'NPS': { label: 'Customer Feedback Comment', arLabel: 'تعليق وملاحظات العميل (Feedback_Comment)' }
    }
  },

  // 10. Case-Specific Fields
  {
    key: 'complaint_reason',
    label: 'Complaint Reason',
    arLabel: 'سبب الشكوى الرئيسي (Complaint_Reason)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['Complaints'],
    sample: 'Staff Misbehavior / Hidden Fee Dispute',
    aliases: ['complaint_reason', 'reason_for_complaint', 'complaint_type', 'سبب_الشكوى', 'نوع_الشكوى', 'موضوع_الشكوى']
  },
  {
    key: 'channel',
    label: 'Intake Channel / Source',
    arLabel: 'قناة استقبال الشكوى (Channel)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['Complaints'],
    sample: 'WhatsApp / Call Center / Web Portal',
    aliases: ['channel', 'source', 'intake_channel', 'complaint_channel', 'قناة_الشكوى', 'مصدر_الشكوى', 'طريقة_التواصل', 'القناة']
  },
  {
    key: 'priority',
    label: 'Complaint Priority / Severity',
    arLabel: 'درجة خطورة الشكوى (Priority)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['Complaints'],
    sample: 'Critical / High / Medium / Low',
    aliases: ['priority', 'severity', 'urgency', 'درجة_الخطورة', 'الأهمية', 'مستوى_الخطورة', 'الأولوية']
  },
  {
    key: 'delay_reason',
    label: 'Delay Reason / Cause',
    arLabel: 'سبب التأخير الرئيسي (Delay_Reason)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['Delays'],
    sample: 'Customs Clearance Hold / Dispatch Misroute',
    aliases: ['delay_reason', 'reason_for_delay', 'cause_of_delay', 'delay_cause', 'سبب_التأخير', 'سبب_تأخر_الطلب']
  },
  {
    key: 'priority',
    label: 'Delay Priority & Impact',
    arLabel: 'أولوية التأخير والأثر التشغيلي (Priority)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['Delays'],
    sample: 'High / Medium / Normal',
    aliases: ['priority', 'delay_priority', 'impact', 'أولوية_التأخير', 'درجة_التأثير']
  },
  {
    key: 'refund_reason',
    label: 'Refund Reason',
    arLabel: 'سبب الاسترداد الرئيسي (Refund_Reason)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['Refunds'],
    sample: 'Defective Return / Avoidable SLA Failure',
    aliases: ['refund_reason', 'return_reason', 'reason_for_refund', 'refund_justification', 'سبب_الاسترداد', 'سبب_الارجاع']
  },
  {
    key: 'refund_sub_reason',
    label: 'Refund Sub Reason',
    arLabel: 'السبب الفرعي للاسترداد (Refund_Sub_Reason)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['Refunds'],
    sample: 'Specification Mismatch / Incorrect Promise',
    aliases: ['refund_sub_reason', 'sub_refund_reason', 'return_sub_reason', 'sub_reason', 'السبب_الفرعي_للاسترداد', 'سبب_الاسترداد_الفرعي']
  },
  {
    key: 'cancellation_reason',
    label: 'Cancellation Reason',
    arLabel: 'سبب الإلغاء الرئيسي (Cancellation_Reason)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['Cancellations'],
    sample: 'Found Cheaper Alternative / Missed SLA Window',
    aliases: ['cancellation_reason', 'reason_for_cancellation', 'cancel_reason', 'سبب_الإلغاء', 'سبب_الغاء_الطلب']
  },
  {
    key: 'rating',
    label: 'NPS / Rating Score (0-10)',
    arLabel: 'تقييم العميل من 0 إلى 10 (Rating_Score)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['NPS'],
    sample: '9 / 10',
    aliases: ['rating', 'score', 'nps_score', 'csat_score', 'stars', 'rating_score', 'التقييم', 'درجة_الرضا', 'تقييم_الخدمة', 'الدرجة']
  },
  {
    key: 'category',
    label: 'NPS Sentiment Category',
    arLabel: 'تصنيف التقييم (Sentiment_Category)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['NPS'],
    sample: 'Promoter / Passive / Detractor',
    aliases: ['category', 'nps_category', 'sentiment', 'sentiment_category', 'التصنيف', 'فئة_التقييم', 'فئة_العميل']
  },
  {
    key: 'feedback_text',
    label: 'Customer Voice / Feedback Text',
    arLabel: 'نص الملاحظات ورأي العميل (Feedback_Text)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['NPS'],
    sample: 'The support staff was very responsive and resolved my inquiry promptly.',
    aliases: ['feedback_text', 'voice_of_customer', 'client_feedback', 'review', 'تعليق_العميل', 'رأي_العميل', 'ملاحظات_العميل', 'نص_التقييم']
  },
  {
    key: 'channel',
    label: 'Survey Channel',
    arLabel: 'قناة إرسال الاستبيان (Channel)',
    category: 'Case Specific',
    required: false,
    applicableCases: ['NPS'],
    sample: 'SMS Survey / Email Link / WhatsApp',
    aliases: ['channel', 'survey_channel', 'قناة_الاستبيان', 'طريقة_الارسال']
  }
];

// Helper to get contextual field presentation per CaseType
export function getFieldPropsForCase(field: MappingFieldDefinition, caseType: CaseType) {
  const overrides = field.caseOverrides?.[caseType];
  return {
    label: overrides?.label || field.label,
    arLabel: overrides?.arLabel || field.arLabel,
    sample: overrides?.sample || field.sample,
    aliases: [...field.aliases, ...(overrides?.aliases || [])]
  };
}

export interface CaseStepDefinition {
  number: number;
  title: string;
  arTitle: string;
  desc: string;
  arDesc: string;
  fieldKeys: string[];
}

// 1:1 Mirror of the Incident Stepper Steps & Fields for all Case Types
export const CASE_STEP_DEFINITIONS: Record<CaseType, CaseStepDefinition[]> = {
  'Cancellations': [
    {
      number: 1,
      title: 'General Info',
      arTitle: 'معلومات الطلب الأساسية',
      desc: 'Basic Request Details',
      arDesc: 'بيانات الطلب، تاريخ الحجز، العميل، والموظف',
      fieldKeys: [
        'transaction_id',
        'qa_reference_number',
        'order_date',
        'request_date',
        'owner',
        'agent_name',
        'agent_id',
        'request_type',
        'cancellation_reason',
        'customer_name',
        'customer_phone',
        'handled_by'
      ]
    },
    {
      number: 2,
      title: 'QA Review',
      arTitle: 'مراجعة الجودة والتحقق',
      desc: 'QA Review & Validation',
      arDesc: 'فحص مراجع الجودة، مطابقة SLA، وحالة مسار العمل',
      fieldKeys: [
        'auditor_name',
        'qa_status',
        'sla_status',
        'operations_status',
        'workflow_status',
        'operation_owner'
      ]
    },
    {
      number: 3,
      title: 'Cancellation Reason',
      arTitle: 'سبب الإلغاء والتصنيف',
      desc: 'Reason & Classification',
      arDesc: 'السبب الرئيسي، تصنيف الخطأ، والسبب الفرعي',
      fieldKeys: [
        'department',
        'root_cause',
        'error_classification',
        'sub_reason',
        'request_sub_type',
        'survey_date'
      ]
    },
    {
      number: 4,
      title: 'Details',
      arTitle: 'تفاصيل الإلغاء والماليات',
      desc: 'Cancellation Details',
      arDesc: 'قيمة الطلب، مبالغ الاسترداد، والتحميل المالي على الموظف',
      fieldKeys: [
        'order_amount',
        'refund_amount',
        'comment',
        'status_on_system',
        'system_remarks',
        'lose_on_employee',
        'lose_employee_name',
        'lose_employee_id',
        'lose_amount',
        'lose_status'
      ]
    },
    {
      number: 5,
      title: 'Review & Close',
      arTitle: 'المراجعة والإغلاق',
      desc: 'Action & Approval',
      arDesc: 'الإجراءات المطلوبة، اعتماد المدير، وتوجيه خطة العمل',
      fieldKeys: [
        'action_required',
        'assigned_manager',
        'manager_approval',
        'manager_notes',
        'action_plan_required',
        'action_plan_type',
        'corrective_action'
      ]
    }
  ],
  'Complaints': [
    {
      number: 1,
      title: 'General Info',
      arTitle: 'معلومات الطلب الأساسية',
      desc: 'Basic Request Details',
      arDesc: 'معرف الشكوى، العميل، الهاتف، وتاريخ المعاملة',
      fieldKeys: [
        'transaction_id',
        'qa_reference_number',
        'customer_name',
        'customer_phone',
        'order_date',
        'request_date',
        'owner',
        'agent_name',
        'agent_id',
        'handled_by',
        'request_type',
        'request_sub_type',
        'channel',
        'priority'
      ]
    },
    {
      number: 2,
      title: 'Validation',
      arTitle: 'التحقق ومراجعة الجودة',
      desc: 'QA & Validation Check',
      arDesc: 'حالة الجودة، الالتزام بـ SLA، وحالة العمليات',
      fieldKeys: [
        'auditor_name',
        'qa_status',
        'sla_status',
        'operations_status',
        'workflow_status',
        'operation_owner',
        'survey_date'
      ]
    },
    {
      number: 3,
      title: 'Classification',
      arTitle: 'تصنيف الشكوى والقسم',
      desc: 'Select Bucket & Department',
      arDesc: 'القسم المعني والتصنيف الهرمي للشكوى',
      fieldKeys: [
        'department',
        'complaint_reason'
      ]
    },
    {
      number: 4,
      title: 'Root Cause',
      arTitle: 'السبب الجذري والفرعي',
      desc: 'Root Cause & Sub Reason',
      arDesc: 'تحديد السبب الجذري والتفاصيل الفرعية وتصنيف الخطأ',
      fieldKeys: [
        'root_cause',
        'sub_reason',
        'error_classification'
      ]
    },
    {
      number: 5,
      title: 'Complaint Details',
      arTitle: 'تفاصيل الشكوى والماليات',
      desc: 'Switches, Amounts & Comments',
      arDesc: 'تفاصيل الشكوى، المبالغ، والتحميل المالي على الموظف',
      fieldKeys: [
        'comment',
        'status_on_system',
        'system_remarks',
        'order_amount',
        'refund_amount',
        'lose_on_employee',
        'lose_employee_name',
        'lose_employee_id',
        'lose_amount',
        'lose_status'
      ]
    },
    {
      number: 6,
      title: 'Action & Review',
      arTitle: 'الإجراء واعتماد المدير',
      desc: 'Action & Manager Approval',
      arDesc: 'الإجراءات المطلوبة، اعتماد المدير، وخطة العمل',
      fieldKeys: [
        'action_required',
        'assigned_manager',
        'manager_approval',
        'manager_notes',
        'action_plan_required',
        'action_plan_type',
        'corrective_action'
      ]
    }
  ],
  'Delays': [
    {
      number: 1,
      title: 'General Info',
      arTitle: 'معلومات الطلب الأساسية',
      desc: 'Basic Request Details',
      arDesc: 'بيانات الطلب، العميل، الموظف، ومسؤول العمليات',
      fieldKeys: [
        'transaction_id',
        'qa_reference_number',
        'request_type',
        'request_date',
        'order_date',
        'owner',
        'agent_name',
        'agent_id',
        'customer_name',
        'customer_phone',
        'handled_by'
      ]
    },
    {
      number: 2,
      title: 'Operations Review',
      arTitle: 'مراجعة العمليات والالتزام',
      desc: 'SLA & Status Check',
      arDesc: 'حالة SLA، مسجل على السيستم، وملاحظات التشغيل',
      fieldKeys: [
        'operations_status',
        'sla_status',
        'status_on_system',
        'system_remarks',
        'operation_owner'
      ]
    },
    {
      number: 3,
      title: 'QA Validation',
      arTitle: 'تقييم وفحص الجودة',
      desc: 'Auditor Evaluation',
      arDesc: 'مدقق الجودة، نتيجة التقييم، وحالة مسار العمل',
      fieldKeys: [
        'auditor_name',
        'qa_status',
        'workflow_status',
        'survey_date',
        'priority'
      ]
    },
    {
      number: 4,
      title: 'Classification',
      arTitle: 'تصنيف جهة التأخير',
      desc: 'Department Bucket',
      arDesc: 'القسم المسؤول عن التأخير والتصنيف النوعي',
      fieldKeys: [
        'department',
        'delay_reason',
        'request_sub_type'
      ]
    },
    {
      number: 5,
      title: 'Root Cause',
      arTitle: 'السبب الجذري والفرعي',
      desc: 'Primary & Sub Reason',
      arDesc: 'أسباب التأخير الجذرية، تصنيف الخطأ، والسبب الفرعي',
      fieldKeys: [
        'root_cause',
        'sub_reason',
        'error_classification'
      ]
    },
    {
      number: 6,
      title: 'Details',
      arTitle: 'تفاصيل التأخير والماليات',
      desc: 'Switches, Amounts & Remarks',
      arDesc: 'قيمة الشحنة، تفاصيل وملاحظات التأخير، والخصم المالي',
      fieldKeys: [
        'comment',
        'order_amount',
        'lose_on_employee',
        'lose_employee_name',
        'lose_employee_id',
        'lose_amount',
        'lose_status'
      ]
    },
    {
      number: 7,
      title: 'Review & Close',
      arTitle: 'الإجراء واعتماد المدير',
      desc: 'Action & Approval',
      arDesc: 'الإجراءات المطلوبة، اعتماد المدير، وخطة المعالجة',
      fieldKeys: [
        'action_required',
        'assigned_manager',
        'manager_approval',
        'manager_notes',
        'action_plan_required',
        'action_plan_type',
        'corrective_action'
      ]
    }
  ],
  'Refunds': [
    {
      number: 1,
      title: 'General Info',
      arTitle: 'معلومات الطلب الأساسية',
      desc: 'Basic Request Details',
      arDesc: 'معرف طلب الاسترداد، العميل، الهاتف، وتاريخ التقديم',
      fieldKeys: [
        'transaction_id',
        'qa_reference_number',
        'customer_name',
        'customer_phone',
        'order_date',
        'request_date',
        'owner',
        'agent_name',
        'agent_id',
        'handled_by',
        'request_type',
        'request_sub_type'
      ]
    },
    {
      number: 2,
      title: 'Validation',
      arTitle: 'التحقق ومراجعة الجودة',
      desc: 'QA & Validation Check',
      arDesc: 'فحص مراجع الجودة والتحقق من التذكرة وSLA',
      fieldKeys: [
        'auditor_name',
        'qa_status',
        'sla_status',
        'operations_status',
        'workflow_status',
        'operation_owner',
        'survey_date'
      ]
    },
    {
      number: 3,
      title: 'Classification',
      arTitle: 'تصنيف الاسترداد والسبب',
      desc: 'Bucket & Root Cause',
      arDesc: 'القسم، سبب الاسترداد الرئيسي والفرعي، والسبب الجذري',
      fieldKeys: [
        'department',
        'refund_reason',
        'refund_sub_reason',
        'root_cause',
        'sub_reason',
        'error_classification'
      ]
    },
    {
      number: 4,
      title: 'Refund Details',
      arTitle: 'تفاصيل ومبالغ الاسترداد',
      desc: 'Amount & Error Switches',
      arDesc: 'مبلغ الاسترداد، قيمة الطلب، المبررات، والخصم المالي',
      fieldKeys: [
        'refund_amount',
        'order_amount',
        'comment',
        'status_on_system',
        'system_remarks',
        'lose_on_employee',
        'lose_employee_name',
        'lose_employee_id',
        'lose_amount',
        'lose_status'
      ]
    },
    {
      number: 5,
      title: 'Review & Close',
      arTitle: 'الإجراء واعتماد الصرف',
      desc: 'Action & Approval',
      arDesc: 'الإجراء المطلوب، اعتماد المدير، وخطة العمل',
      fieldKeys: [
        'action_required',
        'assigned_manager',
        'manager_approval',
        'manager_notes',
        'action_plan_required',
        'action_plan_type',
        'corrective_action'
      ]
    }
  ],
  'NPS': [
    {
      number: 1,
      title: 'General Info',
      arTitle: 'معلومات الاستبيان والعميل',
      desc: 'Basic Request Details',
      arDesc: 'رقم الاستجابة، العميل، الهاتف، الموظف المقيم، وتاريخ التقييم',
      fieldKeys: [
        'transaction_id',
        'qa_reference_number',
        'customer_name',
        'customer_phone',
        'agent_name',
        'agent_id',
        'handled_by',
        'order_date',
        'request_date',
        'owner',
        'operation_owner',
        'channel'
      ]
    },
    {
      number: 2,
      title: 'NPS Score',
      arTitle: 'درجة التقييم والفئة',
      desc: 'Rating Score & Category',
      arDesc: 'درجة التقييم (0-10)، فئة العميل (Promoter/Detractor)، والامتثال لـ SLA',
      fieldKeys: [
        'rating',
        'category',
        'sla_status',
        'operations_status',
        'workflow_status'
      ]
    },
    {
      number: 3,
      title: 'Root Cause Classification',
      arTitle: 'تصنيف السبب الجذري',
      desc: 'Bucket & Root Cause',
      arDesc: 'القسم، نوع الخدمة، السبب الجذري، والسبب الفرعي',
      fieldKeys: [
        'department',
        'request_type',
        'request_sub_type',
        'root_cause',
        'sub_reason',
        'error_classification'
      ]
    },
    {
      number: 4,
      title: 'Customer Feedback',
      arTitle: 'صوت العميل والإجراءات',
      desc: 'Comment & Action Required',
      arDesc: 'رأي العميل، الملاحظات، والإجراءات المباشرة والتكلفة',
      fieldKeys: [
        'feedback_text',
        'comment',
        'action_required',
        'status_on_system',
        'system_remarks',
        'order_amount',
        'lose_on_employee',
        'lose_employee_name',
        'lose_employee_id',
        'lose_amount',
        'lose_status'
      ]
    },
    {
      number: 5,
      title: 'Manager Review',
      arTitle: 'ملاحظات واعتماد المدير',
      desc: 'Manager Review & Status',
      arDesc: 'مراجع الجودة، مراجعة المدير، اعتماد الحالة، وخطة العمل',
      fieldKeys: [
        'auditor_name',
        'assigned_manager',
        'manager_approval',
        'manager_notes',
        'action_plan_required',
        'action_plan_type',
        'corrective_action',
        'survey_date',
        'priority'
      ]
    }
  ]
};

const DEFAULT_MASTER_SPREADSHEET = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';

const INITIAL_CASE_CONFIGS: Record<CaseType, CaseTypeConfig> = {
  'Complaints': {
    spreadsheet_mode: 'shared',
    sheet_url: DEFAULT_MASTER_SPREADSHEET,
    sheet_tab_name: 'Complaints_Responses',
    sync_frequency: 'Real-time Webhook',
    status: 'Active',
    fetched_columns: [
      'Request_ID', 'QA_Ref_No', 'Customer_Name', 'Customer_Phone', 'Agent_Name', 'Agent_ID',
      'Handled_By', 'Date_Time', 'Owner', 'Department', 'Request_Type', 'Request_Sub_Type',
      'Root_Cause', 'Sub_Reason', 'Error_Classification', 'Complaint_Reason', 'Channel',
      'Priority', 'Request_Date', 'SLA_Status', 'QA_Status', 'Operations_Status', 'Workflow_Status',
      'Operation_Owner', 'Auditor_Name', 'Assigned_Manager', 'Manager_Approval', 'Manager_Notes',
      'Survey_Date', 'Order_Amount', 'Refund_Amount', 'Lose_On_Employee', 'Lose_Employee_Name',
      'Lose_Employee_ID', 'Lose_Amount', 'Lose_Status', 'Corrective_Action', 'Action_Required',
      'Action_Plan_Required', 'Action_Plan_Type', 'Status_On_System', 'System_Remarks', 'Complaint_Details'
    ],
    column_mapping: {
      transaction_id: 'Request_ID',
      qa_reference_number: 'QA_Ref_No',
      customer_name: 'Customer_Name',
      customer_phone: 'Customer_Phone',
      agent_name: 'Agent_Name',
      agent_id: 'Agent_ID',
      handled_by: 'Handled_By',
      order_date: 'Date_Time',
      owner: 'Owner',
      department: 'Department',
      request_type: 'Request_Type',
      request_sub_type: 'Request_Sub_Type',
      root_cause: 'Root_Cause',
      sub_reason: 'Sub_Reason',
      error_classification: 'Error_Classification',
      complaint_reason: 'Complaint_Reason',
      channel: 'Channel',
      priority: 'Priority',
      request_date: 'Request_Date',
      sla_status: 'SLA_Status',
      qa_status: 'QA_Status',
      operations_status: 'Operations_Status',
      workflow_status: 'Workflow_Status',
      operation_owner: 'Operation_Owner',
      auditor_name: 'Auditor_Name',
      assigned_manager: 'Assigned_Manager',
      manager_approval: 'Manager_Approval',
      manager_notes: 'Manager_Notes',
      survey_date: 'Survey_Date',
      order_amount: 'Order_Amount',
      refund_amount: 'Refund_Amount',
      lose_on_employee: 'Lose_On_Employee',
      lose_employee_name: 'Lose_Employee_Name',
      lose_employee_id: 'Lose_Employee_ID',
      lose_amount: 'Lose_Amount',
      lose_status: 'Lose_Status',
      corrective_action: 'Corrective_Action',
      action_required: 'Action_Required',
      action_plan_required: 'Action_Plan_Required',
      action_plan_type: 'Action_Plan_Type',
      status_on_system: 'Status_On_System',
      system_remarks: 'System_Remarks',
      comment: 'Complaint_Details'
    }
  },
  'Delays': {
    spreadsheet_mode: 'shared',
    sheet_url: DEFAULT_MASTER_SPREADSHEET,
    sheet_tab_name: 'Delays_Log',
    sync_frequency: 'Real-time Webhook',
    status: 'Active',
    fetched_columns: [
      'Transaction_Ref', 'QA_Ref_No', 'Client_Name', 'Contact_Number', 'Assigned_Agent', 'Agent_Code',
      'Handled_By', 'Timestamp', 'Ticket_Owner', 'Department', 'Service_Category', 'Delay_Sub_Reason',
      'Delay_Reason', 'Root_Cause', 'Sub_Reason', 'Error_Classification', 'Priority', 'Order_Date',
      'SLA_Compliance', 'QA_Status', 'Fulfillment_Status', 'Workflow_Status', 'Operations_Lead',
      'Auditor_Name', 'Assigned_Manager', 'Manager_Approval', 'Manager_Notes', 'Evaluation_Date',
      'Order_Value', 'Lose_On_Employee', 'Lose_Employee_Name', 'Lose_Employee_ID', 'Lose_Amount',
      'Lose_Status', 'Corrective_Action', 'Action_Required', 'Action_Plan_Required', 'Action_Plan_Type',
      'Status_On_System', 'System_Remarks', 'Delay_Notes'
    ],
    column_mapping: {
      transaction_id: 'Transaction_Ref',
      qa_reference_number: 'QA_Ref_No',
      customer_name: 'Client_Name',
      customer_phone: 'Contact_Number',
      agent_name: 'Assigned_Agent',
      agent_id: 'Agent_Code',
      handled_by: 'Handled_By',
      order_date: 'Timestamp',
      owner: 'Ticket_Owner',
      department: 'Department',
      request_type: 'Service_Category',
      request_sub_type: 'Delay_Sub_Reason',
      delay_reason: 'Delay_Reason',
      root_cause: 'Root_Cause',
      sub_reason: 'Sub_Reason',
      error_classification: 'Error_Classification',
      priority: 'Priority',
      request_date: 'Order_Date',
      sla_status: 'SLA_Compliance',
      qa_status: 'QA_Status',
      operations_status: 'Fulfillment_Status',
      workflow_status: 'Workflow_Status',
      operation_owner: 'Operations_Lead',
      auditor_name: 'Auditor_Name',
      assigned_manager: 'Assigned_Manager',
      manager_approval: 'Manager_Approval',
      manager_notes: 'Manager_Notes',
      survey_date: 'Evaluation_Date',
      order_amount: 'Order_Value',
      lose_on_employee: 'Lose_On_Employee',
      lose_employee_name: 'Lose_Employee_Name',
      lose_employee_id: 'Lose_Employee_ID',
      lose_amount: 'Lose_Amount',
      lose_status: 'Lose_Status',
      corrective_action: 'Corrective_Action',
      action_required: 'Action_Required',
      action_plan_required: 'Action_Plan_Required',
      action_plan_type: 'Action_Plan_Type',
      status_on_system: 'Status_On_System',
      system_remarks: 'System_Remarks',
      comment: 'Delay_Notes'
    }
  },
  'Refunds': {
    spreadsheet_mode: 'custom',
    sheet_url: 'https://docs.google.com/spreadsheets/d/1RefundsFinSpreadsheet_987654321/edit',
    sheet_tab_name: 'Refund_Requests_Form',
    sync_frequency: 'Real-time Webhook',
    status: 'Active',
    fetched_columns: [
      'Refund_Order_ID', 'QA_Ref_No', 'Customer_Full_Name', 'Phone_Number', 'Finance_Officer', 'Agent_ID',
      'Handled_By', 'Process_Date', 'Case_Owner', 'Department', 'Refund_Category', 'Refund_Sub_Type',
      'Refund_Reason', 'Refund_Sub_Reason', 'Root_Cause', 'Sub_Reason', 'Error_Classification', 'Submission_Date',
      'SLA_State', 'QA_Status', 'Accounting_Status', 'Workflow_Status', 'Finance_Supervisor', 'Auditor_Name',
      'Assigned_Manager', 'Manager_Approval', 'Manager_Notes', 'Audit_Date', 'Refund_Amount', 'Order_Amount',
      'Lose_On_Employee', 'Lose_Employee_Name', 'Lose_Employee_ID', 'Lose_Amount', 'Lose_Status',
      'Corrective_Action', 'Action_Required', 'Action_Plan_Required', 'Action_Plan_Type', 'Status_On_System',
      'System_Remarks', 'Refund_Justification'
    ],
    column_mapping: {
      transaction_id: 'Refund_Order_ID',
      qa_reference_number: 'QA_Ref_No',
      customer_name: 'Customer_Full_Name',
      customer_phone: 'Phone_Number',
      agent_name: 'Finance_Officer',
      agent_id: 'Agent_ID',
      handled_by: 'Handled_By',
      order_date: 'Process_Date',
      owner: 'Case_Owner',
      department: 'Department',
      request_type: 'Refund_Category',
      request_sub_type: 'Refund_Sub_Type',
      refund_reason: 'Refund_Reason',
      refund_sub_reason: 'Refund_Sub_Reason',
      root_cause: 'Root_Cause',
      sub_reason: 'Sub_Reason',
      error_classification: 'Error_Classification',
      request_date: 'Submission_Date',
      sla_status: 'SLA_State',
      qa_status: 'QA_Status',
      operations_status: 'Accounting_Status',
      workflow_status: 'Workflow_Status',
      operation_owner: 'Finance_Supervisor',
      auditor_name: 'Auditor_Name',
      assigned_manager: 'Assigned_Manager',
      manager_approval: 'Manager_Approval',
      manager_notes: 'Manager_Notes',
      survey_date: 'Audit_Date',
      refund_amount: 'Refund_Amount',
      order_amount: 'Order_Amount',
      lose_on_employee: 'Lose_On_Employee',
      lose_employee_name: 'Lose_Employee_Name',
      lose_employee_id: 'Lose_Employee_ID',
      lose_amount: 'Lose_Amount',
      lose_status: 'Lose_Status',
      corrective_action: 'Corrective_Action',
      action_required: 'Action_Required',
      action_plan_required: 'Action_Plan_Required',
      action_plan_type: 'Action_Plan_Type',
      status_on_system: 'Status_On_System',
      system_remarks: 'System_Remarks',
      comment: 'Refund_Justification'
    }
  },
  'Cancellations': {
    spreadsheet_mode: 'shared',
    sheet_url: DEFAULT_MASTER_SPREADSHEET,
    sheet_tab_name: 'Cancellations_Export',
    sync_frequency: 'Real-time Webhook',
    status: 'Active',
    fetched_columns: [
      'Order_ID', 'QA_Ref_No', 'Customer_Name', 'Phone', 'Sales_Rep', 'Agent_ID', 'Handled_By',
      'Cancellation_Timestamp', 'Account_Owner', 'Department', 'Product_Type', 'Cancellation_Sub_Reason',
      'Cancellation_Reason', 'Root_Cause', 'Sub_Reason', 'Error_Classification', 'Booking_Date',
      'SLA_Status', 'QA_Status', 'Ops_Status', 'Workflow_Status', 'Ops_Manager', 'Auditor_Name',
      'Assigned_Manager', 'Manager_Approval', 'Manager_Notes', 'Feedback_Date', 'Amount_Lost',
      'Refund_Amount', 'Lose_On_Employee', 'Lose_Employee_Name', 'Lose_Employee_ID', 'Lose_Amount',
      'Lose_Status', 'Corrective_Action', 'Action_Required', 'Action_Plan_Required', 'Action_Plan_Type',
      'Status_On_System', 'System_Remarks', 'Cancellation_Details'
    ],
    column_mapping: {
      transaction_id: 'Order_ID',
      qa_reference_number: 'QA_Ref_No',
      customer_name: 'Customer_Name',
      customer_phone: 'Phone',
      agent_name: 'Sales_Rep',
      agent_id: 'Agent_ID',
      handled_by: 'Handled_By',
      order_date: 'Cancellation_Timestamp',
      owner: 'Account_Owner',
      department: 'Department',
      request_type: 'Product_Type',
      request_sub_type: 'Cancellation_Sub_Reason',
      cancellation_reason: 'Cancellation_Reason',
      root_cause: 'Root_Cause',
      sub_reason: 'Sub_Reason',
      error_classification: 'Error_Classification',
      request_date: 'Booking_Date',
      sla_status: 'SLA_Status',
      qa_status: 'QA_Status',
      operations_status: 'Ops_Status',
      workflow_status: 'Workflow_Status',
      operation_owner: 'Ops_Manager',
      auditor_name: 'Auditor_Name',
      assigned_manager: 'Assigned_Manager',
      manager_approval: 'Manager_Approval',
      manager_notes: 'Manager_Notes',
      survey_date: 'Feedback_Date',
      order_amount: 'Amount_Lost',
      refund_amount: 'Refund_Amount',
      lose_on_employee: 'Lose_On_Employee',
      lose_employee_name: 'Lose_Employee_Name',
      lose_employee_id: 'Lose_Employee_ID',
      lose_amount: 'Lose_Amount',
      lose_status: 'Lose_Status',
      corrective_action: 'Corrective_Action',
      action_required: 'Action_Required',
      action_plan_required: 'Action_Plan_Required',
      action_plan_type: 'Action_Plan_Type',
      status_on_system: 'Status_On_System',
      system_remarks: 'System_Remarks',
      comment: 'Cancellation_Details'
    }
  },
  'NPS': {
    spreadsheet_mode: 'custom',
    sheet_url: 'https://docs.google.com/spreadsheets/d/1NpsFeedbackGoogleFormResponses_12345/edit',
    sheet_tab_name: 'Form Responses 1',
    sync_frequency: 'Real-time Webhook',
    status: 'Active',
    fetched_columns: [
      'Survey_Response_ID', 'QA_Ref_No', 'Client_Name', 'Customer_Mobile', 'Customer_Support_Agent',
      'Agent_ID', 'Handled_By', 'Submission_Time', 'Survey_Owner', 'Department', 'Service_Delivered',
      'Feedback_Sub_Category', 'Rating_Score', 'Sentiment_Category', 'Channel', 'Root_Cause', 'Sub_Reason',
      'Error_Classification', 'Interaction_Date', 'SLA_Response', 'QA_Status', 'Operations_Health',
      'Workflow_Status', 'QA_Lead', 'Auditor_Name', 'Assigned_Manager', 'Manager_Approval', 'Manager_Notes',
      'Survey_Timestamp', 'Ticket_Cost', 'Lose_On_Employee', 'Lose_Employee_Name', 'Lose_Employee_ID',
      'Lose_Amount', 'Lose_Status', 'Corrective_Action', 'Action_Required', 'Action_Plan_Required',
      'Action_Plan_Type', 'Status_On_System', 'System_Remarks', 'Feedback_Comment'
    ],
    column_mapping: {
      transaction_id: 'Survey_Response_ID',
      qa_reference_number: 'QA_Ref_No',
      customer_name: 'Client_Name',
      customer_phone: 'Customer_Mobile',
      agent_name: 'Customer_Support_Agent',
      agent_id: 'Agent_ID',
      handled_by: 'Handled_By',
      order_date: 'Submission_Time',
      owner: 'Survey_Owner',
      department: 'Department',
      request_type: 'Service_Delivered',
      request_sub_type: 'Feedback_Sub_Category',
      rating: 'Rating_Score',
      category: 'Sentiment_Category',
      channel: 'Channel',
      root_cause: 'Root_Cause',
      sub_reason: 'Sub_Reason',
      error_classification: 'Error_Classification',
      request_date: 'Interaction_Date',
      sla_status: 'SLA_Response',
      qa_status: 'QA_Status',
      operations_status: 'Operations_Health',
      workflow_status: 'Workflow_Status',
      operation_owner: 'QA_Lead',
      auditor_name: 'Auditor_Name',
      assigned_manager: 'Assigned_Manager',
      manager_approval: 'Manager_Approval',
      manager_notes: 'Manager_Notes',
      survey_date: 'Survey_Timestamp',
      order_amount: 'Ticket_Cost',
      lose_on_employee: 'Lose_On_Employee',
      lose_employee_name: 'Lose_Employee_Name',
      lose_employee_id: 'Lose_Employee_ID',
      lose_amount: 'Lose_Amount',
      lose_status: 'Lose_Status',
      corrective_action: 'Corrective_Action',
      action_required: 'Action_Required',
      action_plan_required: 'Action_Plan_Required',
      action_plan_type: 'Action_Plan_Type',
      status_on_system: 'Status_On_System',
      system_remarks: 'System_Remarks',
      comment: 'Feedback_Comment',
      feedback_text: 'Feedback_Comment'
    }
  }
};

export const QAIntegrationSettingsModal: React.FC<QAIntegrationSettingsModalProps> = ({
  isOpen = true,
  onClose,
  onSuccess,
  isPage = false
}) => {
  const navigate = useNavigate();
  const handleClose = onClose || (() => navigate('/qa/transactions-audit'));
  const [integrationType, setIntegrationType] = useState<'google_sheets' | 'system_module'>('google_sheets');
  const [caseType, setCaseType] = useState<CaseType>('Complaints');
  const [masterSpreadsheetUrl, setMasterSpreadsheetUrl] = useState(() => {
    try {
      const cached = localStorage.getItem('qa_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.master_spreadsheet_url) return parsed.master_spreadsheet_url;
      }
    } catch (e) {}
    return DEFAULT_MASTER_SPREADSHEET;
  });
  const [caseConfigs, setCaseConfigs] = useState<Record<CaseType, CaseTypeConfig>>(() => {
    try {
      const cached = localStorage.getItem('qa_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.case_configs) {
          return { ...INITIAL_CASE_CONFIGS, ...parsed.case_configs };
        }
      }
    } catch (e) {}
    return INITIAL_CASE_CONFIGS;
  });
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetchingTabs, setIsFetchingTabs] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchField, setSearchField] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeStepNumber, setActiveStepNumber] = useState<number>(1);
  const [mappingViewMode, setMappingViewMode] = useState<'stepper' | 'expanded'>('stepper');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [systemSourceModule, setSystemSourceModule] = useState<'operations_hub' | 'products' | 'crm' | 'accounting'>('operations_hub');
  const [serviceLogs, setServiceLogs] = useState<Array<{ timestamp: string; status: string; message: string }>>([
    { timestamp: new Date().toLocaleTimeString(), status: 'success', message: 'Multi-sheet Google Sheets integration engine initialized.' },
    { timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(), status: 'info', message: 'All 5 Case Types configured with active column mapping schemas.' }
  ]);

  // Load existing settings on mount or open
  useEffect(() => {
    if (isOpen || isPage) {
      fetchSettings();
    }
  }, [isOpen, isPage]);

  const currentConfig = caseConfigs[caseType] || INITIAL_CASE_CONFIGS[caseType];

  // Fetch Worksheet Tabs when URL changes or caseType switches
  useEffect(() => {
    if ((isOpen || isPage) && integrationType === 'google_sheets') {
      const activeUrl = currentConfig.spreadsheet_mode === 'custom' ? currentConfig.sheet_url : masterSpreadsheetUrl;
      if (activeUrl && activeUrl.includes('docs.google.com/spreadsheets')) {
        handleFetchTabs(activeUrl);
      }
    }
  }, [isOpen, isPage, caseType, currentConfig.spreadsheet_mode, masterSpreadsheetUrl, currentConfig.sheet_url, integrationType]);

  const handleFetchTabs = async (targetUrlOverride?: string) => {
    const targetUrl = targetUrlOverride || (currentConfig.spreadsheet_mode === 'custom' ? currentConfig.sheet_url : masterSpreadsheetUrl);
    if (!targetUrl || !targetUrl.trim() || !targetUrl.includes('docs.google.com/spreadsheets')) return;

    setIsFetchingTabs(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch(`/api/qa/google-sheets/tabs?sheet_url=${encodeURIComponent(targetUrl)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tabs && Array.isArray(data.tabs) && data.tabs.length > 0) {
          setAvailableTabs(data.tabs);
          // If current tab is empty or not in the fetched tabs, choose the closest or first
          if (!currentConfig.sheet_tab_name || !data.tabs.includes(currentConfig.sheet_tab_name)) {
            const matchingTab = data.tabs.find((t: string) => t.toLowerCase().includes(caseType.toLowerCase())) || data.tabs[0];
            updateCurrentConfig({ sheet_tab_name: matchingTab });
          }
        }
      }
    } catch (err) {
      // Non-fatal if offline
    } finally {
      setIsFetchingTabs(false);
    }
  };

  const fetchSettings = async (retryCount = 0) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch('/api/qa/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.master_spreadsheet_url) setMasterSpreadsheetUrl(data.master_spreadsheet_url);
        if (data.case_configs) {
          const loadedConfigs = { ...data.case_configs };
          // Harmonize NPS & CSAT alias with NPS
          if (loadedConfigs['NPS & CSAT'] && !loadedConfigs['NPS']) {
            loadedConfigs['NPS'] = loadedConfigs['NPS & CSAT'];
          }
          setCaseConfigs(prev => ({
            ...prev,
            ...loadedConfigs
          }));
        }
        if (data.service_logs && Array.isArray(data.service_logs)) {
          setServiceLogs(data.service_logs);
        }
        try {
          localStorage.setItem('qa_settings_cache', JSON.stringify(data));
        } catch (e) {}
      }
    } catch (err) {
      if (retryCount < 2) {
        setTimeout(() => fetchSettings(retryCount + 1), 600);
        return;
      }
      try {
        const cached = localStorage.getItem('qa_settings_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.master_spreadsheet_url) setMasterSpreadsheetUrl(parsed.master_spreadsheet_url);
          if (parsed.case_configs) setCaseConfigs(prev => ({ ...prev, ...parsed.case_configs }));
        }
      } catch (e) {}
    }
  };

  const updateCurrentConfig = (updates: Partial<CaseTypeConfig>) => {
    setCaseConfigs(prev => ({
      ...prev,
      [caseType]: {
        ...prev[caseType],
        ...updates
      }
    }));
  };

  const handleUpdateMapping = (fieldKey: string, columnVal: string) => {
    const updatedMappings = {
      ...currentConfig.column_mapping,
      [fieldKey]: columnVal
    };
    updateCurrentConfig({ column_mapping: updatedMappings });
  };

  const handleClearAllMappings = () => {
    updateCurrentConfig({ column_mapping: {} });
    setToastMessage(`🗑️ Cleared all column mappings for '${caseType}'.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Smart Auto-Match columns based on fetched columns
  const handleAutoMatchColumns = (columnsOverride?: string[], stepFieldKeys?: string[]) => {
    const columns = columnsOverride || currentConfig.fetched_columns || [];
    if (columns.length === 0) {
      setToastMessage('⚠️ Please verify connection first to retrieve worksheet columns.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const newMappings: Record<string, string> = { ...currentConfig.column_mapping };
    let matchedCount = 0;

    const applicableFields = MAPPING_FIELDS.filter(f => !f.applicableCases || f.applicableCases.includes(caseType));
    const targetFields = stepFieldKeys 
      ? applicableFields.filter(f => stepFieldKeys.includes(f.key))
      : applicableFields;

    targetFields.forEach(field => {
      const fieldProps = getFieldPropsForCase(field, caseType);
      // Find matching column by aliases, arabic label, or field key
      const matched = columns.find(col => {
        const colClean = col.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const colArabic = col.trim().toLowerCase();
        const isArabicMatch = Boolean(fieldProps.arLabel && (colArabic.includes(fieldProps.arLabel.toLowerCase()) || fieldProps.arLabel.toLowerCase().includes(colArabic)));
        const isAliasMatch = fieldProps.aliases.some(alias => {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '_');
          return colClean === cleanAlias || colClean.includes(cleanAlias) || cleanAlias.includes(colClean);
        });
        const isKeyMatch = colClean.includes(field.key.toLowerCase());
        return isAliasMatch || isArabicMatch || isKeyMatch;
      });

      if (matched) {
        newMappings[field.key] = matched;
        matchedCount++;
      }
    });

    updateCurrentConfig({ column_mapping: newMappings });
    setToastMessage(`✨ Auto-mapped ${matchedCount} columns for ${caseType}${stepFieldKeys ? ' (Current Step)' : ''} successfully!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Apply Current URL to All Case Types
  const handleApplyUrlToAll = () => {
    const activeUrl = currentConfig.spreadsheet_mode === 'custom' ? currentConfig.sheet_url : masterSpreadsheetUrl;
    setMasterSpreadsheetUrl(activeUrl);
    setCaseConfigs(prev => {
      const updated = { ...prev };
      (Object.keys(updated) as CaseType[]).forEach(ct => {
        updated[ct] = {
          ...updated[ct],
          sheet_url: activeUrl
        };
      });
      return updated;
    });
    handleFetchTabs(activeUrl);
    setToastMessage('🔗 Master spreadsheet URL applied across all 5 Case Types!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Verify connection for active Case Type
  const handleVerifyConnection = async () => {
    setIsVerifying(true);
    setVerifyStatus('idle');
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const targetUrl = currentConfig.spreadsheet_mode === 'custom' ? currentConfig.sheet_url : masterSpreadsheetUrl;

      const res = await fetch('/api/qa/google-sheets/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify({
          sheet_url: targetUrl,
          sheet_tab_name: currentConfig.sheet_tab_name,
          case_type: caseType
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const fetchedCols = data.columns || [];
        updateCurrentConfig({
          fetched_columns: fetchedCols,
          status: 'Connected'
        });
        if (data.preview_rows && Array.isArray(data.preview_rows)) {
          setPreviewRows(data.preview_rows);
        }
        setVerifyStatus('success');
        if (data.log) {
          setServiceLogs(prev => [data.log, ...prev]);
        }
        // Auto match columns right away
        handleAutoMatchColumns(fetchedCols);
        setToastMessage(data.message || `✅ Connection successful! Extracted ${fetchedCols.length} columns from tab '${currentConfig.sheet_tab_name || 'Tab'}'.`);
      } else {
        setVerifyStatus('error');
        setToastMessage(data.message || '❌ Unable to connect to Google Sheet. Please ensure link access is set to "Anyone with the link can view".');
      }
    } catch (err: any) {
      console.error(err);
      setVerifyStatus('error');
      setToastMessage('❌ An error occurred while connecting to Google Sheet.');
    } finally {
      setIsVerifying(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Run live sync test for active Case Type
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const targetUrl = currentConfig.spreadsheet_mode === 'custom' ? currentConfig.sheet_url : masterSpreadsheetUrl;

      const res = await fetch('/api/qa/google-sheets/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify({
          case_type: caseType,
          column_mapping: currentConfig.column_mapping,
          sheet_url: targetUrl,
          sheet_tab_name: currentConfig.sheet_tab_name
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(data.message || `⚡ Live sync completed! Imported ${data.synced_count || 0} records for ${caseType}.`);
        setServiceLogs(prev => [
          { timestamp: new Date().toLocaleTimeString(), status: 'success', message: data.message },
          ...prev
        ]);
        if (onSuccess) onSuccess();
      } else {
        setToastMessage(data.message || '❌ Sync failed. Please verify column mappings and sheet permissions.');
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage('❌ An error occurred during live synchronization.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Save All Settings
  const handleSaveIntegrationSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';

      const payload = {
        integration_type: integrationType,
        master_spreadsheet_url: masterSpreadsheetUrl,
        case_type: caseType,
        case_configs: caseConfigs,
        log_message: `Saved multi-sheet configurations for ${caseType} (Spreadsheet Mode: ${currentConfig.spreadsheet_mode})`
      };

      await fetch('/api/qa/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify(payload)
      });

      setToastMessage(`💾 QA Integration Settings saved successfully!`);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } catch (err) {
      console.error(err);
      setToastMessage('💾 Settings saved locally.');
      setTimeout(() => onClose(), 700);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter mapping fields strictly to the active Case Type
  const relevantFields = useMemo(() => {
    return MAPPING_FIELDS.filter(f => !f.applicableCases || f.applicableCases.includes(caseType));
  }, [caseType]);

  // Incident Stepper Steps Definition for active Case Type
  const activeCaseSteps = useMemo(() => {
    return CASE_STEP_DEFINITIONS[caseType] || CASE_STEP_DEFINITIONS['Cancellations'];
  }, [caseType]);

  // Reset active step when caseType changes
  useEffect(() => {
    setActiveStepNumber(1);
  }, [caseType]);

  // Step-to-fields mapping ensuring all applicable fields are covered
  const stepFieldsMap = useMemo(() => {
    const map = new Map<number, MappingFieldDefinition[]>();
    const assignedKeys = new Set<string>();

    activeCaseSteps.forEach(step => {
      const fields: MappingFieldDefinition[] = [];
      step.fieldKeys.forEach(k => {
        const found = relevantFields.find(rf => rf.key === k);
        if (found) {
          fields.push(found);
          assignedKeys.add(k);
        }
      });
      map.set(step.number, fields);
    });

    // Safeguard: Any remaining field in relevantFields not explicitly listed in steps is appended to the last step
    const unassigned = relevantFields.filter(rf => !assignedKeys.has(rf.key));
    if (unassigned.length > 0 && activeCaseSteps.length > 0) {
      const lastStepNum = activeCaseSteps[activeCaseSteps.length - 1].number;
      const existing = map.get(lastStepNum) || [];
      map.set(lastStepNum, [...existing, ...unassigned]);
    }

    return map;
  }, [activeCaseSteps, relevantFields]);

  const currentStepDef = useMemo(() => {
    return activeCaseSteps.find(s => s.number === activeStepNumber) || activeCaseSteps[0];
  }, [activeCaseSteps, activeStepNumber]);

  const currentStepFields = useMemo(() => {
    return stepFieldsMap.get(currentStepDef?.number || 1) || [];
  }, [stepFieldsMap, currentStepDef]);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(relevantFields.map(f => f.category)))];
  }, [relevantFields]);

  // If active category is no longer valid for the selected Case Type, reset to 'All'
  useEffect(() => {
    if (selectedCategory !== 'All' && !categories.includes(selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categories, selectedCategory]);

  const filteredFields = useMemo(() => {
    return relevantFields.filter(f => {
      const fieldProps = getFieldPropsForCase(f, caseType);
      const matchesSearch = fieldProps.label.toLowerCase().includes(searchField.toLowerCase()) ||
                            fieldProps.arLabel.includes(searchField) ||
                            f.key.toLowerCase().includes(searchField.toLowerCase());
      const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [relevantFields, caseType, searchField, selectedCategory]);

  const mappedCount = relevantFields.filter(f => Boolean(currentConfig.column_mapping?.[f.key])).length;
  const totalFields = relevantFields.length;

  const settingsBodyContent = (
    <div className="space-y-6">
      {/* 1. Integration Mode Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Select Data Source Mode (نوع مصدر البيانات)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIntegrationType('google_sheets')}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 text-left cursor-pointer ${
                    integrationType === 'google_sheets'
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${integrationType === 'google_sheets' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">Google Sheets Integration</span>
                      {integrationType === 'google_sheets' && (
                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Connect shared or dedicated Google Spreadsheets with custom tab mappings for every Case Type.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIntegrationType('system_module')}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 text-left cursor-pointer ${
                    integrationType === 'system_module'
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${integrationType === 'system_module' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">System Module Pull (Direct DB)</span>
                      {integrationType === 'system_module' && (
                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Pull internal tickets directly from Operations Hub, Products & Orders, CRM, or Accounting.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Target Incident Case Type Selection Tabs */}
            <div className="space-y-3 bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>2. Target Case Type (تحديد نوع الحالة لربط الشيت المخصص لها)</span>
                </label>
                <span className="text-xs text-slate-500">
                  Configuring: <strong className="text-indigo-600 font-black">{caseType}</strong> ({currentConfig.spreadsheet_mode === 'custom' ? 'Dedicated URL' : 'Shared Spreadsheet Tab'})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'Complaints', label: 'Complaints', ar: 'الشكاوى', color: 'border-rose-200 hover:bg-rose-50/50' },
                  { id: 'Delays', label: 'Delays', ar: 'التأخيرات', color: 'border-amber-200 hover:bg-amber-50/50' },
                  { id: 'Refunds', label: 'Refunds', ar: 'الاستردادات', color: 'border-purple-200 hover:bg-purple-50/50' },
                  { id: 'Cancellations', label: 'Cancellations', ar: 'الإلغاءات', color: 'border-slate-300 hover:bg-slate-100' },
                  { id: 'NPS', label: 'NPS', ar: 'استبيانات الرضا', color: 'border-emerald-200 hover:bg-emerald-50/50' }
                ].map((ct) => {
                  const cfg = caseConfigs[ct.id as CaseType];
                  const isSelected = caseType === ct.id;
                  const isConfigured = cfg && Object.keys(cfg.column_mapping || {}).length > 0;

                  return (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => setCaseType(ct.id as CaseType)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                          : `bg-white text-slate-800 ${ct.color}`
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black">{ct.label}</span>
                        {isConfigured && (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-300' : 'text-emerald-500'}`} />
                        )}
                      </div>
                      <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {ct.ar}
                      </span>
                      {cfg && cfg.spreadsheet_mode === 'custom' && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full mt-1 ${isSelected ? 'bg-indigo-700 text-indigo-200' : 'bg-slate-100 text-slate-600'}`}>
                          Dedicated URL
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google Sheets Specific Configuration */}
            {integrationType === 'google_sheets' && (
              <div className="space-y-6">

                {/* 3. Spreadsheet Mode & URL Setup */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Link className="w-4 h-4 text-indigo-600" />
                        <span>3. Spreadsheet & Tab Configuration for &apos;{caseType}&apos;</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Choose whether &apos;{caseType}&apos; shares the master spreadsheet URL with its own tab, or has its own dedicated spreadsheet URL.
                      </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => updateCurrentConfig({ spreadsheet_mode: 'shared' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          currentConfig.spreadsheet_mode === 'shared'
                            ? 'bg-white text-indigo-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Shared Master Spreadsheet
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCurrentConfig({ spreadsheet_mode: 'custom' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          currentConfig.spreadsheet_mode === 'custom'
                            ? 'bg-white text-indigo-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Dedicated Spreadsheet URL
                      </button>
                    </div>
                  </div>

                  {/* URL Inputs based on mode */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                    {currentConfig.spreadsheet_mode === 'shared' ? (
                      <>
                        <div className="md:col-span-7 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Link className="w-3.5 h-3.5 text-slate-400" />
                              <span>Shared Master Google Spreadsheet URL</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleApplyUrlToAll}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                            >
                              <FolderSync className="w-3 h-3" />
                              <span>Apply URL to all Case Types</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            value={masterSpreadsheetUrl}
                            onChange={(e) => setMasterSpreadsheetUrl(e.target.value)}
                            onBlur={() => handleFetchTabs(masterSpreadsheetUrl)}
                            placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="md:col-span-5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Table className="w-3.5 h-3.5 text-slate-400" />
                              <span>Sheet Tab Name (اسم التبويب)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleFetchTabs(masterSpreadsheetUrl)}
                              disabled={isFetchingTabs}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3 h-3 ${isFetchingTabs ? 'animate-spin' : ''}`} />
                              <span>{isFetchingTabs ? 'جاري الجلب...' : 'جلب التبويبات'}</span>
                            </button>
                          </div>

                          {availableTabs.length > 0 ? (
                            <div className="space-y-1.5">
                              <select
                                value={currentConfig.sheet_tab_name || ''}
                                onChange={(e) => updateCurrentConfig({ sheet_tab_name: e.target.value })}
                                className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {availableTabs.map((t) => (
                                  <option key={t} value={t}>
                                    📄 {t}
                                  </option>
                                ))}
                              </select>
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="text-[10px] text-slate-400 font-semibold">تبويبات متاحة:</span>
                                {availableTabs.map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => updateCurrentConfig({ sheet_tab_name: t })}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                      currentConfig.sheet_tab_name === t
                                        ? 'bg-indigo-600 text-white shadow-2xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={currentConfig.sheet_tab_name || ''}
                              onChange={(e) => updateCurrentConfig({ sheet_tab_name: e.target.value })}
                              placeholder={`${caseType}_Responses`}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="md:col-span-7 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Link className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="text-indigo-900 font-extrabold">Dedicated Google Spreadsheet URL for {caseType}</span>
                            </label>
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                              Custom Spreadsheet
                            </span>
                          </div>
                          <input
                            type="text"
                            value={currentConfig.sheet_url || ''}
                            onChange={(e) => updateCurrentConfig({ sheet_url: e.target.value })}
                            onBlur={() => handleFetchTabs(currentConfig.sheet_url)}
                            placeholder={`https://docs.google.com/spreadsheets/d/${caseType}_dedicated_id/edit`}
                            className="w-full px-3.5 py-2.5 bg-purple-50/30 border border-purple-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div className="md:col-span-5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Table className="w-3.5 h-3.5 text-slate-400" />
                              <span>Sheet Tab Name (اسم التبويب)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleFetchTabs(currentConfig.sheet_url)}
                              disabled={isFetchingTabs}
                              className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3 h-3 ${isFetchingTabs ? 'animate-spin' : ''}`} />
                              <span>{isFetchingTabs ? 'جاري الجلب...' : 'جلب التبويبات'}</span>
                            </button>
                          </div>

                          {availableTabs.length > 0 ? (
                            <div className="space-y-1.5">
                              <select
                                value={currentConfig.sheet_tab_name || ''}
                                onChange={(e) => updateCurrentConfig({ sheet_tab_name: e.target.value })}
                                className="w-full px-3 py-2 bg-purple-50/60 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                {availableTabs.map((t) => (
                                  <option key={t} value={t}>
                                    📄 {t}
                                  </option>
                                ))}
                              </select>
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="text-[10px] text-slate-400 font-semibold">تبويبات متاحة:</span>
                                {availableTabs.map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => updateCurrentConfig({ sheet_tab_name: t })}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                      currentConfig.sheet_tab_name === t
                                        ? 'bg-purple-600 text-white shadow-2xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={currentConfig.sheet_tab_name || ''}
                              onChange={(e) => updateCurrentConfig({ sheet_tab_name: e.target.value })}
                              placeholder="Form Responses 1"
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Verification Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl">
                        <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Verify & Extract Headers for &apos;{caseType}&apos;
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {currentConfig.fetched_columns?.length || 0} active headers extracted from &apos;{currentConfig.sheet_tab_name}&apos;.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAutoMatchColumns()}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                        title="Automatically match standard fields to extracted columns"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>✨ Auto-Match All</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearAllMappings}
                        className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
                        title="Clear all current column mappings"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Clear All</span>
                      </button>

                      {previewRows.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPreviewModal(prev => !prev)}
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>{showPreviewModal ? 'Hide Sample Data' : `Preview Data (${previewRows.length} Rows)`}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleVerifyConnection}
                        disabled={isVerifying}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                        <span>{isVerifying ? 'Verifying...' : 'Verify Connection'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Live Data Preview from Sheet */}
                  {showPreviewModal && previewRows.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 overflow-x-auto">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Table className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Google Sheet Live Preview (First {previewRows.length} Rows from &apos;{currentConfig.sheet_tab_name}&apos;)</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Total columns in sheet: {currentConfig.fetched_columns.length}
                        </span>
                      </div>
                      <table className="w-full text-left text-xs text-slate-700 border-collapse">
                        <thead>
                          <tr className="bg-slate-200/70 text-slate-800">
                            <th className="p-2 border border-slate-300 text-[11px] font-bold">#</th>
                            {currentConfig.fetched_columns.slice(0, 10).map((col, idx) => (
                              <th key={idx} className="p-2 border border-slate-300 text-[11px] font-bold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                            {currentConfig.fetched_columns.length > 10 && (
                              <th className="p-2 border border-slate-300 text-[11px] font-bold text-slate-400">
                                +{currentConfig.fetched_columns.length - 10} more cols
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-white/80 transition odd:bg-white even:bg-slate-50">
                              <td className="p-2 border border-slate-200 font-mono text-[10px] text-slate-400">{rIdx + 1}</td>
                              {currentConfig.fetched_columns.slice(0, 10).map((col, cIdx) => (
                                <td key={cIdx} className="p-2 border border-slate-200 font-mono text-[10px] whitespace-nowrap max-w-[180px] truncate" title={String(row[col] ?? '')}>
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                              {currentConfig.fetched_columns.length > 10 && (
                                <td className="p-2 border border-slate-200 text-[10px] text-slate-400">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 4. Active Column Mapping Section */}
                <div className="space-y-4">
                  {/* Section Title and Mode Toggles */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                          <Table className="w-4 h-4 text-indigo-600" />
                          <span>4. Active Column Mapping (خريطة ربط الأعمدة النشطة لـ {caseType})</span>
                        </label>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                          خاص بـ {caseType} ({totalFields} حقل موزعة على {activeCaseSteps.length} خطوات)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        تم تنظيم حقول ربط شيت <strong className="text-indigo-600 font-bold">{caseType}</strong> لتطابق تماماً خطوات الـ <strong className="text-slate-800 font-bold">Incident Stepper</strong> الخاصة بها، لتسهيل ربط كل خطوة بالأعمدة المقابلة.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
                      {/* View Mode Toggle: Stepper vs Expanded */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setMappingViewMode('stepper')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            mappingViewMode === 'stepper'
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="عرض خطوة بخطوة مثل الـ Incident Stepper"
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                          <span>Step-by-Step Flow</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMappingViewMode('expanded')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            mappingViewMode === 'expanded'
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="عرض كل الخطوات مفتوحة معاً"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>All Steps Expanded</span>
                        </button>
                      </div>

                      {/* Total Mapped Count Badge */}
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                        mappedCount === totalFields
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {mappedCount === totalFields ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>Mapped: {mappedCount} / {totalFields} fields</span>
                      </span>
                    </div>
                  </div>

                  {/* Incident Stepper Progress Header - Matches IncidentWorkflowStepper */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                    <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2 scrollbar-none">
                      {activeCaseSteps.map((step, idx) => {
                        const stepFields = stepFieldsMap.get(step.number) || [];
                        const stepMappedCount = stepFields.filter(f => Boolean(currentConfig.column_mapping?.[f.key])).length;
                        const isStepComplete = stepFields.length > 0 && stepMappedCount === stepFields.length;
                        const isActive = activeStepNumber === step.number;

                        return (
                          <div key={step.number} className="flex items-center gap-2 flex-1 min-w-[150px]">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveStepNumber(step.number);
                              }}
                              className={`flex items-center gap-2.5 text-left cursor-pointer transition-all w-full p-2 rounded-xl ${
                                isActive
                                  ? 'bg-indigo-50/80 text-indigo-700 font-bold ring-2 ring-indigo-300 shadow-2xs'
                                  : isStepComplete
                                  ? 'text-emerald-700 hover:bg-emerald-50/60 font-semibold'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                                isActive
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-200'
                                  : isStepComplete
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}>
                                {isStepComplete ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-xs font-bold leading-tight truncate">{step.title}</p>
                                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                                    isStepComplete
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isActive
                                      ? 'bg-indigo-200/80 text-indigo-900'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {stepMappedCount}/{stepFields.length}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium truncate">{step.arTitle}</p>
                              </div>
                            </button>

                            {idx < activeCaseSteps.length - 1 && (
                              <div className={`h-0.5 w-6 shrink-0 rounded-full ${
                                isStepComplete ? 'bg-emerald-400' : 'bg-slate-200'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filter, Search & Quick Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-100/90 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
                      <div className="w-full sm:w-72">
                        <input
                          type="text"
                          value={searchField}
                          onChange={(e) => setSearchField(e.target.value)}
                          placeholder="Search field or arabic name..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {searchField && (
                        <button
                          type="button"
                          onClick={() => setSearchField('')}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1 bg-white border border-slate-200 rounded-lg cursor-pointer"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAutoMatchColumns(undefined, currentStepDef.fieldKeys)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="مطابقة الحقول التابعة للخطوة الحالية فقط بأعمدة الشيت"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Auto-Match Step {activeStepNumber}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoMatchColumns()}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="مطابقة كل حقول الحالة الحالية بأعمدة الشيت"
                      >
                        <FolderSync className="w-3.5 h-3.5 text-slate-500" />
                        <span>Auto-Match All</span>
                      </button>
                    </div>
                  </div>

                  {/* Render Fields: Stepper Mode vs Expanded Mode */}
                  {mappingViewMode === 'stepper' ? (
                    (() => {
                      const stepFields = stepFieldsMap.get(activeStepNumber) || [];
                      const displayFields = stepFields.filter(f => {
                        if (!searchField.trim()) return true;
                        const q = searchField.toLowerCase().trim();
                        const fieldProps = getFieldPropsForCase(f, caseType);
                        return fieldProps.label.toLowerCase().includes(q) ||
                               fieldProps.arLabel.toLowerCase().includes(q) ||
                               f.key.toLowerCase().includes(q) ||
                               f.category.toLowerCase().includes(q);
                      });

                      const stepMappedCount = stepFields.filter(f => Boolean(currentConfig.column_mapping?.[f.key])).length;

                      // Check if matches exist in other steps when search yields empty in current step
                      const otherStepMatches: Array<{ stepNumber: number; title: string; count: number }> = [];
                      if (searchField.trim()) {
                        activeCaseSteps.forEach(s => {
                          if (s.number !== activeStepNumber) {
                            const sf = stepFieldsMap.get(s.number) || [];
                            const q = searchField.toLowerCase().trim();
                            const matches = sf.filter(f => {
                              const fp = getFieldPropsForCase(f, caseType);
                              return fp.label.toLowerCase().includes(q) ||
                                     fp.arLabel.toLowerCase().includes(q) ||
                                     f.key.toLowerCase().includes(q) ||
                                     f.category.toLowerCase().includes(q);
                            });
                            if (matches.length > 0) {
                              otherStepMatches.push({ stepNumber: s.number, title: s.title, count: matches.length });
                            }
                          }
                        });
                      }

                      return (
                        <div className="bg-white rounded-2xl border-2 border-indigo-500/30 p-5 shadow-sm space-y-4">
                          {/* Step Banner */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                                {currentStepDef.number}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                                    {currentStepDef.number}. {currentStepDef.title}
                                  </h3>
                                  <span className="text-xs text-indigo-600 font-bold">
                                    ({currentStepDef.arTitle})
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">{currentStepDef.desc}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                                Step Progress: {stepMappedCount} / {stepFields.length} mapped
                              </span>
                            </div>
                          </div>

                          {/* Notice if search has matches in other steps */}
                          {otherStepMatches.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2 flex-wrap">
                              <span className="font-bold">Found matching fields in other steps:</span>
                              {otherStepMatches.map(m => (
                                <button
                                  key={m.stepNumber}
                                  type="button"
                                  onClick={() => setActiveStepNumber(m.stepNumber)}
                                  className="px-2 py-0.5 bg-white hover:bg-indigo-100 rounded-md border border-indigo-200 font-bold text-indigo-700 text-[11px] cursor-pointer"
                                >
                                  Step {m.stepNumber} ({m.title}): {m.count} fields
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Grid of Mapping Cards for Current Step */}
                          {displayFields.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                              <p className="font-bold">No fields matching "{searchField}" in this step.</p>
                              <button
                                type="button"
                                onClick={() => setSearchField('')}
                                className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold border border-indigo-200 cursor-pointer"
                              >
                                View all {stepFields.length} fields in Step {activeStepNumber}
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                              {displayFields.map((field) => {
                                const fieldProps = getFieldPropsForCase(field, caseType);
                                const currentMappedCol = currentConfig.column_mapping?.[field.key] || '';
                                const isMapped = Boolean(currentMappedCol);
                                const columnsList = currentConfig.fetched_columns || [];

                                return (
                                  <div
                                    key={field.key}
                                    className={`p-3.5 rounded-2xl border transition-all ${
                                      isMapped
                                        ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                                        : 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-xs font-black text-slate-900 leading-snug">{fieldProps.label}</span>
                                          {field.required && (
                                            <span className="text-[10px] text-rose-500 font-bold" title="Required Field">*</span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5" dir="rtl">
                                          {fieldProps.arLabel}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                          Step {currentStepDef.number}
                                        </span>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                          {field.category}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="space-y-1.5 mt-2.5">
                                      <select
                                        value={currentMappedCol}
                                        onChange={(e) => handleUpdateMapping(field.key, e.target.value)}
                                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                                          isMapped
                                            ? 'bg-indigo-50/60 border border-indigo-200 text-indigo-950 shadow-2xs'
                                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white'
                                        }`}
                                      >
                                        <option value="">-- Select Sheet Column --</option>
                                        {columnsList.map((col) => (
                                          <option key={col} value={col}>
                                            {col}
                                          </option>
                                        ))}
                                      </select>

                                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                        <span className="truncate max-w-[170px]" title={`Ex: ${fieldProps.sample}`}>Ex: {fieldProps.sample}</span>
                                        {isMapped ? (
                                          <span className="text-emerald-600 font-bold flex items-center gap-0.5 shrink-0 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                            <Check className="w-3 h-3 stroke-[3]" /> Linked
                                          </span>
                                        ) : (
                                          <span className="text-amber-600 font-bold shrink-0 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                            Unmapped
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Stepper Footer Controls */}
                          <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 mt-2">
                            <button
                              type="button"
                              disabled={activeStepNumber === 1}
                              onClick={() => setActiveStepNumber(prev => Math.max(1, prev - 1))}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Previous Step</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              {activeCaseSteps.map(s => (
                                <button
                                  key={s.number}
                                  type="button"
                                  onClick={() => setActiveStepNumber(s.number)}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                    activeStepNumber === s.number
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                  title={`Go to Step ${s.number}: ${s.title}`}
                                >
                                  {s.number}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              disabled={activeStepNumber === activeCaseSteps.length}
                              onClick={() => setActiveStepNumber(prev => Math.min(activeCaseSteps.length, prev + 1))}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                            >
                              <span>Next Step</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* Expanded View: All Steps Stacked */
                    <div className="space-y-5">
                      {activeCaseSteps.map(stepDef => {
                        const allStepFields = stepFieldsMap.get(stepDef.number) || [];
                        const fields = allStepFields.filter(f => {
                          if (!searchField.trim()) return true;
                          const q = searchField.toLowerCase().trim();
                          const fieldProps = getFieldPropsForCase(f, caseType);
                          return fieldProps.label.toLowerCase().includes(q) ||
                                 fieldProps.arLabel.toLowerCase().includes(q) ||
                                 f.key.toLowerCase().includes(q) ||
                                 f.category.toLowerCase().includes(q);
                        });
                        const stepMapped = allStepFields.filter(f => Boolean(currentConfig.column_mapping?.[f.key])).length;
                        const isStepComplete = allStepFields.length > 0 && stepMapped === allStepFields.length;

                        return (
                          <div
                            key={stepDef.number}
                            className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-3.5 transition-all ${
                              isStepComplete ? 'border-emerald-200/80' : 'border-slate-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center ${
                                  isStepComplete ? 'bg-emerald-600 text-white' : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                  {isStepComplete ? <Check className="w-4 h-4 stroke-[3]" /> : stepDef.number}
                                </span>
                                <div>
                                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                                    {stepDef.number}. {stepDef.title} ({stepDef.arTitle})
                                  </h3>
                                  <p className="text-[11px] text-slate-400 font-medium">{stepDef.desc}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                                  isStepComplete
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {stepMapped} / {allStepFields.length} mapped
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAutoMatchColumns(undefined, stepDef.fieldKeys)}
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition cursor-pointer flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Auto-Match Step {stepDef.number}</span>
                                </button>
                              </div>
                            </div>

                            {fields.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2">No fields matching search in this step.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {fields.map((field) => {
                                  const fieldProps = getFieldPropsForCase(field, caseType);
                                  const currentMappedCol = currentConfig.column_mapping?.[field.key] || '';
                                  const isMapped = Boolean(currentMappedCol);
                                  const columnsList = currentConfig.fetched_columns || [];

                                  return (
                                    <div
                                      key={field.key}
                                      className={`p-3.5 rounded-2xl border transition-all ${
                                        isMapped
                                          ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                                          : 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-xs font-black text-slate-900 leading-snug">{fieldProps.label}</span>
                                            {field.required && (
                                              <span className="text-[10px] text-rose-500 font-bold" title="Required Field">*</span>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5" dir="rtl">
                                            {fieldProps.arLabel}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            Step {stepDef.number}
                                          </span>
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                            {field.category}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="space-y-1.5 mt-2.5">
                                        <select
                                          value={currentMappedCol}
                                          onChange={(e) => handleUpdateMapping(field.key, e.target.value)}
                                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                                            isMapped
                                              ? 'bg-indigo-50/60 border border-indigo-200 text-indigo-950 shadow-2xs'
                                              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white'
                                          }`}
                                        >
                                          <option value="">-- Select Sheet Column --</option>
                                          {columnsList.map((col) => (
                                            <option key={col} value={col}>
                                              {col}
                                            </option>
                                          ))}
                                        </select>

                                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                          <span className="truncate max-w-[170px]" title={`Ex: ${fieldProps.sample}`}>Ex: {fieldProps.sample}</span>
                                          {isMapped ? (
                                            <span className="text-emerald-600 font-bold flex items-center gap-0.5 shrink-0 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                              <Check className="w-3 h-3 stroke-[3]" /> Linked
                                            </span>
                                          ) : (
                                            <span className="text-amber-600 font-bold shrink-0 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                              Unmapped
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. Live Service Logs & Real-Time Sync Tester */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>5. Live Service Logs & Webhook Monitor (سجل العمليات والربط المباشر)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition"
                    >
                      <Zap className={`w-3.5 h-3.5 text-amber-500 ${isSyncing ? 'animate-bounce' : ''}`} />
                      <span>{isSyncing ? 'Running Sync...' : `Run Live Test Import for '${caseType}'`}</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-[11px] space-y-1.5 max-h-36 overflow-y-auto border border-slate-800">
                    {serviceLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-slate-500 font-bold shrink-0">[{log.timestamp}]</span>
                        <span className={log.status === 'success' ? 'text-emerald-400 font-bold' : 'text-sky-400'}>
                          {log.status === 'success' ? '🟢 SUCCESS:' : 'ℹ️ INFO:'}
                        </span>
                        <span className="text-slate-300">{log.message}</span>
                      </div>
                    ))}
                    {serviceLogs.length === 0 && (
                      <p className="text-slate-500 text-center py-2 italic">No webhook service logs yet.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* System Module Mode Specific UI */}
            {integrationType === 'system_module' && (
              <div className="space-y-6">
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Select System Module Source (موديول السيستم المصدري)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'operations_hub', label: 'Operations Hub & Work Orders', desc: 'Pull delayed or breached SLA work orders directly into QA' },
                      { id: 'products', label: 'Products, Orders & Services', desc: 'Pull cancelled or refunded customer product orders' },
                      { id: 'crm', label: 'CRM & Lead Interactions', desc: 'Pull client complaints and unsatisfied leads' },
                      { id: 'accounting', label: 'Accounting & Financial Invoices', desc: 'Pull payment disputes and processed refunds' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSystemSourceModule(m.id as any)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          systemSourceModule === m.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-extrabold block">{m.label}</span>
                        <span className={`text-[11px] block mt-1 ${systemSourceModule === m.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {m.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">Pull & Sync Trigger</h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Pull latest {caseType} records from {systemSourceModule} directly into QA Transactions Audit.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Pull & Import Orders Now</span>
                  </button>
                </div>
              </div>
            )}

    </div>
  );

  // Standalone Page Mode (no backdrop, full page container)
  if (isPage) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 animate-fadeIn font-sans" id="qa-settings-page-content">
        {/* Top Breadcrumb & Return Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer group shrink-0"
              title="Return to Transactions Audit"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Transactions Audit</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <span>Quality Assurance</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>Transactions Audit</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Settings</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                QA Integration & Google Sheets Settings
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveIntegrationSettings}
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
          {/* Header Banner */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/50">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-indigo-600/30 rounded-2xl border border-indigo-400/20 text-indigo-300">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Data Integration & Google Sheets Setup
                  </h2>
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/20 uppercase font-mono font-bold tracking-wider">
                    Multi-Sheet Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Connect unified or dedicated Google Spreadsheets per Case Type, map active columns, and verify real-time sync.
                </p>
              </div>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 flex items-center justify-between shadow-inner animate-fadeIn">
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Page Content Body */}
          <div className="p-6 sm:p-8">
            {settingsBodyContent}
          </div>

          {/* Bottom Actions Footer */}
          <div className="px-6 sm:px-8 py-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveIntegrationSettings}
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Configurations...' : 'Save & Activate Integration'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm" id="qa-settings-modal-backdrop">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
          id="qa-settings-modal"
        >
          {/* Modal Header */}
          <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-indigo-600/30 rounded-2xl border border-indigo-400/20 text-indigo-300">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Data Integration & Google Sheets Setup
                  </h2>
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/20 uppercase font-mono font-bold tracking-wider">
                    Multi-Sheet Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Connect unified or dedicated Google Spreadsheets per Case Type, map active columns, and verify real-time sync.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="bg-indigo-600 text-white text-xs font-bold px-6 py-2 flex items-center justify-between shadow-inner animate-fadeIn shrink-0">
              <div className="flex items-center gap-2">
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Scrollable Modal Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
            {settingsBodyContent}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveIntegrationSettings}
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Configurations...' : 'Save & Activate Integration'}</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
