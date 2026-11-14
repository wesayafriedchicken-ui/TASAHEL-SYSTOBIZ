import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  motion, AnimatePresence 
} from 'motion/react';
import { 
  Users, User, Shield, Network, Plus, Search, 
  MoreVertical, Edit2, Trash2, Check, X,
  ChevronRight, ChevronDown, ChevronUp, ShieldCheck,
  Building2, Briefcase, UserPlus, Download, Fingerprint,
  Printer, Save, Lock, Eye, Trash, FileDown,
  Activity, ToggleLeft, ListChecks, Settings2, AlertTriangle,
  Globe, AlertCircle, Database, Link2, Calendar, Sparkles,
  SlidersHorizontal, Play, HelpCircle, FileText, CheckSquare, List,
  RefreshCw, ArrowRight, CheckCircle2, ShieldAlert, Folder, Coffee, Repeat,
  DollarSign, Clock, Target, Box, Award, BookOpen, HeartHandshake,
  Volume2, UserCheck, Megaphone, PartyPopper, Coins, GraduationCap, MapPin, PieChart, Sliders,
  Palette, Upload, RotateCcw, Paintbrush, Hexagon, Layers, Cpu, Crown, Image, Zap, FolderTree,
  Star, AtSign, ExternalLink
} from 'lucide-react';
import ReactFlow, { 
  Background, Controls, MiniMap, useNodesState, useEdgesState,
  Panel, MarkerType, Node, Edge, Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import { cn } from '../../lib/utils';
import { MODULES, User as UserType, Department } from '../../types';
import DeleteConfirmation from '../Common/DeleteConfirmation';
import { useAuth } from '../../context/AuthContext';

import { logAudit } from '../../lib/audit';
import { SYSTEM_ROLE_PRESETS, SystemRolePreset, isActionEnabledForPreset, MODULE_SENSITIVE_FIELDS } from './rbacPresets';
import { FieldSecurityModal } from './FieldSecurityModal';
import { CompanyGeofenceSettings } from './CompanyGeofenceSettings';
import { MobileAppPermissionsCard } from './MobileAppPermissionsCard';
import { safeSetItem, safeGetItem } from '../../utils/safeStorage';

// --- Form & Fields Configurations for RBAC See Permissions ---

export interface HRModuleTabConfig {
  id: string;
  label: string;
  icon: any;
  actions: { id: string; label: string }[];
}

export const HR_MODULE_TABS: HRModuleTabConfig[] = [
  {
    id: 'hiring',
    label: 'Hiring',
    icon: Briefcase,
    actions: [
      { id: 'request_job_opening', label: 'Request Job Opening (طلب فتح وظيفة جديدة)' },
      { id: 'add_job_posting', label: 'Create / Add Job Posting (إنشاء/إضافة وظيفة شاغرة)' },
      { id: 'register_applicant', label: 'Register Applicant / Add Candidate (تسجيل متقدم جديد)' },
      { id: 'move_candidate_stage', label: 'Move Candidate Stage (تغيير مرحلة التوظيف / السحب والإفلات)' },
      { id: 'schedule_interview', label: 'Schedule Interview (جدولة مقابلة جديدة)' },
      { id: 'evaluate_candidate_scorecard', label: 'Evaluate Candidate / Scorecard (إضافة تقييم / بطاقة أدوات المتقدم)' },
    ]
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: Clock,
    actions: [
      { id: 'attendance_smart_sync', label: 'Smart Sync Button (زر التزامن الذكي)' },
      { id: 'attendance_clock_in_out', label: 'Clock In / Out Button (تسجيل الحضور والانصراف)' },
      { id: 'attendance_edit_logs', label: 'Edit / Delete Attendance Logs (تعديل وحذف سجلات الحضور)' },
      { id: 'assign_shift', label: 'Assign Shift (تخصيص شيفت لموظفين)' },
      { id: 'request_leave', label: 'Request Leave (طلب إجازة)' },
      { id: 'request_shift_swap', label: 'Request Shift Swap (طلب تبديل شيفت)' },
    ]
  },
  {
    id: 'daily_logs_exact',
    label: 'DAILY LOGS',
    icon: Clock,
    actions: [
      { id: 'attendance_smart_sync', label: 'Smart Sync Button (زر التزامن الذكي)' },
      { id: 'attendance_filter_logs', label: 'Daily Logs Filter Buttons (زراير الفلترة بالسجل اليومي)' },
      { id: 'attendance_clock_in_out', label: 'Clock In / Out Button (تسجيل الحضور والانصراف)' },
      { id: 'attendance_edit_logs', label: 'Edit / Delete Attendance Logs (تعديل وحذف سجلات الحضور)' },
      { id: 'attendance_export', label: 'Export Attendance Logs (تصدير سجلات الحضور)' },
    ]
  },
  {
    id: 'shift_schedule_exact',
    label: 'SHIFT SCHEDULE',
    icon: Calendar,
    actions: [
      { id: 'assign_shift', label: 'Assign Shift (تخصيص شيفت لموظفين)' },
      { id: 'create_new_shift', label: 'Create New Shift (إنشاء شيفت جديد)' },
      { id: 'view_edit_shift_schedule', label: 'Shift Schedule & Weekly Assignments (جدول الشيفتات والتكليفات الأسبوعية)' },
      { id: 'edit_shift', label: 'Shift Options / Edit Shift (خيارات وتعديل الشيفت)' },
      { id: 'delete_shift', label: 'Delete Shift (حذف الشيفت)' },
      { id: 'filter_shifts', label: 'Filter Shift Schedule (فلترة جداول الشيفتات)' },
    ]
  },
  {
    id: 'breaks_exact',
    label: 'BREAKS',
    icon: Coffee,
    actions: [
      { id: 'add_break_slot', label: 'Add Break Slot (إضافة فترة استراحة)' },
      { id: 'edit_break_slot', label: 'Edit Break Slot (تعديل فترة استراحة)' },
      { id: 'delete_break_slot', label: 'Delete Break Slot (حذف فترة استراحة)' },
      { id: 'filter_breaks', label: 'Filter Breaks (فلترة الاستراحات)' },
    ]
  },
  {
    id: 'leave_mgmt_exact',
    label: 'LEAVE MANAGEMENT',
    icon: Calendar,
    actions: [
      { id: 'request_leave', label: 'Request Leave (طلب إجازة)' },
      { id: 'edit_leave', label: 'Edit Leave Request (تعديل طلب إجازة)' },
      { id: 'bulk_approve_leaves', label: 'Bulk Approve Leaves (موافقة جماعية)' },
      { id: 'approve_leaves', label: 'Approve Leave Requests (الموافقة على الإجازات)' },
      { id: 'reject_leaves', label: 'Reject Leave Requests (رفض طلبات الإجازات)' },
      { id: 'delete_leaves', label: 'Delete Leave Requests (حذف طلبات الإجازات)' },
      { id: 'adjust_leave_balances', label: 'Adjust Leave Balances (تعديل أرصدة الإجازات)' },
      { id: 'filter_leaves', label: 'Filter Leave Requests (فلترة طلبات الإجازات)' },
    ]
  },
  {
    id: 'shift_swaps_exact',
    label: 'SHIFT SWAPS',
    icon: Repeat,
    actions: [
      { id: 'request_shift_swap', label: 'Request Shift Swap (طلب تبديل شيفت)' },
      { id: 'edit_shift_swap', label: 'Edit Shift Swap (تعديل طلب تبديل شيفت)' },
      { id: 'swap_manager_approve', label: 'Manager Approve/Reject Swap (موافقة/رفض المدير المباشر)' },
      { id: 'swap_attendance_approve', label: 'Attendance Approve/Reject Swap (موافقة/رفض مسؤول الحضور)' },
      { id: 'delete_shift_swap', label: 'Delete Shift Swap (حذف طلب تبديل الشيفت)' },
      { id: 'filter_swaps', label: 'Filter Shift Swaps (فلترة طلبات التبديل)' },
    ]
  },
  {
    id: 'employee_core',
    label: 'Employee Profiles & Directory',
    icon: Users,
    actions: [
      { id: 'add_employee', label: 'Add New Employee (إضافة موظف جديد)' },
      { id: 'edit_employee', label: 'Edit Employee Details (تعديل بيانات الموظف)' },
      { id: 'delete_employee', label: 'Delete Employee Profile (حذف ملف الموظف)' },
      { id: 'share_employee', label: 'Share Employee Profile (مشاركة الملف)' },
      { id: 'customize_layout', label: 'Customize Profile Layout (تخصيص الواجهة)' },
      { id: 'request_change', label: 'Request Profile Change (طلب تعديل بيانات)' },
      { id: 'upload_files', label: 'Upload Files & Documents (رفع مستندات)' },
      { id: 'view_edit_login_info', label: 'Login Info Access (بيانات الدخول)' },
      { id: 'add_profile_custom_row', label: 'Add Custom Row in Profile (إضافة صف مخصص)' },
      { id: 'google_sheets_export', label: 'Export Sheet / Google Sheets Sync (تصدير لجداول جوجل)' },
    ]
  },
  {
    id: 'daily_logs',
    label: 'Daily Logs & Attendance',
    icon: Clock,
    actions: [
      { id: 'attendance_smart_sync', label: 'Smart Sync Button (زر التزامن الذكي)' },
      { id: 'attendance_filter_logs', label: 'Daily Logs Filter Buttons (زراير الفلترة بالسجل اليومي)' },
      { id: 'attendance_clock_in_out', label: 'Clock In / Out Button (تسجيل الحضور والانصراف)' },
      { id: 'attendance_edit_logs', label: 'Edit / Delete Attendance Logs (تعديل وحذف سجلات الحضور)' },
      { id: 'attendance_export', label: 'Export Attendance Logs (تصدير سجلات الحضور)' },
    ]
  },
  {
    id: 'shifts',
    label: 'Shift Schedule',
    icon: Calendar,
    actions: [
      { id: 'assign_shift', label: 'Assign Shift (تخصيص شيفت لموظفين)' },
      { id: 'create_new_shift', label: 'Create New Shift (إنشاء شيفت جديد)' },
      { id: 'view_edit_shift_schedule', label: 'Shift Schedule & Weekly Assignments (جدول الشيفتات والتكليفات الأسبوعية)' },
      { id: 'edit_shift', label: 'Shift Options / Edit Shift (خيارات وتعديل الشيفت)' },
      { id: 'delete_shift', label: 'Delete Shift (حذف الشيفت)' },
      { id: 'filter_shifts', label: 'Filter Shift Schedule (فلترة جداول الشيفتات)' },
    ]
  },
  {
    id: 'breaks',
    label: 'Breaks Management',
    icon: Coffee,
    actions: [
      { id: 'add_break_slot', label: 'Add Break Slot (إضافة فترة استراحة)' },
      { id: 'edit_break_slot', label: 'Edit Break Slot (تعديل فترة استراحة)' },
      { id: 'delete_break_slot', label: 'Delete Break Slot (حذف فترة استراحة)' },
      { id: 'filter_breaks', label: 'Filter Breaks (فلترة الاستراحات)' },
    ]
  },
  {
    id: 'leaves',
    label: 'Leave Management',
    icon: Calendar,
    actions: [
      { id: 'request_leave', label: 'Request Leave (طلب إجازة)' },
      { id: 'edit_leave', label: 'Edit Leave Request (تعديل طلب إجازة)' },
      { id: 'bulk_approve_leaves', label: 'Bulk Approve Leaves (موافقة جماعية)' },
      { id: 'approve_leaves', label: 'Approve Leave Requests (الموافقة على الإجازات)' },
      { id: 'reject_leaves', label: 'Reject Leave Requests (رفض طلبات الإجازات)' },
      { id: 'delete_leaves', label: 'Delete Leave Requests (حذف طلبات الإجازات)' },
      { id: 'adjust_leave_balances', label: 'Adjust Leave Balances (تعديل أرصدة الإجازات)' },
      { id: 'filter_leaves', label: 'Filter Leave Requests (فلترة طلبات الإجازات)' },
    ]
  },
  {
    id: 'swaps',
    label: 'Shift Swaps',
    icon: Repeat,
    actions: [
      { id: 'request_shift_swap', label: 'Request Shift Swap (طلب تبديل شيفت)' },
      { id: 'edit_shift_swap', label: 'Edit Shift Swap (تعديل طلب تبديل شيفت)' },
      { id: 'swap_manager_approve', label: 'Manager Approve/Reject Swap (موافقة/رفض المدير المباشر)' },
      { id: 'swap_attendance_approve', label: 'Attendance Approve/Reject Swap (موافقة/رفض مسؤول الحضور)' },
      { id: 'delete_shift_swap', label: 'Delete Shift Swap (حذف طلب تبديل الشيفت)' },
      { id: 'filter_swaps', label: 'Filter Shift Swaps (فلترة طلبات التبديل)' },
    ]
  },
  {
    id: 'reports',
    label: 'Reports & Payroll',
    icon: FileText,
    actions: [
      { id: 'export_payroll_excel_csv', label: 'Export CSV / Excel (Payroll) (تصدير ملفات اكسيل وسجل المرتبات)' },
      { id: 'print_pdf_report', label: 'Print PDF Report (طباعة تقارير PDF)' },
      { id: 'generate_payroll_report', label: 'Generate Payroll Report (إنشاء تقرير المرتبات)' },
      { id: 'edit_payroll_entry', label: 'Edit Payroll Entry (تعديل مفردات المرتب)' },
    ]
  },
  {
    id: 'departments',
    label: 'Departments & Structure',
    icon: Building2,
    actions: [
      { id: 'add_department', label: 'Add New Department (إضافة قسم جديد)' },
      { id: 'edit_department', label: 'Edit Department (تعديل بيانات القسم)' },
      { id: 'delete_department', label: 'Delete Department (حذف قسم)' },
    ]
  },
  {
    id: 'job_openings',
    label: 'Job Openings & Postings',
    icon: Briefcase,
    actions: [
      { id: 'request_job_opening', label: 'Request Job Opening (طلب فتح وظيفة جديدة)' },
      { id: 'add_job_posting', label: 'Create / Add Job Posting (إنشاء/إضافة وظيفة شاغرة)' },
      { id: 'view_job_posting', label: 'View Job Posting Details (عرض تفاصيل الوظيفة)' },
      { id: 'edit_job_posting', label: 'Edit Job Posting (تعديل الوظيفة الشاغرة)' },
      { id: 'delete_job_posting', label: 'Delete Job Posting (حذف الوظيفة الشاغرة)' },
      { id: 'share_job_posting', label: 'Share Job Posting Link (مشاركة رابط الوظيفة)' },
      { id: 'filter_job_openings', label: 'Filter Job Openings (فلترة وبحث الوظائف الشاغرة)' },
      { id: 'show_recruitment_budget', label: 'Verify Recruitment Budget (التحقق من ميزانية التوظيف)' },
    ]
  },
  {
    id: 'candidates_pipeline',
    label: 'Candidates Pipeline',
    icon: Users,
    actions: [
      { id: 'register_applicant', label: 'Register Applicant / Add Candidate (تسجيل متقدم جديد)' },
      { id: 'add_candidate', label: 'Add Candidate Details (إضافة بيانات المتقدم)' },
      { id: 'view_candidate', label: 'View Candidate Profile (عرض ملف المتقدم)' },
      { id: 'edit_candidate', label: 'Edit Candidate Details (تعديل بيانات المتقدم)' },
      { id: 'delete_candidate', label: 'Delete Candidate Profile (حذف ملف المتقدم)' },
      { id: 'share_candidate', label: 'Share Candidate Profile (مشاركة ملف المتقدم)' },
      { id: 'move_candidate_stage', label: 'Move Candidate Stage (تغيير مرحلة التوظيف / السحب والإفلات)' },
      { id: 'pull_channel_candidates', label: 'Sync / Import Hiring Channels (تزامن واستيراد المرشحين)' },
      { id: 'filter_candidates', label: 'Filter Candidates (فلترة وبحث المتقدمين)' },
    ]
  },
  {
    id: 'interviews_scorecards',
    label: 'Interviews & Scorecards',
    icon: Calendar,
    actions: [
      { id: 'schedule_interview', label: 'Schedule Interview (جدولة مقابلة جديدة)' },
      { id: 'view_interview', label: 'View Interview Details (عرض تفاصيل المقابلة)' },
      { id: 'edit_interview', label: 'Edit Scheduled Interview (تعديل المقابلة المجدولة)' },
      { id: 'delete_interview', label: 'Delete Interview (حذف المقابلة المجدولة)' },
      { id: 'evaluate_candidate_scorecard', label: 'Evaluate Candidate / Scorecard (إضافة تقييم / بطاقة أدوات المتقدم)' },
      { id: 'edit_scorecard', label: 'Edit Evaluation Scorecard (تعديل التقييم)' },
      { id: 'ai_analyze_scorecard', label: 'Run AI Scorecard Evaluation (تحليل التقييم بالذكاء الاصطناعي)' },
      { id: 'filter_interviews', label: 'Filter Interviews Agenda (فلترة جدول المقابلات)' },
    ]
  },
  {
    id: 'performance',
    label: 'Performance & OKRs',
    icon: Target,
    actions: [
      { id: 'performance_add_review', label: 'Performance: Add Review (إضافة تقييم أدائي)' },
      { id: 'performance_edit_delete', label: 'Performance: Edit/Delete Review (تعديل/حذف تقييم)' },
      { id: 'performance_manage_okrs', label: 'Performance: Manage OKRs (إدارة الأهداف والأدوار)' },
    ]
  },
  {
    id: 'complaints',
    label: 'Complaints & Grievances',
    icon: AlertCircle,
    actions: [
      { id: 'complaints_submit', label: 'Complaints: Submit Complaint (تقديم شكوى جديدة)' },
      { id: 'complaints_resolve', label: 'Complaints: Resolve & Approve (البت وحل الشكاوى)' },
      { id: 'complaints_delete', label: 'Complaints: Delete Complaint (حذف شكوى)' },
    ]
  },
  {
    id: 'subtabs',
    label: 'Employee Sub-Tabs',
    icon: Box,
    actions: [
      { id: 'manage_assets', label: 'Assets Tab: Manage Actions (إدارة العهد والأصول)' },
      { id: 'manage_benefits', label: 'Benefits Tab: Manage Actions (إدارة المزايا والتعويضات)' },
      { id: 'manage_onboarding', label: 'Onboarding Tab: Manage Actions (إدارة التهيئة والإنضمام)' },
      { id: 'manage_offboarding', label: 'Offboarding Tab: Manage Actions (إدارة إجراءات المغادرة)' },
    ]
  }
];

export interface FormSectionConfig {
  key: string;
  label: string;
  fieldsList: string[];
}

export interface FormSubtabConfig {
  id: string;
  label: string;
  icon?: any;
  sections: FormSectionConfig[];
}

export interface MainModuleConfig {
  id: string;
  label: string;
  icon: any;
  subtabs: FormSubtabConfig[];
}

export const HR_MAIN_MODULE_CONFIGS: MainModuleConfig[] = [
  {
    id: 'Directory',
    label: 'Directory',
    icon: Users,
    subtabs: [
      {
        id: 'Personal',
        label: 'Personal',
        icon: User,
        sections: [
          {
            key: 'basic_info',
            label: 'Basic Info',
            fieldsList: [
              'Employee #',
              'Status',
              'First Name',
              'Middle Name',
              'Last Name',
              'Preferred Name',
              'Birth Date',
              'NIN',
              'Gender',
              'Marital Status',
              'Shirt size *Custom Field*',
              'Bank Details Copy'
            ]
          },
          {
            key: 'address',
            label: 'Address',
            fieldsList: [
              'Address Line 1',
              'Address Line 2',
              'City',
              'County',
              'Postcode',
              'Country'
            ]
          },
          {
            key: 'contact',
            label: 'Contact Details',
            fieldsList: [
              'Work Phone',
              'Work Ext',
              'Mobile Phone',
              'Home Phone',
              'Work Email',
              'Home Email'
            ]
          }
        ]
      },
      {
        id: 'Job',
        label: 'Job',
        icon: Briefcase,
        sections: [
          {
            key: 'employment_info',
            label: 'Employment Info',
            fieldsList: [
              'Job Title',
              'Department',
              'Division',
              'Direct Supervisor',
              'Contract Date',
              'Employment Status',
              'Work Schedule',
              'Probation End Date'
            ]
          },
          {
            key: 'work_location',
            label: 'Work Location',
            fieldsList: [
              'Primary Office',
              'Branch / Location',
              'Remote Status',
              'Desk / Workstation',
              'Working Hours'
            ]
          },
          {
            key: 'job_history',
            label: 'Job History & Transfers',
            fieldsList: [
              'Promotion Records',
              'Transfer History',
              'Salary Grade / Band',
              'Manager Change Log'
            ]
          }
        ]
      },
      {
        id: 'Time Off',
        label: 'Time Off',
        icon: Calendar,
        sections: [
          {
            key: 'leave_balances',
            label: 'Leave Balances',
            fieldsList: [
              'Annual Leave Allowance',
              'Sick Leave Days',
              'Parental Leave',
              'Compassionate Leave',
              'Carry Over Days'
            ]
          },
          {
            key: 'leave_history',
            label: 'Leave Requests History',
            fieldsList: [
              'Submitted Requests',
              'Start Date',
              'End Date',
              'Category / Type',
              'Approver Comments',
              'Approval Status'
            ]
          }
        ]
      },
      {
        id: 'Emergency',
        label: 'Emergency',
        icon: AlertCircle,
        sections: [
          {
            key: 'emergency_contacts',
            label: 'Emergency Contacts',
            fieldsList: [
              'Primary Contact Name',
              'Relationship',
              'Primary Phone Number',
              'Secondary Contact Name',
              'Secondary Phone Number',
              'Home Address'
            ]
          }
        ]
      },
      {
        id: 'Performance',
        label: 'Performance',
        icon: Target,
        sections: [
          {
            key: 'reviews',
            label: 'Performance Reviews',
            fieldsList: [
              'Self Review Submission',
              'Manager Assessment',
              'Peer Feedback',
              'Overall Rating Score',
              'Performance Scorecard'
            ]
          },
          {
            key: 'okrs',
            label: 'OKRs & Goals',
            fieldsList: [
              'Objective Title',
              'Key Results Detail',
              'Target Metric',
              'Progress Percentage',
              'Completion Date'
            ]
          }
        ]
      },
      {
        id: 'Training',
        label: 'Training',
        icon: BookOpen,
        sections: [
          {
            key: 'courses',
            label: 'Assigned Courses',
            fieldsList: [
              'Course Name',
              'Provider / Platform',
              'Completion Status',
              'Assignment Date',
              'Due Date',
              'Certificate File'
            ]
          }
        ]
      },
      {
        id: 'Documents',
        label: 'Documents',
        icon: FileText,
        sections: [
          {
            key: 'personnel_docs',
            label: 'Personnel Documents',
            fieldsList: [
              'ID / Passport Verification',
              'Offer Letter Copy',
              'Employment Contract',
              'Tax Exemption Forms',
              'Signed Compliance Policies'
            ]
          }
        ]
      },
      {
        id: 'Certifications',
        label: 'Certifications',
        icon: Award,
        sections: [
          {
            key: 'pro_certs',
            label: 'Professional Certifications',
            fieldsList: [
              'Certification Name',
              'License ID',
              'Issuing Authority',
              'Issue Date',
              'Expiry Date'
            ]
          }
        ]
      },
      {
        id: 'Notes',
        label: 'Notes',
        icon: HeartHandshake,
        sections: [
          {
            key: 'hr_notes',
            label: 'HR Confidential Notes',
            fieldsList: [
              'Internal Confidential Note',
              'Category / Tag',
              'Author Name',
              'Created Date',
              'Disciplinary Records'
            ]
          }
        ]
      },
      {
        id: 'Assets',
        label: 'Assets',
        icon: Box,
        sections: [
          {
            key: 'hardware',
            label: 'Company Hardware & Assets',
            fieldsList: [
              'Laptop Serial Number',
              'Mobile Device IMEI',
              'Monitor & Accessories',
              'Security Key / Badge',
              'Assignment Date',
              'Return Status'
            ]
          }
        ]
      },
      {
        id: 'Onboarding',
        label: 'Onboarding',
        icon: CheckSquare,
        sections: [
          {
            key: 'tasks',
            label: 'Onboarding Checklist',
            fieldsList: [
              'IT Provisioning Status',
              'Orientation Schedule',
              'Policy Acknowledgments',
              'Document Signatures'
            ]
          }
        ]
      },
      {
        id: 'Benefits',
        label: 'Benefits',
        icon: Sparkles,
        sections: [
          {
            key: 'insurance',
            label: 'Health & Perks',
            fieldsList: [
              'Medical Plan Tier',
              'Dental Insurance Plan',
              'Vision Insurance Plan',
              'Retirement Contribution %'
            ]
          }
        ]
      },
      {
        id: 'Pay Info',
        label: 'Pay Info',
        icon: DollarSign,
        sections: [
          {
            key: 'salary',
            label: 'Salary & Compensation',
            fieldsList: [
              'Base Salary Amount',
              'Pay Frequency',
              'Currency',
              'Bonus Structure',
              'Tax Identification Number',
              'Bank Account IBAN'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'Departments',
    label: 'Departments',
    icon: Building2,
    subtabs: [
      {
        id: 'Department Directory',
        label: 'Department Directory',
        icon: Building2,
        sections: [
          {
            key: 'dept_basic_info',
            label: 'Department Basic Info',
            fieldsList: [
              'Department Name',
              'Department Code',
              'Description',
              'Department Lead / Head',
              'Active Employee Count'
            ]
          },
          {
            key: 'dept_budget',
            label: 'Budget & Capacity',
            fieldsList: [
              'Annual Operating Budget',
              'Approved Headcount Quota',
              'Cost Center Code',
              'Expense Approval Limit'
            ]
          }
        ]
      },
      {
        id: 'Department Structure',
        label: 'Department Structure',
        icon: Network,
        sections: [
          {
            key: 'dept_hierarchy',
            label: 'Department Hierarchy',
            fieldsList: [
              'Parent Department',
              'Sub-Departments / Divisions',
              'Location & Branch Assignment',
              'Reporting Supervisor'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'Recruitment',
    label: 'Recruitment',
    icon: Briefcase,
    subtabs: [
      {
        id: 'Candidates Pipeline',
        label: 'Candidates Pipeline',
        icon: UserPlus,
        sections: [
          {
            key: 'candidate_profile',
            label: 'Candidate Details',
            fieldsList: [
              'Candidate Full Name',
              'Contact Email',
              'Phone Number',
              'Years of Experience',
              'Current Employer'
            ]
          },
          {
            key: 'candidate_screening',
            label: 'Resume & Screening',
            fieldsList: [
              'Resume / CV File',
              'Cover Letter',
              'Screening Score',
              'Recruiter Notes',
              'Portfolio Link'
            ]
          },
          {
            key: 'pipeline_stage',
            label: 'Pipeline Stage & Status',
            fieldsList: [
              'Current Pipeline Stage',
              'Applied Date',
              'Assigned Recruiter',
              'Rejection Reason'
            ]
          }
        ]
      },
      {
        id: 'Job Openings',
        label: 'Job Openings',
        icon: Briefcase,
        sections: [
          {
            key: 'job_posting_details',
            label: 'Job Posting Details',
            fieldsList: [
              'Job Title',
              'Department',
              'Employment Type',
              'Job Location',
              'Posting Status',
              'Open Position Count'
            ]
          },
          {
            key: 'job_comp_range',
            label: 'Salary & Requirements',
            fieldsList: [
              'Minimum Offered Salary',
              'Maximum Offered Salary',
              'Required Qualifications',
              'Job Description Body'
            ]
          }
        ]
      },
      {
        id: 'Interviews & Scorecards',
        label: 'Interviews & Scorecards',
        icon: ListChecks,
        sections: [
          {
            key: 'interview_schedule',
            label: 'Interview Schedule',
            fieldsList: [
              'Interview Date & Time',
              'Interview Round Type',
              'Assigned Panel Members',
              'Meeting Link / Location'
            ]
          },
          {
            key: 'evaluation_scorecard',
            label: 'Evaluation Scorecard',
            fieldsList: [
              'Technical Rating Score',
              'Cultural Fit Rating',
              'Communication Rating',
              'Overall Recommendation Score',
              'Panel Reviewer Notes'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'Payroll',
    label: 'Payroll',
    icon: DollarSign,
    subtabs: [
      {
        id: 'Payroll Records',
        label: 'Payroll Records',
        icon: DollarSign,
        sections: [
          {
            key: 'payroll_salary_components',
            label: 'Salary Components',
            fieldsList: [
              'Basic Salary',
              'Housing Allowance',
              'Transportation Allowance',
              'Performance Bonus',
              'Gross Total Salary'
            ]
          },
          {
            key: 'payroll_deductions',
            label: 'Deductions & Taxes',
            fieldsList: [
              'Income Tax Deduction',
              'Social Security / Pension',
              'Health Insurance Deductions',
              'Net Payable Amount'
            ]
          },
          {
            key: 'payslips',
            label: 'Payslips & Statements',
            fieldsList: [
              'Pay Period Month/Year',
              'Disbursement Date',
              'Payslip PDF Download',
              'Payment Confirmation Status'
            ]
          }
        ]
      },
      {
        id: 'Bank & Payment Details',
        label: 'Bank & Payment Details',
        icon: DollarSign,
        sections: [
          {
            key: 'bank_account_info',
            label: 'Bank Account & IBAN',
            fieldsList: [
              'Bank Name',
              'Branch Name',
              'Account Holder Name',
              'Account Number / IBAN',
              'SWIFT / BIC Code'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'Attendance',
    label: 'Attendance',
    icon: Clock,
    subtabs: [
      {
        id: 'Daily Logs',
        label: 'Daily Logs',
        icon: Clock,
        sections: [
          {
            key: 'attendance_timestamps',
            label: 'Clock-In / Clock-Out Timestamps',
            fieldsList: [
              'Check-In Time',
              'Check-Out Time',
              'Total Working Hours',
              'Break Duration',
              'Overtime Hours'
            ]
          },
          {
            key: 'attendance_location',
            label: 'Location & GPS Verification',
            fieldsList: [
              'Clock-In Location / IP',
              'Attendance Status (Present/Late/Absent)',
              'Manager Correction Note'
            ]
          }
        ]
      },
      {
        id: 'Shift Schedules',
        label: 'Shift Schedules',
        icon: Calendar,
        sections: [
          {
            key: 'shift_assignments',
            label: 'Shift Assignments & Swaps',
            fieldsList: [
              'Assigned Shift Pattern',
              'Shift Start Time',
              'Shift End Time',
              'Shift Swap Request Status'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'Performance',
    label: 'Performance',
    icon: Target,
    subtabs: [
      {
        id: 'Appraisal Reviews',
        label: 'Appraisal Reviews',
        icon: Target,
        sections: [
          {
            key: 'appraisal_scores',
            label: 'Review Assessments',
            fieldsList: [
              'Self Review Summary',
              'Manager Evaluation Score',
              'Peer Feedback Comments',
              'Final Rating Grade',
              'Development Action Plan'
            ]
          }
        ]
      },
      {
        id: 'Goals & OKRs',
        label: 'Goals & OKRs',
        icon: CheckSquare,
        sections: [
          {
            key: 'okr_metrics',
            label: 'Objectives & Key Results',
            fieldsList: [
              'Objective Title',
              'Key Result Description',
              'Target Metric Value',
              'Current Progress %',
              'Target Completion Date'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'Org Chart',
    label: 'Org Chart',
    icon: Network,
    subtabs: [
      {
        id: 'Organization Hierarchy',
        label: 'Organization Hierarchy',
        icon: Network,
        sections: [
          {
            key: 'org_structure',
            label: 'Reporting Line & Structure',
            fieldsList: [
              'Executive Direct Reports',
              'Managerial Level & Grade',
              'Department Reporting Node',
              'Span of Control Count'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'Complaints',
    label: 'Complaints',
    icon: AlertTriangle,
    subtabs: [
      {
        id: 'Whistleblower & Grievances',
        label: 'Whistleblower & Grievances',
        icon: AlertTriangle,
        sections: [
          {
            key: 'complaint_details',
            label: 'Grievance & Case Info',
            fieldsList: [
              'Complainant Name / Anonymous Flag',
              'Incident Category',
              'Incident Date & Time',
              'Detailed Description',
              'Witnesses Mentioned'
            ]
          },
          {
            key: 'investigation_notes',
            label: 'Investigation & Resolution',
            fieldsList: [
              'Assigned HR Investigator',
              'Investigation Status',
              'Confidential Case Notes',
              'Resolution & Action Taken',
              'Case Closing Date'
            ]
          }
        ]
      }
    ]
  }
];

export const HR_FORM_CONFIGS = HR_MAIN_MODULE_CONFIGS[0].subtabs;

// --- Types ---

interface Role {
  id: number;
  name: string;
  description?: string;
  company_id?: number;
  mobile_permissions?: Record<string, boolean>;
  permissions: Record<string, {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    tabs?: Record<string, boolean>;
    settings_access?: boolean;
    custom_actions?: Record<string, boolean>;
    tab_actions?: Record<string, Record<string, boolean>>;
    data_scopes?: Record<string, 'global' | 'branch' | 'own'>;
  }>;
}

// --- Custom Node for Org Chart ---

const OrgNode = ({ data }: any) => (
  <div className="px-4 py-3 shadow-xl rounded-2xl bg-white border-2 border-indigo-100 min-w-[200px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-400" />
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
        {data.name.charAt(0)}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{data.name}</p>
        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{data.job_title}</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-400" />
  </div>
);

const DeptNode = ({ data }: any) => (
  <div className="px-6 py-4 shadow-2xl rounded-3xl bg-indigo-600 border-4 border-indigo-400 min-w-[250px] text-white">
    <Handle type="target" position={Position.Top} className="w-4 h-4 bg-white" />
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
        <Building2 className="w-6 h-6" />
      </div>
      <div>
        <p className="text-lg font-black tracking-tight">{data.name}</p>
        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Department Unit</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-white" />
  </div>
);

const nodeTypes = {
  orgNode: OrgNode,
  deptNode: DeptNode,
};

// --- Main Component ---

interface AdminPanelProps {
  onDataChange?: () => void;
  users?: UserType[];
  roles?: Role[];
  departments?: Department[];
  globalStatuses?: any[];
  systemModules?: any[];
  setActiveModule?: (id: string) => void;
  initialTab?: 'users' | 'rbac' | 'org' | 'statuses' | 'modules' | 'audit' | 'branding';
  hideLayoutNav?: boolean;
}

// --- Granular Permissions Configuration Mappings ---
const MODULE_TABS_MAPPING: Record<string, { tabs: string[], settingsLabel?: string }> = {
  'Dashboard': {
    tabs: ['Dashboard Overview', 'Global Activity Feed', 'My Checklist', 'System Status'],
    settingsLabel: 'Dashboard Settings'
  },
  'AI Business': {
    tabs: ['AI Generator', 'Market Analysis', 'Feasibility Studies', 'SWOT Analysis', 'Saved Prompts'],
    settingsLabel: 'AI Business Settings'
  },
  'Meeting Hub': {
    tabs: ['Calendar', 'Active Meetings', 'Meeting Notes', 'Rooms & Resource Booker', 'Action Items'],
    settingsLabel: 'Meeting Hub Settings'
  },
  'Business Model': {
    tabs: ['Business Model Canvas', 'Value Proposition Canvas', 'Lean Canvas', 'History logs'],
    settingsLabel: 'Business Model Canvas Settings'
  },
  'Performance & KPIs': {
    tabs: ['Dashboard', 'KPI Metrics', 'Department Breakdown', 'History Log'],
    settingsLabel: 'KPI Settings'
  },
  'KPIs': {
    tabs: ['Dashboard', 'KPI Metrics', 'Department Breakdown', 'History Log'],
    settingsLabel: 'KPI Settings'
  },
  'Risk Register': {
    tabs: ['Risk Register', 'Risk Matrix', 'Mitigation Plans'],
    settingsLabel: 'Risk Settings'
  },
  'Risk': {
    tabs: ['Risk Register', 'Risk Matrix', 'Mitigation Plans'],
    settingsLabel: 'Risk Settings'
  },
  'Marketing Hub': {
    tabs: ['Campaigns Planner', 'Content Calendar', 'Lead Sources Analytics', 'Social Scheduler'],
    settingsLabel: 'Marketing Hub Settings'
  },
  'Marketing': {
    tabs: ['Campaigns Planner', 'Content Calendar', 'Lead Sources Analytics', 'Social Scheduler'],
    settingsLabel: 'Marketing Hub Settings'
  },
  'CRM Leads': {
    tabs: ['Leads Board', 'Lead List', 'Import/Export'],
    settingsLabel: 'CRM Leads Settings'
  },
  'Leads': {
    tabs: ['Leads Board', 'Lead List', 'Import/Export'],
    settingsLabel: 'CRM Leads Settings'
  },
  'Sales CRM': {
    tabs: ['Sales CRM Dashboard', 'Pipeline Stages', 'Contacts & Accounts', 'Quotations & Proposals', 'Sales Reps Performance', 'Unified Inbox', 'Auto Assign'],
    settingsLabel: 'CRM Settings (Assignment Rules, Stage Colors)'
  },
  'CRM': {
    tabs: ['Sales CRM Dashboard', 'Pipeline Stages', 'Contacts & Accounts', 'Quotations & Proposals', 'Sales Reps Performance', 'Unified Inbox', 'Auto Assign'],
    settingsLabel: 'CRM Settings (Assignment Rules, Stage Colors)'
  },
  'Operations Hub': {
    tabs: ['Work Orders Pipeline', 'Multi-Role Assignment Desk', 'Operational Cost Override Desk', 'Auto Assign System', 'Operations Performance Desk', 'Quality Assurance & Review'],
    settingsLabel: 'Operations Hub Settings'
  },
  'Accounting': {
    tabs: ['Financial Dashboard', 'Vaults & Banks', 'Invoices & Ledger', 'Payroll & Commissions', 'Chart of Accounts', 'Invoices Ledger', 'Supplier Bills', 'Journal Ledger', 'Bank Reconciliation', 'Financial Reports'],
    settingsLabel: 'Accounting Settings (VAT Rate, Prefix, Terms)'
  },
  'Products/Services': {
    tabs: ['Dashboard', 'Items Directory', 'Prices & Promo Codes', 'Profitability Analytics', 'Cross-Module Integrations', 'Manage Fields'],
    settingsLabel: 'Products/Services Settings'
  },
  'Products': {
    tabs: ['Dashboard', 'Items Directory', 'Prices & Promo Codes', 'Profitability Analytics', 'Cross-Module Integrations', 'Manage Fields'],
    settingsLabel: 'Products/Services Settings'
  },
  'SOP Management': {
    tabs: ['Directory', 'SOP List', 'Approval Workflow', 'Categories'],
    settingsLabel: 'SOP Settings'
  },
  'SOPs': {
    tabs: ['Directory', 'SOP List', 'Approval Workflow', 'Categories'],
    settingsLabel: 'SOP Settings'
  },
  'Process Mapping': {
    tabs: ['Flowcharts', 'Mapping Tool', 'SOP Linker'],
    settingsLabel: 'Process Mapping Settings'
  },
  'RACI Matrix': {
    tabs: ['RACI Chart', 'Matrix Editor', 'Role Assignments'],
    settingsLabel: 'RACI Settings'
  },
  'RACI': {
    tabs: ['RACI Chart', 'Matrix Editor', 'Role Assignments'],
    settingsLabel: 'RACI Settings'
  },
  'Tasks': {
    tabs: ['Task Board', 'Kanban', 'Timeline', 'Time Tracker'],
    settingsLabel: 'Tasks Settings'
  },
  'HR Management': {
    tabs: ['Dashboard', 'Hiring', 'Candidates Pipeline', 'Job Openings', 'Interviews & Scorecards', 'Attendance', 'DAILY LOGS', 'SHIFT SCHEDULE', 'BREAKS', 'LEAVE MANAGEMENT', 'SHIFT SWAPS', 'Employee Directory', 'Employee Profiles & Directory', 'Departments & Structure', 'Org Chart', 'Payroll & Salaries', 'Benefits & Allowances', 'Performance & OKRs', 'Complaints & Grievances', 'Assets Management', 'Onboarding & Offboarding'],
    settingsLabel: 'HR Settings'
  },
  'HR': {
    tabs: ['Dashboard', 'Hiring', 'Candidates Pipeline', 'Job Openings', 'Interviews & Scorecards', 'Attendance', 'DAILY LOGS', 'SHIFT SCHEDULE', 'BREAKS', 'LEAVE MANAGEMENT', 'SHIFT SWAPS', 'Employee Directory', 'Employee Profiles & Directory', 'Departments & Structure', 'Org Chart', 'Payroll & Salaries', 'Benefits & Allowances', 'Performance & OKRs', 'Complaints & Grievances', 'Assets Management', 'Onboarding & Offboarding'],
    settingsLabel: 'HR Settings'
  },
  'Training Hub': {
    tabs: ['Courses', 'Assignments', 'Enrollment', 'Statistics'],
    settingsLabel: 'Training Hub Settings'
  },
  'Training': {
    tabs: ['Courses', 'Assignments', 'Enrollment', 'Statistics'],
    settingsLabel: 'Training Hub Settings'
  },
  'Knowledge Base': {
    tabs: ['Articles Explorer', 'Category Hub', 'Article Reader', 'Article Authoring & Markdown Studio', 'Knowledge Base Management & Taxonomies', 'Enterprise Search & Discovery'],
    settingsLabel: 'KB Settings'
  },
  'Communication': {
    tabs: ['Inbox', 'Contextual Chat', 'System Broadcasts'],
    settingsLabel: 'Communication Settings'
  },
  'Quality Assurance': {
    tabs: ['Audits', 'Evaluation Forms', 'Performance Board'],
    settingsLabel: 'QA Settings'
  },
  'QA': {
    tabs: ['Audits', 'Evaluation Forms', 'Performance Board'],
    settingsLabel: 'QA Settings'
  },
  'Kaizen Improvement': {
    tabs: ['Proposals', 'Voting Board', 'Implementation Logs'],
    settingsLabel: 'Kaizen Settings'
  },
  'Kaizen': {
    tabs: ['Proposals', 'Voting Board', 'Implementation Logs'],
    settingsLabel: 'Kaizen Settings'
  },
  'Automation': {
    tabs: ['Triggers', 'Workflows', 'Execution History', 'Webhook Listener'],
    settingsLabel: 'Automation Settings'
  },
  'Integration Hub': {
    tabs: ['Google Sheets', 'Facebook Leads', 'WhatsApp', 'Zapier', 'Sync Logs'],
    settingsLabel: 'Integration Settings'
  },
  'Integrations': {
    tabs: ['Google Sheets', 'Facebook Leads', 'WhatsApp', 'Zapier', 'Sync Logs'],
    settingsLabel: 'Integration Settings'
  },
  'Build': {
    tabs: ['App Builder', 'Component Catalog', 'Layout Inspector', 'Deployment Logs'],
    settingsLabel: 'Build Settings'
  },
  'Admin Panel': {
    tabs: ['Users', 'RBAC Matrix', 'Org Chart', 'Statuses', 'System Modules', 'Audit Logs'],
    settingsLabel: 'Admin Panel Global Settings'
  },
  'Admin': {
    tabs: ['Users', 'RBAC Matrix', 'Org Chart', 'Statuses', 'System Modules', 'Audit Logs'],
    settingsLabel: 'Admin Panel Global Settings'
  }
};

export function getModuleTabs(moduleName: string | null | undefined, systemModulesList?: any[]): string[] {
  if (!moduleName) return ['General Form'];
  
  const canon = moduleName === 'HR Management' ? 'HR' :
                moduleName === 'Sales CRM' ? 'CRM' :
                moduleName === 'CRM Leads' ? 'Leads' :
                moduleName === 'SOP Management' ? 'SOPs' :
                moduleName === 'Quality Assurance' ? 'QA' :
                moduleName === 'Training Hub' ? 'Training' :
                moduleName === 'Kaizen Improvement' ? 'Kaizen' :
                moduleName === 'Integration Hub' ? 'Integrations' :
                moduleName === 'Performance & KPIs' ? 'KPIs' :
                moduleName === 'Risk Register' ? 'Risk' : moduleName;

  const mNameLow = (moduleName || '').toLowerCase();
  const canonLow = (canon || '').toLowerCase();

  const staticKey = Object.keys(MODULE_TABS_MAPPING).find(
    k => (k || '').toLowerCase() === mNameLow || (k || '').toLowerCase() === canonLow
  );
  let baseTabs = staticKey ? MODULE_TABS_MAPPING[staticKey].tabs : [];

  if (systemModulesList && Array.isArray(systemModulesList)) {
    const matchedSysModule = systemModulesList.find(sm => 
      sm.name?.toLowerCase() === mNameLow || 
      sm.id?.toLowerCase() === mNameLow ||
      sm.name?.toLowerCase() === canonLow
    );

    if (matchedSysModule) {
      let sysTabs: string[] = [];
      if (matchedSysModule.metadata) {
        let meta = matchedSysModule.metadata;
        if (typeof meta === 'string') {
          try { meta = JSON.parse(meta); } catch (e) { meta = null; }
        }
        if (meta?.tabs && Array.isArray(meta.tabs)) {
          sysTabs = meta.tabs;
        }
      }
      if (sysTabs.length > 0) {
        return Array.from(new Set([...baseTabs, ...sysTabs]));
      }
    }
  }

  return baseTabs.length > 0 ? baseTabs : ['General Form', 'List View', 'Details View'];
}

const HR_SENSITIVE_CUSTOM_ACTIONS = [
  // 1. Employee Core Actions
  { key: 'add_employee', label: 'Add New Employee / زر إضافة موظف جديد' },
  { key: 'edit_employee', label: 'Edit Employee Details / تعديل بيانات وسجلات الموظف' },
  { key: 'delete_employee', label: 'Delete Employee Profile / حذف ملف الموظف' },
  { key: 'share_employee', label: 'Share Employee Profile / مشاركة ملف الموظف' },
  { key: 'customize_layout', label: 'Customize Profile Layout / زر Customize Layout (تخصيص الهيكل)' },
  { key: 'request_change', label: 'Request Profile Change / زر Request a Change (طلب تغيير البيانات)' },
  { key: 'upload_files', label: 'Upload Files & Documents / زر Upload لرفع الصورة والمستندات' },
  { key: 'view_edit_login_info', label: 'Login Info Access / عرض وتعديل بيانات دخول النظام وكلمات المرور' },
  { key: 'add_profile_custom_row', label: 'Add Custom Row in Profile / إضافة سطر أو حقل مخصص بملف الموظف' },

  // 2. Time Off & Leaves
  { key: 'adjust_leave_balances', label: 'Adjust Leave Balances / آيقونة تعديل وتصفير أرصدة الإجازات' },
  { key: 'approve_leaves', label: 'Approve Leave Requests / آيقونة قبول وتصديق طلبات الإجازة' },
  { key: 'reject_leaves', label: 'Reject Leave Requests / آيقونة رفض طلبات الإجازة' },
  { key: 'delete_leaves', label: 'Delete Leave Requests / آيقونة مسح وحذف طلبات الإجازة' },
  { key: 'request_leave', label: 'Submit Leave Request / زر تقديم طلب إجازة جديد' },

  // 3. Departments
  { key: 'add_department', label: 'Add New Department / زر Add New Department' },
  { key: 'edit_department', label: 'Edit Department / آيقونة تعديل بيانات القسم' },
  { key: 'delete_department', label: 'Delete Department / آيقونة حذف القسم' },

  // 4. Employee Sub-Tabs
  { key: 'manage_assets', label: 'Assets Tab: Manage Actions / كافة زراير وآيقونات تابة الأصول والأجهزة' },
  { key: 'manage_benefits', label: 'Benefits Tab: Manage Actions / كافة زراير وآيقونات تابة المزايا والبدلات' },
  { key: 'manage_onboarding', label: 'Onboarding Tab: Manage Actions / كافة زراير وآيقونات تابة خطة التأهيل' },
  { key: 'manage_offboarding', label: 'Offboarding Tab: Manage Actions / كافة زراير وآيقونات تابة إجراءات إنهاء الخدمة' },

  // 5. Recruitment & Hiring Subtabs
  { key: 'request_job_opening', label: 'Job Openings: Request Job Opening / طلب فتح وظيفة جديدة' },
  { key: 'add_job_posting', label: 'Job Openings: Create / Add Job Posting / إضافة وظيفة جديدة' },
  { key: 'view_job_posting', label: 'Job Openings: View Details / عرض تفاصيل الوظيفة' },
  { key: 'edit_job_posting', label: 'Job Openings: Edit Job Posting / تعديل بيانات الوظيفة' },
  { key: 'delete_job_posting', label: 'Job Openings: Delete Job Posting / حذف الوظيفة الشاغرة' },
  { key: 'share_job_posting', label: 'Job Openings: Share Job Link / مشاركة رابط الوظيفة' },
  { key: 'filter_job_openings', label: 'Job Openings: Filter Jobs / فلترة وبحث الوظائف الشاغرة' },
  { key: 'show_recruitment_budget', label: 'Job Openings: View Budgets / إظهار الميزانيات والرواتب المعروضة' },
  { key: 'register_applicant', label: 'Candidates: Register Applicant / تسجيل متقدم جديد' },
  { key: 'add_candidate', label: 'Candidates: Add Candidate Details / إضافة بيانات مرشح جديد' },
  { key: 'view_candidate', label: 'Candidates: View Candidate Profile / عرض ملف المرشح' },
  { key: 'edit_candidate', label: 'Candidates: Edit Candidate Details / تعديل بيانات المرشح' },
  { key: 'delete_candidate', label: 'Candidates: Delete Candidate Profile / حذف ملف المرشح' },
  { key: 'share_candidate', label: 'Candidates: Share Candidate Profile / مشاركة ملف المرشح' },
  { key: 'move_candidate_stage', label: 'Candidates: Move Stage (Drag & Drop) / نقل المرشح بين مراحل التعيين' },
  { key: 'pull_channel_candidates', label: 'Candidates: Sync Hiring Channels / تزامن واستيراد المرشحين' },
  { key: 'filter_candidates', label: 'Candidates: Filter Candidates / فلترة وبحث المرشحين' },

  // 6. Attendance & Shifts
  { key: 'attendance_clock_in_out', label: 'Attendance: Clock In/Out / زراير وآيقونات الحضور والانصراف' },
  { key: 'attendance_manage_shifts', label: 'Attendance: Manage Shifts / كافة زراير وآيقونات إضافة وتعديل النوبات' },
  { key: 'attendance_edit_logs', label: 'Attendance: Edit/Delete Logs / آيقونات تعديل وحذف سجلات البصمة' },
  { key: 'swap_request', label: 'Swap Management: Request Shift Swap / زر طلب تبديل الوردية' },
  { key: 'swap_manager_approve', label: 'Swap Management: Manager Approval / موافقة المدير المباشر' },
  { key: 'swap_attendance_approve', label: 'Swap Management: Attendance Approval / موافقة مسئول الحضور' },

  // 7. Performance & OKRs
  { key: 'performance_add_review', label: 'Performance: Add Review / زر إضافة تقييم أداء جديد' },
  { key: 'performance_edit_delete', label: 'Performance: Edit/Delete Review / آيقونات تعديل وحذف تقييمات الأداء' },
  { key: 'performance_manage_okrs', label: 'Performance: Manage OKRs / كافة زراير وآيقونات الأهداف الذكية' },

  // 8. Complaints
  { key: 'complaints_submit', label: 'Complaints: Submit Complaint / زر تقديم شكوى جديدة' },
  { key: 'complaints_resolve', label: 'Complaints: Resolve & Approve / آيقونات البت في الشكوى وحلها أو قبولها' },
  { key: 'complaints_delete', label: 'Complaints: Delete Complaint / آيقونة حذف وتكتم الشكوى' }
];

const MODULE_CUSTOM_ACTIONS_MAPPING: Record<string, { key: string, label: string }[]> = {
  'Operations Hub': [
    { key: 'override_actual_cost', label: 'Override Actual Cost / تعديل التكلفة الفعلية للأوردر يدوياً' },
    { key: 'view_crm_deal_value', label: 'View CRM Deal Value / رؤية القيمة البيعية للعقد من الـ CRM' },
    { key: 'reassign_orders', label: 'Reassign Orders / إعادة تعيين أوامر التشغيل والمسؤولين' }
  ],
  'CRM': [
    { key: 'edit_stages', label: 'Edit Deal Stages / تعديل مراحل الصفقة' },
    { key: 'edit_commissions', label: 'Edit Commission Rates / تعديل نسب العمولات' },
    { key: 'manual_override', label: 'Override Representative Assignments / التعيين اليدوي للموظفين' }
  ],
  'Sales CRM': [
    { key: 'edit_stages', label: 'Edit Deal Stages / تعديل مراحل الصفقة' },
    { key: 'edit_commissions', label: 'Edit Commission Rates / تعديل نسب العمولات' },
    { key: 'manual_override', label: 'Override Representative Assignments / التعيين اليدوي للموظفين' }
  ],
  'Leads': [
    { key: 'import_leads', label: 'Import Leads Sheet / استيراد قوائم عملاء متوقعين' },
    { key: 'assign_leads', label: 'Assign Lead Owners / توزيع العملاء على فريق المبيعات' },
    { key: 'export_leads', label: 'Export Leads Data / تصدير بيانات عملاء المتوقعين' }
  ],
  'CRM Leads': [
    { key: 'import_leads', label: 'Import Leads Sheet / استيراد قوائم عملاء متوقعين' },
    { key: 'assign_leads', label: 'Assign Lead Owners / توزيع العملاء على فريق المبيعات' },
    { key: 'export_leads', label: 'Export Leads Data / تصدير بيانات عملاء المتوقعين' }
  ],
  'SOPs': [
    { key: 'approve_sops', label: 'Approve & Publish SOPs / اعتماد ونشر إجراءات العمل SOPs' },
    { key: 'manage_versions', label: 'Manage SOP Versions & History / إدارة الإصدارات والأرشيف' }
  ],
  'SOP Management': [
    { key: 'approve_sops', label: 'Approve & Publish SOPs / اعتماد ونشر إجراءات العمل SOPs' },
    { key: 'manage_versions', label: 'Manage SOP Versions & History / إدارة الإصدارات والأرشيف' }
  ],
  'Accounting': [
    { key: 'manage_currencies', label: 'Manage Financial Currencies / إدارة العملات المالية' },
    { key: 'edit_invoice_settings', label: 'Edit Invoice Templates & VAT / تعديل الفواتير والضريبة' },
    { key: 'approve_bills', label: 'Approve Supplier Bills / اعتماد فواتير الموردين والصرف' },
    { key: 'override_journal', label: 'Override Journal Entries / تعديل قيود اليومية يدوياً' }
  ],
  'HR': HR_SENSITIVE_CUSTOM_ACTIONS,
  'HR Management': HR_SENSITIVE_CUSTOM_ACTIONS,
  'Knowledge Base': [
    { key: 'approve_articles', label: 'Approve KB Articles / اعتماد مقالات المعرفة' }
  ],
  'Tasks': [
    { key: 'edit_time_logs', label: 'Edit Team Time Sheets / تعديل وتدقيق ساعات عمل الفريق' }
  ],
  'Quality Assurance': [
    { key: 'approve_audits', label: 'Approve Audit Reports / اعتماد تقارير جودة التشغيل' }
  ],
  'QA': [
    { key: 'approve_audits', label: 'Approve Audit Reports / اعتماد تقارير جودة التشغيل' }
  ],
  'Automation': [
    { key: 'execute_workflows', label: 'Trigger Automation Workflows / تشغيل أتمتة مسارات العمل' }
  ]
};

export function getModuleCustomActions(moduleName: string | null | undefined): { key: string, label: string }[] {
  if (!moduleName) return [];
  const canon = moduleName === 'HR Management' ? 'HR' :
                moduleName === 'Sales CRM' ? 'CRM' :
                moduleName === 'CRM Leads' ? 'Leads' :
                moduleName === 'Accounting' ? 'Accounting' :
                moduleName === 'SOP Management' ? 'SOPs' :
                moduleName === 'Quality Assurance' ? 'QA' :
                moduleName === 'Training Hub' ? 'Training' :
                moduleName === 'Kaizen Improvement' ? 'Kaizen' :
                moduleName === 'Integration Hub' ? 'Integrations' :
                moduleName === 'Performance & KPIs' ? 'KPIs' :
                moduleName === 'Risk Register' ? 'Risk' : moduleName;

  const canonLow = (canon || '').toLowerCase();
  const modLow = (moduleName || '').toLowerCase();

  const key = Object.keys(MODULE_CUSTOM_ACTIONS_MAPPING).find(
    k => (k || '').toLowerCase() === canonLow || (k || '').toLowerCase() === modLow
  );

  return key ? MODULE_CUSTOM_ACTIONS_MAPPING[key] : [];
}

export function normalizeHrPermissions(hrPerms: any) {
  if (!hrPerms) return hrPerms;
  
  const cleanPerms = { ...hrPerms };
  if (!cleanPerms.tabs) cleanPerms.tabs = {};
  if (!cleanPerms.custom_actions) cleanPerms.custom_actions = {};
  if (!cleanPerms.tab_actions) cleanPerms.tab_actions = {};
  if (!cleanPerms.data_scopes) cleanPerms.data_scopes = {};

  const allHrTabs = Array.from(new Set([
    'Dashboard', 'Employee Directory', 'Departments & Structure', 'Recruitment & Jobs',
    'Candidates Pipeline', 'Job Openings', 'Interviews & Scorecards', 'Payroll & Salaries',
    'Attendance & Clock In', 'Time Off & Leaves', 'Performance & OKRs', 'Complaints & Grievances',
    'Assets Management', 'Benefits & Allowances', 'Onboarding & Offboarding', 'Org Chart',
    'Swap Management', 'Hiring', 'Recruitment', 'Attendance', 'DAILY LOGS', 'SHIFT SCHEDULE',
    'BREAKS', 'LEAVE MANAGEMENT', 'SHIFT SWAPS', 'Employee Profiles & Directory', 'Departments',
    'Payroll', 'Performance', ...Object.keys(cleanPerms.tabs || {}), ...Object.keys(cleanPerms.tab_actions || {})
  ]));

  allHrTabs.forEach(tabName => {
    const isTabDisabled = cleanPerms.tabs[tabName] === false;
    if (!cleanPerms.tab_actions[tabName]) {
      cleanPerms.tab_actions[tabName] = {
        view: !isTabDisabled,
        read: !isTabDisabled,
        write: !isTabDisabled,
        edit: !isTabDisabled,
        create: !isTabDisabled,
        delete: !isTabDisabled,
        select: !isTabDisabled,
        submit: !isTabDisabled,
        cancel: !isTabDisabled,
        amend: !isTabDisabled,
        report: !isTabDisabled,
        import: !isTabDisabled,
        export: !isTabDisabled,
        print: !isTabDisabled,
        email: !isTabDisabled,
        share: !isTabDisabled,
        if_owner: false,
        level: isTabDisabled ? 3 : 0,
        data_scope: cleanPerms.data_scopes[tabName] || 'global'
      };
    } else {
      if (isTabDisabled) {
        cleanPerms.tab_actions[tabName].view = false;
        cleanPerms.tab_actions[tabName].read = false;
        cleanPerms.tab_actions[tabName].level = 3;
      } else if (cleanPerms.tabs[tabName] === true) {
        cleanPerms.tab_actions[tabName].view = true;
        cleanPerms.tab_actions[tabName].read = true;
        if (cleanPerms.tab_actions[tabName].level === 3) {
          cleanPerms.tab_actions[tabName].level = 0;
        }
      }
    }
  });

  return cleanPerms;
}

export default function AdminPanel({ 
  onDataChange,
  users: propUsers,
  roles: propRoles,
  departments: propDepartments,
  globalStatuses: propStatuses,
  systemModules: propModules,
  setActiveModule,
  initialTab,
  hideLayoutNav
}: AdminPanelProps) {
  const { checkPermission, user, refreshUser, updateUserPermissions } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'rbac' | 'org' | 'statuses' | 'modules' | 'audit' | 'branding'>(() => {
    if (initialTab) return initialTab;
    if ((checkPermission as any)('Admin', 'tab:Users')) return 'users';
    if ((checkPermission as any)('Admin', 'tab:RBAC Matrix')) return 'rbac';
    if ((checkPermission as any)('Admin', 'tab:Org Chart')) return 'org';
    if ((checkPermission as any)('Admin', 'tab:Statuses')) return 'statuses';
    if ((checkPermission as any)('Admin', 'tab:System Modules')) return 'modules';
    if ((checkPermission as any)('Admin', 'tab:Audit Logs')) return 'audit';
    return 'users';
  });

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [users, setUsers] = useState<UserType[]>(propUsers || []);
  const [roles, setRoles] = useState<Role[]>(() => {
    if (!propRoles) return [];
    return propRoles.map((role: any) => {
      const perms = JSON.parse(JSON.stringify(role.permissions || {}));
      if (perms.HR) {
        perms.HR = normalizeHrPermissions(perms.HR);
      }
      return { ...role, permissions: perms };
    });
  });
  const [departments, setDepartments] = useState<Department[]>(propDepartments || []);
  const [globalStatuses, setGlobalStatuses] = useState<any[]>(propStatuses || []);
  const [systemModules, setSystemModules] = useState<any[]>(propModules || []);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(!propUsers);

  const getDepartmentJobTitles = (deptId?: number | string | null): string[] => {
    if (!deptId) return [];
    const dept = departments.find(d => Number(d.id) === Number(deptId));
    const titlesSet = new Set<string>();

    if (dept?.job_titles) {
      if (Array.isArray(dept.job_titles)) {
        dept.job_titles.forEach((t: any) => {
          const str = typeof t === 'string' ? t : (t?.title || t?.name || '');
          if (str) titlesSet.add(str);
        });
      } else if (typeof dept.job_titles === 'string') {
        try {
          const parsed = JSON.parse(dept.job_titles);
          if (Array.isArray(parsed)) {
            parsed.forEach((t: any) => {
              const str = typeof t === 'string' ? t : (t?.title || t?.name || '');
              if (str) titlesSet.add(str);
            });
          }
        } catch (e) {
          (dept.job_titles as string).split(',').forEach(t => {
            if (t.trim()) titlesSet.add(t.trim());
          });
        }
      }
    }

    // Include existing users' titles in that department
    users.filter(u => Number(u.department_id) === Number(deptId)).forEach(u => {
      if (u.job_title) titlesSet.add(u.job_title);
    });

    // Default fallback titles if none specified in department
    if (titlesSet.size === 0 && dept?.name) {
      const dName = dept.name.toLowerCase();
      if (dName.includes('hr') || dName.includes('human')) {
        ['HR Specialist', 'HR Manager', 'Talent Acquisition Lead', 'Payroll Manager', 'HR Generalist'].forEach(t => titlesSet.add(t));
      } else if (dName.includes('fin') || dName.includes('acc')) {
        ['Accountant', 'Finance Manager', 'Financial Analyst', 'Auditor', 'Treasurer'].forEach(t => titlesSet.add(t));
      } else if (dName.includes('sale') || dName.includes('commercial')) {
        ['Sales Manager', 'Account Executive', 'Sales Representative', 'Business Development Manager'].forEach(t => titlesSet.add(t));
      } else if (dName.includes('tech') || dName.includes('it') || dName.includes('dev') || dName.includes('eng')) {
        ['Software Engineer', 'Senior Developer', 'DevOps Specialist', 'IT Administrator', 'QA Engineer'].forEach(t => titlesSet.add(t));
      } else if (dName.includes('op') || dName.includes('logis')) {
        ['Operations Manager', 'Supply Chain Specialist', 'Logistics Manager', 'Operations Analyst'].forEach(t => titlesSet.add(t));
      } else if (dName.includes('market')) {
        ['Marketing Manager', 'Content Specialist', 'Digital Marketing Lead', 'SEO Executive'].forEach(t => titlesSet.add(t));
      } else {
        ['Department Manager', 'Senior Specialist', 'Team Leader', 'Specialist', 'Coordinator'].forEach(t => titlesSet.add(t));
      }
    }

    return Array.from(titlesSet);
  };

  const getRBACKey = (m: any): string => {
    const map: Record<string, string> = {
      'crm': 'CRM',
      'leads': 'Leads',
      'sops': 'SOPs',
      'process-mapping': 'Process Mapping',
      'kb': 'Knowledge Base',
      'qa': 'QA',
      'training': 'Training',
      'tasks': 'Tasks',
      'kpis': 'KPIs',
      'risk': 'Risk',
      'kaizen': 'Kaizen',
      'raci': 'RACI',
      'comm': 'Communication',
      'integration': 'Integrations',
      'admin': 'Admin',
      'acct': 'Accounting',
      'hr': 'HR',
      'dashboard': 'Dashboard',
      'ai-business': 'AI Business',
      'ai-boardroom': 'AI Boardroom',
      'marketing': 'Marketing Hub',
      'business-model': 'Business Model',
      'products': 'Products/Services',
      'automation': 'Automation',
      'home': 'Home',
      'home-workspace': 'Home'
    };
    return map[m.id] || m.name || m.id;
  };

  const getRBACModulesList = () => {
    const activeFromSystem = systemModules
      .filter((m: any) => m.is_active)
      .map((m: any) => getRBACKey(m));
    
    if (activeFromSystem.length > 0) {
      return Array.from(new Set(['Home', ...activeFromSystem]));
    }

    return ['Home', 'CRM', 'Leads', 'SOPs', 'Process Mapping', 'Knowledge Base', 'QA', 'Training', 'Tasks', 'KPIs', 'Risk', 'Kaizen', 'RACI', 'Communication', 'Integrations', 'Admin', 'Accounting', 'HR'];
  };

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [matrixSearch, setMatrixSearch] = useState('');

  // RBAC Redesign States
  const [selectedTreeItem, setSelectedTreeItem] = useState<{ module: string; tab: string } | null>({
    module: 'Operations Hub',
    tab: 'Work Orders Pipeline'
  });
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({ 'Operations Hub': true });
  const [selectedRBACModule, setSelectedRBACModule] = useState<string | null>(null);
  const [hasUnsavedRbacChanges, setHasUnsavedRbacChanges] = useState(false);
  const [isSavingRbac, setIsSavingRbac] = useState(false);

  // RBAC Slide-over Drawer & Main View Mode States
  const [rbacMatrixMainTab, setRbacMatrixMainTab] = useState<'tree' | 'actions_fields' | 'presets'>('tree');
  const [rbacTabDrawerOpen, setRbacTabDrawerOpen] = useState(false);
  const [rbacDrawerTab, setRbacDrawerTab] = useState<string | null>(null);
  const [rbacDrawerActiveTab, setRbacDrawerActiveTab] = useState<'actions' | 'fields'>('actions');

  // RBAC Access Level "What can do" & "What can see" States
  const [rbacAccessViewTab, setRbacAccessViewTab] = useState<'do' | 'see'>('do');
  const [rbacActiveModuleTab, setRbacActiveModuleTab] = useState<string>('employees');
  const [rbacSeePerspective, setRbacSeePerspective] = useState<'others' | 'self' | 'home'>('others');
  const [rbacSeeScope, setRbacSeeScope] = useState<string>('all');
  const [rbacSeeMainModule, setRbacSeeMainModule] = useState<string>('Directory');
  const [rbacSeeSubtab, setRbacSeeSubtab] = useState<string>('Personal');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSectionCollapse = (secKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [secKey]: !prev[secKey]
    }));
  };

  // Granular Permissions States
  const [isGranularModalOpen, setIsGranularModalOpen] = useState(false);
  const [selectedGranularModule, setSelectedGranularModule] = useState<string | null>(null);
  const [granularPermissions, setGranularPermissions] = useState<{
    tabs?: Record<string, boolean>;
    settings_access?: boolean;
    custom_actions?: Record<string, boolean>;
  }>({});

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'user' | 'role' | 'department' | 'status' | 'module' | 'tab' | null;
    item: any | null;
  }>({ isOpen: false, type: null, item: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Field Level Security & Presets States
  const [isFieldSecurityOpen, setIsFieldSecurityOpen] = useState(false);
  const [fieldSecurityModule, setFieldSecurityModule] = useState<string | null>(null);
  const [newRolePresetId, setNewRolePresetId] = useState<string>('contributor');

  // Sync props to state
  useEffect(() => { if (propUsers) setUsers(propUsers); }, [propUsers]);
  useEffect(() => {
    if (propRoles) {
      const normalized = propRoles.map((role: any) => {
        const perms = JSON.parse(JSON.stringify(role.permissions || {}));
        if (perms.HR) {
          perms.HR = normalizeHrPermissions(perms.HR);
        }
        return { ...role, permissions: perms };
      });
      setRoles(normalized);
    }
  }, [propRoles]);
  useEffect(() => { if (propDepartments) setDepartments(propDepartments); }, [propDepartments]);
  useEffect(() => { if (propStatuses) setGlobalStatuses(propStatuses); }, [propStatuses]);
  useEffect(() => { if (propModules) setSystemModules(propModules); }, [propModules]);

  const currentUser = useMemo(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  const isSuperAdmin = currentUser?.is_super_admin || currentUser?.email === 'admin@gmail.com';
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserType> | null>(null);

  // Note: Department CRUD states removed and migrated to HR Management. Org chart reading is kept for visualization.

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);

  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [presetApplyScope, setPresetApplyScope] = useState<'all' | 'module'>('all');

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any | null>(null);
  const [statusFilterModule, setStatusFilterModule] = useState('all');

  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);

  const [auditFilterUser, setAuditFilterUser] = useState('all');
  const [auditFilterDate, setAuditFilterDate] = useState('');

  // --- No-Code Module Customizer Workspace States ---
  const [selectedModuleId, setSelectedModuleId] = useState<string>('operations-hub');
  const [searchModuleTerm, setSearchModuleTerm] = useState<string>('');
  const [workspaceSubTab, setWorkspaceSubTab] = useState<'tabs' | 'fields' | 'preview'>('tabs');
  const [selectedTabName, setSelectedTabName] = useState<string>('');
  const [moduleFields, setModuleFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState<boolean>(false);
  const [fieldForm, setFieldForm] = useState({
    field_name: '',
    field_label_en: '',
    field_label_ar: '',
    field_type: 'text' as 'text' | 'longtext' | 'number' | 'decimal' | 'date' | 'select' | 'checkbox' | 'file' | 'relation_o2m' | 'relation_m2m' | 'relation_self' | 'relation' | 'pull',
    is_required: false,
    options: '',
    relation_target_table: '',
    relation_display_column: '',
    allow_search: false,
    add_to_filter: false
  });
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [sandboxRelationOptions, setSandboxRelationOptions] = useState<Record<string, any[]>>({});
  const [sandboxRecordOutput, setSandboxRecordOutput] = useState<any | null>(null);

  // Tab CRUD States (avoiding prompt/alert in iframe)
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [newTabTitle, setNewTabTitle] = useState('');
  const [renamingTabIdx, setRenamingTabIdx] = useState<number | null>(null);
  const [renamingTabValue, setRenamingTabValue] = useState('');

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(propRoles && propRoles.length > 0 ? propRoles[0].id : null);
  const selectedRole = useMemo(() => {
    if (!selectedRoleId) return null;
    return roles.find(r => r.id === selectedRoleId) || null;
  }, [selectedRoleId, roles]);

  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const logAction = useCallback((action: string, details: string, oldVal?: any, newVal?: any) => {
    // Log to Supabase Audit Logs
    logAudit({
      module: 'Admin',
      action: action.toUpperCase().replace(/\s+/g, '_') as any,
      details: {
        message: details,
        old_value: oldVal,
        new_value: newVal
      }
    });

    // Also keep local copy
    const log = {
      id: Date.now() + Math.random(),
      user_id: currentUser?.id,
      user_name: currentUser?.name || 'System',
      action,
      details,
      old_value: oldVal ? JSON.stringify(oldVal) : null,
      new_value: newVal ? JSON.stringify(newVal) : null,
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev].slice(0, 100));
  }, [currentUser]);

  const [viewMode, setViewMode] = useState<'graph' | 'tree'>('graph');
  const [orgData, setOrgData] = useState<any[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    const headers: any = {
      'Content-Type': 'application/json',
      'x-user-id': userId || '1'
    };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const fetchData = useCallback(async () => {
    if (propUsers && propRoles && propDepartments && propStatuses && propModules) {
       setLoading(false);
       return;
    }
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // Granular data isolation based on initialTab to prevent egress drain
      if (initialTab === 'rbac') {
        const [rRes, mRes] = await Promise.all([
          fetch('/api/admin/roles', { headers }),
          fetch('/api/admin/modules', { headers })
        ]);
        if (rRes.ok) setRoles(await rRes.json());
        if (mRes.ok) setSystemModules(await mRes.json());
        setLoading(false);
        return;
      }
      if (initialTab === 'org') {
        const [oRes, dRes] = await Promise.all([
          fetch('/api/admin/org-chart', { headers }),
          fetch('/api/departments', { headers })
        ]);
        if (oRes.ok) {
          const oData = await oRes.json();
          if (Array.isArray(oData)) setUsers(oData);
        }
        if (dRes.ok) {
          const dData = await dRes.json();
          if (Array.isArray(dData)) setDepartments(dData);
        }
        setLoading(false);
        return;
      }
      if (initialTab === 'statuses') {
        const [sRes, mRes] = await Promise.all([
          fetch('/api/admin/statuses', { headers }),
          fetch('/api/admin/modules', { headers })
        ]);
        if (sRes.ok) setGlobalStatuses(await sRes.json());
        if (mRes.ok) setSystemModules(await mRes.json());
        setLoading(false);
        return;
      }
      if (initialTab === 'modules') {
        const mRes = await fetch('/api/admin/modules', { headers });
        if (mRes.ok) setSystemModules(await mRes.json());
        setLoading(false);
        return;
      }
      if (initialTab === 'audit') {
        const aRes = await fetch('/api/admin/audit-logs', { headers });
        if (aRes.ok) {
          const aData = await aRes.json();
          if (Array.isArray(aData)) setAuditLogs(aData);
          else if (aData?.logs) setAuditLogs(aData.logs);
        }
        setLoading(false);
        return;
      }
      if (initialTab === 'branding') {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/all', { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      if (data.users) setUsers(data.users);
      if (data.roles) setRoles(data.roles);
      if (data.departments) setDepartments(data.departments);
      if (data.statuses) setGlobalStatuses(data.statuses);
      if (data.modules) setSystemModules(data.modules);
      
      const aRes = await fetch('/api/admin/audit-logs', { headers });
      if (aRes.ok) {
        const text = await aRes.text();
        try {
          const aData = JSON.parse(text);
          if (Array.isArray(aData)) setAuditLogs(aData);
        } catch (e) {
          console.warn("Audit logs returned non-JSON:", text.substring(0, 50));
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      try {
        const cached = safeGetItem('cached_admin_data');
        if (cached) {
          const cachedData = JSON.parse(cached);
          if (cachedData.users) setUsers(cachedData.users);
          if (cachedData.roles) setRoles(cachedData.roles);
          if (cachedData.departments) setDepartments(cachedData.departments);
          if (cachedData.statuses) setGlobalStatuses(cachedData.statuses);
          if (cachedData.modules) setSystemModules(cachedData.modules);
        }
      } catch (e) {}
      setLoading(false);
    }
  }, [propUsers, propRoles, propDepartments, propStatuses, propModules, initialTab]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetch('/api/admin/audit-logs', { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAuditLogs(data);
        })
        .catch(err => console.error('Failed to fetch audit logs:', err));
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Org Chart Logic ---
  
  const generateOrgChart = useCallback(() => {
    const activeUsers = users.filter(u => u.status === 'active');
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // 1. Add Department Nodes
    departments.forEach((dept, idx) => {
      newNodes.push({
        id: `dept-${dept.id}`,
        type: 'deptNode',
        data: { name: dept.name },
        position: { x: idx * 400, y: 0 },
      });
    });

    // 2. Add User Nodes and link to Departments or Managers
    activeUsers.forEach((user, idx) => {
      const yPos = user.reporting_to ? 400 : 200; // Simplified vertical layering
      newNodes.push({
        id: `user-${user.id}`,
        type: 'orgNode',
        data: { name: user.name, job_title: user.job_title },
        position: { x: idx * 250, y: yPos + (user.reporting_to ? 200 : 0) },
      });

      if (user.reporting_to) {
        // Link to Manager
        newEdges.push({
          id: `e-u${user.reporting_to}-u${user.id}`,
          source: `user-${user.reporting_to}`,
          target: `user-${user.id}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        });
      } else if (user.department_id) {
        // Link to Department if no manager
        newEdges.push({
          id: `e-d${user.department_id}-u${user.id}`,
          source: `dept-${user.department_id}`,
          target: `user-${user.id}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [users, departments, setNodes, setEdges]);

  useEffect(() => {
    if (activeTab === 'org' && users.length > 0) {
      generateOrgChart();
    }
  }, [activeTab, users, generateOrgChart]);

  useEffect(() => {
    if (activeTab === 'org') {
      fetch('/api/admin/org-chart', { headers: getAuthHeaders() }).then(res => res.json()).then(setOrgData);
    }
  }, [activeTab]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUserPayload = {
        ...editingUser,
        status: editingUser?.status || 'active',
        job_title: editingUser?.job_title || 'Employee',
      } as UserType;

      // Handle password: if editing and blank, keep old
      if (editingUser?.id && !editingUser.password) {
        const oldUser = users.find(u => u.id === editingUser.id);
        if (oldUser) newUserPayload.password = oldUser.password;
      }

      setToast({ message: "Syncing employee data...", type: 'success' });

      // Build payload
      const method = editingUser?.id ? 'PATCH' : 'POST';
      const url = editingUser?.id ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(newUserPayload)
      });

      if (!res.ok) {
        let errorMsg = `Status: ${res.status}`;
        try {
          const errJson = await res.json();
          errorMsg = errJson.error || errJson.message || errorMsg;
        } catch {
          const text = await res.text();
          if (text) errorMsg = text;
        }
        throw new Error(errorMsg);
      }

      const savedUser = await res.json();
      
      // Update local users list & local storage immediately
      setUsers(prev => {
        const exists = prev.some(u => u.id === savedUser.id);
        if (exists) {
          return prev.map(u => u.id === savedUser.id ? { ...u, ...savedUser } : u);
        }
        return [...prev, savedUser];
      });

      try {
        const localUsersStr = localStorage.getItem('business_core_users');
        if (localUsersStr) {
          const localUsers = JSON.parse(localUsersStr);
          const exists = localUsers.some((u: any) => u.id === savedUser.id);
          const nextUsers = exists 
            ? localUsers.map((u: any) => u.id === savedUser.id ? { ...u, ...savedUser } : u)
            : [...localUsers, savedUser];
          localStorage.setItem('business_core_users', JSON.stringify(nextUsers));
        }
      } catch (e) {}

      logAction(editingUser?.id ? 'Update User' : 'Create User', `User ${savedUser.name} ${editingUser?.id ? 'updated' : 'created'}`, editingUser?.id ? users.find(u => u.id === editingUser.id) : null, savedUser);

      setIsUserModalOpen(false);
      setEditingUser(null);
      onDataChange?.();
      setToast({ message: `User ${editingUser?.id ? 'updated' : 'created'} successfully!`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Failed to save user:', err);
      setToast({ message: `Sync failed: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    }
  };

  const handleToggleUserStatus = async (targetUser: UserType) => {
    const newStatus = targetUser.status === 'inactive' ? 'active' : 'inactive';
    const updatedUser = { ...targetUser, status: newStatus as 'active' | 'inactive' };

    // Update state
    setUsers(prev => prev.map(u => u.id === targetUser.id ? updatedUser : u));

    // Update localStorage
    try {
      const localUsersStr = localStorage.getItem('business_core_users');
      if (localUsersStr) {
        const localUsers = JSON.parse(localUsersStr);
        const nextUsers = localUsers.map((u: any) => u.id === targetUser.id ? { ...u, status: newStatus } : u);
        localStorage.setItem('business_core_users', JSON.stringify(nextUsers));
      }
    } catch (e) {}

    // API update
    try {
      await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      }).catch(() => null);
    }

    // Also sync to employee profile if linked
    try {
      const localEmpsStr = localStorage.getItem('business_core_employees');
      if (localEmpsStr) {
        const localEmps = JSON.parse(localEmpsStr);
        const nextEmps = localEmps.map((emp: any) => {
          const isMatch = (targetUser.employee_id && String(emp.id) === String(targetUser.employee_id)) ||
                          (emp.work_email && targetUser.email && emp.work_email.toLowerCase() === targetUser.email.toLowerCase()) ||
                          (emp.email && targetUser.email && emp.email.toLowerCase() === targetUser.email.toLowerCase()) ||
                          (emp.name && targetUser.name && emp.name.toLowerCase() === targetUser.name.toLowerCase());
          if (isMatch) {
            return { ...emp, status: newStatus === 'inactive' ? 'inactive' : 'active' };
          }
          return emp;
        });
        localStorage.setItem('business_core_employees', JSON.stringify(nextEmps));
      }
    } catch (e) {}

    setToast({
      message: newStatus === 'inactive'
        ? `تم إيقاف صلاحية الدخول للمستخدم (${targetUser.name}) بنجاح (Inactive)`
        : `تم تفعيل حساب المستخدم (${targetUser.name}) بنجاح (Active)`,
      type: newStatus === 'inactive' ? 'error' : 'success'
    });
  };

  // Note: handleSaveDept removed and migrated to HR Management.

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingRole?.name) {
        setToast({ message: 'Role name is required.', type: 'error' });
        return;
      }

      let initialPermissions = editingRole?.permissions || {};

      // If creating a brand new role, initialize permissions according to selected preset
      if (!editingRole?.id) {
        const preset = SYSTEM_ROLE_PRESETS.find(p => p.id === newRolePresetId) || SYSTEM_ROLE_PRESETS[2]; // contributor
        const modulesList = getRBACModulesList();
        const generatedPerms: Record<string, any> = {};

        modulesList.forEach(modName => {
          const canon = modName === 'HR Management' ? 'HR' : modName;
          const tabs = getModuleTabs(modName, systemModules);
          const tabActions: Record<string, any> = {};

          tabs.forEach(tabName => {
            tabActions[tabName] = {
              view: true,
              read: preset.permissions.read,
              select: preset.permissions.select,
              write: preset.permissions.write,
              edit: preset.permissions.write,
              create: preset.permissions.create,
              delete: preset.permissions.delete,
              submit: preset.permissions.submit,
              cancel: preset.permissions.cancel,
              amend: preset.permissions.amend,
              report: preset.permissions.report,
              import: preset.permissions.import,
              export: preset.permissions.export,
              print: preset.permissions.print,
              email: preset.permissions.email,
              share: preset.permissions.share
            };
          });

          generatedPerms[canon] = {
            view: preset.permissions.read,
            create: preset.permissions.create,
            edit: preset.permissions.write,
            write: preset.permissions.write,
            delete: preset.permissions.delete,
            export: preset.permissions.export,
            tab_actions: tabActions
          };
        });

        initialPermissions = generatedPerms;
      }

      const newRole = {
        ...editingRole,
        id: editingRole?.id || Date.now(),
        permissions: initialPermissions
      } as Role;

      const updatedRoles = editingRole?.id 
        ? roles.map(r => r.id === editingRole.id ? newRole : r)
        : [...roles, newRole];

      setRoles(updatedRoles);
      localStorage.setItem('business_core_roles', JSON.stringify(updatedRoles));

      logAction(editingRole?.id ? 'Update Role' : 'Create Role', `Role ${newRole.name} ${editingRole?.id ? 'updated' : 'created'}`, editingRole?.id ? roles.find(r => r.id === editingRole.id) : null, newRole);

      // Background sync
      fetch(editingRole?.id ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles', {
        method: editingRole?.id ? 'PATCH' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newRole)
      }).catch(err => console.warn('Background sync failed:', err));

      setIsRoleModalOpen(false);
      setEditingRole(null);
      onDataChange?.();
      setToast({ message: `Role ${editingRole?.id ? 'updated' : 'created'} successfully!`, type: 'success' });
    } catch (err) {
      console.error('Failed to save role locally:', err);
      setToast({ message: 'Error saving role locally.', type: 'error' });
    }
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingStatus?.module_id || (!editingStatus?.status_key && !editingStatus?.value) || !editingStatus?.label) {
        setToast({ message: 'Please fill in all required fields.', type: 'error' });
        return;
      }

      const statusPayload = {
        ...editingStatus,
        status_key: editingStatus.status_key || editingStatus.value,
        value: editingStatus.value || editingStatus.status_key,
        color: editingStatus?.color || '#64748b'
      };

      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const authHeaders: any = {
        'Content-Type': 'application/json',
        'x-user-id': userId || '1'
      };
      if (token && token !== 'null' && token !== 'undefined') {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(editingStatus?.id ? `/api/admin/statuses/${editingStatus.id}` : '/api/admin/statuses', {
        method: editingStatus?.id ? 'PATCH' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(statusPayload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save status');
      }

      const savedStatus = await response.json();

      const updatedStatuses = editingStatus?.id 
        ? globalStatuses.map(s => s.id === editingStatus.id ? savedStatus : s)
        : [...globalStatuses, savedStatus];

      setGlobalStatuses(updatedStatuses);
      localStorage.setItem('business_core_statuses', JSON.stringify(updatedStatuses));

      logAction(editingStatus?.id ? 'Update Status' : 'Create Status', `Status ${savedStatus.label} for ${savedStatus.module_id} ${editingStatus?.id ? 'updated' : 'created'}`, editingStatus?.id ? globalStatuses.find(s => s.id === editingStatus.id) : null, savedStatus);

      setIsStatusModalOpen(false);
      setEditingStatus(null);
      onDataChange?.();
      setToast({ message: `Status ${editingStatus?.id ? 'updated' : 'created'} successfully!`, type: 'success' });
    } catch (err) {
      console.error('Failed to save status:', err);
      setToast({ message: `Error saving status: ${(err as Error).message}`, type: 'error' });
    }
  };

  const handleUpdateModule = async (moduleId: string, updates: { is_active?: boolean, order_index?: number }) => {
    try {
      const updatedModules = systemModules.map(m => 
        m.id === moduleId ? { ...m, ...updates } : m
      );
      setSystemModules([...updatedModules].sort((a, b) => a.order_index - b.order_index));
      
      const res = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      
      logAction('Update Module', `Module ${moduleId} updated: ${JSON.stringify(updates)}`);
      onDataChange?.();
    } catch (err) {
      console.error('Failed to update module', err);
    }
  };

  const handleMoveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const sorted = [...systemModules].sort((a, b) => a.order_index - b.order_index);
    const index = sorted.findIndex(m => m.id === moduleId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sorted.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentModule = sorted[index];
    const targetModule = sorted[targetIndex];

    // Swap order_index
    const currentOrder = currentModule.order_index;
    const targetOrder = targetModule.order_index;

    // Update both locally
    const updated = systemModules.map(m => {
      if (m.id === currentModule.id) return { ...m, order_index: targetOrder };
      if (m.id === targetModule.id) return { ...m, order_index: currentOrder };
      return m;
    });

    setSystemModules([...updated].sort((a, b) => a.order_index - b.order_index));

    // Persist changes
    await Promise.all([
      fetch(`/api/admin/modules/${currentModule.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ order_index: targetOrder })
      }),
      fetch(`/api/admin/modules/${targetModule.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ order_index: currentOrder })
      })
    ]);

    logAction('Reorder Modules', `Swapped ${currentModule.id} with ${targetModule.id}`);
    onDataChange?.();
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule?.name || !editingModule?.id) return;

    const isNew = !systemModules.find(m => m.id === editingModule.id);
    const newModule = {
      ...editingModule,
      is_active: true,
      order_index: isNew ? systemModules.length : editingModule.order_index
    };

    const res = await fetch(isNew ? '/api/admin/modules' : `/api/admin/modules/${editingModule.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(newModule)
    });

    if (res.ok) {
      const saved = await res.json();
      const finalModules = isNew 
        ? [...systemModules, saved]
        : systemModules.map(m => m.id === editingModule.id ? saved : m);
      
      setSystemModules([...finalModules].sort((a, b) => a.order_index - b.order_index));
      logAction(isNew ? 'Create Module' : 'Update Module', `Module ${editingModule.name} ${isNew ? 'created' : 'updated'}`);
      setIsModuleModalOpen(false);
      setEditingModule(null);
      onDataChange?.();
      setToast({ message: 'Module saved successfully!', type: 'success' });
    }
  };

  // --- No-Code Module Customizer Helper Functions ---
  const selectedModule = useMemo(() => {
    return systemModules.find(m => m.id === selectedModuleId);
  }, [systemModules, selectedModuleId]);

  const activeModuleTabs = useMemo(() => {
    return getModuleTabs(selectedModule?.name || selectedModuleId, systemModules);
  }, [selectedModule, selectedModuleId, systemModules]);

  useEffect(() => {
    if (activeModuleTabs && activeModuleTabs.length > 0) {
      // Keep selected tab name if it's still in the list, otherwise choose the first one
      if (!activeModuleTabs.includes(selectedTabName)) {
        setSelectedTabName(activeModuleTabs[0]);
      }
    } else if (selectedTabName !== 'General Form') {
      setSelectedTabName('General Form');
    }
  }, [selectedModuleId, activeModuleTabs, selectedTabName]);

  const fetchFieldsForModuleTab = useCallback(async () => {
    if (!selectedModuleId) return;
    const tab = selectedTabName || 'General Form';
    const entityType = `${selectedModuleId}:${tab}`;
    setLoadingFields(true);
    try {
      const res = await fetch(`/api/hr/custom-fields?entity_type=${encodeURIComponent(entityType)}`);
      if (res.ok) {
        const data = await res.json();
        setModuleFields(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFields(false);
    }
  }, [selectedModuleId, selectedTabName]);

  useEffect(() => {
    fetchFieldsForModuleTab();
    setPreviewValues({});
    setSandboxRecordOutput(null);
  }, [selectedModuleId, selectedTabName, fetchFieldsForModuleTab]);

  useEffect(() => {
    const fetchRelations = async () => {
      const relFields = moduleFields.filter(f => f.field_type === 'relation' && f.relation_target_table);
      const newOptions: Record<string, any[]> = {};
      for (const f of relFields) {
        try {
          const res = await fetch(`/api/hr/custom-fields/relation-data/${f.relation_target_table}?display_column=${f.relation_display_column || 'name'}`);
          if (res.ok) {
            const data = await res.json();
            newOptions[f.field_name] = data;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setSandboxRelationOptions(newOptions);
    };
    if (moduleFields.length > 0) {
      fetchRelations();
    }
  }, [moduleFields]);

  const handleRelationValueChange = async (relationFieldName: string, targetTable: string, selectedRecordId: string) => {
    const updatedVals = { ...previewValues, [relationFieldName]: selectedRecordId };
    setPreviewValues(updatedVals);

    if (!selectedRecordId) {
      const clearedVals = { ...updatedVals };
      moduleFields.forEach(f => {
        if (f.field_type === 'pull' && f.relation_target_table === relationFieldName) {
          clearedVals[f.field_name] = '';
        }
      });
      setPreviewValues(clearedVals);
      return;
    }

    try {
      const res = await fetch(`/api/hr/custom-fields/relation-record/${targetTable}/${selectedRecordId}`);
      if (res.ok) {
        const recordData = await res.json();
        const updatedWithPulls = { ...updatedVals };
        
        moduleFields.forEach(f => {
          if (f.field_type === 'pull' && f.relation_target_table === relationFieldName) {
            const pullCol = f.relation_display_column || 'name';
            updatedWithPulls[f.field_name] = recordData[pullCol] !== undefined ? String(recordData[pullCol]) : '';
          }
        });
        
        setPreviewValues(updatedWithPulls);
      }
    } catch (e) {
      console.error("Failed to pull record for relation:", e);
    }
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldForm.field_name || !fieldForm.field_label_en) {
      setToast({ message: 'Field name and label are required', type: 'error' });
      return;
    }

    const tab = selectedTabName || 'General Form';
    const entityType = `${selectedModuleId}:${tab}`;
    const normalizedName = fieldForm.field_name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const isRelational = fieldForm.field_type.startsWith('relation') || fieldForm.field_type === 'pull';

    const payload = {
      entity_type: entityType,
      field_name: normalizedName,
      field_label_en: fieldForm.field_label_en,
      field_label_ar: fieldForm.field_label_ar || fieldForm.field_label_en, // default Arabic label to English
      field_type: fieldForm.field_type,
      is_required: fieldForm.is_required,
      options: fieldForm.field_type === 'select' ? fieldForm.options : null,
      relation_target_table: isRelational ? fieldForm.relation_target_table : null,
      relation_display_column: isRelational ? fieldForm.relation_display_column : null,
      allow_search: fieldForm.allow_search,
      add_to_filter: fieldForm.add_to_filter
    };

    try {
      const url = editingFieldId ? `/api/hr/custom-fields/${editingFieldId}` : '/api/hr/custom-fields';
      const method = editingFieldId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setToast({ 
          message: editingFieldId ? 'Field updated successfully!' : 'Field registered successfully!', 
          type: 'success' 
        });
        setEditingFieldId(null);
        setFieldForm({
          field_name: '',
          field_label_en: '',
          field_label_ar: '',
          field_type: 'text',
          is_required: false,
          options: '',
          relation_target_table: '',
          relation_display_column: '',
          allow_search: false,
          add_to_filter: false
        });
        fetchFieldsForModuleTab();
      } else {
        const errData = await res.json();
        setToast({ message: errData.error || 'Failed to save custom field.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Failed to save field.', type: 'error' });
    }
  };

  const handleDeleteField = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this field?')) return;
    try {
      const res = await fetch(`/api/hr/custom-fields/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: 'Field deleted successfully.', type: 'success' });
        fetchFieldsForModuleTab();
      } else {
        setToast({ message: 'Failed to delete custom field.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Failed to delete field.', type: 'error' });
    }
  };

  const handleReorderField = async (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= moduleFields.length) return;

    const currentField = moduleFields[idx];
    const targetField = moduleFields[targetIdx];

    const tempIndex = currentField.order_index || 0;
    const targetIndex = targetField.order_index || 0;

    try {
      const updatedFields = [...moduleFields];
      currentField.order_index = targetIndex === tempIndex ? (direction === 'up' ? tempIndex - 1 : tempIndex + 1) : targetIndex;
      targetField.order_index = tempIndex;
      updatedFields[idx] = targetField;
      updatedFields[targetIdx] = currentField;
      setModuleFields(updatedFields.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));

      await Promise.all([
        fetch(`/api/hr/custom-fields/${currentField.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: currentField.order_index })
        }),
        fetch(`/api/hr/custom-fields/${targetField.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: targetField.order_index })
        })
      ]);
      fetchFieldsForModuleTab();
    } catch (e) {
      console.error(e);
      setToast({ message: 'Failed to reorder fields', type: 'error' });
    }
  };

  const handleSaveModuleTabs = async (updatedTabs: string[]) => {
    if (!selectedModule) return;
    let currentMetadata = {};
    if (selectedModule.metadata) {
      try {
        currentMetadata = typeof selectedModule.metadata === 'string' 
          ? JSON.parse(selectedModule.metadata) 
          : selectedModule.metadata;
      } catch (e) {
        currentMetadata = {};
      }
    }
    const updatedMetadata = { ...currentMetadata, tabs: updatedTabs };

    try {
      const res = await fetch(`/api/admin/modules/${selectedModuleId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ metadata: updatedMetadata })
      });

      if (res.ok) {
        const savedModule = await res.json();
        setSystemModules(prev => prev.map(m => m.id === selectedModuleId ? savedModule : m));
        setToast({ message: 'Module tabs updated successfully!', type: 'success' });
        onDataChange?.();
      } else {
        setToast({ message: 'Failed to update module tabs.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Failed to update tabs.', type: 'error' });
    }
  };

  const handleSaveRename = async (idx: number) => {
    const trimmed = renamingTabValue.trim();
    if (!trimmed) {
      setToast({ message: 'Tab name cannot be empty!', type: 'error' });
      return;
    }
    if (activeModuleTabs.some((t, i) => i !== idx && t.toLowerCase() === trimmed.toLowerCase())) {
      setToast({ message: 'A tab with this name already exists!', type: 'error' });
      return;
    }
    const updated = [...activeModuleTabs];
    updated[idx] = trimmed;
    await handleSaveModuleTabs(updated);
    setRenamingTabIdx(null);
  };

  const handleConfirmAddTab = async () => {
    const trimmed = newTabTitle.trim();
    if (!trimmed) {
      setToast({ message: 'Tab name cannot be empty!', type: 'error' });
      return;
    }
    if (activeModuleTabs.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setToast({ message: 'A tab with this name already exists!', type: 'error' });
      return;
    }
    const updated = [...activeModuleTabs, trimmed];
    await handleSaveModuleTabs(updated);
    setIsAddingTab(false);
    setNewTabTitle('');
  };

  const handleUpdatePermission = async (roleId: number, moduleId: string, action: string, value: boolean) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const newPermissions = JSON.parse(JSON.stringify(role.permissions || {}));
    if (!newPermissions[moduleId]) {
      newPermissions[moduleId] = { view: false, create: false, edit: false, delete: false, export: false };
    }
    newPermissions[moduleId] = { ...newPermissions[moduleId], [action]: value };

    // Update local state immediately for better UX
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, permissions: newPermissions } : r));

    try {
      const res = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ permissions: newPermissions })
      });
      if (res.ok) {
        onDataChange?.();
      } else {
        // Rollback on error
        const originalRoles = await fetch('/api/admin/roles', { headers: getAuthHeaders() }).then(r => r.json());
        setRoles(originalRoles);
        setToast({ message: 'Failed to update permissions', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to update permissions', err);
      setToast({ message: 'Network error while updating permissions', type: 'error' });
    }
  };

  const handleApplySystemRolePreset = (presetId: string, scopeAllModules: boolean = true) => {
    if (!selectedRoleId) return;
    const targetRole = roles.find(r => r.id === selectedRoleId);
    if (!targetRole) return;
    if (targetRole.name === 'Admin') {
      setToast({ message: 'حساب المدير العام Admin يمتلك كافة الصلاحيات بشكل دائم.', type: 'error' });
      return;
    }

    const preset = SYSTEM_ROLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const newPermissions = JSON.parse(JSON.stringify(targetRole.permissions || {}));
    const modulesToApply = scopeAllModules ? getRBACModulesList() : (selectedRBACModule ? [selectedRBACModule] : getRBACModulesList());

    modulesToApply.forEach(modName => {
      const canon = modName === 'HR Management' ? 'HR' : modName;
      const tabs = getModuleTabs(modName, systemModules);
      
      const customActionsMap: Record<string, boolean> = {};
      const dataScopesMap: Record<string, string> = {};
      const tabActions: Record<string, any> = {};

      tabs.forEach(tabName => {
        // Collect custom actions for this tab
        const safeTabName = (tabName || '').toLowerCase();
        const tabObj = HR_MODULE_TABS.find(t => {
          const tLabel = (t.label || '').toLowerCase();
          const tId = (t.id || '').toLowerCase().replace(/_/g, ' ');
          const safeTabClean = safeTabName.replace(/_/g, ' ');
          return tLabel.includes(safeTabName) || 
                 safeTabName.includes(tLabel) || 
                 tId.includes(safeTabClean) ||
                 safeTabClean.includes(tId);
        });

        if (tabObj) {
          tabObj.actions.forEach(act => {
            customActionsMap[act.id] = isActionEnabledForPreset(preset.id, act.id);
          });
        }

        tabActions[tabName] = {
          view: preset.permissions.read,
          tabs: preset.permissions.read,
          read: preset.permissions.read,
          select: preset.permissions.select,
          write: preset.permissions.write,
          edit: preset.permissions.write,
          create: preset.permissions.create,
          delete: preset.permissions.delete,
          submit: preset.permissions.submit,
          cancel: preset.permissions.cancel,
          amend: preset.permissions.amend,
          report: preset.permissions.report,
          import: preset.permissions.import,
          export: preset.permissions.export,
          print: preset.permissions.print,
          email: preset.permissions.email,
          share: preset.permissions.share,
          level: preset.level,
          data_scope: preset.dataScope,
          if_owner: preset.ifOwner,
          custom_actions: { ...customActionsMap }
        };

        dataScopesMap[tabName] = preset.dataScope;
      });

      // Populate any remaining custom actions from HR_MODULE_TABS if canon is HR
      if (canon === 'HR') {
        HR_MODULE_TABS.forEach(t => {
          t.actions.forEach(act => {
            if (customActionsMap[act.id] === undefined) {
              customActionsMap[act.id] = isActionEnabledForPreset(preset.id, act.id);
            }
          });
        });
      }

      // Build field_security for sensitive fields
      const sensitiveFieldsList = MODULE_SENSITIVE_FIELDS[canon] || [];
      const fieldSecurityMap: Record<string, string> = {};
      sensitiveFieldsList.forEach(sf => {
        fieldSecurityMap[sf.key] = preset.fieldSecurity;
      });

      // Build see_permissions for forms/fields
      const seePermissionsMap: Record<string, string> = {};
      HR_MAIN_MODULE_CONFIGS.forEach(mm => {
        seePermissionsMap[mm.id] = preset.seePermissions;
        mm.subtabs.forEach(st => {
          seePermissionsMap[st.id] = preset.seePermissions;
          st.sections.forEach(sec => {
            seePermissionsMap[sec.key] = preset.seePermissions;
            sec.fieldsList.forEach(f => {
              const fKey = `${sec.key}_${f.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
              seePermissionsMap[fKey] = preset.seePermissions;
              seePermissionsMap[f.toLowerCase().replace(/[^a-z0-9]/g, '_')] = preset.seePermissions;
            });
          });
        });
      });

      newPermissions[canon] = {
        ...(newPermissions[canon] || {}),
        view: preset.permissions.read,
        create: preset.permissions.create,
        edit: preset.permissions.write,
        write: preset.permissions.write,
        delete: preset.permissions.delete,
        export: preset.permissions.export,
        tab_actions: tabActions,
        custom_actions: customActionsMap,
        data_scopes: dataScopesMap,
        see_scope: preset.seeScope,
        see_permissions: seePermissionsMap,
        field_security: fieldSecurityMap
      };
    });

    setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, permissions: newPermissions } : r));
    setHasUnsavedRbacChanges(true);

    if (preset.seeScope) {
      setRbacSeeScope(preset.seeScope);
    }

    setToast({
      message: `تم تطبيق قالب (${preset.nameAr}) بنجاح على ${scopeAllModules ? 'جميع موديولات النظام' : selectedRBACModule}! اضغط "تأكيد وحفظ الصلاحيات" للتطبيق.`,
      type: 'success'
    });
  };

  const handleSaveFieldPermissionsForModule = (fieldPermissions: Record<string, 'editable' | 'readonly' | 'hidden'>) => {
    if (!selectedRoleId || !fieldSecurityModule) return;
    const targetRole = roles.find(r => r.id === selectedRoleId);
    if (!targetRole || targetRole.name === 'Admin') return;

    const canon = fieldSecurityModule === 'HR Management' ? 'HR' : fieldSecurityModule;
    const newPermissions = JSON.parse(JSON.stringify(targetRole.permissions || {}));

    if (!newPermissions[canon]) {
      newPermissions[canon] = { view: true, create: false, edit: false, delete: false, export: false };
    }

    newPermissions[canon].field_security = fieldPermissions;

    setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, permissions: newPermissions } : r));
    setHasUnsavedRbacChanges(true);
    setToast({
      message: `تم تحديث خصوصية حقول موديول (${fieldSecurityModule}) بنجاح!`,
      type: 'success'
    });
  };

  const handleOpenGranularModal = (moduleId: string) => {
    setSelectedGranularModule(moduleId);
    const mPerms = (selectedRole?.permissions?.[moduleId] || {}) as any;
    setGranularPermissions({
      tabs: mPerms.tabs || {},
      settings_access: mPerms.settings_access !== false, // default to true
      custom_actions: mPerms.custom_actions || {}
    });
    setIsGranularModalOpen(true);
  };

  const handleSaveGranularPermissions = async () => {
    if (!selectedRoleId || !selectedGranularModule) return;
    const role = roles.find(r => r.id === selectedRoleId);
    if (!role) return;

    const newPermissions = JSON.parse(JSON.stringify(role.permissions || {}));
    if (!newPermissions[selectedGranularModule]) {
      newPermissions[selectedGranularModule] = { view: false, create: false, edit: false, delete: false, export: false };
    }

    newPermissions[selectedGranularModule] = {
      ...newPermissions[selectedGranularModule],
      tabs: granularPermissions.tabs,
      settings_access: granularPermissions.settings_access,
      custom_actions: granularPermissions.custom_actions
    };

    // Update state
    setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, permissions: newPermissions } : r));
    setIsGranularModalOpen(false);

    // Sync to database
    try {
      const res = await fetch(`/api/admin/roles/${selectedRoleId}/permissions`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ permissions: newPermissions })
      });
      if (res.ok) {
        onDataChange?.();
        setToast({ message: 'Granular permissions saved!', type: 'success' });
      } else {
        const originalRoles = await fetch('/api/admin/roles', { headers: getAuthHeaders() }).then(r => r.json());
        setRoles(originalRoles);
        setToast({ message: 'Failed to sync permissions', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  const handleConfirmSaveRbacPermissions = async () => {
    if (!selectedRoleId) return;
    const role = roles.find(r => r.id === selectedRoleId);
    if (!role) return;

    // Ensure HR, QA, Products/Services, and Knowledge Base permissions are strictly normalized and synced
    const cleanPermissions = JSON.parse(JSON.stringify(role.permissions || {}));
    if (cleanPermissions.HR || cleanPermissions['HR Management']) {
      const baseHr = cleanPermissions.HR || cleanPermissions['HR Management'];
      const normalizedHr = normalizeHrPermissions(baseHr);
      cleanPermissions.HR = normalizedHr;
      cleanPermissions['HR Management'] = JSON.parse(JSON.stringify(normalizedHr));
    }
    if (cleanPermissions['Products/Services'] || cleanPermissions['Products & Services'] || cleanPermissions['Catalog'] || cleanPermissions['catalog'] || cleanPermissions['products']) {
      const baseProd = cleanPermissions['Products/Services'] || cleanPermissions['Products & Services'] || cleanPermissions['Catalog'] || cleanPermissions['catalog'] || cleanPermissions['products'];
      cleanPermissions['Products/Services'] = baseProd;
      cleanPermissions['Products & Services'] = JSON.parse(JSON.stringify(baseProd));
      cleanPermissions['Products%2FServices'] = JSON.parse(JSON.stringify(baseProd));
      cleanPermissions['Catalog'] = JSON.parse(JSON.stringify(baseProd));
      cleanPermissions['catalog'] = JSON.parse(JSON.stringify(baseProd));
      cleanPermissions['products'] = JSON.parse(JSON.stringify(baseProd));
    }
    if (cleanPermissions['Knowledge Base'] || cleanPermissions['Knowledge%20Base'] || cleanPermissions['kb'] || cleanPermissions['knowledge_base'] || cleanPermissions['knowledge']) {
      const baseKB = cleanPermissions['Knowledge Base'] || cleanPermissions['Knowledge%20Base'] || cleanPermissions['kb'] || cleanPermissions['knowledge_base'] || cleanPermissions['knowledge'];
      cleanPermissions['Knowledge Base'] = baseKB;
      cleanPermissions['Knowledge%20Base'] = JSON.parse(JSON.stringify(baseKB));
      cleanPermissions['kb'] = JSON.parse(JSON.stringify(baseKB));
      cleanPermissions['knowledge_base'] = JSON.parse(JSON.stringify(baseKB));
      cleanPermissions['knowledge'] = JSON.parse(JSON.stringify(baseKB));
    }
    if (cleanPermissions['QA'] || cleanPermissions['Quality Assurance'] || cleanPermissions['qa']) {
      const baseQa = cleanPermissions['QA'] || cleanPermissions['Quality Assurance'] || cleanPermissions['qa'];
      cleanPermissions['QA'] = baseQa;
      cleanPermissions['Quality Assurance'] = JSON.parse(JSON.stringify(baseQa));
      cleanPermissions['qa'] = JSON.parse(JSON.stringify(baseQa));
    }

    setIsSavingRbac(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRoleId}/permissions`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ permissions: cleanPermissions })
      });

      if (res.ok) {
        setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, permissions: cleanPermissions } : r));

        if (user) {
          const isUserRole = Number(user.role_id) === Number(selectedRoleId) ||
            user.role?.toLowerCase() === role.name?.toLowerCase() ||
            (user as any).role_name?.toLowerCase() === role.name?.toLowerCase();

          if (isUserRole) {
            const updatedUser = { ...user, permissions: cleanPermissions };
            safeSetItem('user', JSON.stringify(updatedUser));
            if (updateUserPermissions) {
              updateUserPermissions(cleanPermissions);
            }
            refreshUser?.();
          }
        }
        window.dispatchEvent(new Event('sys_permissions_updated'));
        setHasUnsavedRbacChanges(false);
        onDataChange?.();
        setToast({ message: 'Permissions saved successfully', type: 'success' });
      } else {
        setToast({ message: 'Failed to save permissions', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to sync permissions', err);
      setToast({ message: 'Network error', type: 'error' });
    } finally {
      setIsSavingRbac(false);
    }
  };

  const handleDiscardRbacChanges = async () => {
    try {
      const originalRoles = await fetch('/api/admin/roles', { headers: getAuthHeaders() }).then(r => r.json());
      if (Array.isArray(originalRoles)) {
        setRoles(originalRoles);
      }
      setHasUnsavedRbacChanges(false);
      setToast({ message: 'Changes discarded', type: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGranularPermission = (
    roleId: number,
    moduleName: string,
    updater: (currentModulePerms: any) => any
  ) => {
    setRoles(prevRoles => {
      const role = prevRoles.find(r => r.id === roleId);
      if (!role) return prevRoles;

      const newPermissions = JSON.parse(JSON.stringify(role.permissions || {}));
      const lowMod = (moduleName || '').toLowerCase().trim();
      const isProd = lowMod.includes('product') || lowMod.includes('catalog') || moduleName === 'Products/Services' || moduleName === 'Products%2FServices';
      const isKB = lowMod.includes('knowledge') || lowMod === 'kb' || lowMod === 'knowledge_base' || moduleName === 'Knowledge Base' || moduleName === 'Knowledge%20Base';
      const isQA = lowMod === 'qa' || lowMod.includes('quality') || moduleName === 'QA' || moduleName === 'Quality Assurance';
      const isHR = lowMod === 'hr' || moduleName === 'HR Management' || moduleName === 'HR';

      const canonicalKey = isProd ? 'Products/Services' :
                           isKB ? 'Knowledge Base' :
                           isQA ? 'QA' :
                           isHR ? 'HR' : moduleName;

      if (!newPermissions[canonicalKey]) {
        newPermissions[canonicalKey] = { view: true, create: true, edit: true, delete: true, export: true };
      }

      newPermissions[canonicalKey] = updater(newPermissions[canonicalKey]);

      if (isHR) {
        newPermissions['HR'] = normalizeHrPermissions(newPermissions['HR']);
        newPermissions['HR Management'] = JSON.parse(JSON.stringify(newPermissions['HR']));
      } else if (isProd) {
        const prodPerms = newPermissions['Products/Services'];
        newPermissions['Products/Services'] = prodPerms;
        newPermissions['Products & Services'] = JSON.parse(JSON.stringify(prodPerms));
        newPermissions['Products%2FServices'] = JSON.parse(JSON.stringify(prodPerms));
        newPermissions['Catalog'] = JSON.parse(JSON.stringify(prodPerms));
        newPermissions['catalog'] = JSON.parse(JSON.stringify(prodPerms));
        newPermissions['products'] = JSON.parse(JSON.stringify(prodPerms));
      } else if (isKB) {
        const kbPerms = newPermissions['Knowledge Base'];
        newPermissions['Knowledge Base'] = kbPerms;
        newPermissions['Knowledge%20Base'] = JSON.parse(JSON.stringify(kbPerms));
        newPermissions['kb'] = JSON.parse(JSON.stringify(kbPerms));
        newPermissions['knowledge_base'] = JSON.parse(JSON.stringify(kbPerms));
        newPermissions['knowledge'] = JSON.parse(JSON.stringify(kbPerms));
      } else if (isQA) {
        const qaPerms = newPermissions['QA'];
        newPermissions['QA'] = qaPerms;
        newPermissions['Quality Assurance'] = JSON.parse(JSON.stringify(qaPerms));
        newPermissions['qa'] = JSON.parse(JSON.stringify(qaPerms));
      }

      // Sync active logged in user instantly if user belongs to this role
      if (user) {
        const isUserRole = Number(user.role_id) === Number(roleId) ||
          user.role?.toLowerCase() === role.name?.toLowerCase() ||
          (user as any).role_name?.toLowerCase() === role.name?.toLowerCase();

        if (isUserRole) {
          const updatedUser = { ...user, permissions: newPermissions };
          safeSetItem('user', JSON.stringify(updatedUser));
          if (updateUserPermissions) {
            updateUserPermissions(newPermissions);
          }
          window.dispatchEvent(new CustomEvent('sys_permissions_updated', {
            detail: {
              roleId,
              moduleId: canonicalKey,
              canonModule: canonicalKey,
              permissions: newPermissions[canonicalKey]
            }
          }));
        }
      }

      return prevRoles.map(r => r.id === roleId ? { ...r, permissions: newPermissions } : r);
    });

    setHasUnsavedRbacChanges(true);
  };

  const handleToggleTabVisibility = (moduleName: string, tabName: string, isChecked: boolean) => {
    if (!selectedRoleId) return;
    handleUpdateGranularPermission(selectedRoleId, moduleName, (perms) => {
      const tabs = { ...(perms.tabs || {}) };
      tabs[tabName] = isChecked;
      const tab_actions = { ...(perms.tab_actions || {}) };
      if (!tab_actions[tabName]) {
        tab_actions[tabName] = {
          view: isChecked,
          read: isChecked,
          write: isChecked,
          edit: isChecked,
          create: isChecked,
          delete: isChecked,
          select: isChecked,
          submit: isChecked,
          cancel: isChecked,
          amend: isChecked,
          report: isChecked,
          import: isChecked,
          export: isChecked,
          print: isChecked,
          email: isChecked,
          share: isChecked,
          if_owner: false,
          level: isChecked ? 0 : 3,
          data_scope: isChecked ? 'global' : 'own'
        };
      } else {
        const curLevel = tab_actions[tabName].level;
        const newLevel = isChecked ? (curLevel === 3 ? 0 : (curLevel ?? 0)) : 3;
        tab_actions[tabName] = {
          ...tab_actions[tabName],
          view: isChecked,
          read: isChecked,
          write: isChecked ? (tab_actions[tabName].write ?? true) : false,
          edit: isChecked ? (tab_actions[tabName].edit ?? true) : false,
          create: isChecked ? (tab_actions[tabName].create ?? true) : false,
          delete: isChecked ? (tab_actions[tabName].delete ?? true) : false,
          level: newLevel
        };
      }

      const custom_actions = { ...(perms.custom_actions || {}) };
      if (!isChecked) {
        const tabNorm = (tabName || '').toLowerCase().trim();
        Object.keys(custom_actions).forEach(actKey => {
          const actLower = (actKey || '').toLowerCase();
          if (
            (tabNorm.includes('candidate') || tabNorm.includes('pipeline')) && (
              actLower.includes('candidate') || actLower.includes('applicant') || actLower.includes('move_candidate') || actLower.includes('pull_channel')
            ) ||
            (tabNorm.includes('job') || tabNorm.includes('opening')) && (
              actLower.includes('job') || actLower.includes('budget') || actLower.includes('posting')
            ) ||
            (tabNorm.includes('interview') || tabNorm.includes('scorecard')) && (
              actLower.includes('interview') || actLower.includes('scorecard')
            )
          ) {
            custom_actions[actKey] = false;
          }
        });
      }

      return { ...perms, tabs, tab_actions, custom_actions };
    });
  };

  const handleToggleTabVisibilityWithCascade = (moduleName: string, tabName: string, isChecked: boolean) => {
    if (selectedRole?.name === 'Admin') return;

    const canonModule = (moduleName === 'HR Management' || moduleName === 'HR') ? 'HR' : moduleName;

    // First toggle the target tab itself
    handleToggleTabVisibility(canonModule, tabName, isChecked);

    // If it's HR or HR Management module, apply parent-child cascading
    if (canonModule === 'HR') {
      const parentChildGroups: Record<string, string[]> = {
        'Hiring': ['Candidates Pipeline', 'Job Openings', 'Interviews & Scorecards'],
        'Recruitment & Jobs': ['Candidates Pipeline', 'Job Openings', 'Interviews & Scorecards'],
        'Recruitment': ['Candidates Pipeline', 'Job Openings', 'Interviews & Scorecards'],
        'Attendance': ['DAILY LOGS', 'SHIFT SCHEDULE', 'BREAKS', 'LEAVE MANAGEMENT', 'SHIFT SWAPS', 'Time Off & Leaves', 'Swap Management'],
        'Attendance & Clock In': ['DAILY LOGS', 'SHIFT SCHEDULE', 'BREAKS', 'LEAVE MANAGEMENT', 'SHIFT SWAPS', 'Time Off & Leaves', 'Swap Management'],
        'Employee Directory': ['Employee Profiles & Directory', 'Departments & Structure', 'Org Chart'],
        'Departments': ['Departments & Structure'],
        'Org Chart': ['Org Chart'],
        'Payroll': ['Payroll & Salaries', 'Benefits & Allowances'],
        'Payroll & Salaries': ['Payroll & Salaries', 'Benefits & Allowances'],
        'Performance': ['Performance & OKRs', 'Complaints & Grievances'],
        'Performance & OKRs': ['Complaints & Grievances'],
        'Assets Management': ['Onboarding & Offboarding']
      };

      // 1. If parent is toggled -> cascade to all child sub-tabs and sync aliases
      if (parentChildGroups[tabName]) {
        const hiringAliases = ['Hiring', 'Recruitment & Jobs', 'Recruitment'];
        const parentAliases = hiringAliases.includes(tabName) ? hiringAliases : [tabName];

        parentAliases.forEach(pAlias => {
          handleToggleTabVisibility(canonModule, pAlias, isChecked);
        });

        parentChildGroups[tabName].forEach(childTab => {
          handleToggleTabVisibility(canonModule, childTab, isChecked);
        });
      }

      // 2. If child sub-tab is toggled ON -> ensure parent tabs and all aliases are ON as well
      if (isChecked) {
        Object.entries(parentChildGroups).forEach(([parent, children]) => {
          if (children.includes(tabName)) {
            const hiringAliases = ['Hiring', 'Recruitment & Jobs', 'Recruitment'];
            const parentAliases = hiringAliases.includes(parent) ? hiringAliases : [parent];
            parentAliases.forEach(pAlias => {
              handleToggleTabVisibility(canonModule, pAlias, true);
            });
          }
        });
      }

      // 3. If child sub-tab is toggled OFF -> check if all siblings in group are OFF, if so turn parent OFF
      if (!isChecked && selectedRoleId) {
        setRoles(prevRoles => {
          const role = prevRoles.find(r => r.id === selectedRoleId);
          if (!role) return prevRoles;
          const hrPerms = (role.permissions?.HR || role.permissions?.['HR Management'] || {}) as any;
          const tabsState = hrPerms.tabs || {};

          Object.entries(parentChildGroups).forEach(([parent, children]) => {
            if (children.includes(tabName)) {
              const anySiblingActive = children.some(sibling => sibling !== tabName && tabsState[sibling] === true);
              if (!anySiblingActive) {
                const hiringAliases = ['Hiring', 'Recruitment & Jobs', 'Recruitment'];
                const parentAliases = hiringAliases.includes(parent) ? hiringAliases : [parent];
                parentAliases.forEach(pAlias => {
                  handleToggleTabVisibility(canonModule, pAlias, false);
                });
              }
            }
          });
          return prevRoles;
        });
      }
    }
  };

  const handleToggleCustomAction = (moduleName: string, actionKey: string, isChecked: boolean) => {
    if (!selectedRoleId) return;
    handleUpdateGranularPermission(selectedRoleId, moduleName, (perms) => {
      const custom_actions = { ...(perms.custom_actions || {}) };
      custom_actions[actionKey] = isChecked;
      return { ...perms, custom_actions };
    });
  };

  const handleUpdateDataScope = (moduleName: string, tabName: string, scope: 'global' | 'branch' | 'own' | 'team' | 'custom' | string) => {
    if (!selectedRoleId) return;
    handleUpdateGranularPermission(selectedRoleId, moduleName, (perms) => {
      const data_scopes = { ...(perms.data_scopes || {}) };
      data_scopes[tabName] = scope;
      data_scopes.see_scope = scope;
      return { 
        ...perms, 
        data_scope: scope, 
        see_scope: scope, 
        data_scopes 
      };
    });
  };

  const handleSetSeePermission = (moduleName: string, secKey: string, val: 'no' | 'view' | 'full') => {
    if (!selectedRoleId) return;
    handleUpdateGranularPermission(selectedRoleId, moduleName, (perms) => {
      const see_permissions = { ...(perms.see_permissions || {}) };
      see_permissions[secKey] = val;
      return { ...perms, see_permissions };
    });
  };

  const handleBulkSetSeePermissions = (moduleName: string, secKeys: string[], val: 'no' | 'view' | 'full', parentKeys?: string[]) => {
    if (!selectedRoleId) return;
    handleUpdateGranularPermission(selectedRoleId, moduleName, (perms) => {
      const see_permissions = { ...(perms.see_permissions || {}) };
      secKeys.forEach(k => {
        see_permissions[k] = val;
      });
      if (parentKeys) {
        parentKeys.forEach(pk => {
          see_permissions[pk] = val;
        });
      }
      return { ...perms, see_permissions };
    });
  };

  const handleToggleHomeWidget = (moduleName: string, widgetKey: string, enabled: boolean) => {
    if (!selectedRoleId) return;
    handleUpdateGranularPermission(selectedRoleId, moduleName, (perms) => {
      const home_widgets = { ...(perms.home_widgets || {}) };
      home_widgets[widgetKey] = {
        ...(home_widgets[widgetKey] || {}),
        enabled,
      };
      return { ...perms, home_widgets };
    });
  };

  const handleSetHomeWidgetMode = (moduleName: string, widgetKey: string, mode: string) => {
    if (!selectedRoleId) return;
    handleUpdateGranularPermission(selectedRoleId, moduleName, (perms) => {
      const home_widgets = { ...(perms.home_widgets || {}) };
      home_widgets[widgetKey] = {
        ...(home_widgets[widgetKey] || { enabled: true }),
        mode,
      };
      return { ...perms, home_widgets };
    });
  };

  const handleSetSelfAccess = (moduleName: string, allow: boolean, level?: string) => {
    if (!selectedRoleId) return;
    handleUpdateGranularPermission(selectedRoleId, moduleName, (perms) => {
      const self_access = { 
        allow, 
        level: level !== undefined ? level : (perms.self_access?.level || 'Employees') 
      };
      return { ...perms, self_access };
    });
  };

  const handleToggleTabCrudAction = (moduleName: string, tabName: string, action: string, value: boolean) => {
    if (!selectedRoleId) return;
    handleUpdateGranularPermission(selectedRoleId, moduleName, (perms) => {
      const tab_actions = { ...(perms.tab_actions || {}) };
      tab_actions[tabName] = {
        ...(tab_actions[tabName] || { view: true, create: true, edit: true, delete: true, export: true }),
        [action]: value
      };
      
      // Also fallback to the top-level permission to ensure standard components have default access
      return { 
        ...perms, 
        tab_actions,
        [action]: value // Sync to top level module action as fallback for backward compatibility
      };
    });
  };

  const handleUpdateMatrixPermission = (moduleName: string, tabName: string, field: string, value: any) => {
    if (!selectedRoleId) return;
    handleUpdateGranularPermission(selectedRoleId, moduleName, (perms) => {
      const tab_actions = { ...(perms.tab_actions || {}) };
      const existing = tab_actions[tabName] || {};
      
      tab_actions[tabName] = {
        view: existing.view ?? true,
        read: existing.read ?? true,
        write: existing.write ?? false,
        edit: existing.edit ?? false,
        create: existing.create ?? false,
        delete: existing.delete ?? false,
        select: existing.select ?? false,
        submit: existing.submit ?? false,
        cancel: existing.cancel ?? false,
        amend: existing.amend ?? false,
        report: existing.report ?? false,
        import: existing.import ?? false,
        export: existing.export ?? false,
        print: existing.print ?? false,
        email: existing.email ?? false,
        share: existing.share ?? false,
        if_owner: existing.if_owner ?? false,
        level: existing.level ?? 0,
        data_scope: existing.data_scope ?? 'global',
        ...existing,
        [field]: value
      };
      
      // Sync standard fields based on Perm Level semantics:
      // Level 0: Default (تلقائي)
      // Level 1: Editable (تعديل)
      // Level 2: Read-Only (قراءة)
      // Level 3: Hidden (مخفي)
      if (field === 'level') {
        const numLevel = Number(value);
        tab_actions[tabName].level = numLevel;

        if (numLevel === 3) {
          // Hidden
          tab_actions[tabName].view = false;
          tab_actions[tabName].read = false;
          tab_actions[tabName].write = false;
          tab_actions[tabName].edit = false;
          tab_actions[tabName].create = false;
          tab_actions[tabName].delete = false;
        } else if (numLevel === 2) {
          // Read-Only
          tab_actions[tabName].view = true;
          tab_actions[tabName].read = true;
          tab_actions[tabName].write = false;
          tab_actions[tabName].edit = false;
          tab_actions[tabName].create = false;
          tab_actions[tabName].delete = false;
        } else if (numLevel === 1) {
          // Editable
          tab_actions[tabName].view = true;
          tab_actions[tabName].read = true;
          tab_actions[tabName].write = true;
          tab_actions[tabName].edit = true;
          tab_actions[tabName].create = true;
          tab_actions[tabName].delete = true;
        } else {
          // 0: Default
          tab_actions[tabName].view = true;
          tab_actions[tabName].read = true;
          tab_actions[tabName].write = true;
          tab_actions[tabName].edit = true;
        }

        const tabs = { ...(perms.tabs || {}) };
        tabs[tabName] = numLevel !== 3;

        const data_scopes = { ...(perms.data_scopes || {}) };
        return {
          ...perms,
          tabs,
          tab_actions,
          data_scopes
        };
      } else if (field === 'read') {
        tab_actions[tabName].view = value;
      } else if (field === 'write') {
        tab_actions[tabName].edit = value;
      } else if (field === 'view') {
        tab_actions[tabName].read = value;
      } else if (field === 'edit') {
        tab_actions[tabName].write = value;
      }

      // Sync data_scope to separate data_scopes record
      const data_scopes = { ...(perms.data_scopes || {}) };
      if (field === 'data_scope') {
        data_scopes[tabName] = value;
      }
      
      return { 
        ...perms, 
        tab_actions,
        data_scopes
      };
    });
  };

  const getTabActionValue = (moduleName: string, tabName: string, actionKey: string): boolean => {
    if (!selectedRole) return false;
    const canon = moduleName === 'HR' || moduleName === 'HR Management' ? 'HR' : moduleName;
    const modulePerms = (selectedRole.permissions?.[canon] || {}) as any;
    
    if (actionKey === 'tabs') {
      const isTabOff = modulePerms.tabs?.[tabName] === false;
      const isLevel3 = modulePerms.tab_actions?.[tabName]?.level === 3;
      const isViewOff = modulePerms.tab_actions?.[tabName]?.view === false;
      return !(isTabOff || isLevel3 || isViewOff);
    }

    const tabActions = modulePerms.tab_actions?.[tabName] || {};
    
    if (tabActions[actionKey] !== undefined) {
      return !!tabActions[actionKey];
    }
    
    // Fallbacks
    if (actionKey === 'read' || actionKey === 'view') {
      return !!(tabActions.view ?? tabActions.read ?? modulePerms.view);
    }
    if (actionKey === 'write' || actionKey === 'edit') {
      return !!(tabActions.edit ?? tabActions.write ?? modulePerms.edit);
    }
    if (actionKey === 'create') {
      return !!(tabActions.create ?? modulePerms.create);
    }
    if (actionKey === 'delete') {
      return !!(tabActions.delete ?? modulePerms.delete);
    }
    if (actionKey === 'export') {
      return !!(tabActions.export ?? modulePerms.export);
    }
    
    return false;
  };

  const getTabDataScope = (moduleName: string, tabName: string): string => {
    if (!selectedRole) return 'global';
    const canon = moduleName === 'HR' || moduleName === 'HR Management' ? 'HR' : moduleName;
    const modulePerms = (selectedRole.permissions?.[canon] || {}) as any;
    return modulePerms.data_scopes?.[tabName] || modulePerms.tab_actions?.[tabName]?.data_scope || 'global';
  };

  const getTabLevel = (moduleName: string, tabName: string): number => {
    if (!selectedRole) return 0;
    const canon = moduleName === 'HR' || moduleName === 'HR Management' ? 'HR' : moduleName;
    const modulePerms = (selectedRole.permissions?.[canon] || {}) as any;
    return modulePerms.tab_actions?.[tabName]?.level ?? 0;
  };

  const getTabIfOwner = (moduleName: string, tabName: string): boolean => {
    if (!selectedRole) return false;
    const canon = moduleName === 'HR' || moduleName === 'HR Management' ? 'HR' : moduleName;
    const modulePerms = (selectedRole.permissions?.[canon] || {}) as any;
    return !!modulePerms.tab_actions?.[tabName]?.if_owner;
  };

  const updateTabLevel = (moduleName: string, tabName: string, level: number) => {
    handleUpdateMatrixPermission(moduleName, tabName, 'level', level);
  };

  const updateTabDataScope = (moduleName: string, tabName: string, scope: string) => {
    handleUpdateMatrixPermission(moduleName, tabName, 'data_scope', scope);
  };

  const updateTabIfOwner = (moduleName: string, tabName: string, ifOwner: boolean) => {
    handleUpdateMatrixPermission(moduleName, tabName, 'if_owner', ifOwner);
  };

  const exportOrgChart = () => {
    const element = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (element) {
      toPng(element).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'business-core-org-chart.png';
        link.href = dataUrl;
        link.click();
      });
    }
  };

  const RecursiveTree = ({ node }: { node: any }) => (
    <div className="ml-8 border-l-2 border-indigo-100 pl-4 py-2">
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm w-fit min-w-[200px]">
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
          {node.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{node.name}</p>
          <p className="text-[10px] text-slate-500">{node.job_title}</p>
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child: any) => (
            <RecursiveTree key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.item || !deleteConfirm.type) return;
    
    setIsDeleting(true);
    try {
      const { type, item } = deleteConfirm;
      
      if (type === 'status') {
        const response = await fetch(`/api/admin/statuses/${item.id}`, { method: 'DELETE', headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to delete status');
        
        const updatedStatuses = globalStatuses.filter((s: any) => s.id !== item.id);
        setGlobalStatuses(updatedStatuses);
        localStorage.setItem('business_core_statuses', JSON.stringify(updatedStatuses));
        logAction('Delete Status', `Status ${item.label} deleted`);
      } else if (type === 'user') {
        const updatedUsers = users.filter(u => u.id !== item.id);
        setUsers(updatedUsers);
        localStorage.setItem('business_core_users', JSON.stringify(updatedUsers));
        await fetch(`/api/admin/users/${item.id}`, { method: 'DELETE', headers: getAuthHeaders() });
        logAction('Delete User', `Employee ${item.name} deleted`);
      } else if (type === 'role') {
        const updatedRoles = roles.filter(r => r.id !== item.id);
        setRoles(updatedRoles);
        localStorage.setItem('business_core_roles', JSON.stringify(updatedRoles));
        await fetch(`/api/admin/roles/${item.id}`, { method: 'DELETE', headers: getAuthHeaders() });
        logAction('Delete Role', `Role ${item.name} deleted`);
      } else if (type === 'module') {
        const updatedModules = systemModules.filter(m => m.id !== item.id);
        setSystemModules(updatedModules);
        await fetch(`/api/admin/modules/${item.id}`, { method: 'DELETE', headers: getAuthHeaders() });
        logAction('Delete Module', `Module ${item.name} deleted`);
      } else if (type === 'tab') {
        const { tabName, idx } = item;
        const updated = activeModuleTabs.filter((_, i) => i !== idx);
        await handleSaveModuleTabs(updated);
        logAction('Delete Tab', `Tab ${tabName} deleted from module ${selectedModuleId}`);
      }

      onDataChange?.();
      setToast({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`, type: 'success' });
    } catch (err) {
      console.error('Delete failed:', err);
      setToast({ message: `Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, type: null, item: null });
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400">Loading Admin Panel...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      {!hideLayoutNav && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Control Panel</h2>
            <p className="text-slate-500 font-medium">Manage users, roles, and organizational structure.</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full custom-scrollbar">
            {(checkPermission as any)('Admin', 'tab:Users') && <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Users" />}
            {(checkPermission as any)('Admin', 'tab:RBAC Matrix') && <TabButton active={activeTab === 'rbac'} onClick={() => setActiveTab('rbac')} icon={Shield} label="RBAC" />}
            {(checkPermission as any)('Admin', 'tab:Org Chart') && <TabButton active={activeTab === 'org'} onClick={() => setActiveTab('org')} icon={Network} label="Org Chart" />}
            {(checkPermission as any)('Admin', 'tab:Statuses') && <TabButton active={activeTab === 'statuses'} onClick={() => setActiveTab('statuses')} icon={ListChecks} label="Statuses" />}
            {(checkPermission as any)('Admin', 'tab:System Modules') && <TabButton active={activeTab === 'modules'} onClick={() => setActiveTab('modules')} icon={ToggleLeft} label="Modules" />}
            {(checkPermission as any)('Admin', 'tab:Audit Logs') && <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={Activity} label="Audit Logs" />}
            <TabButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={Palette} label="Company Branding" />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Note: Departments render relocated to HR Management */}

        {activeTab === 'statuses' && (
          <motion.div 
            key="statuses"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Status Management</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Filter:</span>
                  <select 
                    className="bg-slate-100 border-none rounded-lg text-xs font-bold text-slate-600 px-3 py-1.5 focus:ring-0"
                    value={statusFilterModule}
                    onChange={(e) => setStatusFilterModule(e.target.value)}
                  >
                    <option value="all">All Modules</option>
                    {systemModules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <button 
                onClick={() => { setEditingStatus({ color: '#6366f1', order_index: 0 }); setIsStatusModalOpen(true); }}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Status Option
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Module</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status Key</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Value</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Label</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Order</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Color</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Default</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {globalStatuses.filter(s => statusFilterModule === 'all' || s.module_id === statusFilterModule).map((status: any) => (
                    <tr key={status.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">{status.module_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-[10px] bg-slate-100 px-2 py-1 rounded font-mono text-slate-600">{status.status_key}</code>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-[10px] bg-slate-50 px-2 py-1 rounded font-mono text-indigo-500">{status.value || status.status_key}</code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${status.color}20`, color: status.color }}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-slate-400">{status.order_index || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: status.color }} />
                          <span className="text-xs font-mono text-slate-500 uppercase">{status.color}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {status.is_default && <Check className="w-4 h-4 text-emerald-500" />}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingStatus(status); setIsStatusModalOpen(true); }}
                            className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirm({ isOpen: true, type: 'status', item: status })}
                            className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'modules' && (
          <motion.div 
            key="modules"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)] min-h-[600px]"
          >
            {/* Sidebar List of Modules (Left) */}
            <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col gap-4 shadow-sm shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  No-Code Modules
                </h3>
                <button 
                  onClick={() => { setEditingModule({}); setIsModuleModalOpen(true); }}
                  className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                  title="Add Custom Module"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Search Modules */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchModuleTerm}
                  onChange={(e) => setSearchModuleTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Modules List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {systemModules
                  .filter(m => (m.name || '').toLowerCase().includes((searchModuleTerm || '').toLowerCase()) || (m.id || '').toLowerCase().includes((searchModuleTerm || '').toLowerCase()))
                  .map((m: any) => {
                    const isSelected = selectedModuleId === m.id;
                    const isCustom = !['dashboard', 'ai-business', 'meeting-hub', 'business-model', 'kpis', 'risk', 'marketing', 'leads', 'crm', 'operations-hub', 'acct', 'products', 'sops', 'process-mapping', 'raci', 'tasks', 'hr', 'training', 'kb', 'comm', 'qa', 'kaizen', 'automation', 'integration', 'admin'].includes(m.id);
                    
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedModuleId(m.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all text-left group",
                          isSelected 
                            ? "bg-indigo-50/70 border-indigo-200 shadow-sm" 
                            : "bg-white hover:bg-slate-50 border-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            m.is_active 
                              ? (isSelected ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600") 
                              : "bg-slate-100 text-slate-400"
                          )}>
                            {(() => {
                              const staticModule = MODULES.find(mod => mod.id === m.id);
                              const Icon = staticModule?.icon || Database;
                              return <Icon className="w-4 h-4" />;
                            })()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{m.name}</h4>
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{m.id}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCustom ? (
                            <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-md font-bold uppercase">Custom</span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-bold uppercase">System</span>
                          )}
                          {!m.is_active && (
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Workspace details (Right) */}
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-6 shadow-sm overflow-hidden">
              {selectedModule ? (
                <>
                  {/* Selected Module Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        {(() => {
                          const staticModule = MODULES.find(mod => mod.id === selectedModuleId);
                          const Icon = staticModule?.icon || Database;
                          return <Icon className="w-6 h-6" />;
                        })()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-base font-bold text-slate-800">{selectedModule.name}</h2>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                            selectedModule.is_active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-400"
                          )}>
                            {selectedModule.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">ID Key: <code className="bg-slate-50 px-1 py-0.5 rounded font-mono text-[11px] text-slate-500">{selectedModuleId}</code> • Display Order: {selectedModule.order_index}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingModule(selectedModule); setIsModuleModalOpen(true); }}
                        className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Module Settings
                      </button>

                      {/* Delete Custom Module Button */}
                      {!['dashboard', 'ai-business', 'meeting-hub', 'business-model', 'kpis', 'risk', 'marketing', 'leads', 'crm', 'operations-hub', 'acct', 'products', 'sops', 'process-mapping', 'raci', 'tasks', 'hr', 'training', 'kb', 'comm', 'qa', 'kaizen', 'automation', 'integration', 'admin'].includes(selectedModuleId) && (
                        <button
                          onClick={() => {
                            if (!isSuperAdmin) return;
                            setDeleteConfirm({ isOpen: true, type: 'module', item: selectedModule });
                          }}
                          className="px-3 py-1.5 border border-rose-100 hover:bg-rose-50 rounded-xl text-xs font-bold text-rose-600 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button 
                        onClick={() => handleUpdateModule(selectedModule.id, { is_active: !selectedModule.is_active })}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none",
                          selectedModule.is_active ? "bg-indigo-600" : "bg-slate-200"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          selectedModule.is_active ? "translate-x-6" : "translate-x-1"
                        )} />
                      </button>
                    </div>
                  </div>

                  {/* Workspace Sub-Tabs Selection */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                      <button
                        onClick={() => setWorkspaceSubTab('tabs')}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                          workspaceSubTab === 'tabs' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        <List className="w-3.5 h-3.5" /> Tabs Configurer
                      </button>
                      <button
                        onClick={() => setWorkspaceSubTab('fields')}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                          workspaceSubTab === 'fields' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" /> Forms & Fields Builder
                      </button>
                      <button
                        onClick={() => setWorkspaceSubTab('preview')}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                          workspaceSubTab === 'preview' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        <Play className="w-3.5 h-3.5" /> Interactive Sandbox Preview
                      </button>
                    </div>

                    {/* Active tab/section filter */}
                    {(workspaceSubTab === 'fields' || workspaceSubTab === 'preview') && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Tab Section:</span>
                        <select
                          value={selectedTabName}
                          onChange={(e) => setSelectedTabName(e.target.value)}
                          className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                        >
                          {activeModuleTabs.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Sub-workspace details panel */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    {/* TABS CONFIGURER SUB-TAB */}
                    {workspaceSubTab === 'tabs' && (
                      <div className="space-y-6 max-w-3xl">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">No-Code Module Tabs Builder</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">Customize the navigational tabs of this module. Administrators can create, edit, reorder, or delete tabs instantly without touching code. Tab titles define the container zones where custom form fields are registered.</p>
                          </div>
                        </div>

                        {/* List of active tabs */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configure Tabs ({activeModuleTabs.length})</h4>
                          <div className="space-y-2 max-h-80 overflow-y-auto border border-slate-100 rounded-2xl p-2.5 bg-slate-50/40">
                            {activeModuleTabs.map((tab, idx) => (
                              <div key={idx} className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex items-center justify-between group shadow-xs">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-mono font-bold text-slate-300 w-5">#{idx + 1}</span>
                                  {renamingTabIdx === idx ? (
                                    <input
                                      type="text"
                                      value={renamingTabValue}
                                      onChange={(e) => setRenamingTabValue(e.target.value)}
                                      className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 w-44"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveRename(idx);
                                        } else if (e.key === 'Escape') {
                                          setRenamingTabIdx(null);
                                        }
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-slate-700">{tab}</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {renamingTabIdx === idx ? (
                                    <>
                                      <button
                                        onClick={() => handleSaveRename(idx)}
                                        className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                        title="Save Name"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setRenamingTabIdx(null)}
                                        className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                                        title="Cancel"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {/* Tab Reordering buttons */}
                                      <button
                                        onClick={() => {
                                          if (idx === 0) return;
                                          const updated = [...activeModuleTabs];
                                          const temp = updated[idx];
                                          updated[idx] = updated[idx - 1];
                                          updated[idx - 1] = temp;
                                          handleSaveModuleTabs(updated);
                                        }}
                                        disabled={idx === 0}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                                        title="Move Up"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (idx === activeModuleTabs.length - 1) return;
                                          const updated = [...activeModuleTabs];
                                          const temp = updated[idx];
                                          updated[idx] = updated[idx + 1];
                                          updated[idx + 1] = temp;
                                          handleSaveModuleTabs(updated);
                                        }}
                                        disabled={idx === activeModuleTabs.length - 1}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                                        title="Move Down"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </button>

                                      {/* Tab Action rename / delete */}
                                      <button
                                        onClick={() => {
                                          if (setActiveModule) {
                                            window.history.pushState(null, '', '/build');
                                            setActiveModule('build');
                                          } else {
                                            setSelectedTabName(tab);
                                            setWorkspaceSubTab('fields');
                                          }
                                        }}
                                        className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                        title="Edit Tab & Fields"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={() => {
                                          setRenamingTabIdx(idx);
                                          setRenamingTabValue(tab);
                                        }}
                                        className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                                        title="Rename Tab"
                                      >
                                        <Settings2 className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={() => {
                                          if (activeModuleTabs.length <= 1) {
                                            setToast({ message: 'A module must have at least one tab!', type: 'error' });
                                            return;
                                          }
                                          setDeleteConfirm({
                                            isOpen: true,
                                            type: 'tab',
                                            item: { tabName: tab, idx }
                                          });
                                        }}
                                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                                        title="Delete Tab"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Add a new tab block */}
                          <div className="flex gap-2.5 pt-2">
                            {isAddingTab ? (
                              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                                <input
                                  type="text"
                                  placeholder="Enter new tab name..."
                                  value={newTabTitle}
                                  onChange={(e) => setNewTabTitle(e.target.value)}
                                  className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 w-48"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleConfirmAddTab();
                                    } else if (e.key === 'Escape') {
                                      setIsAddingTab(false);
                                      setNewTabTitle('');
                                    }
                                  }}
                                />
                                <button
                                  onClick={handleConfirmAddTab}
                                  className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                                  title="Add Tab"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setIsAddingTab(false);
                                    setNewTabTitle('');
                                  }}
                                  className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setIsAddingTab(true);
                                  setNewTabTitle('');
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 transition-all"
                              >
                                <Plus className="w-4 h-4" /> Add Custom Tab
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FORMS & FIELDS BUILDER SUB-TAB */}
                    {workspaceSubTab === 'fields' && (
                      <div className="flex flex-col xl:flex-row gap-6">
                        {/* List of custom fields on the left of forms builder */}
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Fields ({moduleFields.length})</h4>
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-mono font-bold">Scope: {selectedModuleId}:{selectedTabName}</span>
                          </div>

                          {loadingFields ? (
                            <div className="flex items-center justify-center py-12 text-slate-400 text-xs gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" /> Fetching form fields...
                            </div>
                          ) : moduleFields.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-400">No custom fields created in this tab yet.</p>
                              <p className="text-[11px] text-slate-400 mt-1">Use the field generator panel to add fields dynamically!</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                              {moduleFields.map((f, idx) => (
                                <div key={f.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-start justify-between group hover:border-slate-300 shadow-xs transition-all">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-xs font-bold text-slate-800">{f.field_label_en}</h5>
                                      {f.is_required && (
                                        <span className="text-[9px] px-1.5 py-0.2 bg-red-50 text-red-500 border border-red-100 rounded font-bold uppercase">Required</span>
                                      )}
                                      <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded font-mono uppercase font-bold">{f.field_type}</span>
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-400 mt-1">Field Name: <code className="bg-slate-50 px-1 py-0.5 rounded text-slate-500">{f.field_name}</code></p>
                                    
                                    {/* Select Options details */}
                                    {f.field_type === 'select' && f.options && (
                                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1"><span className="font-semibold text-slate-600">Options:</span> {f.options}</p>
                                    )}

                                    {/* Relations details */}
                                    {f.field_type === 'relation' && (
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                                        <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span>Linked to table: <code className="bg-slate-50 px-1 rounded text-slate-600 font-mono">{f.relation_target_table}</code> (display: <code className="bg-slate-50 px-1 rounded text-slate-600 font-mono">{f.relation_display_column}</code>)</span>
                                      </div>
                                    )}

                                    {/* Pull details */}
                                    {f.field_type === 'pull' && (
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                                        <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                                        <span>Pull value of column <code className="bg-slate-50 px-1 rounded text-indigo-600 font-mono">{f.relation_display_column}</code> from relation field <code className="bg-indigo-50 px-1 rounded text-indigo-600 font-mono">{f.relation_target_table}</code></span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      disabled={idx === 0}
                                      onClick={() => handleReorderField(idx, 'up')}
                                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                                      title="Move Field Up"
                                    >
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      disabled={idx === moduleFields.length - 1}
                                      onClick={() => handleReorderField(idx, 'down')}
                                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                                      title="Move Field Down"
                                    >
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingFieldId(f.id);
                                        setFieldForm({
                                          field_name: f.field_name,
                                          field_label_en: f.field_label_en,
                                          field_label_ar: f.field_label_ar || '',
                                          field_type: f.field_type,
                                          is_required: f.is_required || false,
                                          options: f.options || '',
                                          relation_target_table: f.relation_target_table || '',
                                          relation_display_column: f.relation_display_column || '',
                                          allow_search: f.allow_search || false,
                                          add_to_filter: f.add_to_filter || false
                                        });
                                      }}
                                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg"
                                      title="Edit Field"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteField(f.id)}
                                      className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg"
                                      title="Delete Field"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Fields Form Editor (Right) */}
                        <div className="w-full xl:w-96 bg-slate-50 p-5 rounded-2xl border border-slate-100 shrink-0">
                          <h4 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                            {editingFieldId ? 'Edit Form Field' : 'Create Form Field'}
                          </h4>

                          <form onSubmit={handleSaveField} className="space-y-4">
                            {/* Field Name */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Field API/DB Name (Lowercase, no spaces)</label>
                              <input
                                type="text"
                                placeholder="e.g. employee_role_code"
                                value={fieldForm.field_name}
                                onChange={(e) => setFieldForm({...fieldForm, field_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})}
                                disabled={!!editingFieldId}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 font-mono"
                                required
                              />
                            </div>

                            {/* Field Label English */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Label English</label>
                              <input
                                type="text"
                                placeholder="e.g. Role Code"
                                value={fieldForm.field_label_en}
                                onChange={(e) => setFieldForm({...fieldForm, field_label_en: e.target.value})}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                required
                              />
                            </div>

                            {/* Field Type */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Field Type</label>
                              <select
                                value={fieldForm.field_type}
                                onChange={(e: any) => setFieldForm({...fieldForm, field_type: e.target.value})}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-700"
                              >
                                <optgroup label="Standard Fields / الحقول العادية">
                                  <option value="text">Short Text (نص قصير)</option>
                                  <option value="longtext">Long Text (نص طويل)</option>
                                  <option value="number">Integer Number (رقم صحيح)</option>
                                  <option value="decimal">Decimal/Currency (مبالغ عشرية)</option>
                                  <option value="date">Date (تاريخ)</option>
                                  <option value="select">Dropdown / Select (قائمة خيارات)</option>
                                  <option value="checkbox">Checkbox / Toggle (نعم/لا)</option>
                                  <option value="file">File / Image (ملف أو صورة)</option>
                                </optgroup>
                                <optgroup label="Relational Fields / الربط الديناميكي">
                                  <option value="relation_o2m">One-to-One / One-to-Many Lookup (ربط فردي)</option>
                                  <option value="relation_m2m">Many-to-Many Lookup (ربط متعدد)</option>
                                  <option value="relation_self">Self-Relation (الربط الذاتي)</option>
                                  <option value="relation">Standard Lookup (ربط موديول خارجي)</option>
                                  <option value="pull">Dynamic Field Pull (جلب البيانات التلقائي)</option>
                                </optgroup>
                              </select>
                            </div>

                            {/* Options Input (Only for Dropdown choice list) */}
                            {fieldForm.field_type === 'select' && (
                              <div>
                                <label className="block text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Choice Options (Comma separated list)</label>
                                <textarea
                                  placeholder="e.g. Starter, Pro, Enterprise, VIP"
                                  value={fieldForm.options}
                                  onChange={(e) => setFieldForm({...fieldForm, options: e.target.value})}
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 h-16 font-semibold"
                                  required
                                />
                              </div>
                            )}

                            {/* Relation Target Table Input (For relation, relation_o2m, relation_m2m) */}
                            {(fieldForm.field_type === 'relation' || fieldForm.field_type === 'relation_o2m' || fieldForm.field_type === 'relation_m2m') && (
                              <div className="space-y-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                <div>
                                  <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-1">Target Look-Up Table</label>
                                  <select
                                    value={fieldForm.relation_target_table}
                                    onChange={(e) => setFieldForm({...fieldForm, relation_target_table: e.target.value})}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold"
                                    required
                                  >
                                    <option value="">-- Choose Target Table --</option>
                                    <option value="crm_customers">Sales CRM Customers</option>
                                    <option value="users">System Users / Admins</option>
                                    <option value="departments">Departments List</option>
                                    <option value="products">Products / Services Directory</option>
                                    <option value="orders">Operations Orders</option>
                                    <option value="sops">Standard Operating Procedures</option>
                                    <option value="kaizen_suggestions">Kaizen Improvement Ideas</option>
                                    <option value="hr_employees">HR Employee Directory</option>
                                    <option value="hr_job_openings">Recruitment Job Openings</option>
                                    <option value="hr_candidates">Recruitment Candidates</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-1">Display Text Database Column</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. name, title, company, email"
                                    value={fieldForm.relation_display_column}
                                    onChange={(e) => setFieldForm({...fieldForm, relation_display_column: e.target.value})}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                                    required
                                  />
                                </div>
                              </div>
                            )}

                            {/* Self-Relation Helper Info */}
                            {fieldForm.field_type === 'relation_self' && (
                              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-700 leading-relaxed">
                                <strong>Self-Relation:</strong> This field allows linking records within the same module (e.g. parent company, child task, supervisor). The dropdown will automatically pull unique entries of this module.
                              </div>
                            )}

                            {/* Dynamic Field Pull Configuration (Only for 'pull' types) */}
                            {fieldForm.field_type === 'pull' && (
                              <div className="space-y-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                                <p className="text-[10px] text-purple-600 leading-normal mb-1">
                                  <strong>How Dynamic Pull Works:</strong> Selecting a related record inside the specified Relation field will auto-fill this field with a selected column value!
                                </p>
                                <div>
                                  <label className="block text-[10px] font-bold text-purple-700 uppercase mb-1">Source Relation Field Name (in current module)</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. customer_id, linked_employee"
                                    value={fieldForm.relation_target_table}
                                    onChange={(e) => setFieldForm({...fieldForm, relation_target_table: e.target.value})}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 font-mono font-bold text-purple-800"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-purple-700 uppercase mb-1">Target Column / Custom Field to Pull</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. email, phone, is_active, notes"
                                    value={fieldForm.relation_display_column}
                                    onChange={(e) => setFieldForm({...fieldForm, relation_display_column: e.target.value})}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 font-mono"
                                    required
                                  />
                                </div>
                              </div>
                            )}

                            {/* Field Settings / Flags */}
                            <div className="space-y-2.5 pt-2 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="is_required"
                                  checked={fieldForm.is_required}
                                  onChange={(e) => setFieldForm({...fieldForm, is_required: e.target.checked})}
                                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="is_required" className="text-xs text-slate-600 font-semibold cursor-pointer">Require users to fill this field (مطلوب)</label>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="allow_search"
                                  checked={fieldForm.allow_search}
                                  onChange={(e) => setFieldForm({...fieldForm, allow_search: e.target.checked})}
                                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="allow_search" className="text-xs text-slate-600 font-semibold cursor-pointer">Allow searching this field (تفعيل البحث)</label>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="add_to_filter"
                                  checked={fieldForm.add_to_filter}
                                  onChange={(e) => setFieldForm({...fieldForm, add_to_filter: e.target.checked})}
                                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="add_to_filter" className="text-xs text-slate-600 font-semibold cursor-pointer">Add to list filters (إضافة للفلاتر)</label>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-3">
                              {editingFieldId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingFieldId(null);
                                    setFieldForm({
                                      field_name: '',
                                      field_label_en: '',
                                      field_label_ar: '',
                                      field_type: 'text',
                                      is_required: false,
                                      options: '',
                                      relation_target_table: '',
                                      relation_display_column: '',
                                      allow_search: false,
                                      add_to_filter: false
                                    });
                                  }}
                                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-all"
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                type="submit"
                                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                              >
                                <Save className="w-3.5 h-3.5" />
                                {editingFieldId ? 'Update Field' : 'Add to Form'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* INTERACTIVE PLAYGROUND SANDBOX PREVIEW */}
                    {workspaceSubTab === 'preview' && (
                      <div className="max-w-3xl space-y-6">
                        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
                          <Play className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-amber-800">Dynamic Sandbox Testing Playground</h4>
                            <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5">Test your forms and dynamic field mappings interactively! Select items from relation lookup lists to see **Dynamic Field Pulling** auto-fill secondary inputs in real-time. Click "Submit Sandbox Record" to see the produced JSON output structure.</p>
                          </div>
                        </div>

                        {/* Interactive Form Rendering */}
                        <div className="bg-slate-50/40 p-6 rounded-3xl border border-slate-200 max-w-2xl shadow-inner">
                          <div className="border-b border-slate-200 pb-3 mb-5">
                            <h3 className="text-sm font-bold text-slate-800">{selectedModule.name}</h3>
                            <p className="text-xs text-slate-500">Form Tab: {selectedTabName}</p>
                          </div>

                          {moduleFields.length === 0 ? (
                            <div className="text-center py-12">
                              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs text-slate-400 font-bold">This form tab has no custom fields configured yet.</p>
                            </div>
                          ) : (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                setSandboxRecordOutput({
                                  submitted_at: new Date().toISOString(),
                                  module_id: selectedModuleId,
                                  tab_name: selectedTabName,
                                  payload: previewValues
                                });
                              }}
                              className="space-y-4"
                            >
                              {moduleFields.map((f) => {
                                const val = previewValues[f.field_name] || '';
                                const isRequired = f.is_required || false;

                                return (
                                  <div key={f.id} className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                      {f.field_label_en}
                                      {isRequired && <span className="text-rose-500 font-bold">*</span>}
                                      {f.field_type === 'pull' && <span className="text-[9px] px-1.5 bg-purple-50 text-purple-600 rounded font-bold uppercase border border-purple-100">Dynamic Pull</span>}
                                    </label>

                                    {/* String field (Text) */}
                                    {f.field_type === 'text' && (
                                      <input
                                        type="text"
                                        value={val}
                                        onChange={(e) => setPreviewValues({...previewValues, [f.field_name]: e.target.value})}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                                        required={isRequired}
                                        placeholder={`Enter ${(f.field_label_en || f.field_name || '').toLowerCase()}...`}
                                      />
                                    )}

                                    {/* Textarea field (Long Text) */}
                                    {f.field_type === 'longtext' && (
                                      <textarea
                                        value={val}
                                        onChange={(e) => setPreviewValues({...previewValues, [f.field_name]: e.target.value})}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 h-20"
                                        required={isRequired}
                                        placeholder={`Enter ${(f.field_label_en || f.field_name || '').toLowerCase()} details...`}
                                      />
                                    )}

                                    {/* Number field */}
                                    {f.field_type === 'number' && (
                                      <input
                                        type="number"
                                        value={val}
                                        onChange={(e) => setPreviewValues({...previewValues, [f.field_name]: e.target.value})}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
                                        required={isRequired}
                                        placeholder="0"
                                      />
                                    )}

                                    {/* Date field */}
                                    {f.field_type === 'date' && (
                                      <input
                                        type="date"
                                        value={val}
                                        onChange={(e) => setPreviewValues({...previewValues, [f.field_name]: e.target.value})}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
                                        required={isRequired}
                                      />
                                    )}

                                    {/* Dropdown Select field */}
                                    {f.field_type === 'select' && (
                                      <select
                                        value={val}
                                        onChange={(e) => setPreviewValues({...previewValues, [f.field_name]: e.target.value})}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-700"
                                        required={isRequired}
                                      >
                                        <option value="">-- Choose Option --</option>
                                        {(f.options || '').split(',').map((opt: string) => {
                                          const trimmed = opt.trim();
                                          return <option key={trimmed} value={trimmed}>{trimmed}</option>;
                                        })}
                                      </select>
                                    )}

                                    {/* Boolean Checkbox field */}
                                    {f.field_type === 'checkbox' && (
                                      <div className="flex items-center gap-2 py-1">
                                        <input
                                          type="checkbox"
                                          id={`chk-${f.id}`}
                                          checked={!!val}
                                          onChange={(e) => setPreviewValues({...previewValues, [f.field_name]: e.target.checked})}
                                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <label htmlFor={`chk-${f.id}`} className="text-xs text-slate-600 font-semibold cursor-pointer">Yes, select / activate</label>
                                      </div>
                                    )}

                                    {/* Relational lookup field */}
                                    {f.field_type === 'relation' && (
                                      <select
                                        value={val}
                                        onChange={(e) => handleRelationValueChange(f.field_name, f.relation_target_table, e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-white border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-700"
                                        required={isRequired}
                                      >
                                        <option value="">-- Dynamic Database Lookup --</option>
                                        {(sandboxRelationOptions[f.field_name] || []).map((row) => (
                                          <option key={row.id} value={row.id}>{row.display_value || `Record ID ${row.id}`}</option>
                                        ))}
                                      </select>
                                    )}

                                    {/* Dynamic pulled field (Pulled value) */}
                                    {f.field_type === 'pull' && (
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={val}
                                          readOnly
                                          className="w-full pl-3 pr-8 py-2 text-xs bg-purple-50/50 border border-purple-200 rounded-xl focus:outline-none text-purple-800 font-bold"
                                          placeholder={`Auto-fills from link: [${f.relation_target_table}]`}
                                        />
                                        <Sparkles className="absolute right-3 top-2.5 w-3.5 h-3.5 text-purple-400" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewValues({})}
                                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-all"
                                >
                                  Reset Sandbox values
                                </button>
                                <button
                                  type="submit"
                                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                                >
                                  Submit Sandbox Record <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </form>
                          )}
                        </div>

                        {/* Submitted playground sandbox JSON Output display modal */}
                        {sandboxRecordOutput && (
                          <div className="bg-slate-900 text-emerald-400 p-5 rounded-2xl border border-slate-800 font-mono text-xs shadow-xl space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Completed Form Submitted Payload JSON</span>
                              <button 
                                onClick={() => setSandboxRecordOutput(null)} 
                                className="text-slate-400 hover:text-white font-bold"
                              >
                                Clear
                              </button>
                            </div>
                            <pre className="overflow-x-auto max-h-60 text-[11px] leading-relaxed">
                              {JSON.stringify(sandboxRecordOutput, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <Database className="w-12 h-12 text-slate-300 mb-2 animate-pulse" />
                  <p className="text-sm font-bold">No module selected.</p>
                  <p className="text-xs text-slate-400">Choose a system or custom module from the left sidebar to start building forms!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'audit' && (
          <motion.div 
            key="audit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Admin Audit Log</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">User:</span>
                    <select 
                      className="bg-slate-100 border-none rounded-lg text-xs font-bold text-slate-600 px-3 py-1.5 focus:ring-0"
                      value={auditFilterUser}
                      onChange={(e) => setAuditFilterUser(e.target.value)}
                    >
                      <option value="all">All Admins</option>
                      {Array.from(new Set(auditLogs.map(l => l.user_name))).map(name => (
                        <option key={name as string} value={name as string}>{name as string}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Date:</span>
                    <input 
                      type="date"
                      className="bg-slate-100 border-none rounded-lg text-xs font-bold text-slate-600 px-3 py-1 focus:ring-0"
                      value={auditFilterDate}
                      onChange={(e) => setAuditFilterDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">
                <Download className="w-4 h-4" /> Export Log
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Admin / User</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Module</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Changes</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {auditLogs
                    .filter(log => auditFilterUser === 'all' || log.user_name === auditFilterUser)
                    .filter(log => !auditFilterDate || log.created_at.startsWith(auditFilterDate))
                    .map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">{log.user_name || 'System'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                          {log.entity_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          log.action?.includes('Create') || log.action === 'CREATE' ? "bg-emerald-100 text-emerald-700" :
                          log.action?.includes('Update') || log.action === 'UPDATE' ? "bg-blue-100 text-blue-700" :
                          log.action?.includes('Delete') || log.action === 'DELETE' ? "bg-rose-100 text-rose-700" :
                          "bg-slate-100 text-slate-700"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.old_value && log.new_value ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-[10px] bg-rose-50 text-rose-600 px-1 rounded line-through opacity-50">Old</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1 rounded">New</span>
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => { setEditingUser({}); setIsUserModalOpen(true); }}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                <UserPlus className="w-4 h-4" /> Add User
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Reports To</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.filter(u => (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-slate-900">{user.name}</p>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded-md border border-slate-200" title="رقم المستخدم بالنظام (System User ID)">
                                User ID: #{user.id}
                              </span>
                              {user.employee_id && (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md border border-indigo-200/60" title="كود البصمة / Employee Fingerprint ID">
                                  Emp ID: {user.employee_id}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{user.job_title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                          {user.department_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <Shield className="w-3.5 h-3.5 text-indigo-500" />
                          {user.role_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.manager_name || <span className="text-slate-300 italic">N/A</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border",
                            user.status === 'active' || !user.status
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            <span className={cn("w-2 h-2 rounded-full", user.status === 'active' || !user.status ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                            {user.status === 'active' || !user.status ? "Active / نشط" : "Inactive / معطل"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            title={user.status === 'active' || !user.status ? 'إيقاف صلاحية الدخول لكون الموظف غير نشط أو مستقيل' : 'تفعيل حساب المستخدم وصلاحية الدخول'}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer",
                              user.status === 'active' || !user.status
                                ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            )}
                          >
                            {user.status === 'active' || !user.status ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-rose-600" />
                                <span className="hidden sm:inline">إيقاف الدخول</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="hidden sm:inline">تفعيل الدخول</span>
                              </>
                            )}
                          </button>

                          {isSuperAdmin && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }}
                                className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                title="تعديل بيانات المستخدم"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setDeleteConfirm({ isOpen: true, type: 'user', item: user })}
                                className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                                title="حذف المستخدم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'rbac' && (
          <motion.div 
            key="rbac"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Unsaved Changes Floating Banner */}
            {hasUnsavedRbacChanges && (
              <div className="bg-amber-500 text-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-amber-600 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm flex items-center gap-2">
                      <span>تغييرات معلقة في صلاحيات الدور ({selectedRole?.name})</span>
                      <span className="text-xs bg-amber-600/80 px-2 py-0.5 rounded-md border border-amber-400">لم يتم الحفظ بالسيرفر</span>
                    </h4>
                    <p className="text-xs text-amber-100 font-medium mt-0.5" dir="rtl">
                      لقد قمت بتعديل الصلاحيات. اضغط على زر "تأكيد وحفظ الصلاحيات" لتطبيق التغييرات نهائياً ومنع الخطأ.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                  <button
                    onClick={handleDiscardRbacChanges}
                    disabled={isSavingRbac}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    إلغاء التغييرات (Discard)
                  </button>
                  <button
                    onClick={handleConfirmSaveRbacPermissions}
                    disabled={isSavingRbac}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {isSavingRbac ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        تأكيد وحفظ الصلاحيات (Save Changes)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Column 1: System Roles List */}
            <div className="xl:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">System Roles</h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                  {roles.length} Total
                </span>
              </div>
              <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
                {roles.map((role) => (
                  <div key={role.id} className="group relative">
                    <button 
                      onClick={() => {
                        setSelectedRoleId(role.id);
                        // Also auto-select first tab of first module when role is switched
                        const modules = getRBACModulesList();
                        if (modules.length > 0) {
                          const firstModule = modules[0];
                          const tabs = getModuleTabs(firstModule, systemModules);
                          if (tabs.length > 0) {
                            setSelectedTreeItem({ module: firstModule, tab: tabs[0] });
                          }
                        }
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 border rounded-2xl transition-all group text-left",
                        selectedRoleId === role.id 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                          : "bg-white border-slate-200 hover:border-indigo-300 text-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          selectedRoleId === role.id ? "bg-white/20" : "bg-indigo-50 text-indigo-600"
                        )}>
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold block text-sm">{role.name}</span>
                          <span className={cn(
                            "text-[9px] font-medium uppercase tracking-wider block mt-0.5",
                            selectedRoleId === role.id ? "text-indigo-200" : "text-slate-400"
                          )}>
                            {role.name === 'Admin' ? 'Unlimited Access' : 'Custom RBAC Scope'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-colors",
                        selectedRoleId === role.id ? "text-white" : "text-slate-300 group-hover:text-indigo-500"
                      )} />
                    </button>
                    {isSuperAdmin && role.name !== 'Admin' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ isOpen: true, type: 'role', item: role });
                        }}
                        className={cn(
                          "absolute right-12 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-all",
                          selectedRoleId === role.id ? "text-white/70 hover:text-white" : "text-rose-400 hover:text-rose-600"
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => { setEditingRole({}); setIsRoleModalOpen(true); }}
                className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 bg-slate-50/30"
              >
                <Plus className="w-4 h-4" /> Create New Role
              </button>
            </div>

            {/* Column 2: Modules Overview Grid or Matrix Grid layout */}
            <div className="xl:col-span-9 space-y-6">
              {selectedRBACModule === null ? (
                /* Modules Overview Grid & System Role Presets */
                <div className="space-y-6">
                  {selectedRole && (
                    <MobileAppPermissionsCard
                      key={`mobile-perms-${selectedRole.id}`}
                      roleId={selectedRole.id}
                      roleName={selectedRole.name}
                      initialMobilePermissions={selectedRole.mobile_permissions}
                      onPermissionsUpdated={(roleId, mobilePerms, updatedFullPerms) => {
                        setRoles(prev => prev.map(r => r.id === roleId ? {
                          ...r,
                          mobile_permissions: mobilePerms,
                          permissions: updatedFullPerms || r.permissions
                        } : r));
                      }}
                    />
                  )}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">System Modules Permissions / صلاحيات موديولات النظام</h3>
                      <p className="text-xs text-slate-400 font-semibold tracking-wide mt-1">
                        اختر الموديول لتعديل مصفوفة صلاحيات الشاشات والحقول لدور ({selectedRole?.name})
                      </p>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setPresetApplyScope('all');
                          setIsPresetsModalOpen(true);
                        }}
                        disabled={selectedRole?.name === 'Admin'}
                        className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Shield className="w-3.5 h-3.5 text-indigo-200" />
                        <span>قوالب أدوار النظام الجاهزة (System Role Presets)</span>
                      </button>
                      {hasUnsavedRbacChanges ? (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase flex items-center gap-1.5 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          تغييرات غير محفوظة
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase flex items-center gap-1.5 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          الصلاحيات محفوظة
                        </span>
                      )}
                      <button
                        onClick={handleConfirmSaveRbacPermissions}
                        disabled={isSavingRbac || !hasUnsavedRbacChanges}
                        className={cn(
                          "px-5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all",
                          hasUnsavedRbacChanges
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:scale-105 active:scale-95 cursor-pointer"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        )}
                      >
                        {isSavingRbac ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>تأكيد وحفظ الصلاحيات</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {getRBACModulesList().map((module) => {
                      const canon = module === 'HR Management' ? 'HR' : module;
                      const modulePerms = (selectedRole?.permissions?.[canon] || {}) as any;
                      const isEnabled = modulePerms.view !== false;
                      const desc = {
                        'Home': { desc: 'Workspace homepage, widgets, team feed, and quick actions', arDesc: 'الصفحة الرئيسية وموجز الفريق والودجات والإجراءات السريعة', icon: '🏠', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                        'Dashboard': { desc: 'Executive dashboard and KPIs overview', arDesc: 'لوحة التحكم الرئيسية والمؤشرات', icon: '📊', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                        'AI Business': { desc: 'AI assistant and business planning utilities', arDesc: 'مساعد الذكاء الاصطناعي ودراسات الجدوى', icon: '✨', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                        'Meeting Hub': { desc: 'Calendar and room reservations management', arDesc: 'إدارة الاجتماعات وحجز غرف المؤتمرات', icon: '📅', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                        'Business Model': { desc: 'Business model and value canvas modeler', arDesc: 'مخطط نموذج العمل والقيمة المقترحة', icon: '🎯', color: 'bg-pink-50 text-pink-600 border-pink-100' },
                        'Performance & KPIs': { desc: 'Department metrics and KPI performance', arDesc: 'إدارة الأداء والمؤشرات الرئيسية للموظفين', icon: '📈', color: 'bg-violet-50 text-violet-600 border-violet-100' },
                        'KPIs': { desc: 'Department metrics and KPI performance', arDesc: 'إدارة الأداء والمؤشرات الرئيسية للموظفين', icon: '📈', color: 'bg-violet-50 text-violet-600 border-violet-100' },
                        'Risk Register': { desc: 'Corporate risk management and mitigation', arDesc: 'سجل المخاطر وتحديد مصفوفة الحلول والبدائل', icon: '🛡️', color: 'bg-rose-50 text-rose-600 border-rose-100' },
                        'Risk': { desc: 'Corporate risk management and mitigation', arDesc: 'سجل المخاطر وتحديد مصفوفة الحلول والبدائل', icon: '🛡️', color: 'bg-rose-50 text-rose-600 border-rose-100' },
                        'Marketing Hub': { desc: 'Campaign planner and content calendar', arDesc: 'مخطط الحملات الإعلانية وجدول المحتوى', icon: '📢', color: 'bg-orange-50 text-orange-600 border-orange-100' },
                        'Marketing': { desc: 'Campaign planner and content calendar', arDesc: 'مخطط الحملات الإعلانية وجدول المحتوى', icon: '📢', color: 'bg-orange-50 text-orange-600 border-orange-100' },
                        'CRM Leads': { desc: 'Pipeline board and sales leads acquisition', arDesc: 'لوحة المبيعات وإدارة العملاء المحتملين', icon: '🔌', color: 'bg-sky-50 text-sky-600 border-sky-100' },
                        'Leads': { desc: 'Pipeline board and sales leads acquisition', arDesc: 'لوحة المبيعات وإدارة العملاء المحتملين', icon: '🔌', color: 'bg-sky-50 text-sky-600 border-sky-100' },
                        'Sales CRM': { desc: 'Deal pipeline, contacts, and auto assign', arDesc: 'إدارة علاقات العملاء ومراحل الصفقات والاتصالات', icon: '💼', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                        'CRM': { desc: 'Deal pipeline, contacts, and auto assign', arDesc: 'إدارة علاقات العملاء ومراحل الصفقات والاتصالات', icon: '💼', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                        'Operations Hub': { desc: 'Work order pipelines and operations dashboard', arDesc: 'أوامر العمل والتشغيل وتوزيع المهام اليومية', icon: '⚙️', color: 'bg-slate-50 text-slate-600 border-slate-100' },
                        'Accounting': { desc: 'Ledger, invoices, reconciliation, and reports', arDesc: 'الحسابات العامة والفواتير والتحصيل والرواتب', icon: '💵', color: 'bg-teal-50 text-teal-600 border-teal-100' },
                        'Products/Services': { desc: 'Pricing directory and product catalogs', arDesc: 'دليل المنتجات وقوائم الأسعار والخدمات', icon: '📦', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
                        'Products': { desc: 'Pricing directory and product catalogs', arDesc: 'دليل المنتجات وقوائم الأسعار والخدمات', icon: '📦', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
                        'SOP Management': { desc: 'Standard operating procedures approval', arDesc: 'إجراءات التشغيل القياسية وصلاحيات الاعتماد', icon: '📑', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
                        'SOPs': { desc: 'Standard operating procedures approval', arDesc: 'إجراءات التشغيل القياسية وصلاحيات الاعتماد', icon: '📑', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
                        'Process Mapping': { desc: 'Visual flowcharts and link to SOPs', arDesc: 'خرائط التدفق وربط إجراءات العمل والتشغيل', icon: '🗺️', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                        'RACI Matrix': { desc: 'Visual RACI editor and role assignments', arDesc: 'مصفوفة RACI لتوزيع المسؤوليات والأدوار', icon: '🧩', color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100' },
                        'RACI': { desc: 'Visual RACI editor and role assignments', arDesc: 'مصفوفة RACI لتوزيع المسؤوليات والأدوار', icon: '🧩', color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100' },
                        'Tasks': { desc: 'Kanban tasks board and project timelines', arDesc: 'إدارة المهام وتتبع الوقت ومخطط المشروع', icon: '✅', color: 'bg-green-50 text-green-600 border-green-100' },
                        'HR Management': { desc: 'Employee directory, payroll, and org chart', arDesc: 'شؤون الموظفين والرواتب والحضور والتقييم', icon: '👥', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                        'HR': { desc: 'Employee directory, payroll, and org chart', arDesc: 'شؤون الموظفين والرواتب والحضور والتقييم', icon: '👥', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                        'Training Hub': { desc: 'Courses and employee training logs', arDesc: 'مركز التدريب والدورات المخصصة للموظفين', icon: '🎓', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                        'Training': { desc: 'Courses and employee training logs', arDesc: 'مركز التدريب والدورات المخصصة للموظفين', icon: '🎓', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                        'Knowledge Base': { desc: 'Articles and documentation directories', arDesc: 'مكتبة المعرفة والتوثيق والتعليمات الداخلية', icon: '📚', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                        'Communication': { desc: 'Inbox and contextual system chats', arDesc: 'صندوق الوارد والدردشات ونظام الإعلانات', icon: '💬', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                        'Quality Assurance': { desc: 'Performance boards and audits registers', arDesc: 'تقييم الجودة والتدقيق ومراجعة كفاءة التشغيل', icon: '🔎', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                        'QA': { desc: 'Performance boards and audits registers', arDesc: 'تقييم الجودة والتدقيق ومراجعة كفاءة التشغيل', icon: '🔎', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                        'Kaizen Improvement': { desc: 'Voting boards and proposals management', arDesc: 'مقترحات كايزن للتحسين المستمر والابتكار', icon: '💡', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                        'Kaizen': { desc: 'Voting boards and proposals management', arDesc: 'مقترحات كايزن للتحسين المستمر والابتكار', icon: '💡', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                        'Automation': { desc: 'Webhook listeners and custom integrations', arDesc: 'الربط التلقائي والعمليات المؤتمتة بالمشروع', icon: '⚡', color: 'bg-orange-50 text-orange-600 border-orange-100' },
                        'Integration Hub': { desc: 'Integrate external worksheets and chats', arDesc: 'ربط الأنظمة الخارجية والملفات والواتساب', icon: '🔌', color: 'bg-sky-50 text-sky-600 border-sky-100' },
                        'Integrations': { desc: 'Integrate external worksheets and chats', arDesc: 'ربط الأنظمة الخارجية والملفات والواتساب', icon: '🔌', color: 'bg-sky-50 text-sky-600 border-sky-100' },
                        'Admin Panel': { desc: 'System RBAC matrix, users, and audit logs', arDesc: 'لوحة التحكم والـ RBAC وإعدادات النظام الحساسة', icon: '🛡️', color: 'bg-red-50 text-red-600 border-red-100' },
                        'Admin': { desc: 'System RBAC matrix, users, and audit logs', arDesc: 'لوحة التحكم والـ RBAC وإعدادات النظام الحساسة', icon: '🛡️', color: 'bg-red-50 text-red-600 border-red-100' }
                      }[module] || {
                        desc: 'System module configuration and permission tables',
                        arDesc: 'جداول الصلاحيات وإعدادات موديول النظام العام',
                        icon: '📁',
                        color: 'bg-slate-50 text-slate-600 border-slate-100'
                      };
                      const tabsCount = getModuleTabs(module, systemModules).length;

                      return (
                        <div 
                          key={module}
                          onClick={() => {
                            if (selectedRoleId) {
                              navigate(`/admin/rbac/${selectedRoleId}/module/${encodeURIComponent(module)}/tree`);
                            } else {
                              setSelectedRBACModule(module);
                            }
                          }}
                          className={cn(
                            "group cursor-pointer relative border rounded-2xl p-5 transition-all flex flex-col justify-between bg-white hover:shadow-lg hover:border-indigo-300 transform hover:-translate-y-0.5",
                            isEnabled 
                              ? "border-slate-200" 
                              : "border-slate-100 opacity-60 bg-slate-50/50"
                          )}
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shadow-xs border", desc.color)}>
                                {desc.icon}
                              </div>
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                isEnabled 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                  : "bg-slate-100 text-slate-400 border-slate-200"
                              )}>
                                {isEnabled ? 'Active / فعال' : 'Hidden / مخفي'}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                <span>{module}</span>
                                <span className="text-[9px] font-bold text-slate-300">({canon})</span>
                              </h4>
                              <p className="text-[10px] text-slate-400 font-semibold block mt-1 leading-relaxed">
                                {desc.desc}
                              </p>
                              <p className="text-[10px] text-slate-500 font-semibold block mt-0.5 leading-relaxed" dir="rtl">
                                {desc.arDesc}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                              {tabsCount} Forms & tabs
                            </span>
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer scale-75" title="Toggle Module Visibility">
                                <input 
                                  type="checkbox" 
                                  checked={isEnabled}
                                  disabled={selectedRole?.name === 'Admin'}
                                  onChange={(e) => {
                                    if (selectedRole?.name !== 'Admin') {
                                      handleUpdateGranularPermission(selectedRoleId!, module, (perms) => ({
                                        ...perms,
                                        view: e.target.checked
                                      }));
                                    }
                                  }}
                                  className="sr-only peer" 
                                />
                                <div className={cn(
                                  "w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600",
                                  selectedRole?.name === 'Admin' && "opacity-50 cursor-not-allowed"
                                )}></div>
                              </label>
                              
                              <button
                                onClick={() => {
                                  if (selectedRoleId) {
                                    navigate(`/admin/rbac/${selectedRoleId}/module/${encodeURIComponent(module)}/tree`);
                                  } else {
                                    setSelectedRBACModule(module);
                                  }
                                }}
                                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                              >
                                Edit Matrix
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                </div>
              ) : (
                /* Majestic Permissions Matrix Grid Table */
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fade-in relative">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 bg-slate-50/50 -mx-6 -mt-6 p-6 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedRBACModule(null)}
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all text-slate-600 flex items-center justify-center hover:scale-105 active:scale-95"
                        title="Back to Modules / العودة للأقسام"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </button>
                      <div>
                        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest block">
                          Selected Role: {selectedRole?.name}
                        </span>
                        <h4 className="text-base font-black text-slate-800 mt-0.5 flex items-center gap-2">
                          <span>{selectedRBACModule === 'HR' ? 'HR Management' : selectedRBACModule} Matrix Table</span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-black">
                            مصفوفة صلاحيات الشاشات
                          </span>
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setPresetApplyScope('module');
                          setIsPresetsModalOpen(true);
                        }}
                        disabled={selectedRole?.name === 'Admin'}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[11px] font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-indigo-200" />
                        <span>قوالب الصلاحيات الجاهزة (Presets)</span>
                      </button>

                      <button
                        onClick={() => {
                          setFieldSecurityModule(selectedRBACModule);
                          setIsFieldSecurityOpen(true);
                        }}
                        disabled={selectedRole?.name === 'Admin'}
                        className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>التحكم بالحقول الحساسة (Field Security)</span>
                      </button>

                      <button
                        onClick={handleConfirmSaveRbacPermissions}
                        disabled={isSavingRbac || !hasUnsavedRbacChanges}
                        className={cn(
                          "px-5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all",
                          hasUnsavedRbacChanges
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:scale-105 active:scale-95 cursor-pointer"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        )}
                      >
                        {isSavingRbac ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>تأكيد وحفظ الصلاحيات</span>
                      </button>

                      <button
                        onClick={() => setSelectedRBACModule(null)}
                        className="p-2 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 hover:text-rose-600 rounded-xl transition-all shadow-xs"
                        title="Close Matrix"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Filters and Search */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-50/20 p-4 rounded-2xl border border-indigo-50/50">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search tabs / forms in this module..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        value={matrixSearch}
                        onChange={(e) => setMatrixSearch(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mr-2">
                        Fast Actions:
                      </span>
                      <button
                        onClick={() => {
                          if (selectedRole?.name === 'Admin') return;
                          const tabs = getModuleTabs(selectedRBACModule!, systemModules);
                          tabs.forEach(tab => {
                            handleToggleTabVisibility(selectedRBACModule!, tab, true);
                            updateTabLevel(selectedRBACModule!, tab, 0);
                            updateTabDataScope(selectedRBACModule!, tab, 'global');
                          });
                        }}
                        disabled={selectedRole?.name === 'Admin'}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Select All (تفعيل الكل)
                      </button>
                      <button
                        onClick={() => {
                          if (selectedRole?.name === 'Admin') return;
                          const tabs = getModuleTabs(selectedRBACModule!, systemModules);
                          tabs.forEach(tab => {
                            handleToggleTabVisibility(selectedRBACModule!, tab, false);
                            updateTabLevel(selectedRBACModule!, tab, 3);
                            updateTabDataScope(selectedRBACModule!, tab, 'own');
                          });
                        }}
                        disabled={selectedRole?.name === 'Admin'}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Reset All (تصفير الكل)
                      </button>
                    </div>
                  </div>

                  {/* Top Mode Navigation Pills */}
                  <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-2 border border-slate-200 my-2">
                    <button
                      type="button"
                      onClick={() => setRbacMatrixMainTab('tree')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer",
                        rbacMatrixMainTab === 'tree' ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      )}
                    >
                      <FolderTree className="w-4 h-4" />
                      <span>1. الهيكلية الشجرية للشاشات (Hierarchical Tree)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRbacMatrixMainTab('actions_fields')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer",
                        rbacMatrixMainTab === 'actions_fields' ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      )}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>2. الصلاحيات والحقول التفصيلية (Actions & Fields)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRbacMatrixMainTab('presets')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer",
                        rbacMatrixMainTab === 'presets' ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      )}
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>3. القوالب الجاهزة (System Role Presets)</span>
                    </button>
                  </div>

                  {/* MODE 1: HIERARCHICAL TREE VIEW */}
                  {rbacMatrixMainTab === 'tree' && (
                    <div className="space-y-4">
                      {/* HR Module Tree Domain Groups */}
                      {(() => {
                        const canonModule = selectedRBACModule === 'HR Management' ? 'HR' : (selectedRBACModule || 'HR');
                        const isHrModule = canonModule === 'HR';

                        const hrDomainGroups = [
                          {
                            groupId: 'hr_root',
                            titleAr: 'شاشة النظام الأساسية والتنقل (HR Workspace Shell & Navigation)',
                            parentTab: 'HR Root',
                            subTabs: ['Master Navigation & Workspace Shell (Hub)', 'Module Schema & Custom Layout Settings', 'Email Notifications & Integration Bridges', 'Quick Action Shortcuts & Security Overrides']
                          },
                          {
                            groupId: 'dashboard',
                            titleAr: 'لوحة التحكم والقياسات الحيوية (HR Control Center Dashboard)',
                            parentTab: 'Dashboard',
                            subTabs: ['Executive Summary Metrics & KPIs', 'Headcount Distribution & Department Graphs', 'Turnover Rates & Leave Analytics', 'Biometric Telemetry & Audit Logs']
                          },
                          {
                            groupId: 'directory',
                            titleAr: 'سجل الموظفين والملفات الشاملة (Employee Directory & Comprehensive Profiles)',
                            parentTab: 'Employee Directory',
                            subTabs: [
                              'Master Employee Roster & Filter Matrix',
                              'Add New Employee Onboarding Wizard',
                              'Profile Tab: Personal Details (Default redirect)',
                              'Profile Tab: Job & Employment Details',
                              'Profile Tab: Time-Off Balances & Leaves',
                              'Profile Tab: Emergency Contacts',
                              'Profile Tab: Recognition & Awards',
                              'Profile Tab: Performance Records',
                              'Profile Tab: Training & Certifications',
                              'Profile Tab: Documents & Digital Attachments',
                              'Profile Tab: System Logins & Credentials',
                              'Profile Tab: Profile Notes & Activity Timeline',
                              'Profile Tab: More: Assets & Equipment Custody',
                              'Profile Tab: More: Benefits & Insurance',
                              'Profile Tab: More: Onboarding Checklist',
                              'Profile Tab: More: Offboarding & Clearances'
                            ]
                          },
                          {
                            groupId: 'attendance',
                            titleAr: 'الحضور والورديات والإجازات (Attendance, Shifts & Leaves)',
                            parentTab: 'Attendance',
                            subTabs: [
                              'Attendance Hub & Clock In Terminal',
                              'Daily Attendance Logs & Clock Punches',
                              'Shift Schedules & Rosters Overview',
                              'Shift Configuration & Timings Setup',
                              'Shift Rotation Matrix & Patterns',
                              'Break Shifts & Time Tracking',
                              'Leave Requests, Approvals & Accrual Balances',
                              'Shift Swaps & Colleague Cover Requests',
                              'Attendance Reports & Audit Analytics'
                            ]
                          },
                          {
                            groupId: 'recruitment',
                            titleAr: 'إدارة التوظيف واستقطاب الكفاءات (Hiring & Recruitment)',
                            parentTab: 'Hiring',
                            subTabs: ['Candidates Pipeline', 'Job Openings', 'Interviews & Scorecards']
                          },
                          {
                            groupId: 'departments',
                            titleAr: 'إدارة الأقسام (Departments)',
                            parentTab: 'Departments',
                            subTabs: []
                          },
                          {
                            groupId: 'orgchart',
                            titleAr: 'الهيكل التنظيمي (Org Chart)',
                            parentTab: 'Org Chart',
                            subTabs: []
                          },
                          {
                            groupId: 'payroll',
                            titleAr: 'الرواتب والمسيرات والمزايا (Payroll & Benefits)',
                            parentTab: 'Payroll & Salaries',
                            subTabs: ['Benefits & Allowances']
                          },
                          {
                            groupId: 'performance',
                            titleAr: 'الأداء والإنضباط والشكاوى (Performance & Discipline)',
                            parentTab: 'Performance & OKRs',
                            subTabs: ['Complaints & Grievances']
                          },
                          {
                            groupId: 'services',
                            titleAr: 'خدمات وأصول الموظف (Assets & Onboarding)',
                            parentTab: 'Assets Management',
                            subTabs: ['Onboarding & Offboarding']
                          }
                        ];

                        const allTabsInModule = getModuleTabs(selectedRBACModule!, systemModules);
                        const filteredTabs = allTabsInModule.filter(t => (t || '').toLowerCase().includes((matrixSearch || '').toLowerCase()));

                        // Collect set of all categorized tabs for dynamic sync fallback
                        const categorizedTabNames = new Set<string>();
                        hrDomainGroups.forEach(g => {
                          if (g.parentTab) categorizedTabNames.add(g.parentTab.toLowerCase());
                          g.subTabs.forEach(st => { if (st) categorizedTabNames.add(st.toLowerCase()); });
                        });
                        const extraDynamicTabs = filteredTabs.filter(t => t && !categorizedTabNames.has(t.toLowerCase()));

                        if (!isHrModule) {
                          // Generic Module Tree Rendering
                          return (
                            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                              {filteredTabs.map(tabName => {
                                const isVisible = getTabActionValue(selectedRBACModule, tabName, 'tabs');
                                const currentLevel = getTabLevel(selectedRBACModule, tabName);
                                const currentScope = getTabDataScope(selectedRBACModule, tabName);

                                return (
                                  <div key={tabName} className={cn("p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/60", !isVisible && "bg-slate-50/40 opacity-60")}>
                                    <div className="flex items-center gap-3">
                                      <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0">
                                        <input
                                          type="checkbox"
                                          checked={isVisible}
                                          disabled={selectedRole?.name === 'Admin'}
                                          onChange={(e) => handleToggleTabVisibilityWithCascade(selectedRBACModule!, tabName, e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                      </label>
                                      <div>
                                        <span className="text-xs font-black text-slate-900 block">{tabName}</span>
                                        <span className="text-[10px] text-slate-500 font-medium">الشاشة الأساسية / Master Tab</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                      <select
                                        value={currentLevel}
                                        disabled={selectedRole?.name === 'Admin' || !isVisible}
                                        onChange={(e) => updateTabLevel(selectedRBACModule!, tabName, parseInt(e.target.value))}
                                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-800"
                                      >
                                        <option value="0">Default (تلقائي)</option>
                                        <option value="1">Editable (تعديل)</option>
                                        <option value="2">Read-Only (قراءة)</option>
                                        <option value="3">Hidden (مخفي)</option>
                                      </select>

                                      <select
                                        value={currentScope}
                                        disabled={selectedRole?.name === 'Admin' || !isVisible}
                                        onChange={(e) => updateTabDataScope(selectedRBACModule!, tabName, e.target.value)}
                                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-800"
                                      >
                                        <option value="own">own only / خاص بي</option>
                                        <option value="team">Team only / فريقي</option>
                                        <option value="department">department only / القسم</option>
                                        <option value="global">company / all / الكل</option>
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRbacDrawerTab(tabName);
                                          setRbacTabDrawerOpen(true);
                                        }}
                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                                      >
                                        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>⚙️ تخصيص الإجراءات والحقول (Advanced Rules)</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        // Structured HR Module Hierarchical Accordion Groups
                        return (
                          <div className="space-y-4">
                            {hrDomainGroups.map(group => {
                              const parentIsVisible = getTabActionValue('HR', group.parentTab, 'tabs');
                              const parentLevel = getTabLevel('HR', group.parentTab);
                              const parentScope = getTabDataScope('HR', group.parentTab);

                              return (
                                <div key={group.groupId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                                  {/* PARENT TAB HEADER ROW */}
                                  <div className={cn(
                                    "p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors",
                                    !parentIsVisible && "bg-slate-100/60 opacity-60"
                                  )}>
                                    <div className="flex items-center gap-3">
                                      <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0">
                                        <input
                                          type="checkbox"
                                          checked={parentIsVisible}
                                          disabled={selectedRole?.name === 'Admin'}
                                          onChange={(e) => handleToggleTabVisibilityWithCascade('HR', group.parentTab, e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
                                      </label>

                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-sm font-black text-slate-900">{group.parentTab}</h4>
                                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black dir-rtl">
                                            {group.titleAr}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold mt-0.5 dir-rtl">
                                          التاب الأب الماستر (Parent Module Tab)
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                      <select
                                        value={parentLevel}
                                        disabled={selectedRole?.name === 'Admin' || !parentIsVisible}
                                        onChange={(e) => updateTabLevel('HR', group.parentTab, parseInt(e.target.value))}
                                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-800"
                                      >
                                        <option value="0">Default (تلقائي)</option>
                                        <option value="1">Editable (تعديل)</option>
                                        <option value="2">Read-Only (قراءة)</option>
                                        <option value="3">Hidden (مخفي)</option>
                                      </select>

                                      <select
                                        value={parentScope}
                                        disabled={selectedRole?.name === 'Admin' || !parentIsVisible}
                                        onChange={(e) => updateTabDataScope('HR', group.parentTab, e.target.value)}
                                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none text-slate-800"
                                      >
                                        <option value="own">own only / خاص بي</option>
                                        <option value="team">Team only / فريقي</option>
                                        <option value="department">department only / القسم</option>
                                        <option value="global">company / all / الكل</option>
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRbacDrawerTab(group.parentTab);
                                          setRbacTabDrawerOpen(true);
                                        }}
                                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                      >
                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                        <span>⚙️ تخصيص الإجراءات والحقول (Advanced Rules)</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* SUB-TABS INDENTED TREE ROWS */}
                                  <div className="divide-y divide-slate-100 bg-white">
                                    {group.subTabs.map(subTabName => {
                                      const subIsVisible = getTabActionValue('HR', subTabName, 'tabs');
                                      const subLevel = getTabLevel('HR', subTabName);
                                      const subScope = getTabDataScope('HR', subTabName);

                                      return (
                                        <div 
                                          key={subTabName}
                                          className={cn(
                                            "p-3.5 pl-8 md:pl-12 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80",
                                            !subIsVisible && "bg-slate-50/50 opacity-50"
                                          )}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="text-slate-400 font-mono text-sm font-bold shrink-0">└─</span>
                                            <label className="relative inline-flex items-center cursor-pointer scale-75 shrink-0">
                                              <input
                                                type="checkbox"
                                                checked={subIsVisible}
                                                disabled={selectedRole?.name === 'Admin'}
                                                onChange={(e) => handleToggleTabVisibilityWithCascade('HR', subTabName, e.target.checked)}
                                                className="sr-only peer"
                                              />
                                              <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                                            </label>

                                            <div>
                                              <span className="text-xs font-black text-slate-800 block">{subTabName}</span>
                                              <span className="text-[10px] text-slate-400 font-bold">تاب فرعي • Sub-Tab</span>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2.5 flex-wrap">
                                            <select
                                              value={subLevel}
                                              disabled={selectedRole?.name === 'Admin' || !subIsVisible}
                                              onChange={(e) => updateTabLevel('HR', subTabName, parseInt(e.target.value))}
                                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 outline-none"
                                            >
                                              <option value="0">Default (تلقائي)</option>
                                              <option value="1">Editable (تعديل)</option>
                                              <option value="2">Read-Only (قراءة)</option>
                                              <option value="3">Hidden (مخفي)</option>
                                            </select>

                                            <select
                                              value={subScope}
                                              disabled={selectedRole?.name === 'Admin' || !subIsVisible}
                                              onChange={(e) => updateTabDataScope('HR', subTabName, e.target.value)}
                                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-extrabold text-slate-800 outline-none"
                                            >
                                              <option value="own">own only / خاص بي</option>
                                              <option value="team">Team only / فريقي</option>
                                              <option value="department">department only / القسم</option>
                                              <option value="global">company / all / الكل</option>
                                            </select>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setRbacDrawerTab(subTabName);
                                                setRbacTabDrawerOpen(true);
                                              }}
                                              className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                                            >
                                              <SlidersHorizontal className="w-3 h-3" />
                                              <span>⚙️ تخصيص (Rules)</span>
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}

                            {extraDynamicTabs.map(tabName => {
                              const isVisible = getTabActionValue('HR', tabName, 'tabs');
                              const currentLevel = getTabLevel('HR', tabName);
                              const currentScope = getTabDataScope('HR', tabName);

                              return (
                                <div key={tabName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                                  <div className={cn(
                                    "p-4 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors",
                                    !isVisible && "bg-slate-100/60 opacity-60"
                                  )}>
                                    <div className="flex items-center gap-3">
                                      <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0">
                                        <input
                                          type="checkbox"
                                          checked={isVisible}
                                          disabled={selectedRole?.name === 'Admin'}
                                          onChange={(e) => handleToggleTabVisibilityWithCascade('HR', tabName, e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
                                      </label>

                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-sm font-black text-slate-900">{tabName}</h4>
                                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black dir-rtl">
                                            تاب موديول (Parent Module Tab)
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold mt-0.5 dir-rtl">
                                          التاب الأب الماستر (Parent Module Tab)
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                      <select
                                        value={currentLevel}
                                        disabled={selectedRole?.name === 'Admin' || !isVisible}
                                        onChange={(e) => updateTabLevel('HR', tabName, parseInt(e.target.value))}
                                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-800"
                                      >
                                        <option value="0">Default (تلقائي)</option>
                                        <option value="1">Editable (تعديل)</option>
                                        <option value="2">Read-Only (قراءة)</option>
                                        <option value="3">Hidden (مخفي)</option>
                                      </select>

                                      <select
                                        value={currentScope}
                                        disabled={selectedRole?.name === 'Admin' || !isVisible}
                                        onChange={(e) => updateTabDataScope('HR', tabName, e.target.value)}
                                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none text-slate-800"
                                      >
                                        <option value="own">own only / خاص بي</option>
                                        <option value="team">Team only / فريقي</option>
                                        <option value="department">department only / القسم</option>
                                        <option value="global">company / all / الكل</option>
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRbacDrawerTab(tabName);
                                          setRbacTabDrawerOpen(true);
                                        }}
                                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                      >
                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                        <span>⚙️ تخصيص الإجراءات والحقول (Advanced Rules)</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* MODE 3: PRESETS QUICK VIEW */}
                  {rbacMatrixMainTab === 'presets' && (
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-md space-y-4 my-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
                              قوالب أدوار النظام الجاهزة (System Role Presets)
                            </h3>
                            <p className="text-xs text-slate-300 font-medium mt-0.5" dir="rtl">
                              تطبيق القالب يخيّر مصفوفة الشاشات والإجراءات والحقول فوراً لتناسب الدور المطلوب
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPresetsModalOpen(true)}
                          className="text-xs font-black text-indigo-300 hover:text-white underline cursor-pointer shrink-0"
                        >
                          استعراض القوالب المتقدمة ➔
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {SYSTEM_ROLE_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            disabled={selectedRole?.name === 'Admin'}
                            onClick={() => handleApplySystemRolePreset(preset.id, false)}
                            className="p-4 bg-white/10 hover:bg-indigo-600 active:bg-indigo-700 border border-white/15 hover:border-indigo-400/50 rounded-2xl text-left transition-all flex items-start gap-3 disabled:opacity-40 cursor-pointer group"
                          >
                            <span className="text-2xl shrink-0 p-2 bg-white/10 rounded-xl">{preset.icon}</span>
                            <div>
                              <div className="text-slate-100 group-hover:text-white font-black text-xs dir-rtl">{preset.nameAr}</div>
                              <div className="text-[10px] text-indigo-200 font-bold">{preset.nameEn}</div>
                              <p className="text-[10px] text-slate-300 font-medium mt-1 line-clamp-2 dir-rtl">{preset.descriptionAr}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MODE 2 OR DETAILED ACTIONS & FIELDS PANEL */}
                  {rbacMatrixMainTab === 'actions_fields' && (
                    /* Sensitive Custom Actions & Field Visibility ("What Can Do" & "What Can See") */
                  <div className="pt-8 border-t border-slate-200 space-y-6">
                    {/* Header with Title and Step Switcher */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-5 h-5 text-emerald-800" />
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                            صلاحيات الـ Action والـ Field الحساسة (Module Custom Actions & Field Visibility)
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          تخصيص الإجراءات المسموحة (Actions) وحقول الرؤية (Visibility) لهذا الدور في موديول {selectedRBACModule || 'النظام'}
                        </p>
                      </div>

                      {/* Step Switcher Pills */}
                      <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1 shrink-0 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setRbacAccessViewTab('do')}
                          className={cn(
                            "flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                            rbacAccessViewTab === 'do' 
                              ? "bg-emerald-800 text-white shadow-xs" 
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                          )}
                        >
                          <span className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0",
                            rbacAccessViewTab === 'do' ? "bg-white text-emerald-900" : "bg-slate-200 text-slate-700"
                          )}>
                            1
                          </span>
                          <span>What this Access Level Can Do</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRbacAccessViewTab('see')}
                          className={cn(
                            "flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                            rbacAccessViewTab === 'see' 
                              ? "bg-emerald-800 text-white shadow-xs" 
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                          )}
                        >
                          <span className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0",
                            rbacAccessViewTab === 'see' ? "bg-white text-emerald-900" : "bg-slate-200 text-slate-700"
                          )}>
                            2
                          </span>
                          <span>What this Access Level Can See</span>
                        </button>
                      </div>
                    </div>

                    {/* TAB 1: WHAT CAN PEOPLE WITH THIS ACCESS LEVEL DO */}
                    {rbacAccessViewTab === 'do' && (
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
                        <div>
                          <h2 className="text-lg font-bold font-serif text-emerald-950">
                            What Can People with this Access Level Do?
                          </h2>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Select an area to customise access.
                          </p>
                        </div>

                        <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row gap-6">
                          {/* Left Sidebar of Module Tabs */}
                          <div className="w-full md:w-64 space-y-1 shrink-0 border-r border-slate-100 pr-4">
                            {HR_MODULE_TABS.map(tab => {
                              const Icon = tab.icon;
                              const isSelected = rbacActiveModuleTab === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => setRbacActiveModuleTab(tab.id)}
                                  className={cn(
                                    "w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer",
                                    isSelected 
                                      ? "bg-emerald-100/80 text-emerald-950 font-black shadow-2xs" 
                                      : "text-slate-600 hover:bg-slate-100"
                                  )}
                                >
                                  <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-emerald-800" : "text-slate-400")} />
                                  <span className="truncate">{tab.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Right Panel Permission Checkboxes */}
                          <div className="flex-1 space-y-6">
                            {(() => {
                              const currentTabObj = HR_MODULE_TABS.find(t => t.id === rbacActiveModuleTab) || HR_MODULE_TABS[0];
                              const canon = selectedRBACModule === 'HR' || selectedRBACModule === 'HR Management' ? 'HR' : (selectedRBACModule || 'HR');
                              const customActionsState = selectedRole?.permissions?.[canon]?.custom_actions || {};

                              return (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <h3 className="text-sm font-black text-slate-900">{currentTabObj.label} Permissions</h3>
                                    <button
                                      type="button"
                                      disabled={selectedRole?.name === 'Admin'}
                                      onClick={() => {
                                        if (selectedRole?.name === 'Admin') return;
                                        const allChecked = currentTabObj.actions.every(a => !!customActionsState[a.id]);
                                        currentTabObj.actions.forEach(a => {
                                          handleToggleCustomAction(selectedRBACModule || 'HR', a.id, !allChecked);
                                        });
                                      }}
                                      className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer disabled:opacity-50"
                                    >
                                      Toggle All in {currentTabObj.label}
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    {currentTabObj.actions.map(act => {
                                      const isChecked = !!customActionsState[act.id];
                                      return (
                                        <label
                                          key={act.id}
                                          className={cn(
                                            "flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer",
                                            isChecked 
                                              ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 font-bold" 
                                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                          )}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            disabled={selectedRole?.name === 'Admin'}
                                            onChange={(e) => {
                                              if (selectedRole?.name !== 'Admin') {
                                                handleToggleCustomAction(selectedRBACModule || 'HR', act.id, e.target.checked);
                                              }
                                            }}
                                            className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-800 cursor-pointer w-4 h-4"
                                          />
                                          <span className="text-xs font-semibold leading-snug">{act.label}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: WHAT CAN PEOPLE WITH THIS ACCESS LEVEL SEE */}
                    {rbacAccessViewTab === 'see' && (
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
                        <div>
                          <h2 className="text-lg font-bold font-serif text-emerald-950">
                            What Can People with this Access Level See?
                          </h2>
                        </div>

                        {/* Top 3 Perspective Options */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div
                            onClick={() => setRbacSeePerspective('others')}
                            className={cn(
                              "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                              rbacSeePerspective === 'others' 
                                ? "bg-white border-emerald-800 shadow-md ring-2 ring-emerald-800/20" 
                                : "bg-slate-50 border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <Users className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-black text-emerald-950">See About Other Employees</h4>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Choose what people with this Access Level will see about other employees.
                              </p>
                            </div>
                          </div>

                          <div
                            onClick={() => setRbacSeePerspective('self')}
                            className={cn(
                              "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                              rbacSeePerspective === 'self' 
                                ? "bg-white border-emerald-800 shadow-md ring-2 ring-emerald-800/20" 
                                : "bg-slate-50 border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <User className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-black text-slate-900">See About Themselves</h4>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Choose what people with this Access Level will see about themselves.
                              </p>
                            </div>
                          </div>

                          <div
                            onClick={() => setRbacSeePerspective('home')}
                            className={cn(
                              "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                              rbacSeePerspective === 'home' 
                                ? "bg-white border-emerald-800 shadow-md ring-2 ring-emerald-800/20" 
                                : "bg-slate-50 border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <Building2 className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-black text-slate-900">See on Home</h4>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Choose what should show on Home for people with this Access Level.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* PERSPECTIVE 1: SEE ABOUT OTHER EMPLOYEES */}
                        {rbacSeePerspective === 'others' && (
                          <div className="space-y-6">
                            {/* Scope Selector Banner, Main Module & Form Dropdowns */}
                            {(() => {
                              const activeMainModule = HR_MAIN_MODULE_CONFIGS.find(m => m.id === rbacSeeMainModule) || HR_MAIN_MODULE_CONFIGS[0];
                              const activeSubtab = activeMainModule.subtabs.find(s => s.id === rbacSeeSubtab) || activeMainModule.subtabs[0];

                              return (
                                <>
                                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-slate-700">
                                      <Lock className="w-4 h-4 text-emerald-800 shrink-0" />
                                      <span>This Access Level can access the information below for</span>
                                      <select
                                        value={rbacSeeScope}
                                        disabled={selectedRole?.name === 'Admin'}
                                        onChange={(e) => {
                                          setRbacSeeScope(e.target.value);
                                          if (selectedRole?.name !== 'Admin') {
                                            handleUpdateDataScope(selectedRBACModule || 'HR', 'see_scope', e.target.value as any);
                                          }
                                        }}
                                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 cursor-pointer shadow-2xs"
                                      >
                                        <option value="all">All Employees</option>
                                        <option value="department">Same Department</option>
                                        <option value="direct_reports">Direct Reports Only</option>
                                        <option value="self">Self Only</option>
                                      </select>
                                    </div>

                                    {/* Selectors for Main Module & Form / Tab */}
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-700">
                                      {/* Main Module Dropdown */}
                                      <div className="flex items-center gap-1.5">
                                        <span className="shrink-0 font-medium text-slate-500">Module:</span>
                                        <select
                                          value={activeMainModule.id}
                                          onChange={(e) => {
                                            const newModId = e.target.value;
                                            setRbacSeeMainModule(newModId);
                                            const targetMod = HR_MAIN_MODULE_CONFIGS.find(m => m.id === newModId);
                                            if (targetMod && targetMod.subtabs.length > 0) {
                                              setRbacSeeSubtab(targetMod.subtabs[0].id);
                                            }
                                          }}
                                          className="bg-white text-emerald-950 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-800 cursor-pointer shadow-2xs"
                                        >
                                          {HR_MAIN_MODULE_CONFIGS.map(m => (
                                            <option key={m.id} value={m.id}>
                                              {m.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Subtab / Form Dropdown */}
                                      <div className="flex items-center gap-1.5">
                                        <span className="shrink-0 font-medium text-slate-500">Select Form / Tab:</span>
                                        <select
                                          value={activeSubtab.id}
                                          onChange={(e) => setRbacSeeSubtab(e.target.value)}
                                          className="bg-emerald-800 text-white border border-emerald-900 rounded-xl px-3 py-1.5 text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-950 cursor-pointer shadow-2xs"
                                        >
                                          {activeMainModule.subtabs.map(st => (
                                            <option key={st.id} value={st.id} className="bg-white text-slate-900 font-medium">
                                              {st.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Horizontal Subtabs Bar */}
                                  <div className="border-b border-slate-200 overflow-x-auto scrollbar-none flex items-center gap-1 pb-1">
                                    {activeMainModule.subtabs.map(st => (
                                      <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => setRbacSeeSubtab(st.id)}
                                        className={cn(
                                          "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                                          activeSubtab.id === st.id 
                                            ? "bg-emerald-800 text-white font-black shadow-xs" 
                                            : "text-slate-600 hover:bg-slate-100"
                                        )}
                                      >
                                        {st.label}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Active Form Section and Field-Level Tree View */}
                                  {(() => {
                                    const currentForm = activeSubtab;
                                    const FormIcon = currentForm.icon || Folder;
                                    const canon = selectedRBACModule === 'HR' || selectedRBACModule === 'HR Management' ? 'HR' : (selectedRBACModule || 'HR');
                                    const seePermsState = (selectedRole?.permissions?.[canon] as any)?.see_permissions || {};

                                    return (
                                      <div className="space-y-4 pt-1">
                                  {/* Form Header */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
                                        <FormIcon className="w-4 h-4 stroke-[2.5]" />
                                      </div>
                                      <div>
                                        <h3 className="text-base font-black text-emerald-950 font-serif">
                                          {currentForm.label}
                                        </h3>
                                        <p className="text-[11px] text-slate-500 font-medium">
                                          Set all fields to No Access to hide the {currentForm.label} tab
                                        </p>
                                      </div>
                                    </div>

                                    {/* Quick Bulk Dropdown for Form */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-500 font-medium">Bulk set all fields:</span>
                                      <select
                                        disabled={selectedRole?.name === 'Admin'}
                                        onChange={(e) => {
                                          if (!e.target.value || selectedRole?.name === 'Admin') return;
                                          const val = e.target.value as 'no' | 'view' | 'full';
                                          const keysToSet: string[] = [];
                                          currentForm.sections.forEach(sec => {
                                            keysToSet.push(sec.key);
                                            sec.fieldsList.forEach(f => {
                                              const safeF = (f || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
                                              const fKey = `${sec.key}_${safeF}`;
                                              const normF = safeF;
                                              keysToSet.push(fKey);
                                              keysToSet.push(normF);
                                              keysToSet.push(f);
                                            });
                                          });
                                          handleBulkSetSeePermissions(selectedRBACModule || 'HR', keysToSet, val);
                                        }}
                                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 cursor-pointer shadow-2xs"
                                      >
                                        <option value="">All Fields are set...</option>
                                        <option value="no">🔒 Set all fields to No Access</option>
                                        <option value="view">👁️ Set all fields to View Only</option>
                                        <option value="full">✏️ Set all fields to Full Access</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Sections Tree */}
                                  <div className="space-y-4">
                                    {currentForm.sections.map(sec => {
                                      const isCollapsed = !!collapsedSections[sec.key];
                                      const sectionVal = seePermsState[sec.key] || 'full';

                                      return (
                                        <div key={sec.key} className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
                                          {/* Collapsible Section Header */}
                                          <div 
                                            className="flex items-center justify-between p-3.5 bg-slate-50/90 hover:bg-slate-100/80 transition-colors border-b border-slate-200/70 cursor-pointer"
                                            onClick={() => toggleSectionCollapse(sec.key)}
                                          >
                                            <div className="flex items-center gap-2">
                                              <button type="button" className="text-emerald-800 font-black p-0.5">
                                                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                              </button>
                                              <span className="text-xs font-black text-slate-900 font-serif tracking-wide">
                                                {sec.label}
                                              </span>
                                              <span className="text-[11px] text-slate-400 font-normal">
                                                ({sec.fieldsList.length} fields)
                                              </span>
                                            </div>

                                            {/* Section Level Controls */}
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                              <span className={cn(
                                                "text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all",
                                                sectionVal === 'no' && "bg-rose-100 text-rose-800 border border-rose-200",
                                                sectionVal === 'view' && "bg-blue-100 text-blue-800 border border-blue-200",
                                                sectionVal === 'full' && "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                              )}>
                                                {sectionVal === 'no' && <Lock className="w-3 h-3" />}
                                                {sectionVal === 'view' && <Eye className="w-3 h-3" />}
                                                {sectionVal === 'full' && <Edit2 className="w-3 h-3" />}
                                                {sectionVal === 'no' ? 'No Access' : sectionVal === 'view' ? 'View Only' : 'Full Access'}
                                              </span>

                                              {/* Section 3-State Quick Set Buttons */}
                                              <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-xl gap-0.5 shadow-2xs">
                                                <button
                                                  type="button"
                                                  title="Set Section to No Access (إخفاء القسم)"
                                                  disabled={selectedRole?.name === 'Admin'}
                                                  onClick={() => {
                                                    const keysToSet = [
                                                      sec.key, 
                                                      ...sec.fieldsList.flatMap(f => {
                                                        const safeF = (f || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
                                                        return [`${sec.key}_${safeF}`, safeF, f];
                                                      })
                                                    ];
                                                    handleBulkSetSeePermissions(selectedRBACModule || 'HR', keysToSet, 'no');
                                                  }}
                                                  className={cn(
                                                    "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                                                    sectionVal === 'no' ? "bg-rose-600 text-white shadow-xs" : "text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                                                  )}
                                                >
                                                  <Lock className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                  type="button"
                                                  title="Set Section to View Only (قراءة فقط)"
                                                  disabled={selectedRole?.name === 'Admin'}
                                                  onClick={() => {
                                                    const keysToSet = [
                                                      sec.key, 
                                                      ...sec.fieldsList.flatMap(f => {
                                                        const safeF = (f || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
                                                        return [`${sec.key}_${safeF}`, safeF, f];
                                                      })
                                                    ];
                                                    handleBulkSetSeePermissions(selectedRBACModule || 'HR', keysToSet, 'view');
                                                  }}
                                                  className={cn(
                                                    "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                                                    sectionVal === 'view' ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                                                  )}
                                                >
                                                  <Eye className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                  type="button"
                                                  title="Set Section to Full Access (تعديل كامل)"
                                                  disabled={selectedRole?.name === 'Admin'}
                                                  onClick={() => {
                                                    const keysToSet = [
                                                      sec.key, 
                                                      ...sec.fieldsList.flatMap(f => {
                                                        const safeF = (f || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
                                                        return [`${sec.key}_${safeF}`, safeF, f];
                                                      })
                                                    ];
                                                    handleBulkSetSeePermissions(selectedRBACModule || 'HR', keysToSet, 'full');
                                                  }}
                                                  className={cn(
                                                    "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                                                    sectionVal === 'full' ? "bg-emerald-800 text-white shadow-xs" : "text-slate-400 hover:text-emerald-800 hover:bg-slate-100"
                                                  )}
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Section Fields List */}
                                          {!isCollapsed && (
                                            <div className="divide-y divide-slate-100/80 bg-white">
                                              {sec.fieldsList.map(fieldName => {
                                                const safeF = (fieldName || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
                                                const fieldKey = `${sec.key}_${safeF}`;
                                                const normKey = safeF;
                                                const fieldVal = seePermsState[fieldKey] || seePermsState[normKey] || seePermsState[fieldName] || sectionVal || 'full';

                                                return (
                                                  <div 
                                                    key={fieldName}
                                                    className={cn(
                                                      "flex items-center justify-between py-2.5 px-4 pl-9 transition-colors group hover:bg-amber-50/30",
                                                      fieldVal === 'no' && "bg-slate-50/60",
                                                      fieldVal === 'view' && "bg-blue-50/20",
                                                      fieldVal === 'full' && "bg-emerald-50/20"
                                                    )}
                                                  >
                                                    <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 flex items-center gap-2">
                                                      <span>{fieldName}</span>
                                                      {fieldVal === 'no' && (
                                                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Hidden / مخفي</span>
                                                      )}
                                                      {fieldVal === 'view' && (
                                                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">View Only / مقفول للتعديل</span>
                                                      )}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                      {/* Status Badge */}
                                                      <span className={cn(
                                                        "text-[11px] font-bold flex items-center gap-1 px-2.5 py-0.5 rounded-md transition-all shadow-2xs",
                                                        fieldVal === 'no' && "text-rose-700 bg-rose-50 border border-rose-200",
                                                        fieldVal === 'view' && "text-blue-700 bg-blue-50 border border-blue-200",
                                                        fieldVal === 'full' && "text-emerald-800 bg-emerald-50 border border-emerald-200"
                                                      )}>
                                                        {fieldVal === 'no' && <Lock className="w-3 h-3 text-rose-600" />}
                                                        {fieldVal === 'view' && <Eye className="w-3 h-3 text-blue-600" />}
                                                        {fieldVal === 'full' && <Edit2 className="w-3 h-3 text-emerald-800" />}
                                                        {fieldVal === 'no' ? 'No Access' : fieldVal === 'view' ? 'View Only' : 'Full Access'}
                                                      </span>

                                                      {/* Green Hover Pill Controls matching reference screenshot */}
                                                      <div className="flex items-center bg-emerald-900 text-white p-0.5 rounded-full shadow-xs gap-0.5">
                                                        <button
                                                          type="button"
                                                          title="No Access (إخفاء الحقل)"
                                                          disabled={selectedRole?.name === 'Admin'}
                                                          onClick={() => handleBulkSetSeePermissions(selectedRBACModule || 'HR', [fieldKey, normKey, fieldName], 'no')}
                                                          className={cn(
                                                            "w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                                            fieldVal === 'no' 
                                                              ? "bg-rose-600 text-white shadow-sm ring-2 ring-white/60 scale-105" 
                                                              : "text-emerald-200 hover:text-white hover:bg-emerald-700/60"
                                                          )}
                                                        >
                                                          <Lock className="w-3 h-3" />
                                                        </button>

                                                        <button
                                                          type="button"
                                                          title="View Only (قراءة فقط بدون تعديل)"
                                                          disabled={selectedRole?.name === 'Admin'}
                                                          onClick={() => handleBulkSetSeePermissions(selectedRBACModule || 'HR', [fieldKey, normKey, fieldName], 'view')}
                                                          className={cn(
                                                            "w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                                            fieldVal === 'view' 
                                                              ? "bg-blue-600 text-white shadow-sm ring-2 ring-white/60 scale-105" 
                                                              : "text-emerald-200 hover:text-white hover:bg-emerald-700/60"
                                                          )}
                                                        >
                                                          <Eye className="w-3 h-3" />
                                                        </button>

                                                        <button
                                                          type="button"
                                                          title="Full Access (تعديل كامل)"
                                                          disabled={selectedRole?.name === 'Admin'}
                                                          onClick={() => handleBulkSetSeePermissions(selectedRBACModule || 'HR', [fieldKey, normKey, fieldName], 'full')}
                                                          className={cn(
                                                            "w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                                            fieldVal === 'full' 
                                                              ? "bg-emerald-950 text-white shadow-sm ring-2 ring-white/60 scale-105" 
                                                              : "text-emerald-200 hover:text-white hover:bg-emerald-700/60"
                                                          )}
                                                        >
                                                          <Edit2 className="w-3 h-3" />
                                                        </button>
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
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                          </div>
                        )}

                        {/* PERSPECTIVE 2: SEE ABOUT THEMSELVES */}
                        {rbacSeePerspective === 'self' && (
                          <div className="space-y-6 pt-2">
                            <div className="space-y-3">
                              <h3 className="text-sm font-black text-slate-900">
                                Should Employees be able to see their own information?
                              </h3>

                              {(() => {
                                const canon = selectedRBACModule === 'HR' || selectedRBACModule === 'HR Management' ? 'HR' : (selectedRBACModule || 'HR');
                                const selfAccess = (selectedRole?.permissions?.[canon] as any)?.self_access || { allow: true, level: 'Employees' };
                                const allowSelf = selfAccess.allow !== false;
                                const selfLevel = selfAccess.level || 'Employees';

                                return (
                                  <div className="space-y-5">
                                    <div className="space-y-2">
                                      <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                          type="radio"
                                          name="allowSelfAccess"
                                          checked={allowSelf}
                                          disabled={selectedRole?.name === 'Admin'}
                                          onChange={() => handleSetSelfAccess(selectedRBACModule || 'HR', true, selfLevel)}
                                          className="w-4 h-4 text-emerald-800 accent-emerald-800 focus:ring-emerald-800 cursor-pointer"
                                        />
                                        <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                                          Yes, Allow Access
                                        </span>
                                      </label>

                                      <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                          type="radio"
                                          name="allowSelfAccess"
                                          checked={!allowSelf}
                                          disabled={selectedRole?.name === 'Admin'}
                                          onChange={() => handleSetSelfAccess(selectedRBACModule || 'HR', false, selfLevel)}
                                          className="w-4 h-4 text-emerald-800 accent-emerald-800 focus:ring-emerald-800 cursor-pointer"
                                        />
                                        <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                                          No, Hide the My Info Section
                                        </span>
                                      </label>
                                    </div>

                                    {allowSelf && (
                                      <div className="space-y-2 pt-2 border-t border-slate-100 max-w-xs">
                                        <label className="block text-xs font-bold text-slate-700">
                                          Which Access Level should apply?
                                        </label>
                                        <select
                                          value={selfLevel}
                                          disabled={selectedRole?.name === 'Admin'}
                                          onChange={(e) => handleSetSelfAccess(selectedRBACModule || 'HR', true, e.target.value)}
                                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 cursor-pointer shadow-2xs"
                                        >
                                          <option value="Employees">Employees</option>
                                          <option value="Managers">Managers</option>
                                          <option value="Full Admin">Full Admin</option>
                                          <option value="Self Access Level">Self Access Level</option>
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* PERSPECTIVE 3: SEE ON HOME */}
                        {rbacSeePerspective === 'home' && (
                          <div className="space-y-8 pt-2">
                            {/* STEP 1: Choose which widgets show on Home */}
                            <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-black flex items-center justify-center shadow-xs">1</span>
                                  <h3 className="text-sm font-black text-slate-900">
                                    Choose which widgets show on Home:
                                  </h3>
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 1 • Main Widgets</span>
                              </div>

                              {(() => {
                                const canon = selectedRBACModule === 'HR' || selectedRBACModule === 'HR Management' ? 'HR' : (selectedRBACModule || 'HR');
                                const homeWidgets = (selectedRole?.permissions?.[canon] as any)?.home_widgets || {
                                  celebrations: { enabled: true, mode: 'Anniversaries & Birthdays' },
                                  announcements: { enabled: true, mode: 'View Only' },
                                  links: { enabled: true, mode: 'View Only' },
                                  welcome_new_hires: { enabled: true },
                                  whos_out: { enabled: true },
                                };

                                const widgetsList = [
                                  {
                                    id: 'celebrations',
                                    label: 'Celebrations',
                                    icon: Sparkles,
                                    options: ['Anniversaries & Birthdays', 'Birthdays Only', 'View Only'],
                                  },
                                  {
                                    id: 'announcements',
                                    label: 'Announcements',
                                    icon: Megaphone,
                                    options: ['View Only', 'Edit'],
                                  },
                                  {
                                    id: 'links',
                                    label: 'Links',
                                    icon: Link2,
                                    options: ['View Only', 'Edit'],
                                  },
                                  {
                                    id: 'welcome_new_hires',
                                    label: 'Welcome New Hires',
                                    icon: UserCheck,
                                    options: null,
                                  },
                                  {
                                    id: 'whos_out',
                                    label: 'Who\'s out',
                                    icon: Calendar,
                                    options: null,
                                  },
                                ];

                                return (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                      {widgetsList.map((w) => {
                                        const Icon = w.icon;
                                        const wConfig = homeWidgets[w.id] || { enabled: true };
                                        const isChecked = wConfig.enabled !== false;
                                        const currentMode = wConfig.mode || (w.options ? w.options[0] : '');

                                        return (
                                          <div key={w.id} className="space-y-2">
                                            <div
                                              onClick={() => {
                                                if (selectedRole?.name !== 'Admin') {
                                                  handleToggleHomeWidget(selectedRBACModule || 'HR', w.id, !isChecked);
                                                }
                                              }}
                                              className={cn(
                                                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between h-32 relative bg-white",
                                                isChecked 
                                                  ? "border-emerald-800 shadow-xs ring-1 ring-emerald-800/10" 
                                                  : "border-slate-200 opacity-60 hover:opacity-100"
                                              )}
                                            >
                                              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                                                <Icon className="w-5 h-5" />
                                              </div>

                                              <div className="flex items-center justify-between mt-auto">
                                                <span className="text-xs font-black text-slate-800">{w.label}</span>
                                                <div className={cn(
                                                  "w-5 h-5 rounded-md flex items-center justify-center transition-colors border",
                                                  isChecked ? "bg-emerald-800 border-emerald-800 text-white" : "border-slate-300 bg-white"
                                                )}>
                                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Dropdown if widget has sub-options and is enabled */}
                                            {w.options && isChecked && (
                                              <div>
                                                <select
                                                  value={currentMode}
                                                  disabled={selectedRole?.name === 'Admin'}
                                                  onChange={(e) => handleSetHomeWidgetMode(selectedRBACModule || 'HR', w.id, e.target.value)}
                                                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-800 cursor-pointer shadow-2xs"
                                                >
                                                  {w.options.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                  ))}
                                                </select>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-500">
                                      Pssst... the Benefits and Goals widgets only show if employees have an active item in them. The What's Happening widget always shows.
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* STEP 2: Customize Home Layout Cards (جميع كروت صفحة الهوم للتخصيص) */}
                            <div className="bg-indigo-50/40 rounded-2xl p-5 border border-indigo-200/80 space-y-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-200/80 pb-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-full bg-indigo-700 text-white text-xs font-black flex items-center justify-center shadow-xs">2</span>
                                  <div>
                                    <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                                      <Sliders className="w-4 h-4 text-indigo-700" />
                                      Step 2: Customize Home Layout Cards (تحديد ظهور كروت الهوم لكل صلاحية)
                                    </h3>
                                    <p className="text-xs text-indigo-900/70 font-medium mt-0.5">
                                      التحكم في ظهور أو إخفاء كافة البطاقات والكروت الخاصة بصفحة الهوم (Home View) لهذه الصلاحية المحدد (Access Level).
                                    </p>
                                  </div>
                                </div>

                                {/* Quick Bulk Action for Step 2 Cards */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    disabled={selectedRole?.name === 'Admin'}
                                    onClick={() => {
                                      if (selectedRole?.name === 'Admin') return;
                                      const allKeys = ['timeOff', 'myStuff', 'announcements', 'directReports', 'celebrations', 'whosOut', 'companyLinks', 'welcomeNewHires', 'timeOffUsed', 'peopleNoRaise', 'incompleteTrainings', 'location', 'onboarding', 'timeOffRequests', 'cascadingGoals', 'recognition'];
                                      allKeys.forEach(k => handleToggleHomeWidget(selectedRBACModule || 'HR', k, true));
                                    }}
                                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                                  >
                                    ✓ Enable All Cards
                                  </button>
                                  <button
                                    type="button"
                                    disabled={selectedRole?.name === 'Admin'}
                                    onClick={() => {
                                      if (selectedRole?.name === 'Admin') return;
                                      const allKeys = ['timeOff', 'myStuff', 'announcements', 'directReports', 'celebrations', 'whosOut', 'companyLinks', 'welcomeNewHires', 'timeOffUsed', 'peopleNoRaise', 'incompleteTrainings', 'location', 'onboarding', 'timeOffRequests', 'cascadingGoals', 'recognition'];
                                      allKeys.forEach(k => handleToggleHomeWidget(selectedRBACModule || 'HR', k, false));
                                    }}
                                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                                  >
                                    ✕ Disable All Cards
                                  </button>
                                </div>
                              </div>

                              {(() => {
                                const canon = selectedRBACModule === 'HR' || selectedRBACModule === 'HR Management' ? 'HR' : (selectedRBACModule || 'HR');
                                const homeWidgets = (selectedRole?.permissions?.[canon] as any)?.home_widgets || {};

                                const layoutCardsList = [
                                  { id: 'timeOff', labelEn: 'Time Off & Balances', labelAr: 'أرصدة وطلبات الإجازات', icon: Calendar, desc: 'Leave balances & quick request shortcuts' },
                                  { id: 'myStuff', labelEn: 'My Stuff & Actions', labelAr: 'أدواتي والروابط السريعة', icon: FileText, desc: 'Quick action shortcuts & personal docs' },
                                  { id: 'announcements', labelEn: 'Announcements', labelAr: 'الإعلانات والتنويهات', icon: Megaphone, desc: 'Company broadcast notices & news' },
                                  { id: 'directReports', labelEn: 'Direct Reports', labelAr: 'فريق العمل المباشر', icon: Users, desc: 'Direct team members overview (Manager)' },
                                  { id: 'celebrations', labelEn: 'Celebrations', labelAr: 'المناسبات وأعياد الميلاد', icon: Sparkles, desc: 'Birthdays & work anniversaries' },
                                  { id: 'whosOut', labelEn: 'Who\'s Out Today', labelAr: 'الغائبون والمجازون اليوم', icon: UserCheck, desc: 'Team absence & leave schedule' },
                                  { id: 'companyLinks', labelEn: 'Company Links', labelAr: 'روابط ومستندات الشركة', icon: Link2, desc: 'Handbook & external portal links' },
                                  { id: 'welcomeNewHires', labelEn: 'Welcome New Hires', labelAr: 'الترحيب بالموظفين الجدد', icon: UserPlus, desc: 'Newly joined team members highlight' },
                                  { id: 'timeOffUsed', labelEn: 'Time Off Used', labelAr: 'استهلاك ورسم الإجازات', icon: PieChart, desc: 'Visual pie breakdown of taken leaves' },
                                  { id: 'peopleNoRaise', labelEn: 'No Recent Raise', labelAr: 'الموظفون بدون زيادة مؤخراً', icon: Coins, desc: 'Manager audit card for compensation' },
                                  { id: 'incompleteTrainings', labelEn: 'Incomplete Trainings', labelAr: 'الدورات والتدريبات المتبقية', icon: GraduationCap, desc: 'Track pending employee training courses' },
                                  { id: 'location', labelEn: 'Office Location', labelAr: 'موقع الفرع والخريطة', icon: MapPin, desc: 'Branch details & map view' },
                                  { id: 'onboarding', labelEn: 'Onboarding Progress', labelAr: 'متابعة تهيئة الموظف الجديد', icon: CheckCircle2, desc: 'New hire onboarding checklist tracker' },
                                  { id: 'timeOffRequests', labelEn: 'Pending Leave Requests', labelAr: 'طلبات الإجازات المعلقة', icon: Clock, desc: 'Manager approval list for pending leaves' },
                                  { id: 'cascadingGoals', labelEn: 'Company & Team Goals', labelAr: 'الأهداف الاستراتيجية (OKRs)', icon: Target, desc: 'Cascading goals & objective progress' },
                                  { id: 'recognition', labelEn: 'Kudos & Recognition', labelAr: 'التقدير والثناء بين الموظفين', icon: Award, desc: 'Peer appreciations & shoutouts' },
                                ];

                                return (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                                    {layoutCardsList.map((card) => {
                                      const Icon = card.icon;
                                      const wConfig = homeWidgets[card.id];
                                      const isChecked = wConfig ? wConfig.enabled !== false : true;

                                      return (
                                        <div
                                          key={card.id}
                                          onClick={() => {
                                            if (selectedRole?.name !== 'Admin') {
                                              handleToggleHomeWidget(selectedRBACModule || 'HR', card.id, !isChecked);
                                            }
                                          }}
                                          className={cn(
                                            "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between bg-white shadow-2xs hover:shadow-md",
                                            isChecked 
                                              ? "border-indigo-600 ring-2 ring-indigo-500/10" 
                                              : "border-slate-200 opacity-50 hover:opacity-100 bg-slate-50"
                                          )}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className={cn(
                                              "p-2 rounded-xl shrink-0 transition-colors",
                                              isChecked ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-400"
                                            )}>
                                              <Icon className="w-4 h-4" />
                                            </div>
                                            <div className={cn(
                                              "w-5 h-5 rounded-md flex items-center justify-center transition-colors border shrink-0",
                                              isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                                            )}>
                                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                          </div>

                                          <div className="mt-3">
                                            <div className="text-xs font-black text-slate-900 leading-tight">{card.labelEn}</div>
                                            <div className="text-[10px] font-bold text-indigo-900/80 mt-0.5 dir-rtl">{card.labelAr}</div>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 line-clamp-1">{card.desc}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                  {/* Slide-Over Drawer for Tab Advanced Rules */}
                  {rbacTabDrawerOpen && rbacDrawerTab && (
                    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setRbacTabDrawerOpen(false)}
                      />

                      {/* Drawer Container */}
                      <div className="relative w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 h-full flex flex-col z-50 animate-slide-in-right">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                              <SlidersHorizontal className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">
                                تخصيص متقدم للتاب • {selectedRBACModule || 'HR'}
                              </span>
                              <h3 className="text-base font-black text-slate-900 mt-0.5">
                                {rbacDrawerTab}
                              </h3>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setRbacTabDrawerOpen(false)}
                            className="p-2 hover:bg-slate-200/60 rounded-xl transition-all text-slate-500 hover:text-slate-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Drawer Tabs */}
                        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1">
                          <button
                            type="button"
                            onClick={() => setRbacDrawerActiveTab('actions')}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2",
                              rbacDrawerActiveTab === 'actions' ? "bg-white text-indigo-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>1. الأنشطة والإجراءات (Actions)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRbacDrawerActiveTab('fields')}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2",
                              rbacDrawerActiveTab === 'fields' ? "bg-white text-indigo-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-500" />
                            <span>2. رؤية الحقول (Field Security)</span>
                          </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                          {rbacDrawerActiveTab === 'actions' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                  <h4 className="text-sm font-black text-slate-900">الإجراءات والعمليات المسموحة</h4>
                                  <p className="text-xs text-slate-500 mt-0.5">اختر الإجراءات التفصيلية للمستخدم في {rbacDrawerTab}</p>
                                </div>

                                {(() => {
                                  const safeRbacTab = (rbacDrawerTab || '').toLowerCase();
                                  const matchedTab = HR_MODULE_TABS.find(t => {
                                    const tLabel = (t.label || '').toLowerCase();
                                    const tId = (t.id || '').toLowerCase().replace(/_/g, ' ');
                                    const safeRbacClean = safeRbacTab.replace(/_/g, ' ');
                                    return tLabel.includes(safeRbacTab) || 
                                           safeRbacTab.includes(tLabel) || 
                                           tId.includes(safeRbacClean) ||
                                           safeRbacClean.includes(tId);
                                  }) || HR_MODULE_TABS[0];

                                  return (
                                    <button
                                      type="button"
                                      disabled={selectedRole?.name === 'Admin'}
                                      onClick={() => {
                                        if (selectedRole?.name === 'Admin') return;
                                        const canon = selectedRBACModule === 'HR Management' ? 'HR' : (selectedRBACModule || 'HR');
                                        const customActionsState = selectedRole?.permissions?.[canon]?.custom_actions || {};
                                        const allChecked = matchedTab.actions.every(a => !!customActionsState[a.id]);
                                        matchedTab.actions.forEach(a => {
                                          handleToggleCustomAction(selectedRBACModule || 'HR', a.id, !allChecked);
                                        });
                                      }}
                                      className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer disabled:opacity-50"
                                    >
                                      تحديد/إلغاء الكل
                                    </button>
                                  );
                                })()}
                              </div>

                              <div className="grid grid-cols-1 gap-3">
                                {(() => {
                                  const safeRbacTab = (rbacDrawerTab || '').toLowerCase();
                                  const matchedTab = HR_MODULE_TABS.find(t => {
                                    const tLabel = (t.label || '').toLowerCase();
                                    const tId = (t.id || '').toLowerCase().replace(/_/g, ' ');
                                    const safeRbacClean = safeRbacTab.replace(/_/g, ' ');
                                    return tLabel.includes(safeRbacTab) || 
                                           safeRbacTab.includes(tLabel) || 
                                           tId.includes(safeRbacClean) ||
                                           safeRbacClean.includes(tId);
                                  }) || HR_MODULE_TABS[0];

                                  const canon = selectedRBACModule === 'HR Management' ? 'HR' : (selectedRBACModule || 'HR');
                                  const customActionsState = selectedRole?.permissions?.[canon]?.custom_actions || {};

                                  return matchedTab.actions.map((act: any) => {
                                    const isChecked = !!customActionsState[act.id];
                                    return (
                                      <label
                                        key={act.id}
                                        className={cn(
                                          "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                                          isChecked ? "bg-emerald-50/60 border-emerald-300 shadow-2xs" : "bg-white border-slate-200 hover:border-slate-300"
                                        )}
                                      >
                                        <div className="space-y-0.5">
                                          <span className="text-xs font-black text-slate-900 block dir-rtl">{act.labelAr || act.label}</span>
                                          <span className="text-[10px] text-slate-500 font-medium block">{act.labelEn || act.label}</span>
                                        </div>

                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          disabled={selectedRole?.name === 'Admin'}
                                          onChange={(e) => {
                                            if (selectedRole?.name !== 'Admin') {
                                              handleToggleCustomAction(selectedRBACModule || 'HR', act.id, e.target.checked);
                                            }
                                          }}
                                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                        />
                                      </label>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          )}

                          {rbacDrawerActiveTab === 'fields' && (
                            <div className="space-y-4">
                              <div className="pb-3 border-b border-slate-100">
                                <h4 className="text-sm font-black text-slate-900">مستوى رؤية وحساسية الحقول (Field Security)</h4>
                                <p className="text-xs text-slate-500 mt-0.5">حدد مستوى الإتاحة لكل حقل حسّاس داخل شاشة {rbacDrawerTab}</p>
                              </div>

                              <div className="space-y-3">
                                {(() => {
                                  const safeRbacTab = (rbacDrawerTab || '').toLowerCase();
                                  const matchedMod = HR_MAIN_MODULE_CONFIGS.find(c => {
                                    const cLabel = (c.label || '').toLowerCase();
                                    const cId = (c.id || '').toLowerCase();
                                    return cLabel.includes(safeRbacTab) || 
                                           safeRbacTab.includes(cLabel) ||
                                           cId.includes(safeRbacTab) ||
                                           (c.subtabs && c.subtabs.some(st => {
                                             const stLabel = (st.label || '').toLowerCase();
                                             const stId = (st.id || '').toLowerCase();
                                             return stLabel.includes(safeRbacTab) || 
                                                    safeRbacTab.includes(stLabel) ||
                                                    stId.includes(safeRbacTab);
                                           }));
                                  }) || HR_MAIN_MODULE_CONFIGS[0];

                                  const canon = selectedRBACModule === 'HR Management' ? 'HR' : (selectedRBACModule || 'HR');
                                  const seePerms = (selectedRole?.permissions?.[canon] as any)?.see_permissions || {};

                                  return matchedMod.subtabs.map(st => {
                                    return st.sections.map((sec: any) => {
                                      const currentVal = seePerms[sec.key] || 'full';
                                      return (
                                        <div key={sec.key} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                                          <div>
                                            <span className="text-xs font-black text-slate-900 block dir-rtl">{sec.labelAr || sec.label}</span>
                                            <span className="text-[10px] text-slate-500 font-medium block">{sec.labelEn || sec.label}</span>
                                          </div>

                                          <select
                                            value={currentVal}
                                            disabled={selectedRole?.name === 'Admin'}
                                            onChange={(e) => {
                                              if (selectedRole?.name !== 'Admin') {
                                                handleSetSeePermission(selectedRBACModule || 'HR', sec.key, e.target.value as any);
                                              }
                                            }}
                                            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                          >
                                            <option value="full">كامل الصلاحية (Full Access)</option>
                                            <option value="view">قراءة فقط (Read Only)</option>
                                            <option value="no">مخفي بالكامل (Hidden)</option>
                                          </select>
                                        </div>
                                      );
                                    });
                                  });
                                })()}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setRbacTabDrawerOpen(false)}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                          >
                            تم وتطبيق (Done & Close)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Floating Save Action Bar */}
                  {hasUnsavedRbacChanges && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-4 max-w-lg w-full justify-between animate-fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                        <div>
                          <span className="text-xs font-black block" dir="rtl">تغييرات غير محفوظة (Unsaved Changes)</span>
                          <span className="text-[10px] text-slate-300 font-medium block">
                            تم تعديل مصفوفة الصلاحيات في دور {selectedRole?.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleDiscardRbacChanges}
                          disabled={isSavingRbac}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmSaveRbacPermissions}
                          disabled={isSavingRbac}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {isSavingRbac ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          <span>تأكيد وحفظ</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Super admin global lockout notice */}
                  {selectedRole?.name === 'Admin' && (
                    <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-start gap-3 text-amber-700 mt-6">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium leading-relaxed">
                        The <strong>Admin</strong> role always operates under a global safety lock. Tab level toggles, custom actions, and data scopes are override-locked for Admin roles to prevent accidental system access cutouts.
                      </p>
                    </div>
                  )}

                  {/* Bottom Confirmation Bar */}
                  <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/80 -mx-6 -mb-6 p-4 rounded-b-3xl">
                    <div className="flex items-center gap-2">
                      {hasUnsavedRbacChanges ? (
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5" dir="rtl">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          لديك تغييرات غير محفوظة في جدول الصلاحيات لهذا الموديول.
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5" dir="rtl">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          جميع الصلاحيات محفوظة ومطبقة على النظام.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      {hasUnsavedRbacChanges && (
                        <button
                          onClick={handleDiscardRbacChanges}
                          disabled={isSavingRbac}
                          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all"
                        >
                          إلغاء التغييرات (Discard)
                        </button>
                      )}
                      <button
                        onClick={handleConfirmSaveRbacPermissions}
                        disabled={isSavingRbac || !hasUnsavedRbacChanges}
                        className={cn(
                          "px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-2",
                          hasUnsavedRbacChanges
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:scale-105 active:scale-95 cursor-pointer"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {isSavingRbac ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>تأكيد وحفظ الصلاحيات (Save Changes)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Column 3: Advanced Tab Permissions Desk (Hidden) */}
            <div className="hidden">
              {selectedTreeItem ? (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    {/* Header Desk */}
                    <div className="flex items-start justify-between pb-4 border-b border-slate-100 bg-slate-50/50 -mx-6 -mt-6 p-6 rounded-t-3xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          ⚙️
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
                            {selectedTreeItem.module}
                          </span>
                          <h4 className="text-sm font-black text-slate-800 mt-0.5">
                            {selectedTreeItem.tab}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-indigo-50/50 border border-indigo-100 rounded-full px-2.5 py-1">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                        </span>
                        <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">
                          Auto-Saving
                        </span>
                      </div>
                    </div>

                    {/* Master Switch Alert */}
                    {!(selectedRole?.permissions?.[selectedTreeItem.module]?.tabs?.[selectedTreeItem.tab] !== false) && (
                      <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 text-slate-400" />
                        <p className="text-[11px] font-medium leading-relaxed">
                          This tab is currently <strong>Hidden</strong> for {selectedRole?.name}. All actions and visibility configurations below will remain inactive until you toggle the master tab switch to <strong>Active</strong> in the tree view.
                        </p>
                      </div>
                    )}

                    {/* Section 1: CRUD Actions */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        صلاحيات العمليات (Tab Operations)
                      </h5>
                      <div className="grid grid-cols-1 gap-2">
                        {['view', 'create', 'edit', 'delete', 'export'].map((action) => {
                          const modulePermissions: any = selectedRole?.permissions?.[selectedTreeItem.module] || {};
                          const tabActions = modulePermissions?.tab_actions?.[selectedTreeItem.tab] || {
                            view: modulePermissions?.view ?? false,
                            create: modulePermissions?.create ?? false,
                            edit: modulePermissions?.edit ?? false,
                            delete: modulePermissions?.delete ?? false,
                            export: modulePermissions?.export ?? false,
                          };

                          const isChecked = tabActions[action as 'view' | 'create' | 'edit' | 'delete' | 'export'];
                          const isDisabled = selectedRole?.name === 'Admin' && action === 'view';

                          const labels: Record<string, { en: string, ar: string }> = {
                            view: { en: 'Allow viewing record lists & details', ar: 'السماح برؤية البيانات وتفاصيل السجلات' },
                            create: { en: 'Allow adding new database records', ar: 'السماح بإضافة بيانات جديدة في النظام' },
                            edit: { en: 'Allow editing existing database records', ar: 'السماح بتعديل وتحرير البيانات القائمة' },
                            delete: { en: 'Allow deleting database records (Dangerous)', ar: 'السماح بحذف البيانات وإزالتها تماماً' },
                            export: { en: 'Allow exporting logs & worksheets to Excel/PDF', ar: 'السماح بتصدير البيانات والجداول المالية للخارج' }
                          };

                          return (
                            <label
                              key={action}
                              className={cn(
                                "flex items-start justify-between p-3.5 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50/50",
                                isChecked 
                                  ? "border-indigo-100 bg-indigo-50/10 text-slate-800" 
                                  : "border-slate-100 bg-white text-slate-400"
                              )}
                            >
                              <div className="flex gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isDisabled || selectedRole?.name === 'Admin'}
                                  onChange={(e) => handleToggleTabCrudAction(selectedTreeItem.module, selectedTreeItem.tab, action, e.target.checked)}
                                  className="mt-1 shrink-0 accent-indigo-600 rounded border-slate-300 w-4 h-4"
                                />
                                <div className="text-left">
                                  <span className="text-xs font-black uppercase text-slate-800 block">
                                    {action}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                                    {labels[action].en}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-semibold block leading-tight mt-0.5">
                                    {labels[action].ar}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 2: Sensitive Custom Actions */}
                    {getModuleCustomActions(selectedTreeItem.module).length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          صلاحيات الـ Action الحساسة (Tab Sensitive Actions)
                        </h5>
                        <div className="grid grid-cols-1 gap-2">
                          {getModuleCustomActions(selectedTreeItem.module).map((customAct) => {
                            const customActionsState = selectedRole?.permissions?.[selectedTreeItem.module]?.custom_actions || {};
                            const isChecked = !!customActionsState[customAct.key];

                            return (
                              <label
                                key={customAct.key}
                                className={cn(
                                  "flex items-start justify-between p-3.5 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50/50",
                                  isChecked 
                                    ? "border-violet-200 bg-violet-50/20 text-slate-800" 
                                    : "border-slate-100 bg-white text-slate-400"
                                )}
                              >
                                <div className="flex gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={selectedRole?.name === 'Admin'}
                                    onChange={(e) => handleToggleCustomAction(selectedTreeItem.module, customAct.key, e.target.checked)}
                                    className="mt-1 shrink-0 accent-indigo-600 rounded border-slate-300 w-4 h-4"
                                  />
                                  <div className="text-left">
                                    <span className="text-xs font-black text-slate-800 block">
                                      {customAct.label.split(' / ')[0]}
                                    </span>
                                    <span className="text-[10px] text-violet-600 font-black block mt-0.5">
                                      {customAct.label.split(' / ')[1] || 'إجراء مخصص'}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Section 3: Data Protection Scope */}
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          مستوى حماية البيانات (Data Scope Per Tab)
                        </h5>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                          حدد الموظف يشوف بيانات مين جوه التابة دي بالذات
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {(() => {
                          const isHRModule = selectedTreeItem.module === 'HR' || selectedTreeItem.module === 'HR Management';
                          const scopeItems = isHRModule 
                            ? [
                                { id: 'global', label: 'Global / الكل', desc: 'CEO أو HR Admin يشوف كل الداتا في السيستم', sub: 'Cross-branch unlimited visibility', icon: Globe },
                                { id: 'branch', label: 'Branch Only / الفرع فقط', desc: 'يشوف بيانات وتفاصيل فرعه المسجل عليه بس', sub: 'Restricted to user registered branch', icon: Building2 },
                                { id: 'own', label: 'Own Only / بياناتي فقط', desc: 'الموظف يشوف بروفايله وحضوره وغيابه وتقييم أدائه هو بس', sub: 'Restricted to own records', icon: Users },
                                { id: 'team', label: 'Team Only / فريقي فقط', desc: 'المدير يشوف الحضور والتقييمات الخاصة بالموظفين اللي تحت إدارته', sub: 'Restricted to team members under management', icon: Users },
                                { id: 'custom', label: 'Custom / مخصصة للـ HR', desc: 'صلاحيات مخصصة يحددها مسؤول الموارد البشرية لكل دور', sub: 'Custom HR specific overrides', icon: Settings2 }
                              ]
                            : [
                                { id: 'global', label: 'Global / عام', desc: 'يشوف بيانات وتكاليف كل فروع الشركة بالكامل', sub: 'Cross-branch unlimited visibility', icon: Globe },
                                { id: 'branch', label: 'Branch Only / الفرع فقط', desc: 'يشوف فواتير وأوامر فرعه المسجل عليه بس', sub: 'Restricted to user registered branch', icon: Building2 },
                                { id: 'own', label: 'Own Records Only / بياناتي فقط', desc: 'يشوف أرقام الأوردرات والمعاملات المتعين عليها هو شخصياً بس', sub: 'Restricted only to assigned assets', icon: Users }
                              ];

                          return scopeItems.map((scopeItem) => {
                            const modulePermissions: any = selectedRole?.permissions?.[selectedTreeItem.module] || {};
                            const currentScope = modulePermissions?.data_scopes?.[selectedTreeItem.tab] || 'global';
                            const isSelected = currentScope === scopeItem.id;
                            const IconComp = scopeItem.icon;

                            return (
                              <div
                                key={scopeItem.id}
                                onClick={() => {
                                  if (selectedRole?.name !== 'Admin') {
                                    handleUpdateDataScope(selectedTreeItem.module, selectedTreeItem.tab, scopeItem.id as any);
                                  }
                                }}
                                className={cn(
                                  "flex items-start gap-3.5 p-3.5 border rounded-2xl cursor-pointer transition-all",
                                  isSelected 
                                    ? "border-indigo-600 bg-indigo-50/20 text-slate-800 shadow-xs" 
                                    : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50/50"
                                )}
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                  isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                                )}>
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-800 block">
                                      {scopeItem.label}
                                    </span>
                                    {isSelected && (
                                      <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                        Active Scope
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-semibold block leading-snug mt-1">
                                    {scopeItem.desc}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                                    {scopeItem.sub}
                                  </span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {selectedRole?.name === 'Admin' && (
                    <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-start gap-3 text-amber-700 mt-6">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium leading-relaxed">
                        The <strong>Admin</strong> role always operates under a global safety lock. Tab level toggles, custom actions, and data scopes are override-locked for Admin roles to prevent accidental system access cutouts.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-2xl font-bold animate-pulse">
                    🧬
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">No Tab Selected</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                      Select any sub-tab from the tree mapping in the second column to review and configure advanced action controls and data visibility scope.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        )}

        {activeTab === 'org' && (
          <motion.div 
            key="org"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setViewMode('graph')}
                  className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'graph' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
                >
                  Interactive Graph
                </button>
                <button 
                  onClick={() => setViewMode('tree')}
                  className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'tree' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
                >
                  Recursive Tree
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={exportOrgChart}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <FileDown className="w-4 h-4" /> Export PNG
                </button>
              </div>
            </div>

            {viewMode === 'graph' ? (
              <div className="h-[70vh] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  fitView
                >
                  <Background color="#f1f5f9" gap={20} />
                  <Controls className="bg-white border-slate-200 shadow-xl rounded-xl overflow-hidden" />
                  <MiniMap 
                    nodeColor="#6366f1"
                    maskColor="rgba(241, 245, 249, 0.7)"
                    className="bg-white border border-slate-200 rounded-xl shadow-xl"
                  />
                </ReactFlow>
              </div>
            ) : (
              <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[70vh] overflow-auto">
                {orgData.map(root => (
                  <RecursiveTree key={root.id} node={root} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'branding' && (
          <motion.div 
            key="branding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <CompanyBrandingView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-slate-900">{editingUser?.id ? 'Edit User' : 'Add New User'}</h3>
                  {editingUser?.id && (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-lg border border-slate-200" title="System User ID">
                      User ID: #{editingUser.id}
                    </span>
                  )}
                </div>
                <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        value={editingUser?.name || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                      <input 
                        required
                        type="email" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        value={editingUser?.email || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Username</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        value={editingUser?.username || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                      <input 
                        required={!editingUser?.id}
                        type="password" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        placeholder={editingUser?.id ? 'Leave blank to keep current' : '••••••••'}
                        value={editingUser?.password || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2 p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Fingerprint className="w-4 h-4 text-indigo-600" />
                          <span>Employee ID / Fingerprint Code (كود البصمة / رقم الموظف)</span>
                        </label>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                          Attendance & HR Sync
                        </span>
                      </div>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-semibold text-slate-800 placeholder:text-slate-400"
                        placeholder="e.g. 101 or EMP-101 (كود البصمة المسجل بأجهزة الحضور)"
                        value={editingUser?.employee_id || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, employee_id: e.target.value, is_employee: true })}
                      />
                      <p className="text-[11px] font-medium text-slate-500 mt-1">
                        * رقم الموظف في جهاز البصمة (employee_id). أي موظف له بصمة سيمتلك employee_id و user_id. أما مستخدمي الدعم أو النظام الذين لا يمتلكون بصمة فيكفي لهم user_id.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department / القسم</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                      value={editingUser?.department_id || ''}
                      onChange={(e) => {
                        const dId = e.target.value ? parseInt(e.target.value) : null;
                        setEditingUser({ 
                          ...editingUser, 
                          department_id: dId,
                          job_title: '',
                          reporting_to: null 
                        });
                      }}
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Job Title / المسمى الوظيفي</label>
                    {editingUser?.department_id ? (
                      <div className="space-y-2">
                        <select
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                          value={getDepartmentJobTitles(editingUser?.department_id).includes(editingUser?.job_title || '') ? editingUser?.job_title : (editingUser?.job_title ? '__custom__' : '')}
                          onChange={(e) => {
                            if (e.target.value !== '__custom__') {
                              setEditingUser({ ...editingUser, job_title: e.target.value });
                            }
                          }}
                        >
                          <option value="">-- Choose Job Title for selected Department --</option>
                          {getDepartmentJobTitles(editingUser?.department_id).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                          <option value="__custom__">-- Custom Job Title --</option>
                        </select>
                        {(!getDepartmentJobTitles(editingUser?.department_id).includes(editingUser?.job_title || '') || editingUser?.job_title === '') && (
                          <input 
                            required
                            type="text" 
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-medium"
                            placeholder="Type custom job title..."
                            value={editingUser?.job_title || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, job_title: e.target.value })}
                          />
                        )}
                      </div>
                    ) : (
                      <input 
                        required
                        type="text" 
                        placeholder="Select Department first or enter title..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        value={editingUser?.job_title || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, job_title: e.target.value })}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Role / صلاحية النظام</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      value={editingUser?.role_id || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, role_id: parseInt(e.target.value) })}
                    >
                      <option value="">Select Role</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reporting To / المدير المباشر للقسم</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      value={editingUser?.reporting_to || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, reporting_to: e.target.value ? parseInt(e.target.value) : null })}
                    >
                      <option value="">No Manager (Root)</option>
                      {users
                        .filter(u => u.id !== editingUser?.id && (!editingUser?.department_id || Number(u.department_id) === Number(editingUser.department_id)))
                        .map(u => <option key={u.id} value={u.id}>{u.name} ({u.job_title || 'Manager'})</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 col-span-2 p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>حالة حساب الدخول والنظام / Account Login Access Status</span>
                      </label>
                      <span className={cn("text-[10px] font-black px-2.5 py-0.5 rounded-full border", editingUser?.status === 'inactive' ? "bg-rose-100 text-rose-800 border-rose-200" : "bg-emerald-100 text-emerald-800 border-emerald-200")}>
                        {editingUser?.status === 'inactive' ? 'Login Disabled / حظر الدخول' : 'Login Enabled / مسموح بالدخول'}
                      </span>
                    </div>
                    <select 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold text-slate-900"
                      value={editingUser?.status || 'active'}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'active' | 'inactive' })}
                    >
                      <option value="active">🟢 Active / نشط (مسموح بالدخول للنظام)</option>
                      <option value="inactive">🔴 Inactive / معطل (إيقاف وحظر الدخول نهائياً)</option>
                    </select>
                    <p className="text-[11px] font-medium text-slate-600 mt-1">
                      * عند اختيار <strong className="text-rose-700">Inactive (معطل)</strong> يتم سحب وإيقاف صلاحية دخول الموظف/المستخدم للنظام فوراً، ولن يتمكن من تسجيل الدخول حتى لو كانت كلمة المرور صحيحة.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-slate-100 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    {editingUser?.id ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Note: Department modal moved to HR Management */}

      {/* Role Modal */}
      <AnimatePresence>
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRoleModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">{editingRole?.id ? 'Edit Role' : 'Create New Role'}</h3>
                <button onClick={() => setIsRoleModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleSaveRole} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Compliance Officer"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={editingRole?.name || ''}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  />
                </div>

                {!editingRole?.id && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      Base System Role Preset (قالب صلاحيات الدور الأساسي)
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-bold text-slate-800"
                      value={newRolePresetId}
                      onChange={(e) => setNewRolePresetId(e.target.value)}
                    >
                      {SYSTEM_ROLE_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.icon} {preset.nameAr} ({preset.nameEn})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1" dir="rtl">
                      سيتم تهيئة كافة موديولات للنظام مسبقاً بناءً على قواعد هذا القالب الجاهز.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsRoleModalOpen(false)}
                    className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    {editingRole?.id ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status Modal */}
      <AnimatePresence>
        {isStatusModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">{editingStatus?.id ? 'Edit Status Option' : 'Add Status Option'}</h3>
                <button onClick={() => setIsStatusModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleSaveStatus} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Module</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={editingStatus?.module_id || ''}
                      onChange={(e) => setEditingStatus({ ...editingStatus, module_id: e.target.value })}
                    >
                      <option value="">Select Module</option>
                      {MODULES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Value (Key)</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. under_negotiation"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                      value={editingStatus?.value || editingStatus?.status_key || ''}
                      onChange={(e) => setEditingStatus({ ...editingStatus, value: e.target.value, status_key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Label</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Under Negotiation"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={editingStatus?.label || ''}
                      onChange={(e) => setEditingStatus({ ...editingStatus, label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        className="h-12 w-12 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                        value={editingStatus?.color || '#64748b'}
                        onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                      />
                      <input 
                        type="text" 
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono uppercase"
                        value={editingStatus?.color || '#64748b'}
                        onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Display Order</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={editingStatus?.order_index || 0}
                      onChange={(e) => setEditingStatus({ ...editingStatus, order_index: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input 
                      type="checkbox" 
                      id="is_default"
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={editingStatus?.is_default || false}
                      onChange={(e) => setEditingStatus({ ...editingStatus, is_default: e.target.checked })}
                    />
                    <label htmlFor="is_default" className="text-sm font-medium text-slate-700">Set as default status</label>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsStatusModalOpen(false)}
                    className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    {editingStatus?.id ? 'Update Status' : 'Create Status'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Module Modal */}
      <AnimatePresence>
        {isModuleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModuleModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">{editingModule?.id ? 'Edit Module' : 'Add New Module'}</h3>
                <button onClick={() => setIsModuleModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleSaveModule} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Module ID (Key)</label>
                    <input 
                      required
                      disabled={!!editingModule?.id}
                      type="text" 
                      placeholder="e.g. custom_module"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                      value={editingModule?.id || ''}
                      onChange={(e) => setEditingModule({ ...editingModule, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Module Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Custom Module"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={editingModule?.name || ''}
                      onChange={(e) => setEditingModule({ ...editingModule, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Icon (Lucide Name)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Zap, BookOpen, Users"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={editingModule?.icon_name || ''}
                      onChange={(e) => setEditingModule({ ...editingModule, icon_name: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-400">Enter a valid Lucide icon name (PascalCase).</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Index</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                        value={editingModule?.order_index || 0}
                        onChange={(e) => setEditingModule({ ...editingModule, order_index: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() => setEditingModule({ ...editingModule, is_active: !editingModule.is_active })}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                          editingModule?.is_active !== false ? "bg-indigo-600" : "bg-slate-200"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          editingModule?.is_active !== false ? "translate-x-6" : "translate-x-1"
                        )} />
                      </button>
                      <label className="text-sm font-bold text-slate-700">Module Visible</label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsModuleModalOpen(false)}
                    className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    {editingModule?.id ? 'Update Module' : 'Create Module'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-8 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]",
              toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
            )}
          >
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
       {/* Field Security & Presets Modals */}
      {isPresetsModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-3xl max-w-4xl w-full text-white shadow-2xl overflow-hidden border border-white/10 my-8 animate-scale-up">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center text-xl">
                  🛡️
                </div>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span>قوالب أدوار النظام الجاهزة (System Role Presets)</span>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold">
                      تطبيق فوري بكلك واحدة
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5" dir="rtl">
                    اختر قالب صلاحيات نمطي لتطبيقه مباشرة على دور (<strong className="text-amber-300">{selectedRole?.name}</strong>)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPresetsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selector */}
            <div className="px-6 py-3 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs" dir="rtl">
              <span className="font-bold text-slate-300">نطاق تطبيق القالب:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPresetApplyScope('all')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer",
                    presetApplyScope === 'all'
                      ? "bg-indigo-600 text-white shadow-md border border-indigo-400/30"
                      : "bg-white/10 text-slate-300 hover:bg-white/20"
                  )}
                >
                  كافة موديولات النظام (All Modules)
                </button>
                {selectedRBACModule && (
                  <button
                    type="button"
                    onClick={() => setPresetApplyScope('module')}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer",
                      presetApplyScope === 'module'
                        ? "bg-indigo-600 text-white shadow-md border border-indigo-400/30"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    )}
                  >
                    موديول ({selectedRBACModule}) فقط
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Presets */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SYSTEM_ROLE_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/50 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{preset.icon}</span>
                        <span className="text-[9px] font-black uppercase text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-400/30">
                          {preset.id}
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-white mt-2">{preset.nameEn}</h5>
                      <span className="text-xs font-black text-amber-300 block mt-0.5" dir="rtl">
                        {preset.nameAr}
                      </span>
                      <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed" dir="rtl">
                        {preset.descriptionAr}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleApplySystemRolePreset(preset.id, presetApplyScope === 'all');
                        setIsPresetsModalOpen(false);
                      }}
                      disabled={selectedRole?.name === 'Admin'}
                      className="w-full mt-3 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>تطبيق القالب ({preset.nameAr})</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/60 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPresetsModalOpen(false)}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                إلغاء وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <FieldSecurityModal
        isOpen={isFieldSecurityOpen}
        onClose={() => setIsFieldSecurityOpen(false)}
        moduleName={fieldSecurityModule || ''}
        roleName={selectedRole?.name || ''}
        currentFieldPermissions={(selectedRole?.permissions?.[fieldSecurityModule === 'HR Management' ? 'HR' : fieldSecurityModule || ''] as any)?.field_security || {}}
        onSaveFieldPermissions={handleSaveFieldPermissionsForModule}
      />

      <DeleteConfirmation
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: null, item: null })}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteConfirm.type === 'tab' ? 'Tab' : (deleteConfirm.type?.charAt(0).toUpperCase() + deleteConfirm.type?.slice(1))}`}
        message={
          deleteConfirm.type === 'user' 
            ? `Are you sure you want to delete employee ${deleteConfirm.item?.name}? This action cannot be undone.`
            : deleteConfirm.type === 'role'
            ? `Are you sure you want to delete the role "${deleteConfirm.item?.name}"? All users assigned to this role will need to be re-assigned.`
            : deleteConfirm.type === 'department'
            ? `Are you sure you want to delete the ${deleteConfirm.item?.name} department?`
            : deleteConfirm.type === 'module'
            ? `Are you sure you want to delete the module "${deleteConfirm.item?.name}" (${deleteConfirm.item?.id})? This will remove it from the system and the RBAC matrix.`
            : deleteConfirm.type === 'tab'
            ? `Are you sure you want to delete the tab "${deleteConfirm.item?.tabName}"? All custom fields registered under this tab will remain but will be inaccessible until another tab with this exact name is created.`
            : `Are you sure you want to delete this ${deleteConfirm.type}?`
        }
        loading={isDeleting}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all",
        active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function CompanyBrandingView() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companyId, setCompanyId] = useState<number>(1);
  const [companyName, setCompanyName] = useState<string>(() => {
    return localStorage.getItem('sys_company_name') || 'Tasahel';
  });
  const [companySubdomain, setCompanySubdomain] = useState<string>('main');
  const [companyTagline, setCompanyTagline] = useState<string>(() => {
    return localStorage.getItem('sys_company_tagline') || 'Enterprise Corporate Portal';
  });
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem('sys_logo_url') || '';
  });
  const [logoIcon, setLogoIcon] = useState<string>(() => {
    return localStorage.getItem('sys_logo_icon') || 'sparkles';
  });
  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('sys_primary_color') || '#168044';
  });
  const [sidebarTheme, setSidebarTheme] = useState<string>(() => {
    return localStorage.getItem('sys_sidebar_theme') || 'slate-900';
  });

  // Corporate Domain Management (Multi-Domain Support for companies table)
  const [primaryCorporateDomain, setPrimaryCorporateDomain] = useState<string>('tasahel.com.eg');
  const [corporateDomains, setCorporateDomains] = useState<string[]>(['tasahel.com.eg']);
  const [newDomainInput, setNewDomainInput] = useState<string>('');
  const [domainError, setDomainError] = useState<string>('');

  // Enterprise Policies & Analytics
  const [enforceCorporateSSO, setEnforceCorporateSSO] = useState<boolean>(false);
  const [autoLinkEmployees, setAutoLinkEmployees] = useState<boolean>(true);
  const [employeesCount, setEmployeesCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [ssoUsersCount, setSsoUsersCount] = useState<number>(0);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const presetColors = [
    { name: 'Emerald Green', hex: '#168044', bg: 'bg-[#168044]' },
    { name: 'Royal Blue', hex: '#1d4ed8', bg: 'bg-blue-700' },
    { name: 'Indigo Purple', hex: '#4338ca', bg: 'bg-indigo-700' },
    { name: 'Deep Violet', hex: '#6d28d9', bg: 'bg-purple-700' },
    { name: 'Dark Teal', hex: '#0f766e', bg: 'bg-teal-700' },
    { name: 'Amber Gold', hex: '#b45309', bg: 'bg-amber-700' },
    { name: 'Crimson Red', hex: '#b91c1c', bg: 'bg-red-700' },
    { name: 'Rose Pink', hex: '#be123c', bg: 'bg-rose-700' },
  ];

  const sidebarThemePresets = [
    { id: 'slate-900', name: 'Dark Slate', class: 'bg-slate-900', border: 'border-slate-800' },
    { id: 'blue-950', name: 'Midnight Navy', class: 'bg-blue-950', border: 'border-blue-900' },
    { id: 'emerald-950', name: 'Deep Emerald', class: 'bg-emerald-950', border: 'border-emerald-900' },
    { id: 'purple-950', name: 'Luxury Violet', class: 'bg-purple-950', border: 'border-purple-900' },
    { id: 'neutral-950', name: 'Onyx Black', class: 'bg-neutral-950', border: 'border-neutral-900' },
  ];

  const logoPresetIcons = [
    { id: 'sparkles', label: 'Sparkles', icon: Sparkles },
    { id: 'building', label: 'Building', icon: Building2 },
    { id: 'shield', label: 'Shield', icon: Shield },
    { id: 'hexagon', label: 'Hexagon', icon: Hexagon },
    { id: 'layers', label: 'Layers', icon: Layers },
    { id: 'globe', label: 'Globe', icon: Globe },
    { id: 'cpu', label: 'Tech CPU', icon: Cpu },
    { id: 'crown', label: 'Crown', icon: Crown },
  ];

  // Fetch company and corporate domains from Database on mount
  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('user_id');
        const res = await fetch('/api/admin/company', {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || '1',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.id) setCompanyId(data.id);
          if (data.name) {
            setCompanyName(data.name);
            localStorage.setItem('sys_company_name', data.name);
          }
          if (data.subdomain) setCompanySubdomain(data.subdomain);
          if (data.logo_url) {
            setLogoUrl(data.logo_url);
            localStorage.setItem('sys_logo_url', data.logo_url);
          }

          const rawDomains: string[] = Array.isArray(data.corporate_domains) && data.corporate_domains.length > 0
            ? data.corporate_domains
            : (data.corporate_domain ? [data.corporate_domain] : ['tasahel.com.eg']);

          setCorporateDomains(rawDomains);
          const prim = data.corporate_domain || rawDomains[0] || 'tasahel.com.eg';
          setPrimaryCorporateDomain(prim);
          localStorage.setItem('sys_corporate_domain', prim);
          localStorage.setItem('sys_corporate_domains', JSON.stringify(rawDomains));

          if (data.employees_count !== undefined) setEmployeesCount(data.employees_count);
          if (data.users_count !== undefined) setUsersCount(data.users_count);
          if (data.sso_users_count !== undefined) setSsoUsersCount(data.sso_users_count);

          if (data.settings && typeof data.settings === 'object') {
            if (data.settings.tagline) setCompanyTagline(data.settings.tagline);
            if (data.settings.primary_color) {
              setPrimaryColor(data.settings.primary_color);
              localStorage.setItem('sys_primary_color', data.settings.primary_color);
              document.documentElement.style.setProperty('--primary-color', data.settings.primary_color);
            }
            if (data.settings.sidebar_theme) {
              setSidebarTheme(data.settings.sidebar_theme);
              localStorage.setItem('sys_sidebar_theme', data.settings.sidebar_theme);
            }
            if (data.settings.logo_icon) setLogoIcon(data.settings.logo_icon);
            if (data.settings.enforce_corporate_sso !== undefined) {
              setEnforceCorporateSSO(!!data.settings.enforce_corporate_sso);
            }
            if (data.settings.auto_link_employees !== undefined) {
              setAutoLinkEmployees(data.settings.auto_link_employees !== false);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch corporate details from database, using cached defaults:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('File size too large. Please select an image smaller than 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDomain = () => {
    setDomainError('');
    let cleaned = newDomainInput.toLowerCase().trim()
      .replace(/^https?:\/\//, '')
      .replace(/^@/, '')
      .replace(/\/.*$/, '')
      .trim();

    if (!cleaned) {
      setDomainError('Please enter a domain name (e.g. tasahel.com).');
      return;
    }

    // Must be valid format e.g. company.com or company.com.eg
    if (!cleaned.includes('.') || cleaned.endsWith('.') || cleaned.startsWith('.') || cleaned.length < 4 || /\s/.test(cleaned)) {
      setDomainError('Invalid domain format. Expected domain name e.g. tasahel.com or tasheel.com.eg');
      return;
    }

    if (corporateDomains.map(d => d.toLowerCase()).includes(cleaned)) {
      setDomainError(`Domain '${cleaned}' is already registered in your corporate whitelist.`);
      return;
    }

    const updated = [...corporateDomains, cleaned];
    setCorporateDomains(updated);
    if (!primaryCorporateDomain) {
      setPrimaryCorporateDomain(cleaned);
    }
    setNewDomainInput('');
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    if (corporateDomains.length <= 1) {
      const confirmRemove = window.confirm(
        'Warning: This is your only whitelisted corporate domain. Removing it may prevent all employees from authenticating via Corporate SSO. Do you want to proceed?'
      );
      if (!confirmRemove) return;
    }

    const updated = corporateDomains.filter(d => d !== domainToRemove);
    setCorporateDomains(updated);

    if (primaryCorporateDomain === domainToRemove) {
      setPrimaryCorporateDomain(updated[0] || '');
    }
  };

  const handleSetPrimaryDomain = (domain: string) => {
    setPrimaryCorporateDomain(domain);
    // Move primary domain to first position
    setCorporateDomains(prev => [domain, ...prev.filter(d => d !== domain)]);
  };

  const handleSaveBranding = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSavedSuccess(false);

    try {
      const effectivePrimary = primaryCorporateDomain || corporateDomains[0] || null;
      let allDomains = [...corporateDomains];
      if (effectivePrimary && !allDomains.includes(effectivePrimary)) {
        allDomains.unshift(effectivePrimary);
      }

      // Save to database companies table via PUT /api/admin/company
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const payload = {
        name: companyName.trim() || 'Tasahel',
        subdomain: companySubdomain.trim() || 'main',
        corporate_domain: effectivePrimary,
        corporate_domains: allDomains,
        logo_url: logoUrl,
        settings: {
          tagline: companyTagline.trim() || 'Enterprise Corporate Portal',
          primary_color: primaryColor,
          sidebar_theme: sidebarTheme,
          logo_icon: logoIcon,
          enforce_corporate_sso: enforceCorporateSSO,
          auto_link_employees: autoLinkEmployees
        }
      };

      const res = await fetch('/api/admin/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '1',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save corporate settings to database.');
      }

      const responseData = await res.json();

      // Sync local storage for instantaneous UI navigation header & sidebar
      localStorage.setItem('sys_company_name', payload.name);
      localStorage.setItem('sys_company_tagline', payload.settings.tagline);
      localStorage.setItem('sys_logo_url', payload.logo_url);
      localStorage.setItem('sys_logo_icon', payload.settings.logo_icon);
      localStorage.setItem('sys_primary_color', payload.settings.primary_color);
      localStorage.setItem('sys_sidebar_theme', payload.settings.sidebar_theme);
      localStorage.setItem('sys_corporate_domain', payload.corporate_domain || '');
      localStorage.setItem('sys_corporate_domains', JSON.stringify(allDomains));

      document.documentElement.style.setProperty('--primary-color', primaryColor);
      window.dispatchEvent(new Event('sys_branding_updated'));

      if (responseData.company?.corporate_domains) {
        setCorporateDomains(responseData.company.corporate_domains);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Save branding error:', err);
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setCompanyName('Tasahel');
    setCompanySubdomain('main');
    setCompanyTagline('Enterprise Corporate Portal');
    setLogoUrl('');
    setLogoIcon('sparkles');
    setPrimaryColor('#168044');
    setSidebarTheme('slate-900');
    setPrimaryCorporateDomain('tasahel.com.eg');
    setCorporateDomains(['tasahel.com.eg']);
    setEnforceCorporateSSO(false);
    setAutoLinkEmployees(true);

    localStorage.removeItem('sys_company_name');
    localStorage.removeItem('sys_company_tagline');
    localStorage.removeItem('sys_logo_url');
    localStorage.removeItem('sys_logo_icon');
    localStorage.removeItem('sys_primary_color');
    localStorage.removeItem('sys_sidebar_theme');
    localStorage.removeItem('sys_corporate_domain');
    localStorage.removeItem('sys_corporate_domains');

    document.documentElement.style.removeProperty('--primary-color');
    window.dispatchEvent(new Event('sys_branding_updated'));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const renderCurrentLogoIcon = (iconId: string, className = "w-5 h-5 text-white") => {
    switch (iconId) {
      case 'building': return <Building2 className={className} />;
      case 'shield': return <Shield className={className} />;
      case 'hexagon': return <Hexagon className={className} />;
      case 'layers': return <Layers className={className} />;
      case 'globe': return <Globe className={className} />;
      case 'cpu': return <Cpu className={className} />;
      case 'crown': return <Crown className={className} />;
      case 'sparkles':
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl backdrop-blur-md">
                <Palette className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white tracking-tight">Company Branding & Corporate Identity</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold flex items-center gap-1">
                    <Database className="w-3 h-3" /> DB Synced (companies)
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Configure your organization profile, whitelisted corporate email domains for SSO, logo, and system theme colors.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDefaults}
              disabled={isSaving}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/15 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset Defaults
            </button>
            <button
              onClick={handleSaveBranding}
              disabled={isSaving}
              style={{ backgroundColor: primaryColor }}
              className="px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving to Database...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save & Apply Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Corporate details, whitelisted domains, and system branding successfully saved to the database (companies table).</span>
          </div>
          <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
            Active in SSO & Shell
          </span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION: Corporate Domains & Enterprise SSO (Dedicated companies table section) */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-base font-black text-slate-900">Corporate Domain Whitelist & Multi-Domain SSO</h4>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
                  companies.corporate_domains
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Configure all email domains owned by your organization. Employees with email addresses matching any whitelisted domain can authenticate via Corporate Domain SSO.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SSO Whitelist Active</span>
            </span>
          </div>
        </div>

        {/* Corporate Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Whitelisted Domains</div>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>{corporateDomains.length}</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Authorized
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Primary Domain</div>
            <div className="text-sm font-black text-indigo-700 truncate font-mono pt-1">
              @{primaryCorporateDomain || 'None set'}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Linked HR Employees</div>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>{employeesCount}</span>
              <span className="text-xs font-medium text-slate-500">Roster</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SSO-Enabled Users</div>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>{ssoUsersCount}</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Add New Corporate Domain Form */}
        <div className="space-y-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Add Corporate Domain to Whitelist</span>
              </label>
              <p className="text-[11px] text-slate-600 font-medium">
                Add subsidiary, regional, or alternative company email domains (e.g., tasahel.com, tasahel.com.eg, tasheel.com).
              </p>
            </div>
            <span className="text-[10px] font-mono text-indigo-700 bg-white px-2 py-1 rounded-md border border-indigo-200">
              Multiple Domains Supported
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono font-bold text-sm">
                @
              </div>
              <input
                type="text"
                value={newDomainInput}
                onChange={(e) => {
                  setNewDomainInput(e.target.value);
                  if (domainError) setDomainError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDomain();
                  }
                }}
                placeholder="e.g. tasahel.com or company.com.eg"
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={handleAddDomain}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Domain
            </button>
          </div>

          {domainError && (
            <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{domainError}</span>
            </p>
          )}
        </div>

        {/* Registered Whitelisted Domains List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Currently Registered Domains ({corporateDomains.length})
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              Click "Make Primary" to select default tenant domain
            </span>
          </div>

          {corporateDomains.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No corporate domains registered yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Add your company domain above to enable Corporate SSO.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {corporateDomains.map((domain) => {
                const isPrimary = domain.toLowerCase() === (primaryCorporateDomain || '').toLowerCase();
                return (
                  <div
                    key={domain}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3",
                      isPrimary
                        ? "bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-500/20 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        isPrimary ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      )}>
                        <AtSign className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900 truncate">
                            @{domain}
                          </span>
                          {isPrimary && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md flex items-center gap-1 border border-emerald-200 shrink-0">
                              <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" /> PRIMARY
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {isPrimary ? 'Default corporate identity domain' : 'Authorized SSO email domain'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryDomain(domain)}
                          title="Set as Primary Corporate Domain"
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Make Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        title="Remove Domain from Whitelist"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Corporate Policies & Database Metadata */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Tenant Subdomain Slug
            </label>
            <input
              type="text"
              value={companySubdomain}
              onChange={(e) => setCompanySubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="e.g. main or tasahel"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400">Maps to `companies.subdomain` column</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-800 block">Enforce Corporate SSO</label>
              <p className="text-[10px] text-slate-500 font-medium">Require matching corporate domain users to use SSO.</p>
            </div>
            <input
              type="checkbox"
              checked={enforceCorporateSSO}
              onChange={(e) => setEnforceCorporateSSO(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-800 block">Auto-link HR Employees</label>
              <p className="text-[10px] text-slate-500 font-medium">Map SSO email automatically to hr_employees record.</p>
            </div>
            <input
              type="checkbox"
              checked={autoLinkEmployees}
              onChange={(e) => setAutoLinkEmployees(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* SECTION: Branch Geofencing & Biometric Attendance Perimeter */}
      <CompanyGeofenceSettings />

      {/* Main Grid: Branding & Appearance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Identity & Logo */}
        <div className="space-y-6">
          {/* Card 1: Organization Profile */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Organization Name & Tagline</h4>
                <p className="text-xs text-slate-400 font-medium">Appears in sidebar header, documents, and notifications.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Tasahel"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Company Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={companyTagline}
                  onChange={(e) => setCompanyTagline(e.target.value)}
                  placeholder="e.g. Enterprise Suite"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Logo Customization */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Company Logo</h4>
                  <p className="text-xs text-slate-400 font-medium">Upload custom image logo or pick a vector icon preset.</p>
                </div>
              </div>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Remove Image
                </button>
              )}
            </div>

            {/* Upload Area */}
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-3 group"
              >
                {logoUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-200 bg-white shadow-md p-1">
                      <img src={logoUrl} alt="Company Logo" className="w-full h-full object-contain rounded-xl" />
                    </div>
                    <span className="text-xs font-bold text-indigo-700 group-hover:underline flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" /> Change Uploaded Image
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-slate-800">Click to Upload Company Logo</p>
                      <p className="text-[11px] text-slate-400 font-medium">PNG, SVG, WEBP or JPG (Max 3MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Vector Icon Presets if no custom image */}
              {!logoUrl && (
                <div className="space-y-2.5 pt-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Or Pick a Vector Preset Icon
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {logoPresetIcons.map((item) => {
                      const IconComp = item.icon;
                      const isSelected = logoIcon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setLogoIcon(item.id)}
                          className={cn(
                            "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer",
                            isSelected
                              ? "border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <div className={cn("p-1.5 rounded-lg", isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600")}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span className="text-[11px]">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: System Colors & Preview */}
        <div className="space-y-6">
          {/* Card 3: Color Palette & System Theme */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <Paintbrush className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">System Color Palette</h4>
                <p className="text-xs text-slate-400 font-medium">Choose primary system accent color and sidebar theme.</p>
              </div>
            </div>

            {/* Accent Preset Colors */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Primary Accent Theme Color
              </label>
              <div className="grid grid-cols-4 gap-3">
                {presetColors.map((color) => {
                  const isSelected = (primaryColor || '').toLowerCase() === (color.hex || '').toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setPrimaryColor(color.hex)}
                      className={cn(
                        "p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer",
                        isSelected
                          ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10 font-bold"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <span className={cn("w-5 h-5 rounded-full shrink-0 shadow-xs flex items-center justify-center text-white", color.bg)}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span className="text-xs text-slate-800 font-bold truncate">{color.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs font-bold text-slate-500 shrink-0">Custom Hex Code:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Background Theme */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Sidebar Theme Background
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sidebarThemePresets.map((theme) => {
                  const isSelected = sidebarTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSidebarTheme(theme.id)}
                      className={cn(
                        "p-3 rounded-2xl border flex items-center gap-3 transition-all text-left cursor-pointer",
                        isSelected
                          ? "border-indigo-600 bg-slate-50 ring-2 ring-indigo-500/20 font-bold"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-lg border shrink-0", theme.class, theme.border)} />
                      <span className="text-xs text-slate-800 font-bold truncate">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 4: Live Interactive Preview */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Live Appearance Preview</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Real-time mock</span>
            </div>

            {/* Mock Header & Sidebar */}
            <div className="rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl bg-slate-950 flex h-40">
              {/* Mock Sidebar */}
              <div className={cn("w-44 p-3 border-r flex flex-col justify-between", sidebarThemePresets.find(t => t.id === sidebarTheme)?.class || 'bg-slate-900 border-slate-800')}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: primaryColor }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 overflow-hidden shadow-md"
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        renderCurrentLogoIcon(logoIcon, "w-4 h-4 text-white")
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate">{companyName || 'Tasahel'}</div>
                      <div className="text-[9px] text-slate-400 truncate">{companyTagline}</div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div style={{ backgroundColor: primaryColor }} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-2">
                      <Building2 className="w-3 h-3" /> Dashboard
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 flex items-center gap-2 hover:bg-white/5">
                      <Users className="w-3 h-3" /> Employees
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 font-mono">@{primaryCorporateDomain || 'corporate.com'}</div>
              </div>

              {/* Mock Main Area */}
              <div className="flex-1 bg-slate-50 p-4 text-slate-900 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="text-xs font-bold text-slate-800">{companyName} Corporate Workspace</div>
                  <div style={{ backgroundColor: primaryColor }} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                    A
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="h-2 w-24 rounded bg-slate-200" />
                  <div className="h-1.5 w-36 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
