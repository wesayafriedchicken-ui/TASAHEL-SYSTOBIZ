import { 
  Users, User, Shield, Network, Building2, Briefcase, UserPlus, 
  Calendar, Clock, DollarSign, Target, Box, Award, BookOpen, 
  HeartHandshake, Coffee, Repeat, AlertTriangle, AlertCircle, 
  Sparkles, CheckSquare, FileText, ListChecks, CheckCircle2,
  Activity, Layers, Sliders, Database, Zap, Cpu, Megaphone,
  Compass, FolderTree, Edit2, Eye, LayoutDashboard, ReceiptText,
  ClipboardCheck, History, Settings, Package, Tag, BarChart3, Share2, Percent,
  MapPin, Plus
} from 'lucide-react';
import { hrModuleRegistry } from '../modules/hr/hrModuleRegistry';

export { hrModuleRegistry };

export interface ModuleActionMetadata {
  id: string;
  labelEn: string;
  labelAr: string;
  category?: 'crud' | 'workflow' | 'sensitive' | 'export';
  description?: string;
}

export interface ModuleFieldMetadata {
  key: string;
  labelEn: string;
  labelAr: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'currency' | 'file';
  isSensitive?: boolean;
}

export interface ModuleSectionMetadata {
  key: string;
  labelEn: string;
  labelAr: string;
  fields: ModuleFieldMetadata[];
}

export interface ModuleTabMetadata {
  id: string;
  labelEn: string;
  labelAr: string;
  icon?: any;
  parentId?: string;
  sections?: ModuleSectionMetadata[];
  actions?: ModuleActionMetadata[];
}

export interface ModuleMetadata {
  id: string;
  canonicalId: string;
  nameEn: string;
  nameAr: string;
  icon: any;
  descriptionEn: string;
  descriptionAr: string;
  color: string;
  tabs: ModuleTabMetadata[];
  customActions?: ModuleActionMetadata[];
  settingsLabelEn?: string;
  settingsLabelAr?: string;
}

// -------------------------------------------------------------
// HR Management Metadata
// -------------------------------------------------------------
const HR_TABS: ModuleTabMetadata[] = [
  {
    id: 'Dashboard',
    labelEn: 'Dashboard Overview',
    labelAr: 'لوحة مؤشرات الموارد البشرية',
    icon: Activity,
    actions: [
      { id: 'view_hr_analytics', labelEn: 'View HR Analytics', labelAr: 'عرض تحليلات ومؤشرات الموارد البشرية' },
      { id: 'export_hr_reports', labelEn: 'Export HR Reports', labelAr: 'تصدير تقارير الأداء والمؤشرات' }
    ]
  },
  {
    id: 'Hiring',
    labelEn: 'Hiring & Recruitment',
    labelAr: 'التوظيف والاستقطاب',
    icon: Briefcase,
    actions: [
      { id: 'request_job_opening', labelEn: 'Request Job Opening', labelAr: 'طلب فتح وظيفة جديدة' },
      { id: 'add_job_posting', labelEn: 'Add Job Posting', labelAr: 'إنشاء وظيفة شاغرة' },
      { id: 'view_job_posting', labelEn: 'View Job Details', labelAr: 'عرض تفاصيل الوظيفة الشاغرة' },
      { id: 'edit_job_posting', labelEn: 'Edit Job Posting', labelAr: 'تعديل بيانات الوظيفة الشاغرة' },
      { id: 'delete_job_posting', labelEn: 'Delete Job Posting', labelAr: 'حذف الوظيفة الشاغرة' },
      { id: 'share_job_posting', labelEn: 'Share Job Link', labelAr: 'مشاركة رابط الوظيفة' },
      { id: 'show_recruitment_budget', labelEn: 'Show Recruitment Budget', labelAr: 'عرض الميزانيات والرواتب المعروضة' }
    ],
    sections: [
      {
        key: 'job_posting_details',
        labelEn: 'Job Posting Details',
        labelAr: 'بيانات الوظيفة الشاغرة',
        fields: [
          { key: 'Job Title', labelEn: 'Job Title', labelAr: 'المسمى الوظيفي' },
          { key: 'Department', labelEn: 'Department', labelAr: 'القسم' },
          { key: 'Employment Type', labelEn: 'Employment Type', labelAr: 'نوع الدوام' },
          { key: 'Job Location', labelEn: 'Job Location', labelAr: 'مقر العمل' },
          { key: 'Posting Status', labelEn: 'Posting Status', labelAr: 'حالة الإعلان' },
          { key: 'Open Position Count', labelEn: 'Open Position Count', labelAr: 'عدد الشواغر' }
        ]
      },
      {
        key: 'job_comp_range',
        labelEn: 'Salary & Requirements',
        labelAr: 'الراتب والاشتراطات',
        fields: [
          { key: 'Minimum Offered Salary', labelEn: 'Minimum Offered Salary', labelAr: 'الحد الأدنى للراتب' },
          { key: 'Maximum Offered Salary', labelEn: 'Maximum Offered Salary', labelAr: 'الحد الأقصى للراتب' },
          { key: 'Required Qualifications', labelEn: 'Required Qualifications', labelAr: 'المؤهلات المطلوبة' },
          { key: 'Job Description Body', labelEn: 'Job Description Body', labelAr: 'الوصف والمهام الوظيفية' }
        ]
      }
    ]
  },
  {
    id: 'Candidates Pipeline',
    labelEn: 'Candidates Pipeline',
    labelAr: 'مسار ومراحل المرشحين',
    icon: UserPlus,
    parentId: 'Hiring',
    actions: [
      { id: 'register_applicant', labelEn: 'Register Applicant', labelAr: 'تسجيل متقدم جديد' },
      { id: 'add_candidate', labelEn: 'Add Candidate Details', labelAr: 'إضافة بيانات مرشح' },
      { id: 'view_candidate', labelEn: 'View Candidate Profile', labelAr: 'عرض ملف المرشح' },
      { id: 'edit_candidate', labelEn: 'Edit Candidate Details', labelAr: 'تعديل بيانات المرشح' },
      { id: 'delete_candidate', labelEn: 'Delete Candidate Profile', labelAr: 'حذف ملف المرشح' },
      { id: 'move_candidate_stage', labelEn: 'Move Stage (Drag & Drop)', labelAr: 'نقل المرشح بين مراحل التعيين' },
      { id: 'pull_channel_candidates', labelEn: 'Sync Hiring Channels', labelAr: 'تزامن واستيراد المرشحين' }
    ],
    sections: [
      {
        key: 'candidate_profile',
        labelEn: 'Candidate Details',
        labelAr: 'بيانات المرشح',
        fields: [
          { key: 'Candidate Full Name', labelEn: 'Candidate Full Name', labelAr: 'اسم المرشح بالكامل' },
          { key: 'Contact Email', labelEn: 'Contact Email', labelAr: 'البريد الإلكتروني' },
          { key: 'Phone Number', labelEn: 'Phone Number', labelAr: 'رقم الهاتف' },
          { key: 'Years of Experience', labelEn: 'Years of Experience', labelAr: 'سنوات الخبرة' },
          { key: 'Current Employer', labelEn: 'Current Employer', labelAr: 'جهة العمل الحالية' }
        ]
      },
      {
        key: 'candidate_screening',
        labelEn: 'Resume & Screening',
        labelAr: 'السيرة الذاتية والتقييم الأولي',
        fields: [
          { key: 'Resume / CV File', labelEn: 'Resume / CV File', labelAr: 'ملف السيرة الذاتية' },
          { key: 'Cover Letter', labelEn: 'Cover Letter', labelAr: 'الخطاب التعريفي' },
          { key: 'Screening Score', labelEn: 'Screening Score', labelAr: 'درجة الفرز الأولي' },
          { key: 'Recruiter Notes', labelEn: 'Recruiter Notes', labelAr: 'ملاحظات مسؤول التوظيف' }
        ]
      }
    ]
  },
  {
    id: 'Interviews & Scorecards',
    labelEn: 'Interviews & Scorecards',
    labelAr: 'المقابلات وبطاقات التقييم',
    icon: ListChecks,
    parentId: 'Hiring',
    actions: [
      { id: 'schedule_interview', labelEn: 'Schedule Interview', labelAr: 'جدولة مقابلة جديدة' },
      { id: 'evaluate_candidate_scorecard', labelEn: 'Evaluate Candidate / Scorecard', labelAr: 'إضافة تقييم بطاقة المقابلة' },
      { id: 'edit_scorecard', labelEn: 'Edit Evaluation Scorecard', labelAr: 'تعديل بطاقة التقييم' },
      { id: 'ai_analyze_scorecard', labelEn: 'Run AI Scorecard Evaluation', labelAr: 'تحليل التقييم بالذكاء الاصطناعي' }
    ]
  },
  {
    id: 'Attendance',
    labelEn: 'Attendance & Time',
    labelAr: 'الحضور والإنصراف وساعات العمل',
    icon: Clock,
    actions: [
      { id: 'attendance_smart_sync', labelEn: 'Smart Sync Button', labelAr: 'زر التزامن الذكي للبصمة' },
      { id: 'attendance_clock_in_out', labelEn: 'Clock In / Out Button', labelAr: 'تسجيل الحضور والانصراف' },
      { id: 'attendance_edit_logs', labelEn: 'Edit / Delete Attendance Logs', labelAr: 'تعديل وحذف سجلات البصمة' },
      { id: 'assign_shift', labelEn: 'Assign Shift', labelAr: 'تخصيص وردية للموظفين' }
    ],
    sections: [
      {
        key: 'attendance_timestamps',
        labelEn: 'Clock-In / Clock-Out Timestamps',
        labelAr: 'توقيتات البصمة وساعات العمل',
        fields: [
          { key: 'Check-In Time', labelEn: 'Check-In Time', labelAr: 'وقت الحضور' },
          { key: 'Check-Out Time', labelEn: 'Check-Out Time', labelAr: 'وقت الانصراف' },
          { key: 'Total Working Hours', labelEn: 'Total Working Hours', labelAr: 'إجمالي ساعات العمل' },
          { key: 'Break Duration', labelEn: 'Break Duration', labelAr: 'فترة الاستراحة' },
          { key: 'Overtime Hours', labelEn: 'Overtime Hours', labelAr: 'ساعات العمل الإضافية' }
        ]
      },
      {
        key: 'attendance_location',
        labelEn: 'Location & GPS Verification',
        labelAr: 'الموقع الجغرافي والتحقق من الـ IP',
        fields: [
          { key: 'Clock-In Location / IP', labelEn: 'Clock-In Location / IP', labelAr: 'موقع التسجيل / عنوان IP' },
          { key: 'Attendance Status (Present/Late/Absent)', labelEn: 'Attendance Status', labelAr: 'حالة الحضور (حاضر/متأخر/غائب)' },
          { key: 'Manager Correction Note', labelEn: 'Manager Correction Note', labelAr: 'ملاحظة تعديل المدير' }
        ]
      }
    ]
  },
  {
    id: 'DAILY LOGS',
    labelEn: 'DAILY LOGS',
    labelAr: 'السجلات اليومية',
    icon: Clock,
    parentId: 'Attendance',
    actions: [
      { id: 'attendance_smart_sync', labelEn: 'Smart Sync Button', labelAr: 'زر التزامن الذكي' },
      { id: 'attendance_filter_logs', labelEn: 'Daily Logs Filter', labelAr: 'فلترة السجل اليومي' },
      { id: 'attendance_clock_in_out', labelEn: 'Clock In / Out', labelAr: 'تسجيل الحضور والانصراف' },
      { id: 'attendance_export', labelEn: 'Export Attendance Logs', labelAr: 'تصدير سجلات الحضور' }
    ]
  },
  {
    id: 'SHIFT SCHEDULE',
    labelEn: 'SHIFT SCHEDULE',
    labelAr: 'جدول الورديات',
    icon: Calendar,
    parentId: 'Attendance',
    actions: [
      { id: 'assign_shift', labelEn: 'Assign Shift', labelAr: 'تخصيص وردية للموظفين' },
      { id: 'create_new_shift', labelEn: 'Create New Shift', labelAr: 'إنشاء وردية جديدة' },
      { id: 'view_edit_shift_schedule', labelEn: 'Shift Schedule & Weekly Assignments', labelAr: 'جدول الورديات والتكليفات الأسبوعية' },
      { id: 'edit_shift', labelEn: 'Edit Shift', labelAr: 'تعديل الوردية' },
      { id: 'delete_shift', labelEn: 'Delete Shift', labelAr: 'حذف الوردية' }
    ]
  },
  {
    id: 'BREAKS',
    labelEn: 'BREAKS',
    labelAr: 'فترات الاستراحة',
    icon: Coffee,
    parentId: 'Attendance',
    actions: [
      { id: 'add_break_slot', labelEn: 'Add Break Slot', labelAr: 'إضافة فترة استراحة' },
      { id: 'edit_break_slot', labelEn: 'Edit Break Slot', labelAr: 'تعديل فترة استراحة' },
      { id: 'delete_break_slot', labelEn: 'Delete Break Slot', labelAr: 'حذف فترة استراحة' }
    ]
  },
  {
    id: 'LEAVE MANAGEMENT',
    labelEn: 'LEAVE MANAGEMENT',
    labelAr: 'إدارة الإجازات والأرصدة',
    icon: Calendar,
    parentId: 'Attendance',
    actions: [
      { id: 'request_leave', labelEn: 'Request Leave', labelAr: 'تقديم طلب إجازة' },
      { id: 'edit_leave', labelEn: 'Edit Leave Request', labelAr: 'تعديل طلب إجازة' },
      { id: 'bulk_approve_leaves', labelEn: 'Bulk Approve Leaves', labelAr: 'موافقة جماعية على الإجازات' },
      { id: 'approve_leaves', labelEn: 'Approve Leaves', labelAr: 'اعتماد وقبول الإجازة' },
      { id: 'reject_leaves', labelEn: 'Reject Leaves', labelAr: 'رفض طلب الإجازة' },
      { id: 'adjust_leave_balances', labelEn: 'Adjust Leave Balances', labelAr: 'تعديل وتصفير أرصدة الإجازات' }
    ]
  },
  {
    id: 'SHIFT SWAPS',
    labelEn: 'SHIFT SWAPS',
    labelAr: 'تبديل الورديات',
    icon: Repeat,
    parentId: 'Attendance',
    actions: [
      { id: 'request_shift_swap', labelEn: 'Request Shift Swap', labelAr: 'طلب تبديل وردية' },
      { id: 'swap_manager_approve', labelEn: 'Manager Approval', labelAr: 'موافقة المدير المباشر' },
      { id: 'swap_attendance_approve', labelEn: 'Attendance Officer Approval', labelAr: 'موافقة مسؤول الحضور' }
    ]
  },
  {
    id: 'Employee Directory',
    labelEn: 'Employee Directory',
    labelAr: 'دليل وملفات الموظفين',
    icon: Users,
    actions: [
      { id: 'add_employee', labelEn: 'Add New Employee', labelAr: 'إضافة موظف جديد' },
      { id: 'edit_employee', labelEn: 'Edit Employee Details', labelAr: 'تعديل ملف وسجل الموظف' },
      { id: 'delete_employee', labelEn: 'Delete Employee Profile', labelAr: 'حذف ملف الموظف' },
      { id: 'share_employee', labelEn: 'Share Employee Profile', labelAr: 'مشاركة ملف الموظف' },
      { id: 'customize_layout', labelEn: 'Customize Profile Layout', labelAr: 'تخصيص هيكل الملف الشخصي' },
      { id: 'upload_files', labelEn: 'Upload Files & Documents', labelAr: 'رفع المستندات والصور' },
      { id: 'view_edit_login_info', labelEn: 'View/Edit Login Info', labelAr: 'عرض وتعديل بيانات الدخول' }
    ],
    sections: [
      {
        key: 'basic_info',
        labelEn: 'Basic Information',
        labelAr: 'البيانات الشخصية الأساسية',
        fields: [
          { key: 'Employee #', labelEn: 'Employee #', labelAr: 'الرقم الوظيفي' },
          { key: 'Status', labelEn: 'Status', labelAr: 'حالة التوظيف' },
          { key: 'First Name', labelEn: 'First Name', labelAr: 'الاسم الأول' },
          { key: 'Middle Name', labelEn: 'Middle Name', labelAr: 'الاسم الأوسط' },
          { key: 'Last Name', labelEn: 'Last Name', labelAr: 'اسم العائلة' },
          { key: 'Preferred Name', labelEn: 'Preferred Name', labelAr: 'الاسم المفضل' },
          { key: 'Birth Date', labelEn: 'Birth Date', labelAr: 'تاريخ الميلاد' },
          { key: 'NIN', labelEn: 'National ID / NIN', labelAr: 'الرقم القومي / الهوية' },
          { key: 'Gender', labelEn: 'Gender', labelAr: 'الجنس' },
          { key: 'Marital Status', labelEn: 'Marital Status', labelAr: 'الحالة الاجتماعية' }
        ]
      },
      {
        key: 'contact',
        labelEn: 'Contact Details',
        labelAr: 'بيانات الاتصال والعناوين',
        fields: [
          { key: 'Work Phone', labelEn: 'Work Phone', labelAr: 'هاتف العمل' },
          { key: 'Mobile Phone', labelEn: 'Mobile Phone', labelAr: 'رقم الجوال' },
          { key: 'Work Email', labelEn: 'Work Email', labelAr: 'البريد الإلكتروني للعمل' },
          { key: 'Personal Email', labelEn: 'Personal Email', labelAr: 'البريد الشخصي' },
          { key: 'Home Address', labelEn: 'Home Address', labelAr: 'عنوان السكن' }
        ]
      },
      {
        key: 'employment_info',
        labelEn: 'Employment & Contract',
        labelAr: 'بيانات العقد والوظيفة',
        fields: [
          { key: 'Job Title', labelEn: 'Job Title', labelAr: 'المسمى الوظيفي' },
          { key: 'Department', labelEn: 'Department', labelAr: 'القسم' },
          { key: 'Direct Supervisor', labelEn: 'Direct Supervisor', labelAr: 'المدير المباشر' },
          { key: 'Contract Date', labelEn: 'Contract Date', labelAr: 'تاريخ بدء العقد' },
          { key: 'Employment Status', labelEn: 'Employment Status', labelAr: 'حالة العقد' },
          { key: 'Base Salary Amount', labelEn: 'Base Salary Amount', labelAr: 'الراتب الأساسي', isSensitive: true },
          { key: 'Bank Account IBAN', labelEn: 'Bank Account IBAN', labelAr: 'رقم الحساب البنكي / الآيبان', isSensitive: true }
        ]
      }
    ]
  },
  {
    id: 'Departments & Structure',
    labelEn: 'Departments & Structure',
    labelAr: 'الأقسام والهيكل التنظيمي',
    icon: Building2,
    actions: [
      { id: 'add_department', labelEn: 'Add New Department', labelAr: 'إضافة قسم جديد' },
      { id: 'edit_department', labelEn: 'Edit Department', labelAr: 'تعديل بيانات القسم' },
      { id: 'delete_department', labelEn: 'Delete Department', labelAr: 'حذف القسم' }
    ],
    sections: [
      {
        key: 'dept_basic_info',
        labelEn: 'Department Basic Info',
        labelAr: 'بيانات القسم الأساسية',
        fields: [
          { key: 'Department Name', labelEn: 'Department Name', labelAr: 'اسم القسم' },
          { key: 'Department Code', labelEn: 'Department Code', labelAr: 'كود القسم' },
          { key: 'Description', labelEn: 'Description', labelAr: 'وصف القسم' },
          { key: 'Department Lead', labelEn: 'Department Lead', labelAr: 'رئيس القسم' },
          { key: 'Active Employee Count', labelEn: 'Active Employee Count', labelAr: 'عدد الموظفين' }
        ]
      },
      {
        key: 'dept_budget',
        labelEn: 'Budget & Capacity',
        labelAr: 'الميزانية والطاقة الاستيعابية',
        fields: [
          { key: 'Annual Operating Budget', labelEn: 'Annual Operating Budget', labelAr: 'الميزانية التشغيلية السنوية', isSensitive: true },
          { key: 'Approved Headcount Quota', labelEn: 'Approved Headcount Quota', labelAr: 'العدد المعتمد للوظائف' },
          { key: 'Cost Center Code', labelEn: 'Cost Center Code', labelAr: 'مركز التكلفة' }
        ]
      }
    ]
  },
  {
    id: 'Org Chart',
    labelEn: 'Organization Chart',
    labelAr: 'المخطط الهيكلي التفاعلي',
    icon: Network,
    actions: [
      { id: 'export_org_chart', labelEn: 'Export Chart (PNG/PDF)', labelAr: 'تصدير المخطط صورة أو ملف' },
      { id: 'reassign_reporting_line', labelEn: 'Reassign Reporting Lines', labelAr: 'إعادة تعيين خطوط التبعية الإدارية' }
    ]
  },
  {
    id: 'Payroll & Salaries',
    labelEn: 'Payroll & Salaries',
    labelAr: 'مسيرات الرواتب والمستحقات',
    icon: DollarSign,
    actions: [
      { id: 'generate_payroll_report', labelEn: 'Generate Payroll Report', labelAr: 'إنشاء مسير الرواتب' },
      { id: 'export_payroll_excel_csv', labelEn: 'Export Payroll Excel/CSV', labelAr: 'تصدير مسير الرواتب إكسيل' },
      { id: 'edit_payroll_entry', labelEn: 'Edit Payroll Entry', labelAr: 'تعديل استحقاقات أو خصومات' },
      { id: 'approve_payroll_batch', labelEn: 'Approve Payroll Batch', labelAr: 'اعتماد صرف الرواتب' }
    ],
    sections: [
      {
        key: 'payroll_salary_components',
        labelEn: 'Salary Components',
        labelAr: 'عناصر وبنود الراتب',
        fields: [
          { key: 'Basic Salary', labelEn: 'Basic Salary', labelAr: 'الراتب الأساسي', isSensitive: true },
          { key: 'Housing Allowance', labelEn: 'Housing Allowance', labelAr: 'بدل السكن', isSensitive: true },
          { key: 'Transportation Allowance', labelEn: 'Transportation Allowance', labelAr: 'بدل الانتقال', isSensitive: true },
          { key: 'Performance Bonus', labelEn: 'Performance Bonus', labelAr: 'مكافأة الأداء', isSensitive: true },
          { key: 'Gross Total Salary', labelEn: 'Gross Total Salary', labelAr: 'إجمالي الراتب', isSensitive: true }
        ]
      },
      {
        key: 'payroll_deductions',
        labelEn: 'Deductions & Net Pay',
        labelAr: 'الاستقطاعات وصافي الراتب',
        fields: [
          { key: 'Income Tax Deduction', labelEn: 'Income Tax Deduction', labelAr: 'ضريبة الدخل', isSensitive: true },
          { key: 'Social Security / Pension', labelEn: 'Social Security / Pension', labelAr: 'التأمينات والمعاشات', isSensitive: true },
          { key: 'Net Payable Amount', labelEn: 'Net Payable Amount', labelAr: 'صافي المستحق للصرف', isSensitive: true }
        ]
      }
    ]
  },
  {
    id: 'Performance & OKRs',
    labelEn: 'Performance & OKRs',
    labelAr: 'تقييم الأداء والأهداف الذكية',
    icon: Target,
    actions: [
      { id: 'performance_add_review', labelEn: 'Add Performance Review', labelAr: 'إضافة تقييم أداء جديد' },
      { id: 'performance_edit_delete', labelEn: 'Edit/Delete Review', labelAr: 'تعديل أو حذف تقييم' },
      { id: 'performance_manage_okrs', labelEn: 'Manage OKRs & Goals', labelAr: 'إدارة وتعيين الأهداف الذكية' }
    ]
  },
  {
    id: 'Complaints & Grievances',
    labelEn: 'Complaints & Grievances',
    labelAr: 'الشكاوى والتظلمات',
    icon: AlertTriangle,
    actions: [
      { id: 'complaints_submit', labelEn: 'Submit Complaint', labelAr: 'تقديم شكوى أو تظلم' },
      { id: 'complaints_resolve', labelEn: 'Resolve & Approve Grievance', labelAr: 'البت وحل الشكوى أو اعتمادها' },
      { id: 'complaints_delete', labelEn: 'Delete Complaint', labelAr: 'حذف وتكتم الشكوى' }
    ],
    sections: [
      {
        key: 'complaint_details',
        labelEn: 'Grievance & Case Info',
        labelAr: 'بيانات وتفاصيل الشكوى',
        fields: [
          { key: 'Complainant Name / Anonymous Flag', labelEn: 'Complainant Name', labelAr: 'اسم الشاكي / مجهول' },
          { key: 'Incident Category', labelEn: 'Incident Category', labelAr: 'تصنيف الشكوى' },
          { key: 'Incident Date & Time', labelEn: 'Incident Date & Time', labelAr: 'تاريخ ووقت الواقعة' },
          { key: 'Detailed Description', labelEn: 'Detailed Description', labelAr: 'تفاصيل الواقعة' }
        ]
      },
      {
        key: 'investigation_notes',
        labelEn: 'Investigation & Resolution',
        labelAr: 'التحقيق والقرار',
        fields: [
          { key: 'Assigned HR Investigator', labelEn: 'Assigned HR Investigator', labelAr: 'المحقق المسؤول' },
          { key: 'Investigation Status', labelEn: 'Investigation Status', labelAr: 'حالة التحقيق' },
          { key: 'Resolution & Action Taken', labelEn: 'Resolution & Action Taken', labelAr: 'القرار والإجراء المتخذ' }
        ]
      }
    ]
  },
  {
    id: 'Assets Management',
    labelEn: 'Assets Management',
    labelAr: 'العهد والأصول المسلمة للموظفين',
    icon: Box,
    actions: [
      { id: 'manage_assets', labelEn: 'Manage Assets & Custody', labelAr: 'إدارة وتسليم العهد والأجهزة' }
    ]
  },
  {
    id: 'Onboarding & Offboarding',
    labelEn: 'Onboarding & Offboarding',
    labelAr: 'التهيئة وإنهاء الخدمات',
    icon: CheckSquare,
    actions: [
      { id: 'manage_onboarding', labelEn: 'Manage Onboarding Tasks', labelAr: 'إدارة خطط تهيئة الموظفين الجدد' },
      { id: 'manage_offboarding', labelEn: 'Manage Offboarding / Exit', labelAr: 'إدارة إجراءات إخلاء الطرف وإنهاء الخدمة' }
    ]
  }
];

// -------------------------------------------------------------
// Operations Hub Metadata
// -------------------------------------------------------------
const OPERATIONS_TABS: ModuleTabMetadata[] = [
  {
    id: 'Work Orders Pipeline',
    labelEn: 'Work Orders Pipeline',
    labelAr: 'مسار أوامر التشغيل والطلبات',
    icon: Activity,
    actions: [
      { id: 'create_work_order', labelEn: 'Create Work Order', labelAr: 'إنشاء أمر تشغيل جديد' },
      { id: 'reassign_orders', labelEn: 'Reassign Orders', labelAr: 'إعادة تعيين أمر التشغيل' },
      { id: 'override_actual_cost', labelEn: 'Override Actual Cost', labelAr: 'تعديل التكلفة الفعلية يدوياً' },
      { id: 'view_crm_deal_value', labelEn: 'View CRM Deal Value', labelAr: 'الاطلاع على قيمة العقد من الـ CRM' }
    ]
  },
  {
    id: 'Multi-Role Assignment Desk',
    labelEn: 'Multi-Role Assignment Desk',
    labelAr: 'مكتب التكليفات متعددة الأدوار',
    icon: Users
  },
  {
    id: 'Operational Cost Override Desk',
    labelEn: 'Cost Override Desk',
    labelAr: 'مكتب تعديل التكاليف التشغيلية',
    icon: DollarSign
  },
  {
    id: 'Auto Assign System',
    labelEn: 'Auto Assign System',
    labelAr: 'نظام التوزيع والتكليف التلقائي',
    icon: Zap
  },
  {
    id: 'Operations Performance Desk',
    labelEn: 'Operations Performance Desk',
    labelAr: 'مكتب تقييم الأداء التشغيلي',
    icon: Target
  },
  {
    id: 'Quality Assurance & Review',
    labelEn: 'Quality Assurance & Review',
    labelAr: 'مراجعة الجودة والرقابة التشغيلية',
    icon: CheckCircle2
  }
];

// -------------------------------------------------------------
// Sales CRM Metadata
// -------------------------------------------------------------
const CRM_TABS: ModuleTabMetadata[] = [
  {
    id: 'Sales CRM Dashboard',
    labelEn: 'Sales Dashboard',
    labelAr: 'لوحة مبيعات ومؤشرات العملاء',
    icon: Activity
  },
  {
    id: 'Pipeline Stages',
    labelEn: 'Pipeline Stages',
    labelAr: 'مراحل الصفقات والفرص البيعية',
    icon: Sliders,
    actions: [
      { id: 'edit_stages', labelEn: 'Edit Deal Stages', labelAr: 'تعديل مراحل الصفقة وترتيبها' },
      { id: 'edit_commissions', labelEn: 'Edit Commission Rates', labelAr: 'تعديل نسب وعمولات المبيعات' },
      { id: 'manual_override', labelEn: 'Manual Assignment Override', labelAr: 'التعيين اليدوي لمندوب المبيعات' }
    ]
  },
  {
    id: 'Contacts & Accounts',
    labelEn: 'Contacts & Accounts',
    labelAr: 'سجل العملاء والحسابات التجارية',
    icon: Users
  },
  {
    id: 'Quotations & Proposals',
    labelEn: 'Quotations & Proposals',
    labelAr: 'عروض الأسعار والاتفاقيات',
    icon: FileText
  },
  {
    id: 'Sales Reps Performance',
    labelEn: 'Sales Reps Performance',
    labelAr: 'أداء مسؤولي المبيعات والعمولات',
    icon: Target
  },
  {
    id: 'Unified Inbox',
    labelEn: 'Unified Inbox',
    labelAr: 'صندوق المحادثات والرسائل الموحد',
    icon: Megaphone
  },
  {
    id: 'Auto Assign',
    labelEn: 'Auto Assign Rules',
    labelAr: 'قواعد التوزيع التلقائي للعملاء',
    icon: Zap
  }
];

// -------------------------------------------------------------
// Accounting Metadata
// -------------------------------------------------------------
const ACCOUNTING_TABS: ModuleTabMetadata[] = [
  {
    id: 'Financial Dashboard',
    labelEn: 'Financial Dashboard',
    labelAr: 'المؤشرات واللوحة المالية',
    icon: Activity
  },
  {
    id: 'Vaults & Banks',
    labelEn: 'Vaults & Banks',
    labelAr: 'الخزائن والحسابات البنكية',
    icon: DollarSign,
    actions: [
      { id: 'manage_currencies', labelEn: 'Manage Currencies', labelAr: 'إدارة العملات وأسعار الصرف' }
    ]
  },
  {
    id: 'Invoices & Ledger',
    labelEn: 'Invoices & Ledger',
    labelAr: 'سجل الفواتير والمبيعات',
    icon: FileText,
    actions: [
      { id: 'edit_invoice_settings', labelEn: 'Edit Invoice Templates & VAT', labelAr: 'تعديل نماذج الفواتير ونسبة الضريبة' }
    ]
  },
  {
    id: 'Supplier Bills',
    labelEn: 'Supplier Bills',
    labelAr: 'فواتير الموردين والمشتريات',
    icon: FileText,
    actions: [
      { id: 'approve_bills', labelEn: 'Approve Supplier Bills', labelAr: 'اعتماد فواتير الصرف للموردين' }
    ]
  },
  {
    id: 'Journal Ledger',
    labelEn: 'Journal Ledger',
    labelAr: 'دفتر اليومية العامة والقيود',
    icon: BookOpen,
    actions: [
      { id: 'override_journal', labelEn: 'Override Journal Entries', labelAr: 'تعديل قيود اليومية يدوياً' }
    ]
  },
  {
    id: 'Chart of Accounts',
    labelEn: 'Chart of Accounts',
    labelAr: 'دليل وشجرة الحسابات',
    icon: Layers
  },
  {
    id: 'Financial Reports',
    labelEn: 'Financial Reports',
    labelAr: 'القوائم المالية والتقارير الختامية',
    icon: Target
  }
];

// -------------------------------------------------------------
// Knowledge Base Metadata
// -------------------------------------------------------------
const KB_TABS: ModuleTabMetadata[] = [
  {
    id: 'Articles Explorer',
    labelEn: 'Articles Directory & Search',
    labelAr: 'مستكشف المقالات والبحث',
    icon: Compass,
    actions: [
      { id: 'view_articles', labelEn: 'View Articles Directory', labelAr: 'استعراض دليل المقالات', category: 'crud', description: 'Access articles explorer table, cards grid, and kanban board' },
      { id: 'search_articles', labelEn: 'Search & Full-Text Query', labelAr: 'البحث الفوري واستعلام النصوص', category: 'workflow', description: 'Real-time instant title, content, and keyword search' },
      { id: 'filter_categories', labelEn: 'Filter by Categories', labelAr: 'فلترة المقالات بالتصنيفات', category: 'workflow', description: 'Filter directory by specific knowledge taxonomies' },
      { id: 'filter_departments', labelEn: 'Filter by Department Scope', labelAr: 'فلترة المقالات حسب الأقسام', category: 'workflow', description: 'Filter articles matching department audience' },
      { id: 'filter_statuses', labelEn: 'Filter by Article Status', labelAr: 'فلترة المقالات حسب حالة النشر', category: 'workflow', description: 'Filter between Draft, Review, and Published states' },
      { id: 'export_articles', labelEn: 'Export Articles List', labelAr: 'تصدير بيانات المقالات', category: 'export', description: 'Export articles metadata and readership stats to CSV/Excel' },
      { id: 'toggle_view_modes', labelEn: 'Toggle View Modes (Grid/List/Kanban)', labelAr: 'تبديل طرق العرض', category: 'workflow', description: 'Switch between tabular list, card grid, and kanban board view' }
    ],
    sections: [
      {
        key: 'article_explorer_columns',
        labelEn: 'Articles Grid Columns & Metadata',
        labelAr: 'أعمدة ومحددات المقالات في المستكشف',
        fields: [
          { key: 'Reference Number', labelEn: 'Reference Number (e.g. KB-0012)', labelAr: 'الرقم المرجعي للمقالة' },
          { key: 'Article Title', labelEn: 'Article Title', labelAr: 'عنوان المقالة' },
          { key: 'Category Name', labelEn: 'Category Name', labelAr: 'اسم التصنيف' },
          { key: 'Author Name', labelEn: 'Author / Creator', labelAr: 'كاتب المقالة' },
          { key: 'Publishing Status', labelEn: 'Status (Draft/Review/Published)', labelAr: 'حالة النشر' },
          { key: 'Readership Count', labelEn: 'Total View Count', labelAr: 'عدد القراءات والمشاهدات' },
          { key: 'Created Timestamp', labelEn: 'Created / Published Date', labelAr: 'تاريخ الإنشاء والنشر' },
          { key: 'Article Tags', labelEn: 'Tags & Keywords', labelAr: 'الوسوم والكلمات الدلالية' }
        ]
      }
    ]
  },
  {
    id: 'Category Hub',
    labelEn: 'Category Explorer & Feed',
    labelAr: 'استعراض تصنيف محدد',
    icon: FolderTree,
    actions: [
      { id: 'view_category_feed', labelEn: 'View Category Dedicated Feed', labelAr: 'تصفح صفحة التصنيف المستقلة', category: 'crud', description: 'Access category-specific article listing and breadcrumb' },
      { id: 'filter_category_tags', labelEn: 'Filter Category Articles by Tag', labelAr: 'تصفية مقالات التصنيف بالوسوم', category: 'workflow', description: 'Filter category contents using keyword tag pills' },
      { id: 'view_category_analytics', labelEn: 'View Category Metrics & Readership', labelAr: 'عرض إحصائيات ومؤشرات التصنيف', category: 'workflow', description: 'Inspect category total count and engagement metrics' }
    ],
    sections: [
      {
        key: 'category_feed_fields',
        labelEn: 'Category Feed & Header Fields',
        labelAr: 'بيانات ومحددات صفحة التصنيف',
        fields: [
          { key: 'Category Title', labelEn: 'Category Name', labelAr: 'اسم التصنيف' },
          { key: 'Department Restriction', labelEn: 'Department Scope', labelAr: 'القسم المرتبط بالتصنيف' },
          { key: 'Category Description', labelEn: 'Category Description & Guidelines', labelAr: 'وصف وإرشادات التصنيف' },
          { key: 'Total Articles Count', labelEn: 'Total Articles Count', labelAr: 'إجمالي المقالات في التصنيف' }
        ]
      }
    ]
  },
  {
    id: 'Article Reader',
    labelEn: 'Article Reader View',
    labelAr: 'شاشة قراءة المقالة المستقلة',
    icon: BookOpen,
    actions: [
      { id: 'read_article_body', labelEn: 'Read Full Markdown Content', labelAr: 'قراءة نص ومحتوى المقالة', category: 'crud', description: 'Access full article reader page and rendered markdown body' },
      { id: 'submit_helpfulness_rating', labelEn: 'Rate Article (Helpful / Not Helpful)', labelAr: 'تقييم فائدة المقالة', category: 'workflow', description: 'Submit helpfulness feedback and rating' },
      { id: 'print_pdf_export', labelEn: 'Print Article & Export PDF', labelAr: 'طباعة وتصدير المقالة', category: 'export', description: 'Print formatted document or export to PDF' },
      { id: 'navigate_linked_sop', labelEn: 'Open Linked SOP Procedure', labelAr: 'الانتقال لإجراء العمل SOP المرتبط', category: 'workflow', description: 'Click through to associated standard operating procedure' },
      { id: 'copy_shareable_link', labelEn: 'Copy Direct Article Link', labelAr: 'نسخ ومشاركة رابط المقالة', category: 'workflow', description: 'Share direct URL to knowledge asset' },
      { id: 'view_related_articles', labelEn: 'Browse Related Articles', labelAr: 'تصفح المقالات ذات الصلة', category: 'workflow', description: 'Explore contextually related articles from same category' }
    ],
    sections: [
      {
        key: 'article_reader_content',
        labelEn: 'Reader View Content & Details',
        labelAr: 'محتوى وتفاصيل شاشة القراءة',
        fields: [
          { key: 'Article Title Heading', labelEn: 'Article Headline', labelAr: 'عنوان المقالة' },
          { key: 'Formatted Markdown Body', labelEn: 'Rich Formatted Body', labelAr: 'نص المقالة المنسق' },
          { key: 'Author & Approver Bio', labelEn: 'Author & Approver Info', labelAr: 'بيانات الكاتب والمعتمد' },
          { key: 'Attachments List', labelEn: 'Attached Documents & Files', labelAr: 'المرفقات والمستندات' },
          { key: 'External URL Reference', labelEn: 'External Reference Link', labelAr: 'الرابط المرجعي الخارجي' },
          { key: 'Helpful Counters', labelEn: 'Helpful / Unhelpful Feedback Counts', labelAr: 'إحصائيات تقييم القراء' }
        ]
      }
    ]
  },
  {
    id: 'Article Authoring & Editing',
    labelEn: 'Article Studio & Editor',
    labelAr: 'محرر واستوديو المقالات',
    icon: Edit2,
    actions: [
      { id: 'create_new_article', labelEn: 'Create New Knowledge Article', labelAr: 'إنشاء مقالة جديدة', category: 'crud', description: 'Access authoring form to create new knowledge base entries' },
      { id: 'edit_existing_article', labelEn: 'Edit Existing Article', labelAr: 'تعديل المقالة الحالية', category: 'crud', description: 'Update title, body, status, or tags of existing articles' },
      { id: 'delete_article', labelEn: 'Delete Article', labelAr: 'حذف المقالة', category: 'sensitive', description: 'Permanently remove knowledge article from database' },
      { id: 'use_ai_assistant', labelEn: 'AI Content Generation & Polishing', labelAr: 'استخدام مساعد الذكاء الاصطناعي', category: 'workflow', description: 'Generate drafts, fix grammar, expand, or summarize with AI' },
      { id: 'change_publishing_status', labelEn: 'Change Status (Draft / Review / Published)', labelAr: 'تغيير حالة النشر والاعتماد', category: 'workflow', description: 'Transition article between editorial workflow states' },
      { id: 'restrict_department_access', labelEn: 'Configure Department Visibility Restrictions', labelAr: 'تحديد وتقييد صلاحية رؤية الأقسام', category: 'sensitive', description: 'Restrict article visibility to specific selected departments' },
      { id: 'upload_article_attachments', labelEn: 'Upload & Attach Documents', labelAr: 'رفع وإرفاق الملفات والمستندات', category: 'crud', description: 'Attach PDF, images, and reference files' },
      { id: 'bind_sop_link', labelEn: 'Link to Standard Operating Procedure (SOP)', labelAr: 'ربط المقالة بإجراء عمل قياسي', category: 'workflow', description: 'Connect article to internal SOP documentation' }
    ],
    sections: [
      {
        key: 'article_form_inputs',
        labelEn: 'Article Editor Form Fields',
        labelAr: 'حقول نموذج كتابة وتحرير المقالة',
        fields: [
          { key: 'Title Field', labelEn: 'Article Title', labelAr: 'عنوان المقالة' },
          { key: 'Category Selector', labelEn: 'Category Selection', labelAr: 'اختيار التصنيف' },
          { key: 'Content Type', labelEn: 'Content Type (Article/FAQ/Policy/PDF)', labelAr: 'نوع المحتوى' },
          { key: 'Status Selector', labelEn: 'Publishing Status', labelAr: 'حالة النشر' },
          { key: 'Visible Departments', labelEn: 'Department Visibility Scope', labelAr: 'الأقسام المصرح لها بالرؤية', isSensitive: true },
          { key: 'Tags Input', labelEn: 'Comma-Separated Tags', labelAr: 'الوسوم والكلمات المفتاحية' },
          { key: 'Rich Content Editor', labelEn: 'Rich Text / Markdown Editor Body', labelAr: 'محرر النصوص المرئي' },
          { key: 'External URL Input', labelEn: 'External Documentation URL', labelAr: 'رابط التوثيق الخارجي' },
          { key: 'Related SOP Selector', labelEn: 'Linked Standard Operating Procedure', labelAr: 'إجراء العمل المرتبط' }
        ]
      }
    ]
  },
  {
    id: 'KB Management & Settings',
    labelEn: 'Taxonomy & Administration',
    labelAr: 'إدارة التصنيفات والإعدادات',
    icon: Shield,
    actions: [
      { id: 'access_management_page', labelEn: 'Access KB Management Console', labelAr: 'دخول لوحة إدارة المعرفة والتصنيفات', category: 'crud', description: 'Open taxonomy and permission settings screen' },
      { id: 'add_category', labelEn: 'Create New Category', labelAr: 'إضافة تصنيف معرفي جديد', category: 'crud', description: 'Define and create new knowledge categories' },
      { id: 'modify_category', labelEn: 'Edit Existing Category', labelAr: 'تعديل بيانات التصنيف', category: 'crud', description: 'Modify category names, departments, and descriptions' },
      { id: 'remove_category', labelEn: 'Delete Category', labelAr: 'حذف التصنيف المعرفي', category: 'sensitive', description: 'Delete empty taxonomy categories' },
      { id: 'configure_kb_access_rules', labelEn: 'Configure Permissions & Roles Access', labelAr: 'ضبط صلاحيات وقواعد الوصول', category: 'sensitive', description: 'Manage role-based rules for knowledge base' }
    ],
    sections: [
      {
        key: 'taxonomy_management_fields',
        labelEn: 'Category Administration Fields',
        labelAr: 'حقول إدارة وتخصيص التصنيفات',
        fields: [
          { key: 'Category Name', labelEn: 'Category Name', labelAr: 'اسم التصنيف' },
          { key: 'Assigned Department', labelEn: 'Department Affiliation', labelAr: 'القسم التابع له' },
          { key: 'Description & Scope', labelEn: 'Category Description', labelAr: 'وصف التصنيف ونطاقه' },
          { key: 'Parent Category', labelEn: 'Parent Taxonomy (if nested)', labelAr: 'التصنيف الأب' }
        ]
      }
    ]
  }
];

// -------------------------------------------------------------
// Quality Assurance (QA) Metadata
// -------------------------------------------------------------
const QA_TABS: ModuleTabMetadata[] = [
  {
    id: 'Quality Dashboard',
    labelEn: 'Quality Dashboard & Analytics',
    labelAr: 'لوحة قيادة وتحليلات الجودة',
    icon: LayoutDashboard,
    actions: [
      { id: 'view_quality_overview', labelEn: 'View Quality Overview & KPIs', labelAr: 'عرض مؤشرات الأداء ولوحة القيادة', category: 'crud', description: 'Access quality overview dashboard, pass rate %, and defect trends' },
      { id: 'view_employee_tracking', labelEn: 'View Employee Quality Scorecards', labelAr: 'متابعة أداء وبطاقات جودة الموظفين', category: 'workflow', description: 'Inspect agent-level audit history, scorecards, and defect rate rankings' },
      { id: 'export_dashboard_reports', labelEn: 'Export Executive Quality Reports', labelAr: 'تصدير تقارير الجودة التنفيذية', category: 'export', description: 'Download executive QMS performance summaries in Excel and PDF formats' },
      { id: 'filter_dashboard_dates', labelEn: 'Filter by Timeframes & Shifts', labelAr: 'تصفية البيانات بالفترات والمناوبات', category: 'workflow', description: 'Filter KPI metrics across 7-day, 30-day, quarterly periods, and teams' },
      { id: 'configure_quality_targets', labelEn: 'Configure Quality Target Benchmarks', labelAr: 'تحديد مستهدفات ومعايير الجودة', category: 'sensitive', description: 'Set Quality Threshold Target and benchmark KPIs across units' }
    ],
    sections: [
      {
        key: 'quality_overview_kpis',
        labelEn: 'Quality Overview & Executive KPIs',
        labelAr: 'المؤشرات التنفيذية العامة للجودة',
        fields: [
          { key: 'Average Quality Score', labelEn: 'Average Quality Score %', labelAr: 'متوسط درجة الجودة' },
          { key: 'First Pass Yield', labelEn: 'First-Pass Yield / Pass Rate %', labelAr: 'معدل النجاح من المرة الأولى' },
          { key: 'Total Audits Count', labelEn: 'Total Audits Executed', labelAr: 'إجمالي جلسات التدقيق المنفذة' },
          { key: 'Open Non-Conformances', labelEn: 'Open Non-Conformances (NCRs)', labelAr: 'حالات عدم المطابقة المفتوحة' },
          { key: 'Critical Incident Count', labelEn: 'Critical Defects Count', labelAr: 'عدد الحوادث والعيوب الحرجة' },
          { key: 'SLA Compliance Rate', labelEn: 'SLA Compliance %', labelAr: 'نسبة الالتزام باتفاقية مستوى الخدمة' }
        ]
      },
      {
        key: 'employee_tracking_fields',
        labelEn: 'Employee Quality Tracking Fields',
        labelAr: 'بيانات متابعة جودة الموظفين',
        fields: [
          { key: 'Employee Name & ID', labelEn: 'Employee Name & ID', labelAr: 'اسم ورقم الموظف' },
          { key: 'Assigned Department', labelEn: 'Assigned Department / Unit', labelAr: 'القسم أو الوحدة التابع لها' },
          { key: 'Individual Quality Score', labelEn: 'Individual Quality Score %', labelAr: 'درجة جودة الموظف' },
          { key: 'Audited Samples Count', labelEn: 'Audited Transactions Count', labelAr: 'عدد العينات المدققة للموظف' },
          { key: 'Error Rate Percentage', labelEn: 'Defect & Error Rate %', labelAr: 'نسبة الأخطاء والانحرافات' },
          { key: 'Coaching Indicator', labelEn: 'Coaching & Retraining Required', labelAr: 'حاجة الموظف لإعادة التدريب' }
        ]
      }
    ]
  },
  {
    id: 'Transactions Audit',
    labelEn: 'Transactions & Incidents Audit',
    labelAr: 'تدقيق المعاملات والحوادث',
    icon: ReceiptText,
    actions: [
      { id: 'view_transactions_audit', labelEn: 'Browse Transactions Audit Queues', labelAr: 'استعراض قوائم تدقيق المعاملات', category: 'crud', description: 'Access complaints, delays, refunds, cancellations, and NPS queues' },
      { id: 'conduct_incident_audit', labelEn: 'Execute Incident Audit Assessment', labelAr: 'إجراء تقييم وتدقيق الحادثة', category: 'workflow', description: 'Walkthrough multi-step audit stepper, checkpoints, and RCA investigation' },
      { id: 'override_audit_score', labelEn: 'Supervisor Score Override', labelAr: 'تعديل النتيجة من المشرف', category: 'sensitive', description: 'Override automated or evaluator calculated score with mandatory justification' },
      { id: 'create_action_plan', labelEn: 'Create Corrective Action Plan', labelAr: 'إنشاء خطة عمل تصحيحية للعملية', category: 'workflow', description: 'Draft remediation milestones, assign owners, and set resolution deadlines' },
      { id: 'approve_action_plan', labelEn: 'Sign-off Action Plan Closure', labelAr: 'اعتماد وإغلاق خطة العمل', category: 'sensitive', description: 'Formally verify and sign off completion of transaction corrective actions' },
      { id: 'export_transactions_audit', labelEn: 'Export Transactions Audit Log', labelAr: 'تصدير سجل تدقيق العمليات', category: 'export', description: 'Export transaction audit log, defect classifications, and scores to Excel/CSV' },
      { id: 'manage_audit_checklists', labelEn: 'Manage Transaction Checklists', labelAr: 'إدارة قوائم ومعايير تدقيق المعاملات', category: 'crud', description: 'Create and adjust evaluation rubrics, penalty deductions, and mandatory questions' },
      { id: 'qa_manage_options', labelEn: 'Manage Options (Drop-down Choice Manager)', labelAr: 'زر إدارة الخيارات والقوائم المنسدلة (Manage Options)', category: 'workflow', description: 'Permission to open options manager modal, add custom choices, delete old options, and update linked records in audit selects' },
      { id: 'qa_add_new_action', labelEn: 'Add New Action (Incident Stepper & Action Plans)', labelAr: 'زر إضافة إجراء تصحيحي جديد (Add New Action)', category: 'workflow', description: 'Permission to add and configure new required operational remediation actions directly from the multi-select dropdown' },
      { id: 'qa_reason_error_mgmt', labelEn: 'Reason & Error Management', labelAr: 'زر إدارة الأسباب والأخطاء (Reason & Error Management)', category: 'sensitive', description: 'Permission to open Reason & Error Management settings to add, rename, or delete main incident reasons and associate error classifications' }
    ],
    sections: [
      {
        key: 'transaction_audit_details',
        labelEn: 'Transaction Details & Defect Classification',
        labelAr: 'تفاصيل المعاملة وتصنيف الخلل',
        fields: [
          { key: 'Transaction Reference', labelEn: 'Transaction Reference #', labelAr: 'رقم المعاملة المرجعي' },
          { key: 'Incident Category', labelEn: 'Incident Category (Complaints/Delays/Refunds/Cancellations/NPS)', labelAr: 'نوع وتصنيف الحادثة' },
          { key: 'Customer Identifier', labelEn: 'Customer Identifier & Contact', labelAr: 'بيانات وهوية العميل' },
          { key: 'Incident Severity', labelEn: 'Severity (Critical / High / Medium / Low)', labelAr: 'درجة خطورة الحادثة' },
          { key: 'Financial Impact', labelEn: 'Refund / Financial Impact Value', labelAr: 'الأثر المالي أو قيمة الاسترداد', isSensitive: true },
          { key: 'Responsible Agent', labelEn: 'Responsible Agent & Team', labelAr: 'الموظف المسؤول والفريق' }
        ]
      },
      {
        key: 'audit_evaluation_results',
        labelEn: 'Audit Evaluation Findings & Sign-off',
        labelAr: 'نتائج التقييم والاعتماد الرقمي',
        fields: [
          { key: 'Checklist Score', labelEn: 'Audit Compliance Score %', labelAr: 'درجة الامتثال والتقييم' },
          { key: 'Audit Status', labelEn: 'Audit Outcome (Pass / Conditional / Fail)', labelAr: 'نتيجة التدقيق النهائية' },
          { key: 'Root Cause Category', labelEn: 'Root Cause Analysis (RCA) Tag', labelAr: 'تصنيف السبب الجذري للخلل' },
          { key: 'Auditor Observations', labelEn: 'Auditor Observations & Evidence', labelAr: 'ملاحظات وأدلة المدقق' },
          { key: 'Corrective Action Required', labelEn: 'Action Plan Trigger Flag', labelAr: 'طلب خطة تصحيحية إلزامية' },
          { key: 'Auditor Signature', labelEn: 'Digital Signature & Stamp', labelAr: 'توقيع واعتماد المدقق' }
        ]
      }
    ]
  },
  {
    id: 'Internal Audit',
    labelEn: 'Internal Audit & ISO Compliance',
    labelAr: 'التدقيق الداخلي وشهادات الامتثال',
    icon: ClipboardCheck,
    actions: [
      { id: 'view_internal_audits', labelEn: 'Access Internal Audit Workspace', labelAr: 'دخول مساحة التدقيق الداخلي', category: 'crud', description: 'Browse planned internal inspection programs and scheduled visits' },
      { id: 'manage_checklist_templates', labelEn: 'Manage Checklist Templates & Rubrics', labelAr: 'إدارة نماذج وقوائم التفتيش', category: 'crud', description: 'Design, version, and publish standardized ISO inspection checklists' },
      { id: 'perform_internal_audit', labelEn: 'Execute Operational Audit Walkthrough', labelAr: 'تنفيذ التدقيق الميداني والتشغيلي', category: 'workflow', description: 'Conduct audit evaluations against departments, upload photo evidence and scores' },
      { id: 'create_ncr_incident', labelEn: 'Issue Non-Conformance Report (NCR)', labelAr: 'إصدار تقرير عدم مطابقة NCR', category: 'sensitive', description: 'Document non-conformances with severity rating and immediate containment actions' },
      { id: 'manage_capa_workflow', labelEn: 'Drive 8D CAPA Action Plans', labelAr: 'إدارة ومتابعة خطط CAPA التصحيحية والوقائية', category: 'workflow', description: 'Formulate corrective and preventive action steps, 5-Why analysis, and target dates' },
      { id: 'verify_capa_closure', labelEn: 'Verify Effectiveness & Close NCR', labelAr: 'التحقق من الفعالية والإغلاق النهائي', category: 'sensitive', description: 'Audit implementation effectiveness, verify no recurrence, and close formal NCR' },
      { id: 'export_iso_compliance', labelEn: 'Export ISO-9001 Compliance Bundle', labelAr: 'تصدير ملف الامتثال لمعايير ISO', category: 'export', description: 'Export full audit findings, non-conformance logs, and CAPA dossiers' }
    ],
    sections: [
      {
        key: 'internal_checklist_template_fields',
        labelEn: 'Checklist Template Specifications',
        labelAr: 'مواصفات ونماذج التفتيش الداخلي',
        fields: [
          { key: 'Template Code & Title', labelEn: 'Template Code & Name', labelAr: 'كود واسم نموذج التفتيش' },
          { key: 'Standard Reference', labelEn: 'ISO Standard / SOP Cross-Reference', labelAr: 'المعيار المرجعي أو إجراء SOP' },
          { key: 'Target Department', labelEn: 'Target Department / Scope', labelAr: 'القسم أو النطاق المستهدف' },
          { key: 'Inspection Criteria', labelEn: 'Weighted Checkpoints & Rubrics', labelAr: 'بنود التفتيش والأوزان النسبية' },
          { key: 'Passing Score Target', labelEn: 'Minimum Passing Threshold %', labelAr: 'الحد الأدنى لدرجة النجاح' }
        ]
      },
      {
        key: 'ncr_and_capa_fields',
        labelEn: 'NCR Incident & CAPA Workflow Fields',
        labelAr: 'بيانات تقرير عدم المطابقة وإجراءات CAPA',
        fields: [
          { key: 'NCR Reference Number', labelEn: 'NCR Incident Reference #', labelAr: 'رقم تقرير عدم المطابقة' },
          { key: 'Defect Severity', labelEn: 'Severity Classification', labelAr: 'درجة تصنيف عدم المطابقة' },
          { key: 'Non-Conformance Details', labelEn: 'Finding Description & Photos', labelAr: 'وصف المخالفة والأدلة المصورة' },
          { key: 'Immediate Containment', labelEn: 'Immediate Containment Action Taken', labelAr: 'الإجراء الاحتوائي الفوري المتخذ' },
          { key: 'Root Cause 5-Why', labelEn: 'Root Cause Analysis (5-Why/Fishbone)', labelAr: 'تحليل السبب الجذري' },
          { key: 'Preventive Action', labelEn: 'Preventive Controls & Target Date', labelAr: 'الإجراء الوقائي والتاريخ المستهدف' },
          { key: 'Responsible Owner', labelEn: 'Responsible Action Owner', labelAr: 'المسؤول عن التنفيذ' },
          { key: 'Effectiveness Verification', labelEn: 'Effectiveness Audit Sign-off', labelAr: 'التحقق من الفعالية والاعتماد' }
        ]
      }
    ]
  },
  {
    id: 'Audit History',
    labelEn: 'Audit Trail & Historical Log',
    labelAr: 'سجل التدقيق التاريخي الشامل',
    icon: History,
    actions: [
      { id: 'view_audit_history', labelEn: 'Search & Browse Historical Audits', labelAr: 'البحث واستعراض سجلات التدقيق التاريخية', category: 'crud', description: 'Access immutable company-wide audit archives across all departments' },
      { id: 'filter_audit_history', labelEn: 'Multi-Filter Historical Records', labelAr: 'تصفية السجلات بالمفتش والنتائج والتاريخ', category: 'workflow', description: 'Filter records by auditor, pass/fail status, date interval, and score bracket' },
      { id: 'view_audit_certificate', labelEn: 'View Certified Audit Certificate', labelAr: 'عرض شهادة وتفاصيل التدقيق المعتمدة', category: 'workflow', description: 'Inspect per-item scoring breakdown, supervisor sign-offs, and verification hash' },
      { id: 'print_audit_report', labelEn: 'Print Findings & Download PDF', labelAr: 'طباعة التقرير وتنزيل ملف PDF', category: 'export', description: 'Print formatted inspection certificate or download compliance dossier' },
      { id: 'export_history_logs', labelEn: 'Export Historical Audit Archive', labelAr: 'تصدير أرشيف التدقيق التاريخي بالكامل', category: 'export', description: 'Export full historical audit data to CSV or Excel spreadsheet' }
    ],
    sections: [
      {
        key: 'audit_history_record_fields',
        labelEn: 'Historical Audit Archive Fields',
        labelAr: 'حقول وسجلات الأرشيف التاريخي للتدقيق',
        fields: [
          { key: 'Audit Session ID', labelEn: 'Audit Session Identifier', labelAr: 'معرف جلسة التدقيق' },
          { key: 'Audited Entity', labelEn: 'Audited Entity (Agent/Unit/Branch)', labelAr: 'الجهة أو الموظف المدقق عليه' },
          { key: 'Certified Auditor', labelEn: 'Certified Auditor Name', labelAr: 'اسم المدقق المعتمد' },
          { key: 'Execution Timestamp', labelEn: 'Execution Date & Time', labelAr: 'تاريخ وتوقيت التنفيذ' },
          { key: 'Overall Score & Grade', labelEn: 'Total Score % and Quality Grade', labelAr: 'الدرجة الإجمالية والتقدير' },
          { key: 'Final Outcome', labelEn: 'Final Outcome (Pass/Conditional/Fail)', labelAr: 'النتيجة النهائية المعتمدة' },
          { key: 'Dispute & Revision Log', labelEn: 'Dispute & Re-evaluation Notes', labelAr: 'سجل الطعون وإعادة التقييم' }
        ]
      }
    ]
  },
  {
    id: 'QA Settings & Integrations',
    labelEn: 'QA Settings & Data Pipelines',
    labelAr: 'إعدادات الجودة ومصادر البيانات',
    icon: Settings,
    actions: [
      { id: 'access_qa_settings', labelEn: 'Access QA Settings & Pipelines Console', labelAr: 'دخول لوحة إعدادات الجودة وخطوط البيانات', category: 'crud', description: 'Open integration settings, connected spreadsheets, and synchronization health' },
      { id: 'manage_google_sheets_sync', labelEn: 'Configure Google Sheets Live Sync', labelAr: 'تهيئة مزامنة Google Sheets التلقائية', category: 'workflow', description: 'Connect external spreadsheets for Complaints, Delays, Refunds, and NPS' },
      { id: 'configure_auto_sampling', labelEn: 'Configure Random Sampling Rates & Quotas', labelAr: 'ضبط نسب العينات العشوائية التلقائية', category: 'sensitive', description: 'Define auto-sampling percentages (e.g. 5%, 10%, 20%) per department or shift' },
      { id: 'set_sla_breach_alerts', labelEn: 'Configure Defect Webhooks & SLA Alerts', labelAr: 'ضبط تنبيهات الإخلال وWebhooks للعيوب', category: 'sensitive', description: 'Set real-time automated webhook alerts when critical non-conformances trigger' },
      { id: 'manage_qa_signers', labelEn: 'Authorize QA Certified Signers & Matrix', labelAr: 'إدارة واعتماد مخولي التوقيع للجودة', category: 'sensitive', description: 'Assign digital sign-off authority to certified lead auditors' },
      { id: 'qa_settings_button', labelEn: 'Settings Button (QA Master Header)', labelAr: 'زر إعدادات الجودة في الهيدر (Settings Button)', category: 'crud', description: 'Permission to view and click the Settings navigation button in the QA master layout header to access /qa/settings' },
      { id: 'qa_quick_sync_config', labelEn: 'Quick Sync Configuration (Sliders Icon)', labelAr: 'أيقونة وزر التكوين السريع للمزامنة (Quick Sync Configuration)', category: 'workflow', description: 'Permission to view and trigger the quick sync configuration slider icon in the QA header to manage Google Sheets and data pipelines modal' }
    ],
    sections: [
      {
        key: 'pipeline_integration_fields',
        labelEn: 'Data Ingestion & Integration Settings',
        labelAr: 'إعدادات خطوط تدفق ودمج البيانات',
        fields: [
          { key: 'Google Sheets URLs', labelEn: 'Connected Google Sheets URLs', labelAr: 'روابط جداول بيانات Google المرتبطة' },
          { key: 'Ingestion Webhook Endpoint', labelEn: 'Ingestion Webhook Endpoint', labelAr: 'عنوان Webhook لاستقبال البيانات' },
          { key: 'API Authentication Secret', labelEn: 'API Secret Key & Token', labelAr: 'مفتاح أمان واجهة البرمجة API', isSensitive: true },
          { key: 'Sync Frequency', labelEn: 'Sync Interval (Real-time / Hourly / Daily)', labelAr: 'معدل وتكرار المزامنة التلقائية' },
          { key: 'Sampling Percentage', labelEn: 'Auto-Sampling Target Rate %', labelAr: 'نسبة أخذ العينات العشوائية التلقائية' },
          { key: 'Critical Alert Channel', labelEn: 'Critical Incident Escalation Channel', labelAr: 'قناة تصعيد الحوادث الحرجة' }
        ]
      }
    ]
  }
];

// -------------------------------------------------------------
// Products & Services (Catalog) Metadata
// -------------------------------------------------------------
const PRODUCTS_SERVICES_TABS: ModuleTabMetadata[] = [
  {
    id: 'Dashboard',
    labelEn: 'Catalog Dashboard & Overview',
    labelAr: 'لوحة تحكم الكتالوج والمؤشرات',
    icon: LayoutDashboard,
    actions: [
      { id: 'view_catalog_dashboard', labelEn: 'View Executive Dashboard & KPIs', labelAr: 'عرض المؤشرات التنفيذية للكتالوج', category: 'crud', description: 'Access catalog executive KPIs, stock valuation, and active SKU summaries' },
      { id: 'view_low_stock_alerts', labelEn: 'Inspect Low Stock Warnings', labelAr: 'متابعة تنبيهات انخفاض المخزون', category: 'workflow', description: 'Review critical stock depletion alerts below minimum safety thresholds' },
      { id: 'view_top_margins', labelEn: 'View Top Margin Leaderboard', labelAr: 'استعراض الأصناف الأعلى هامش ربح', category: 'workflow', description: 'Inspect ranked list of top performing products by profit margin percentage' },
      { id: 'export_catalog_csv', labelEn: 'Export Catalog Items to CSV', labelAr: 'تصدير بيانات الكتالوج إلى CSV', category: 'export', description: 'Export full catalog inventory, prices, costs, and specifications to spreadsheet' },
      { id: 'import_catalog_csv', labelEn: 'Bulk Import Catalog CSV', labelAr: 'استيراد أصناف الكتالوج عبر CSV', category: 'sensitive', description: 'Upload external CSV file to bulk import or update products and services' },
      { id: 'seed_sample_catalog', labelEn: 'Preload Sample Catalog Data', labelAr: 'تغذية بيانات تجريبية للكتالوج', category: 'sensitive', description: 'Load standardized demonstration catalog items, price lists, and coupons' }
    ],
    sections: [
      {
        key: 'catalog_kpi_metrics',
        labelEn: 'Catalog Overview & Executive KPIs',
        labelAr: 'المؤشرات التنفيذية للكتالوج',
        fields: [
          { key: 'Total SKUs Count', labelEn: 'Total Active SKUs', labelAr: 'إجمالي الأكواد والمنتجات النشطة' },
          { key: 'Physical Products Count', labelEn: 'Physical Products Count', labelAr: 'عدد المنتجات المادية' },
          { key: 'Service Solutions Count', labelEn: 'Service Solutions Count', labelAr: 'عدد الخدمات والحلول' },
          { key: 'Stock Valuation', labelEn: 'Physical Inventory Valuation', labelAr: 'القيمة المالية للمخزون', isSensitive: true },
          { key: 'Total Units On Hand', labelEn: 'Total Physical Units On Hand', labelAr: 'إجمالي الوحدات المتوفرة بالمخزون' },
          { key: 'Low Stock Alerts Count', labelEn: 'Active Low Stock Alerts Count', labelAr: 'عدد تنبيهات نفاد المخزون' },
          { key: 'Average Catalog Margin', labelEn: 'Average Catalog Margin %', labelAr: 'متوسط هامش ربح الكتالوج %' }
        ]
      },
      {
        key: 'inventory_health_alerts',
        labelEn: 'Stock Health & Depletion Warnings',
        labelAr: 'صحة المخزون وتنبيهات النفاد',
        fields: [
          { key: 'Low Stock Item SKU', labelEn: 'Depleted Item SKU Code', labelAr: 'كود الصنف المنخفض' },
          { key: 'Low Stock Item Name', labelEn: 'Low Stock Item Name', labelAr: 'اسم الصنف المنخفض' },
          { key: 'Current Stock Remaining', labelEn: 'Remaining Stock Units on Hand', labelAr: 'الكمية المتبقية في المخزن' },
          { key: 'Safety Stock Threshold', labelEn: 'Minimum Safety Stock Threshold', labelAr: 'الحد الأدنى للأمان' },
          { key: 'Urgent Restock Flag', labelEn: 'Urgent Restock Action Flag', labelAr: 'مؤشر إعادة الطلب العاجل' }
        ]
      },
      {
        key: 'top_margin_leaderboard',
        labelEn: 'Top Margin Performance Telemetry',
        labelAr: 'المتصدرين في هوامش الربحية',
        fields: [
          { key: 'Top Product Name', labelEn: 'Top Ranked Product / Service Name', labelAr: 'اسم الصنف المتصدر' },
          { key: 'Top Product SKU', labelEn: 'SKU Identifier Code', labelAr: 'كود الصنف' },
          { key: 'Top Product Classification', labelEn: 'Product vs Service Classification', labelAr: 'تصنيف منتج أو خدمة' },
          { key: 'Unit Margin Value', labelEn: 'Net Profit Spread Per Unit', labelAr: 'صافي الربح للوحدة الواحدة', isSensitive: true },
          { key: 'Profit Margin Percentage', labelEn: 'Profit Margin Percentage %', labelAr: 'نسبة هامش الربح %' }
        ]
      }
    ]
  },
  {
    id: 'Items Directory',
    labelEn: 'Items Directory & Specifications',
    labelAr: 'دليل الأصناف والمواصفات',
    icon: Package,
    actions: [
      { id: 'view_items_directory', labelEn: 'Browse Items Directory', labelAr: 'تصفح دليل الأصناف والمنتجات', category: 'crud', description: 'View full products and services catalog in board cards and tabular data views' },
      { id: 'filter_items_directory', labelEn: 'Filter Items by Type & Stock', labelAr: 'تصفية الأصناف بالتصنيف والمخزون', category: 'workflow', description: 'Filter items by physical product or service, category groups, and stock alerts' },
      { id: 'create_catalog_item', labelEn: 'Create New Product / Service', labelAr: 'إضافة منتج أو خدمة جديدة', category: 'crud', description: 'Author and publish new catalog specifications with pricing, cost, and stock' },
      { id: 'edit_catalog_item', labelEn: 'Edit Item Specifications', labelAr: 'تعديل مواصفات الصنف', category: 'crud', description: 'Update item descriptions, selling prices, direct costs, and operational links' },
      { id: 'delete_catalog_item', labelEn: 'Delete Catalog Item', labelAr: 'حذف صنف من الكتالوج', category: 'sensitive', description: 'Permanently remove a product or service specification from the catalog' },
      { id: 'toggle_item_pricing_type', labelEn: 'Toggle Variable Cost & Pricing', labelAr: 'تفعيل خيارات التكلفة والسعر المرن', category: 'workflow', description: 'Enable variable project operational costs and flexible quoting flags' },
      { id: 'link_item_sop', labelEn: 'Link Standard Operating Procedure', labelAr: 'ربط إجراءات التشغيل القياسية SOP', category: 'workflow', description: 'Connect catalog service to ISO-standard operating procedure execution guidelines' },
      { id: 'link_item_process_mapping', labelEn: 'Link Process Architecture Workflow', labelAr: 'ربط هيكل ومخطط العمليات', category: 'workflow', description: 'Attach catalog item to company visual process mapping architecture' }
    ],
    sections: [
      {
        key: 'item_classification_specs',
        labelEn: 'Item Classification & Basic Specs',
        labelAr: 'تصنيف الصنف والمواصفات الأساسية',
        fields: [
          { key: 'Item ID', labelEn: 'Item Database ID', labelAr: 'معرف الصنف في النظام' },
          { key: 'Item Classification', labelEn: 'Item Type (Physical Product vs Service Solution)', labelAr: 'نوع الصنف (منتج مادي / خدمة وحل)' },
          { key: 'Item Name', labelEn: 'Item Official Name', labelAr: 'اسم الصنف أو الخدمة' },
          { key: 'SKU Code', labelEn: 'SKU / Catalog Code', labelAr: 'رمز الصنف الفريد SKU' },
          { key: 'Category', labelEn: 'Industry Category Classification', labelAr: 'التصنيف الصناعي أو الفئة' },
          { key: 'Description', labelEn: 'Technical Scope & Description', labelAr: 'الوصف ونطاق العمل' }
        ]
      },
      {
        key: 'financial_pricing_fields',
        labelEn: 'Financials, Direct Costs & VAT Taxes',
        labelAr: 'التسعير، التكاليف المباشرة والضريبة',
        fields: [
          { key: 'Selling Price', labelEn: 'Standard Selling Price', labelAr: 'سعر البيع الأساسي', isSensitive: true },
          { key: 'Currency', labelEn: 'Pricing Currency (USD, SAR, EGP, AED, EUR)', labelAr: 'عملة التسعير' },
          { key: 'Direct Cost', labelEn: 'Production / Direct Delivery Cost', labelAr: 'تكلفة الإنتاج أو التنفيذ المباشرة', isSensitive: true },
          { key: 'VAT Rate', labelEn: 'Tax VAT Rate Percentage (%)', labelAr: 'نسبة ضريبة القيمة المضافة (%)' },
          { key: 'Net Unit Margin', labelEn: 'Net Unit Profit Margin Spread', labelAr: 'صافي الربح للوحدة', isSensitive: true },
          { key: 'Markup Percentage', labelEn: 'Gross Profit Markup Percentage (%)', labelAr: 'نسبة هامش الربح الإجمالي (%)', isSensitive: true },
          { key: 'Variable Cost Flag', labelEn: 'Variable Cost Permitted Flag', labelAr: 'مؤشر السماح بتكلفة متغيرة' },
          { key: 'Variable Price Flag', labelEn: 'Variable Price Permitted Flag', labelAr: 'مؤشر السماح بسعر بيع مرن' }
        ]
      },
      {
        key: 'operational_inventory_fields',
        labelEn: 'Inventory Tracking & Operational Linkages',
        labelAr: 'تتبع المخزون والربط التشغيلي',
        fields: [
          { key: 'Stock Quantity', labelEn: 'Physical Stock on Hand (Units)', labelAr: 'الكمية المتوفرة بالمخزن' },
          { key: 'Low Stock Threshold', labelEn: 'Minimum Safety Stock Alert Threshold', labelAr: 'الحد الأدنى لتنبيه نقص المخزون' },
          { key: 'Service Duration Hours', labelEn: 'Standard Delivery Hours (Services)', labelAr: 'ساعات تقديم الخدمة القياسية' },
          { key: 'Linked SOP ID', labelEn: 'Linked Standard Operating Procedure (SOP)', labelAr: 'إجراء التشغيل القياسي المرتبط' },
          { key: 'Linked Process Mapping ID', labelEn: 'Linked Process Architecture Blueprint ID', labelAr: 'مخطط سير العمل المرتبط' }
        ]
      }
    ]
  },
  {
    id: 'Prices & Promo Codes',
    labelEn: 'Multi-Tier Price Lists & Promo Codes',
    labelAr: 'قوائم الأسعار وكوبونات الخصم',
    icon: Tag,
    actions: [
      { id: 'view_price_lists', labelEn: 'Browse Multi-Tier Price Lists', labelAr: 'استعراض قوائم الأسعار المتعددة', category: 'crud', description: 'Access wholesale, distributor, VIP corporate, and seasonal price profiles' },
      { id: 'create_price_list', labelEn: 'Create New Price List Profile', labelAr: 'إنشاء قائمة أسعار جديدة', category: 'crud', description: 'Define new tiered commercial pricing profile with name and description' },
      { id: 'edit_price_list', labelEn: 'Edit Price List Profile', labelAr: 'تعديل ملف قائمة الأسعار', category: 'crud', description: 'Update price list profile details, qualification rules, and active state' },
      { id: 'delete_price_list', labelEn: 'Delete Price List Profile', labelAr: 'حذف قائمة الأسعار', category: 'sensitive', description: 'Permanently remove price list tier and clear custom item override rates' },
      { id: 'manage_price_overrides', labelEn: 'Configure Item Price Overrides', labelAr: 'تحديد الأسعار الاستثنائية للأصناف', category: 'sensitive', description: 'Set item-level price overrides within selected wholesale or partner profile' },
      { id: 'view_promo_codes', labelEn: 'Browse Discount Coupons & Vouchers', labelAr: 'استعراض كوبونات الخصم والقسائم', category: 'crud', description: 'View active and expired promotional vouchers and campaign discounts' },
      { id: 'create_promo_code', labelEn: 'Create New Promo Coupon Code', labelAr: 'إنشاء كود خصم جديد', category: 'crud', description: 'Issue marketing promo coupon with percentage discount or fixed cash value' },
      { id: 'copy_promo_code', labelEn: 'Copy Coupon Code to Clipboard', labelAr: 'نسخ كود الخصم للحافظة', category: 'workflow', description: 'Quick copy promotional coupon code for customer sales quotes' },
      { id: 'delete_promo_code', labelEn: 'Delete Promotional Voucher', labelAr: 'حذف كوبون الخصم', category: 'sensitive', description: 'Revoke and delete marketing promotion coupon code permanently' }
    ],
    sections: [
      {
        key: 'price_list_profiles',
        labelEn: 'Multi-Tier Price Profiles & Override Matrix',
        labelAr: 'ملفات قوائم الأسعار والأسعار الاستثنائية',
        fields: [
          { key: 'Price List ID', labelEn: 'Price List Profile ID', labelAr: 'معرف قائمة الأسعار' },
          { key: 'Price List Name', labelEn: 'Price List Profile Name (Wholesale/VIP/Distributor)', labelAr: 'اسم قائمة الأسعار' },
          { key: 'Price List Description', labelEn: 'Tier Description & Qualification Criteria', labelAr: 'وصف وشروط قائمة الأسعار' },
          { key: 'Price List Active Status', labelEn: 'Price List Active Status', labelAr: 'حالة تفعيل القائمة' },
          { key: 'Item Override Price', labelEn: 'Item Override Unit Price', labelAr: 'السعر المخصص للصنف', isSensitive: true },
          { key: 'Override Delta %', labelEn: 'Markup / Discount Delta vs Base Price', labelAr: 'نسبة الفارق عن السعر الأساسي' }
        ]
      },
      {
        key: 'promo_code_vouchers',
        labelEn: 'Discount Coupons & Promotional Vouchers',
        labelAr: 'قسائم التخفيض وكوبونات الترويج',
        fields: [
          { key: 'Promo Code Text', labelEn: 'Promotional Coupon Voucher Code', labelAr: 'كود القسيمة الترويجية' },
          { key: 'Discount Type', labelEn: 'Discount Type (Percentage % vs Fixed Amount)', labelAr: 'نوع الخصم (نسبة مئوية / مبلغ ثابت)' },
          { key: 'Discount Value', labelEn: 'Discount Rate or Cash Value', labelAr: 'قيمة أو نسبة الخصم', isSensitive: true },
          { key: 'Expiry Date', labelEn: 'Voucher Expiration Date & Time', labelAr: 'تاريخ انتهاء صلاحية الكوبون' },
          { key: 'Promo Active Status', labelEn: 'Coupon Active / Enabled Status', labelAr: 'حالة تفعيل كود الخصم' },
          { key: 'Voucher Usage Logs', labelEn: 'Voucher Usage & Redemption Tracking', labelAr: 'سجل استخدام واستبدال الكوبون' }
        ]
      }
    ]
  },
  {
    id: 'Profitability Analytics',
    labelEn: 'Profitability Analytics & Margin Audits',
    labelAr: 'تحليلات الربحية وتدقيق الهوامش',
    icon: BarChart3,
    actions: [
      { id: 'view_margin_analytics', labelEn: 'View Profitability Intelligence & KPIs', labelAr: 'عرض مؤشرات وتحليلات الربحية', category: 'crud', description: 'Access executive margin benchmarks, weighted markup, and distribution metrics' },
      { id: 'filter_margin_tiers', labelEn: 'Filter by Margin Classification Tier', labelAr: 'تصفية الأصناف بفئات الربحية', category: 'workflow', description: 'Segment catalog across High (>50%), Healthy (20-50%), Thin (<20%), and Negative margins' },
      { id: 'audit_negative_margins', labelEn: 'Audit Negative Margin Losses', labelAr: 'تدقيق الخسائر وهوامش الربح السلبية', category: 'sensitive', description: 'Investigate products selling below cost to halt financial losses' },
      { id: 'export_margin_audit', labelEn: 'Export Profitability Audit Sheet', labelAr: 'تصدير كشف تدقيق الربحية إلى Excel', category: 'export', description: 'Download complete unit economics and profit margin audit spreadsheet' }
    ],
    sections: [
      {
        key: 'margin_summary_metrics',
        labelEn: 'Catalog Profitability Benchmarks & Health',
        labelAr: 'معايير وصحة ربحية الكتالوج',
        fields: [
          { key: 'Average Weighted Markup', labelEn: 'Average Weighted Markup %', labelAr: 'متوسط نسبة الربح المرجحة %', isSensitive: true },
          { key: 'High Margin Items Count', labelEn: 'High Margin Items Count (>50%)', labelAr: 'عدد الأصناف عالية الربحية (>50%)' },
          { key: 'Healthy Margin Items Count', labelEn: 'Healthy Margin Items Count (20-50%)', labelAr: 'عدد الأصناف المعتدلة الربحية (20-50%)' },
          { key: 'Thin Margin Items Count', labelEn: 'Thin Margin Items Count (<20%)', labelAr: 'عدد الأصناف منخفضة الهامش (<20%)' },
          { key: 'Negative Margin Count', labelEn: 'Negative Margin Loss-Making Items Count', labelAr: 'عدد الأصناف الخاسرة', isSensitive: true }
        ]
      },
      {
        key: 'item_unit_economics_audit',
        labelEn: 'Item Unit Economics & Direct Profitability',
        labelAr: 'اقتصاديات الوحدة وتدقيق الربحية المباشرة',
        fields: [
          { key: 'Audit SKU Code', labelEn: 'Audited SKU Identifier Code', labelAr: 'رمز الصنف المدقق' },
          { key: 'Audit Item Name', labelEn: 'Audited Product / Service Name', labelAr: 'اسم الصنف المدقق' },
          { key: 'Classification Type', labelEn: 'Product vs Service Classification', labelAr: 'نوع الصنف (منتج/خدمة)' },
          { key: 'Selling Price Base', labelEn: 'Standard Selling Price', labelAr: 'سعر البيع المعتمد', isSensitive: true },
          { key: 'Production Direct Cost', labelEn: 'Direct Operational Delivery Cost', labelAr: 'تكلفة التنفيذ أو الشراء', isSensitive: true },
          { key: 'Net Profit Spread', labelEn: 'Net Profit Dollar Spread Per Unit', labelAr: 'فارق صافي الربح المالي', isSensitive: true },
          { key: 'Markup Percentage Calculation', labelEn: 'Calculated Markup Percentage %', labelAr: 'نسبة هامش الربح المحسوبة %', isSensitive: true },
          { key: 'Profitability Tier Flag', labelEn: 'Profitability Tier Classification Tag', labelAr: 'تصنيف شريحة الربحية' }
        ]
      }
    ]
  },
  {
    id: 'Cross-Module Integrations',
    labelEn: 'Cross-Module Integrations & Sales Simulator',
    labelAr: 'الربط التشغيلي ومحاكي عروض الأسعار',
    icon: Share2,
    actions: [
      { id: 'view_integrations_hub', labelEn: 'Access Workflow Integrations Hub', labelAr: 'دخول مساحة الربط التشغيلي', category: 'crud', description: 'Access integration bridges across CRM deals, ERP inventory, and Accounting' },
      { id: 'run_quote_simulator', labelEn: 'Run Live Quote & Deal Simulator', labelAr: 'تشغيل محاكي عروض الأسعار التفاعلي', category: 'workflow', description: 'Simulate live sales quotes applying customer accounts, price lists, and coupons' },
      { id: 'select_crm_customer', labelEn: 'Select Target CRM Client Account', labelAr: 'اختيار حساب العميل من CRM', category: 'workflow', description: 'Bind commercial quotation to specific CRM enterprise client' },
      { id: 'apply_quote_price_tier', labelEn: 'Apply Custom Price List Tier in Quote', labelAr: 'تطبيق قائمة أسعار مخصصة بالعرض', category: 'workflow', description: 'Test and apply custom tiered price overrides for selected partner' },
      { id: 'apply_quote_promo', labelEn: 'Apply Promotional Coupon to Quote', labelAr: 'تطبيق كود الخصم في العرض', category: 'workflow', description: 'Validate and deduct promotional discount codes in real time' },
      { id: 'modify_quote_lines', labelEn: 'Add and Adjust Line Items & Quantities', labelAr: 'إضافة وتعديل بنود وكميات العرض', category: 'workflow', description: 'Add products and services, modify quantities, and recalculate subtotals' },
      { id: 'post_quote_to_ledger', labelEn: 'Post Invoice to General Ledger', labelAr: 'ترحيل الفاتورة إلى دفتر الأستاذ العام', category: 'sensitive', description: 'Push finalized commercial quote to Accounting Hub and ledger transaction records' },
      { id: 'view_invoice_audit_logs', labelEn: 'View Synchronized Invoice Audit Logs', labelAr: 'استعراض سجل فواتير المحاسبة المرحلة', category: 'crud', description: 'Review transaction ledger of all quotes pushed to accounting with reference IDs' }
    ],
    sections: [
      {
        key: 'quote_simulator_parameters',
        labelEn: 'Quote Simulator Configuration & Client Binding',
        labelAr: 'إعدادات محاكي العروض وبيانات العميل',
        fields: [
          { key: 'Selected CRM Customer', labelEn: 'Target CRM Client Account', labelAr: 'حساب العميل المستهدف' },
          { key: 'Selected Pricing Tier', labelEn: 'Applied Price List Tier Profile', labelAr: 'مستوى قائمة الأسعار المطبق' },
          { key: 'Applied Promo Code', labelEn: 'Applied Promo Voucher Code', labelAr: 'كود القسيمة المطبق' },
          { key: 'Promo Discount Calculated', labelEn: 'Calculated Promo Discount Amount', labelAr: 'قيمة الخصم المحسوبة', isSensitive: true },
          { key: 'Simulation Validation Status', labelEn: 'Commercial Quotation Validation State', labelAr: 'حالة التحقق التجاري' }
        ]
      },
      {
        key: 'quote_line_items_financials',
        labelEn: 'Quote Line Items & Financial Computations',
        labelAr: 'بنود العرض والحسابات المالية',
        fields: [
          { key: 'Line Item Product', labelEn: 'Selected Catalog Item & SKU Code', labelAr: 'الصنف وكود SKU المختار' },
          { key: 'Line Item Quantity', labelEn: 'Order Quantity (Units / Hours)', labelAr: 'الكمية المطلوبة (وحدات / ساعات)' },
          { key: 'Effective Unit Price', labelEn: 'Effective Unit Price After Tier Override', labelAr: 'سعر الوحدة بعد تطبيق الفئة', isSensitive: true },
          { key: 'Line Subtotal', labelEn: 'Line Subtotal Before VAT', labelAr: 'إجمالي البند قبل الضريبة', isSensitive: true },
          { key: 'Line Tax Value', labelEn: 'Calculated VAT Tax Amount', labelAr: 'قيمة ضريبة القيمة المضافة المحسوبة', isSensitive: true },
          { key: 'Quote Subtotal', labelEn: 'Order Gross Subtotal', labelAr: 'المجموع الفرعي للطلب', isSensitive: true },
          { key: 'Quote Total Tax', labelEn: 'Total Order Accumulated VAT', labelAr: 'إجمالي قيمة الضريبة للطلب', isSensitive: true },
          { key: 'Grand Total Receivable', labelEn: 'Final Grand Total Receivable', labelAr: 'المبلغ الإجمالي المستحق للدفع', isSensitive: true }
        ]
      },
      {
        key: 'ledger_posting_audit',
        labelEn: 'General Ledger Posting & Invoice Logs',
        labelAr: 'الترحيل المحاسبي وسجل الفواتير',
        fields: [
          { key: 'Posted Invoice ID', labelEn: 'Generated Invoice Reference # (INV-SIM-XXXXX)', labelAr: 'رقم الفاتورة المرجعي المولد' },
          { key: 'Transaction Date', labelEn: 'Invoice Dispatch & Posting Date', labelAr: 'تاريخ ترحيل المعاملة' },
          { key: 'Customer Name Log', labelEn: 'Customer Account Recorded in Ledger', labelAr: 'اسم العميل في دفتر الأستاذ' },
          { key: 'Total Posted Amount', labelEn: 'Total Financial Value Posted to Ledger', labelAr: 'القيمة الإجمالية المرحلة للمحاسبة', isSensitive: true },
          { key: 'Accounting Sync Status', labelEn: 'General Ledger Synchronization Status', labelAr: 'حالة المزامنة مع الحسابات' }
        ]
      }
    ]
  }
];

export const PRODUCTS_SERVICES_MODULE: ModuleMetadata = {
  id: 'Products/Services',
  canonicalId: 'Products/Services',
  nameEn: 'Products & Services',
  nameAr: 'المنتجات والخدمات',
  icon: Package,
  descriptionEn: 'Centralized catalog specifications, multi-tier pricing sheets, margin audits, and CRM quote generator.',
  descriptionAr: 'دليل المنتجات والخدمات، قوائم الأسعار متعددة المستويات، تدقيق هوامش الربح وربط عروض الأسعار.',
  color: '#F59E0B',
  tabs: PRODUCTS_SERVICES_TABS,
  settingsLabelEn: 'Catalog Settings & Integrations',
  settingsLabelAr: 'إعدادات الكتالوج والربط'
};

// -------------------------------------------------------------
// Master Modules Registry - Home / Workspace
// -------------------------------------------------------------
const HOME_TABS: ModuleTabMetadata[] = [
  // Parent Group 1: Overview & Quick Actions
  {
    id: 'Overview & Quick Actions',
    labelEn: 'Overview & Quick Actions',
    labelAr: 'نظرة عامة والإجراءات السريعة',
    icon: LayoutDashboard,
    actions: [
      { id: 'new_button', labelEn: 'Show "New..." Action Menu Button', labelAr: 'زر إنشاء جديد السريع (+ New...)' },
      { id: 'edit_layout', labelEn: 'Show "Edit Layout" Customizer Button', labelAr: 'زر تخصيص وترتيب البطاقات (Edit Layout)' },
      { id: 'continue_tour', labelEn: 'View Guided Onboarding Tour Banner', labelAr: 'عرض شريط جولة النظام الإرشادية' },
      { id: 'welcome_to_systo_biz', labelEn: 'View Welcome Onboarding Card', labelAr: 'عرض بطاقة الترحيب والإرشادات' }
    ],
    sections: [
      {
        key: 'overview_controls',
        labelEn: 'Overview Controls & Tour',
        labelAr: 'أدوات الترويسة وجولة النظام',
        fields: [
          { key: 'new_action_menu', labelEn: 'Quick New Action Dropdown', labelAr: 'قائمة إنشاء جديد السريع' },
          { key: 'layout_customizer', labelEn: 'Layout Customizer Modal', labelAr: 'نافذة تخصيص وترتيب البطاقات' },
          { key: 'guided_tour_progress', labelEn: 'Tour Progress Percentage', labelAr: 'نسبة تقدم جولة النظام' },
          { key: 'welcome_card_roster', labelEn: 'Total Team Count Banner', labelAr: 'إحصائية إجمالي الموظفين' }
        ]
      }
    ]
  },

  // Parent Group 2: My Workplace
  {
    id: 'My Workplace',
    labelEn: 'My Workplace',
    labelAr: 'مساحة عملي الشخصية',
    icon: Briefcase,
    actions: [
      { id: 'my_stuff', labelEn: 'View Personal Stuff & Work Items', labelAr: 'عرض أشيائي وملفاتي ومهامي الشخصية' },
      { id: 'time_off', labelEn: 'View Personal Leave Quota & Balances', labelAr: 'عرض رصيد الإجازات الشخصي' },
      { id: 'request_time_off', labelEn: 'Request Leave / Time Off', labelAr: 'تقديم طلب إجازة' },
      { id: 'recognition_kudos', labelEn: 'View Recognition & Kudos Wall', labelAr: 'عرض حائط الشكر والتقدير' },
      { id: 'give_kudos_points', labelEn: 'Give Recognition & Kudos Points', labelAr: 'إرسال بطاقة شكر ومكافأة' }
    ],
    sections: [
      {
        key: 'personal_workplace',
        labelEn: 'Personal Items & Self-Service',
        labelAr: 'عناصر مساحة العمل والخدمات الذاتية',
        fields: [
          { key: 'my_goals_training', labelEn: 'Goals & Training Courses', labelAr: 'الأهداف والدورات التدريبية' },
          { key: 'my_payroll_rewards', labelEn: 'Payroll & Total Rewards', labelAr: 'الرواتب والمكافآت الإجمالية' },
          { key: 'available_leave_days', labelEn: 'Available Leave Days', labelAr: 'أيام الإجازات السنوية المتاحة' },
          { key: 'kudos_points_balance', labelEn: 'Recognition Points Wallet', labelAr: 'رصيد نقاط التقدير والمكافآت' }
        ]
      }
    ]
  },

  // Parent Group 3: Team & Hierarchy
  {
    id: 'Team & Hierarchy',
    labelEn: 'Team & Hierarchy',
    labelAr: 'فريق العمل والتسلسل الإداري',
    icon: Users,
    actions: [
      { id: 'my_direct_reports', labelEn: 'View Subordinate Team Cards', labelAr: 'عرض بطاقات أعضاء الفريق المباشر' },
      { id: 'whos_out', labelEn: "View Who's Out Today Telemetry", labelAr: 'عرض المتغيبين والمجازين اليوم' },
      { id: 'celebrations', labelEn: 'View Birthdays & Anniversaries', labelAr: 'عرض مناسبات وأعياد ميلاد الزملاء' },
      { id: 'employee_distribution', labelEn: 'View Department Breakdown Map', labelAr: 'عرض توزيع الموظفين حسب القسم' }
    ],
    sections: [
      {
        key: 'team_roster_telemetry',
        labelEn: 'Workforce Telemetry & Presence',
        labelAr: 'بيانات وإحصائيات القوى العاملة والحضور',
        fields: [
          { key: 'direct_reports_cards', labelEn: 'Subordinate Employee Cards', labelAr: 'بطاقات الموظفين التابعين' },
          { key: 'headcount_total', labelEn: 'Department Headcount Figures', labelAr: 'أرقام وإحصائيات القوة العاملة' },
          { key: 'today_absent_list', labelEn: 'Today Out of Office Colleagues', labelAr: 'قائمة الغائبين والمجازين اليوم' },
          { key: 'birthdays_calendar', labelEn: 'Birthdays & Work Anniversaries', labelAr: 'أعياد الميلاد والذكرى السنوية' },
          { key: 'department_pie_chart', labelEn: 'Department Share Percentages', labelAr: 'نسب توزيع الأقسام' }
        ]
      }
    ]
  },

  // Parent Group 4: Company Bulletins & Approvals
  {
    id: 'Company Bulletins & Approvals',
    labelEn: 'Company Bulletins & Approvals',
    labelAr: 'إعلانات الشركة والاعتمادات المعلقة',
    icon: Clock,
    actions: [
      { id: 'whats_happening', labelEn: 'View Company Bulletins & Feed', labelAr: 'عرض لوحة إعلانات وأخبار الشركة' },
      { id: 'post_announcement', labelEn: 'Post Announcements', labelAr: 'نشر إعلانات جديدة' },
      { id: 'pending_time_off', labelEn: 'View Pending Leaves Queue', labelAr: 'عرض قائمة طلبات الإجازات المعلقة' },
      { id: 'approve_pending_leave', labelEn: 'Approve Leave Requests', labelAr: 'الموافقة على طلبات الإجازة' },
      { id: 'reject_pending_leave', labelEn: 'Reject Leave Requests', labelAr: 'رفض طلبات الإجازة' },
      { id: 'time_off_used', labelEn: 'View Real-time Used Leaves Chart', labelAr: 'عرض مخطط الإجازات المستهلكة المباشر' },
      { id: 'company_links', labelEn: 'View Corporate Portals & Links', labelAr: 'عرض روابط بوابات الشركة الرسمية' },
      { id: 'invite_your_team', labelEn: 'View Invite Team Box', labelAr: 'عرض بطاقة دعوة الفريق' },
      { id: 'send_team_invite', labelEn: 'Send Team Invitations', labelAr: 'إرسال دعوات الانضمام بالبريد' }
    ],
    sections: [
      {
        key: 'management_bulletins',
        labelEn: 'Managerial Approvals & Portals',
        labelAr: 'الاعتمادات الإدارية وروابط الشركة',
        fields: [
          { key: 'pending_requests_queue', labelEn: 'Pending Subordinate Requests', labelAr: 'قائمة الطلبات المعلقة للمرؤوسين' },
          { key: 'realtime_leave_metrics', labelEn: 'Consumed Leaves Graph', labelAr: 'رسم بياني للإجازات المستهلكة' },
          { key: 'corporate_links_directory', labelEn: 'Handbook & Insurance Links', labelAr: 'دليل العمل وروابط التأمين' },
          { key: 'official_announcements', labelEn: 'Company Announcements Feed', labelAr: 'لوحة الإعلانات الرسمية' },
          { key: 'invite_team_modal', labelEn: 'Team Member Invitation Form', labelAr: 'نموذج دعوة أعضاء الفريق' }
        ]
      }
    ]
  },

  // Granular Sub-Tabs / Specific Dashboard Sections
  {
    id: 'pending_time_off',
    labelEn: 'Pending Time Off Requests',
    labelAr: 'طلبات الإجازات المعلقة للمدير',
    icon: Clock,
    parentId: 'Company Bulletins & Approvals',
    actions: [
      { id: 'view_pending_leaves', labelEn: 'View Pending Leaves Queue', labelAr: 'عرض قائمة طلبات الإجازات المعلقة' },
      { id: 'approve_pending_leave', labelEn: 'Approve Leave Requests', labelAr: 'الموافقة على طلبات الإجازة' },
      { id: 'reject_pending_leave', labelEn: 'Reject Leave Requests', labelAr: 'رفض طلبات الإجازة' }
    ]
  },
  {
    id: 'recognition_kudos',
    labelEn: 'Recognition & Kudos',
    labelAr: 'شهادات التقدير والمكافآت',
    icon: Award,
    parentId: 'My Workplace',
    actions: [
      { id: 'view_recognition_feed', labelEn: 'View Recognition Wall', labelAr: 'عرض حائط الشكر والتقدير' },
      { id: 'give_kudos_points', labelEn: 'Give Recognition & Kudos', labelAr: 'إرسال بطاقة شكر ومكافأة' }
    ]
  },
  {
    id: 'time_off_used',
    labelEn: 'Time Off Used (Real-time)',
    labelAr: 'رصيد الإجازات المستهلكة المباشر',
    icon: Percent,
    parentId: 'Company Bulletins & Approvals',
    actions: [
      { id: 'view_time_off_used_chart', labelEn: 'View Real-time Used Leaves Chart', labelAr: 'عرض مخطط الإجازات المستهلكة المباشر' }
    ]
  },
  {
    id: 'employee_distribution',
    labelEn: 'Employee Distribution',
    labelAr: 'توزيع الموظفين والأقسام',
    icon: MapPin,
    parentId: 'Team & Hierarchy',
    actions: [
      { id: 'view_distribution_map', labelEn: 'View Department Breakdown', labelAr: 'عرض توزيع الموظفين حسب القسم' }
    ]
  },
  {
    id: 'company_links',
    labelEn: 'Company Links',
    labelAr: 'روابط الشركة والمواقع الرسمية',
    icon: Share2,
    parentId: 'Company Bulletins & Approvals',
    actions: [
      { id: 'view_company_links', labelEn: 'View Corporate Portals & Links', labelAr: 'عرض روابط بوابات الشركة الرسمية' }
    ]
  },
  {
    id: 'welcome_to_systo_biz',
    labelEn: 'Welcome to Systo Biz',
    labelAr: 'بطاقة الترحيب والإرشادات',
    icon: Sparkles,
    parentId: 'Overview & Quick Actions',
    actions: [
      { id: 'view_welcome_card', labelEn: 'View Welcome Onboarding Card', labelAr: 'عرض بطاقة الترحيب الإرشادية' }
    ]
  },
  {
    id: 'celebrations',
    labelEn: 'Celebrations',
    labelAr: 'المناسبات وأعياد الميلاد والذكرى السنوية',
    icon: Coffee,
    parentId: 'Team & Hierarchy',
    actions: [
      { id: 'view_celebrations_feed', labelEn: 'View Birthdays & Anniversaries', labelAr: 'عرض مناسبات وأعياد ميلاد الزملاء' }
    ]
  },
  {
    id: 'whos_out',
    labelEn: "Who's Out",
    labelAr: 'المتغيبون والمجازون اليوم',
    icon: Users,
    parentId: 'Team & Hierarchy',
    actions: [
      { id: 'view_whos_out_today', labelEn: "View Who's Out Today Telemetry", labelAr: 'عرض المتغيبين والمجازين اليوم' }
    ]
  },
  {
    id: 'my_direct_reports',
    labelEn: 'My Direct Reports & Team',
    labelAr: 'فريق العمل والمرؤوسون المباشرون',
    icon: Network,
    parentId: 'Team & Hierarchy',
    actions: [
      { id: 'view_direct_reports', labelEn: 'View Subordinate Team Cards', labelAr: 'عرض بطاقات أعضاء الفريق المباشر' }
    ]
  },
  {
    id: 'my_stuff',
    labelEn: 'My Stuff',
    labelAr: 'أشيائي وملفاتي ومهامي الشخصية',
    icon: Briefcase,
    parentId: 'My Workplace',
    actions: [
      { id: 'view_my_stuff', labelEn: 'View Personal Stuff & Work Items', labelAr: 'عرض الملفات والدورات والمهام الشخصية' }
    ]
  },
  {
    id: 'whats_happening',
    labelEn: "What's happening at Systo Biz",
    labelAr: 'أحدث الأخبار والإعلانات العامة',
    icon: Megaphone,
    parentId: 'Company Bulletins & Approvals',
    actions: [
      { id: 'view_announcements', labelEn: 'View Company Bulletins & Feed', labelAr: 'عرض لوحة إعلانات وأخبار الشركة' }
    ]
  },
  {
    id: 'time_off',
    labelEn: 'Time Off',
    labelAr: 'الإجازات وأرصدة الراحة',
    icon: Calendar,
    parentId: 'My Workplace',
    actions: [
      { id: 'view_time_off_balances', labelEn: 'View Personal Leave Quota & Balance', labelAr: 'عرض رصيد الإجازات الشخصي' }
    ]
  },
  {
    id: 'invite_your_team',
    labelEn: 'Invite Your Team',
    labelAr: 'دعوة أعضاء الفريق للنظام',
    icon: UserPlus,
    parentId: 'Company Bulletins & Approvals',
    actions: [
      { id: 'view_invite_card', labelEn: 'View Invite Team Box', labelAr: 'عرض بطاقة دعوة الفريق' }
    ]
  },
  {
    id: 'continue_tour',
    labelEn: 'Continue your tour of Systo Biz',
    labelAr: 'جولة النظام الإرشادية',
    icon: Compass,
    parentId: 'Overview & Quick Actions',
    actions: [
      { id: 'view_tour_banner', labelEn: 'View Guided Onboarding Tour Banner', labelAr: 'عرض شريط جولة النظام الإرشادية' }
    ]
  },
  {
    id: 'quick_actions_menu',
    labelEn: 'Quick Action Buttons (New... & Edit Layout)',
    labelAr: 'أزرار الإجراءات السريعة (New و Edit Layout)',
    icon: Sliders,
    parentId: 'Overview & Quick Actions',
    actions: [
      { id: 'new_button', labelEn: 'Show "New..." Action Menu Button', labelAr: 'زر إنشاء جديد السريع (+ New...)' },
      { id: 'edit_layout', labelEn: 'Show "Edit Layout" Customizer Button', labelAr: 'زر تخصيص وترتيب البطاقات (Edit Layout)' }
    ]
  },
  {
    id: 'new_button',
    labelEn: 'New... Action Menu Button',
    labelAr: 'زر إنشاء جديد (+ New...) السريع',
    icon: Plus,
    parentId: 'Overview & Quick Actions',
    actions: [
      { id: 'new_button', labelEn: 'Show "New..." Action Menu Button', labelAr: 'زر إنشاء جديد السريع (+ New...)' }
    ]
  },
  {
    id: 'edit_layout',
    labelEn: 'Edit Layout Customizer Button',
    labelAr: 'زر تخصيص وترتيب البطاقات (Edit Layout)',
    icon: Sliders,
    parentId: 'Overview & Quick Actions',
    actions: [
      { id: 'edit_layout', labelEn: 'Show "Edit Layout" Customizer Button', labelAr: 'زر تخصيص وترتيب البطاقات (Edit Layout)' }
    ]
  }
];

const HOME_MODULE: ModuleMetadata = {
  id: 'Home',
  canonicalId: 'Home',
  nameEn: 'Home / Workspace',
  nameAr: 'الصفحة الرئيسية ومساحة العمل',
  icon: LayoutDashboard,
  descriptionEn: 'Company workspace homepage, employee widget feeds, announcements, team telemetry, and quick action controls.',
  descriptionAr: 'الصفحة الرئيسية للشركة ومساحة العمل، لوحات الإعلانات، إحصائيات الفريق، وأزرار التحكم السريعة.',
  color: '#10B981',
  tabs: HOME_TABS,
  customActions: [
    { id: 'new_button', labelEn: 'Show "New..." Action Menu Button', labelAr: 'زر إنشاء جديد السريع (+ New...)' },
    { id: 'edit_layout', labelEn: 'Show "Edit Layout" Customizer Button', labelAr: 'زر تخصيص وترتيب البطاقات (Edit Layout)' }
  ],
  settingsLabelEn: 'Home Settings',
  settingsLabelAr: 'إعدادات الشاشة الرئيسية'
};

export const SYSTEM_MODULES_REGISTRY: Record<string, ModuleMetadata> = {
  'Home': HOME_MODULE,
  'home': HOME_MODULE,
  'Home / Workspace': HOME_MODULE,
  'Knowledge Base': {
    id: 'Knowledge Base',
    canonicalId: 'Knowledge Base',
    nameEn: 'Knowledge Base',
    nameAr: 'قاعدة المعرفة والتوثيق',
    icon: BookOpen,
    descriptionEn: 'Company knowledge base, articles explorer, rich reader, authoring studio, and taxonomy management.',
    descriptionAr: 'قاعدة المعرفة المؤسسية، مستكشف المقالات، شاشة القراءة المستقلة، استوديو التحرير وإدارة التصنيفات.',
    color: '#3B82F6',
    tabs: KB_TABS,
    settingsLabelEn: 'Knowledge Base Settings',
    settingsLabelAr: 'إعدادات قاعدة المعرفة'
  },
  'kb': {
    id: 'Knowledge Base',
    canonicalId: 'Knowledge Base',
    nameEn: 'Knowledge Base',
    nameAr: 'قاعدة المعرفة والتوثيق',
    icon: BookOpen,
    descriptionEn: 'Company knowledge base, articles explorer, rich reader, authoring studio, and taxonomy management.',
    descriptionAr: 'قاعدة المعرفة المؤسسية، مستكشف المقالات، شاشة القراءة المستقلة، استوديو التحرير وإدارة التصنيفات.',
    color: '#3B82F6',
    tabs: KB_TABS,
    settingsLabelEn: 'Knowledge Base Settings',
    settingsLabelAr: 'إعدادات قاعدة المعرفة'
  },
  'HR': hrModuleRegistry,
  'HR Management': {
    ...hrModuleRegistry,
    id: 'HR Management'
  },
  'Operations Hub': {
    id: 'Operations Hub',
    canonicalId: 'Operations Hub',
    nameEn: 'Operations Hub',
    nameAr: 'مركز العمليات والتشغيل',
    icon: Cpu,
    descriptionEn: 'Operational pipelines, work order allocation, cost overrides, and QA tracking.',
    descriptionAr: 'إدارة وتتبع أوامر التشغيل، التكليفات الميدانية، والرقابة على تكاليف التشغيل.',
    color: '#0284C7',
    tabs: OPERATIONS_TABS,
    settingsLabelEn: 'Operations Settings',
    settingsLabelAr: 'إعدادات العمليات والتشغيل'
  },
  'CRM': {
    id: 'CRM',
    canonicalId: 'CRM',
    nameEn: 'Sales CRM',
    nameAr: 'إدارة المبيعات وعلاقات العملاء',
    icon: Target,
    descriptionEn: 'Customer relationship management, deals pipeline, contacts, and proposals.',
    descriptionAr: 'إدارة الصفقات والعملاء، متابعة المبيعات، عروض الأسعار ونسب العمولات.',
    color: '#10B981',
    tabs: CRM_TABS,
    settingsLabelEn: 'CRM Settings',
    settingsLabelAr: 'إعدادات المبيعات والصفقات'
  },
  'Sales CRM': {
    id: 'Sales CRM',
    canonicalId: 'CRM',
    nameEn: 'Sales CRM',
    nameAr: 'إدارة المبيعات وعلاقات العملاء',
    icon: Target,
    descriptionEn: 'Customer relationship management, deals pipeline, contacts, and proposals.',
    descriptionAr: 'إدارة الصفقات والعملاء، متابعة المبيعات، عروض الأسعار ونسب العمولات.',
    color: '#10B981',
    tabs: CRM_TABS,
    settingsLabelEn: 'CRM Settings',
    settingsLabelAr: 'إعدادات المبيعات والصفقات'
  },
  'Accounting': {
    id: 'Accounting',
    canonicalId: 'Accounting',
    nameEn: 'Accounting & Finance',
    nameAr: 'المحاسبة والمالية',
    icon: DollarSign,
    descriptionEn: 'Double-entry bookkeeping, invoices, bank reconciliations, and VAT reports.',
    descriptionAr: 'النظام المحاسبي، قيود اليومية، شجرة الحسابات، فواتير المبيعات والمشتريات والضريبة.',
    color: '#F59E0B',
    tabs: ACCOUNTING_TABS,
    settingsLabelEn: 'Accounting Settings',
    settingsLabelAr: 'إعدادات المحاسبة والمالية'
  },
  'CRM Leads': {
    id: 'CRM Leads',
    canonicalId: 'Leads',
    nameEn: 'Leads Board',
    nameAr: 'قوائم العملاء المتوقعين',
    icon: Users,
    descriptionEn: 'Lead qualification, source tracking, and conversion pipelines.',
    descriptionAr: 'إدارة واستيراد العملاء المحتملين وتوزيعهم على فرق المبيعات.',
    color: '#8B5CF6',
    tabs: [
      { id: 'Leads Board', labelEn: 'Leads Board', labelAr: 'لوحة العملاء المحتملين', icon: Activity },
      { id: 'Lead List', labelEn: 'Lead List', labelAr: 'جدول العملاء', icon: ListChecks },
      { id: 'Import/Export', labelEn: 'Import/Export', labelAr: 'الاستيراد والتصدير', icon: FileText }
    ]
  },
  'Leads': {
    id: 'Leads',
    canonicalId: 'Leads',
    nameEn: 'Leads Board',
    nameAr: 'قوائم العملاء المتوقعين',
    icon: Users,
    descriptionEn: 'Lead qualification, source tracking, and conversion pipelines.',
    descriptionAr: 'إدارة واستيراد العملاء المحتملين وتوزيعهم على فرق المبيعات.',
    color: '#8B5CF6',
    tabs: [
      { id: 'Leads Board', labelEn: 'Leads Board', labelAr: 'لوحة العملاء المحتملين', icon: Activity },
      { id: 'Lead List', labelEn: 'Lead List', labelAr: 'جدول العملاء', icon: ListChecks },
      { id: 'Import/Export', labelEn: 'Import/Export', labelAr: 'الاستيراد والتصدير', icon: FileText }
    ]
  },
  'SOPs': {
    id: 'SOPs',
    canonicalId: 'SOPs',
    nameEn: 'SOP Management',
    nameAr: 'إجراءات العمل القياسية (SOP)',
    icon: BookOpen,
    descriptionEn: 'Standard operating procedures, approval chains, and version control.',
    descriptionAr: 'توثيق واعتماد إجراءات وسياسات العمل ومتابعة التحديثات.',
    color: '#6366F1',
    tabs: [
      { id: 'Directory', labelEn: 'Directory', labelAr: 'دليل الإجراءات', icon: BookOpen },
      { id: 'SOP List', labelEn: 'SOP List', labelAr: 'قائمة السياسات', icon: FileText },
      { id: 'Approval Workflow', labelEn: 'Approval Workflow', labelAr: 'سير الاعتمادات', icon: CheckCircle2 }
    ]
  },
  'SOP Management': {
    id: 'SOP Management',
    canonicalId: 'SOPs',
    nameEn: 'SOP Management',
    nameAr: 'إجراءات العمل القياسية (SOP)',
    icon: BookOpen,
    descriptionEn: 'Standard operating procedures, approval chains, and version control.',
    descriptionAr: 'توثيق واعتماد إجراءات وسياسات العمل ومتابعة التحديثات.',
    color: '#6366F1',
    tabs: [
      { id: 'Directory', labelEn: 'Directory', labelAr: 'دليل الإجراءات', icon: BookOpen },
      { id: 'SOP List', labelEn: 'SOP List', labelAr: 'قائمة السياسات', icon: FileText },
      { id: 'Approval Workflow', labelEn: 'Approval Workflow', labelAr: 'سير الاعتمادات', icon: CheckCircle2 }
    ]
  },
  'Tasks': {
    id: 'Tasks',
    canonicalId: 'Tasks',
    nameEn: 'Task Management',
    nameAr: 'المهام وإدارة المشاريع',
    icon: CheckSquare,
    descriptionEn: 'Kanban boards, sprint tracking, milestones, and collaborative task lists.',
    descriptionAr: 'لوحات كانبان، تتبع المهام، الجداول الزمنية وساعات العمل.',
    color: '#EC4899',
    tabs: [
      { id: 'Task Board', labelEn: 'Task Board', labelAr: 'لوحة المهام', icon: Activity },
      { id: 'Kanban', labelEn: 'Kanban Board', labelAr: 'كانبان', icon: Layers },
      { id: 'Timeline', labelEn: 'Timeline / Gantt', labelAr: 'الجدول الزمني', icon: Calendar },
      { id: 'Time Tracker', labelEn: 'Time Tracker', labelAr: 'تتبع الوقت', icon: Clock }
    ]
  },
  'KPIs': {
    id: 'KPIs',
    canonicalId: 'KPIs',
    nameEn: 'Performance & KPIs',
    nameAr: 'مؤشرات الأداء الرئيسية',
    icon: Target,
    descriptionEn: 'Departmental benchmarks, performance tracking, and goal alignment.',
    descriptionAr: 'مؤشرات الأداء الاستراتيجية، الأهداف السنوية والتقييم الدوري.',
    color: '#14B8A6',
    tabs: [
      { id: 'Dashboard', labelEn: 'KPI Dashboard', labelAr: 'لوحة المؤشرات', icon: Activity },
      { id: 'KPI Metrics', labelEn: 'KPI Metrics', labelAr: 'المقاييس', icon: Target },
      { id: 'Department Breakdown', labelEn: 'Department Breakdown', labelAr: 'تحليل الأقسام', icon: Building2 }
    ]
  },
  'Quality Assurance': {
    id: 'Quality Assurance',
    canonicalId: 'QA',
    nameEn: 'Quality Assurance',
    nameAr: 'ضمان الجودة والرقابة',
    icon: CheckCircle2,
    descriptionEn: 'QMS ISO 9001 compliance, transactions audit, internal checklist templates, NCR incident tracking, and CAPA roadmaps.',
    descriptionAr: 'نظام إدارة الجودة والامتثال ISO-9001، تدقيق المعاملات، التفتيش الداخلي، سجل عدم المطابقة NCR، ومسارات CAPA.',
    color: '#06B6D4',
    tabs: QA_TABS,
    settingsLabelEn: 'QA Settings & Integrations',
    settingsLabelAr: 'إعدادات الجودة وربط البيانات'
  },
  'QA': {
    id: 'QA',
    canonicalId: 'QA',
    nameEn: 'Quality Assurance',
    nameAr: 'ضمان الجودة والرقابة',
    icon: CheckCircle2,
    descriptionEn: 'QMS ISO 9001 compliance, transactions audit, internal checklist templates, NCR incident tracking, and CAPA roadmaps.',
    descriptionAr: 'نظام إدارة الجودة والامتثال ISO-9001، تدقيق المعاملات، التفتيش الداخلي، سجل عدم المطابقة NCR، ومسارات CAPA.',
    color: '#06B6D4',
    tabs: QA_TABS,
    settingsLabelEn: 'QA Settings & Integrations',
    settingsLabelAr: 'إعدادات الجودة وربط البيانات'
  },
  'Admin': {
    id: 'Admin',
    canonicalId: 'Admin',
    nameEn: 'Admin Panel',
    nameAr: 'لوحة تحكم النظام والمدير',
    icon: Shield,
    descriptionEn: 'Platform administration, security, RBAC rules, audit trails, and company branding.',
    descriptionAr: 'إدارة المستخدمين، مصفوفة الصلاحيات، الهيكل الإداري، وسجلات التدقيق.',
    color: '#4F46E5',
    tabs: [
      { id: 'Users', labelEn: 'Users Directory', labelAr: 'دليل المستخدمين', icon: Users },
      { id: 'RBAC Matrix', labelEn: 'RBAC Matrix', labelAr: 'مصفوفة الصلاحيات', icon: Shield },
      { id: 'Org Chart', labelEn: 'Org Chart', labelAr: 'الهيكل التنظيمي', icon: Network },
      { id: 'Statuses', labelEn: 'Global Statuses', labelAr: 'الحالات العامة', icon: Sliders },
      { id: 'System Modules', labelEn: 'System Modules', labelAr: 'موديولات النظام', icon: Layers },
      { id: 'Audit Logs', labelEn: 'Audit Logs', labelAr: 'سجل النشاطات والتدقيق', icon: FileText }
    ]
  },
  'Admin Panel': {
    id: 'Admin Panel',
    canonicalId: 'Admin',
    nameEn: 'Admin Panel',
    nameAr: 'لوحة تحكم النظام والمدير',
    icon: Shield,
    descriptionEn: 'Platform administration, security, RBAC rules, audit trails, and company branding.',
    descriptionAr: 'إدارة المستخدمين، مصفوفة الصلاحيات، الهيكل الإداري، وسجلات التدقيق.',
    color: '#4F46E5',
    tabs: [
      { id: 'Users', labelEn: 'Users Directory', labelAr: 'دليل المستخدمين', icon: Users },
      { id: 'RBAC Matrix', labelEn: 'RBAC Matrix', labelAr: 'مصفوفة الصلاحيات', icon: Shield },
      { id: 'Org Chart', labelEn: 'Org Chart', labelAr: 'الهيكل التنظيمي', icon: Network },
      { id: 'Statuses', labelEn: 'Global Statuses', labelAr: 'الحالات العامة', icon: Sliders },
      { id: 'System Modules', labelEn: 'System Modules', labelAr: 'موديولات النظام', icon: Layers },
      { id: 'Audit Logs', labelEn: 'Audit Logs', labelAr: 'سجل النشاطات والتدقيق', icon: FileText }
    ]
  },
  'Products/Services': PRODUCTS_SERVICES_MODULE,
  'Products & Services': PRODUCTS_SERVICES_MODULE,
  'Products%2FServices': PRODUCTS_SERVICES_MODULE,
  'Catalog': PRODUCTS_SERVICES_MODULE,
  'catalog': PRODUCTS_SERVICES_MODULE,
  'products': PRODUCTS_SERVICES_MODULE
};

// -------------------------------------------------------------
// Helper Functions
// -------------------------------------------------------------

export function getCanonicalModuleId(moduleId: string | null | undefined): string {
  if (!moduleId) return 'HR';
  let decoded = moduleId;
  try {
    decoded = decodeURIComponent(moduleId);
  } catch (e) {
    decoded = moduleId;
  }
  const low = decoded.trim().toLowerCase();
  if (low === 'home' || low === 'home / workspace' || low === 'workspace' || low === 'home_workspace' || low.includes('home')) return 'Home';
  if (low === 'hr' || low === 'hr management' || low === 'hrm') return 'HR';
  if (low === 'crm' || low === 'sales crm') return 'CRM';
  if (low === 'leads' || low === 'crm leads') return 'Leads';
  if (low === 'sops' || low === 'sop management') return 'SOPs';
  if (low === 'qa' || low === 'quality assurance') return 'QA';
  if (low === 'kpis' || low === 'performance & kpis') return 'KPIs';
  if (low === 'admin' || low === 'admin panel') return 'Admin';
  if (
    low === 'knowledge base' || 
    low === 'kb' || 
    low === 'knowledge_base' || 
    low === 'knowledge' || 
    low === 'knowledge%20base' ||
    low.includes('knowledge')
  ) return 'Knowledge Base';
  if (low === 'operations hub' || low === 'operations') return 'Operations Hub';
  if (low === 'accounting') return 'Accounting';
  if (
    low === 'products/services' || 
    low === 'products & services' || 
    low === 'products%2fservices' || 
    low === 'products' || 
    low === 'catalog' ||
    low === 'product/service' ||
    low === 'products_services' ||
    low.includes('product') ||
    low.includes('catalog')
  ) return 'Products/Services';
  return moduleId;
}

export function getModuleMetadata(moduleId: string | null | undefined): ModuleMetadata | undefined {
  if (!moduleId) return undefined;
  const canon = getCanonicalModuleId(moduleId);
  return SYSTEM_MODULES_REGISTRY[canon] || SYSTEM_MODULES_REGISTRY[moduleId];
}

export function getAllModulesMetadata(): ModuleMetadata[] {
  // Return unique canonical modules
  const seen = new Set<string>();
  const list: ModuleMetadata[] = [];
  for (const key of Object.keys(SYSTEM_MODULES_REGISTRY)) {
    const mod = SYSTEM_MODULES_REGISTRY[key];
    if (!seen.has(mod.canonicalId)) {
      seen.add(mod.canonicalId);
      list.push(mod);
    }
  }
  return list;
}

export function getModuleTabs(moduleId: string | null | undefined, systemModulesList?: any[]): string[] {
  if (!moduleId) return ['General Form'];
  const meta = getModuleMetadata(moduleId);
  let tabs = meta ? meta.tabs.map(t => t.id) : [];

  if (systemModulesList && Array.isArray(systemModulesList)) {
    const canonLow = getCanonicalModuleId(moduleId).toLowerCase();
    const modLow = moduleId.toLowerCase();
    const matched = systemModulesList.find((sm: any) => 
      sm.name?.toLowerCase() === modLow || 
      sm.id?.toLowerCase() === modLow ||
      sm.name?.toLowerCase() === canonLow
    );
    if (matched?.metadata) {
      let sysMeta = matched.metadata;
      if (typeof sysMeta === 'string') {
        try { sysMeta = JSON.parse(sysMeta); } catch (e) { sysMeta = null; }
      }
      if (sysMeta?.tabs && Array.isArray(sysMeta.tabs)) {
        tabs = Array.from(new Set([...tabs, ...sysMeta.tabs]));
      }
    }
  }

  return tabs.length > 0 ? tabs : ['General Form', 'List View', 'Details View'];
}

export function getModuleCustomActions(moduleId: string | null | undefined): { key: string; label: string }[] {
  const meta = getModuleMetadata(moduleId);
  if (!meta) return [];
  const results: { key: string; label: string }[] = [];

  // Collect actions attached to tabs
  meta.tabs.forEach(tab => {
    if (tab.actions) {
      tab.actions.forEach(a => {
        results.push({
          key: a.id,
          label: `${a.labelEn} / ${a.labelAr}`
        });
      });
    }
  });

  return results;
}
