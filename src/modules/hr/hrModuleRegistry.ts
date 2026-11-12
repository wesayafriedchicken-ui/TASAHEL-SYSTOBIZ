/**
 * HR Module Comprehensive Registry (hrModuleRegistry.ts)
 * 
 * Auto-generated & strictly audited against 100% of the HR module code base:
 * - Screens & Pages: Directory, Add/Edit Employee, Profile Tabs (Personal, Job, Login, Emergency, Training, Documents, Schedule)
 * - Departments: Departments List, Add/Edit Dept, Teams, Job Titles, Job Descriptions
 * - Recruitment/Hiring: Job Openings, Requisitions, Candidates Pipeline, Interviews, Scorecards, Candidate Profile
 * - Payroll: Payroll Board, Monthly Calculation, Payroll Policy Config, Record Edit Breakdown (Earnings, Deductions, CTC)
 * - Attendance: Daily Logs, Shift Schedules, Break Shifts, Leave Management, Shift Swaps, Reports
 * - Performance: Core Hub, New Appraisal Engine, 360/OKR/Hybrid Models, Analysis
 * - Complaints & Grievances: Ticket Case, Investigation, Verdict, Admin Notes
 * - Org Chart & Archived Staff
 * 
 * Designed for granular RBAC permissions, dynamic screen generation, and field-level security.
 */

import { 
  Users, User, Shield, Network, Building2, Briefcase, UserPlus, 
  Calendar, Clock, DollarSign, Target, Box, Award, BookOpen, 
  Coffee, Repeat, AlertTriangle, AlertCircle, Sparkles, CheckSquare, 
  FileText, ListChecks, CheckCircle2, Activity, Layers, Sliders, 
  Key, Heart, Folder, Lock, Archive
} from 'lucide-react';
import { 
  ModuleMetadata, 
  ModuleTabMetadata, 
  ModuleSectionMetadata, 
  ModuleFieldMetadata, 
  ModuleActionMetadata 
} from '../../utils/moduleRegistry';

// -------------------------------------------------------------
// HR TABS METADATA
// -------------------------------------------------------------

export const HR_MODULE_TABS: ModuleTabMetadata[] = [
  // -----------------------------------------------------------
  // 1. DASHBOARD
  // -----------------------------------------------------------
  {
    id: 'Dashboard',
    labelEn: 'Dashboard Overview',
    labelAr: 'لوحة مؤشرات الموارد البشرية',
    icon: Activity,
    actions: [
      { 
        id: 'hr:dashboard:view_hr_analytics', 
        labelEn: 'View HR Analytics & Executive KPIs', 
        labelAr: 'عرض تحليلات ومؤشرات الأداء التنفيذية',
        category: 'workflow',
        description: 'Enables access to high-level HR metric scorecards, trends, and department headcounts.'
      },
      { 
        id: 'hr:dashboard:export_hr_reports', 
        labelEn: 'Export HR Dashboard Reports', 
        labelAr: 'تصدير تقارير مؤشرات الموارد البشرية',
        category: 'export',
        description: 'Allows exporting summary reports in PDF or spreadsheet formats.'
      }
    ],
    sections: [
      {
        key: 'overview_kpis',
        labelEn: 'Executive Summary Metrics',
        labelAr: 'مؤشرات الأداء الرئيسية',
        fields: [
          { key: 'total_employees', labelEn: 'Total Headcount', labelAr: 'إجمالي القوى العاملة', type: 'number' },
          { key: 'active_staff_count', labelEn: 'Active Staff Count', labelAr: 'الموظفون النشطون', type: 'number' },
          { key: 'monthly_payroll_run', labelEn: 'Monthly Payroll Total', labelAr: 'إجمالي مسير الرواتب الشهري', type: 'currency', isSensitive: true },
          { key: 'daily_attendance_rate', labelEn: 'Daily Attendance Rate (%)', labelAr: 'نسبة الحضور اليومي', type: 'number' },
          { key: 'open_job_requisitions', labelEn: 'Open Job Requisitions', labelAr: 'الوظائف الشاغرة الجارية', type: 'number' },
          { key: 'pending_leave_requests', labelEn: 'Pending Leave Approvals', labelAr: 'طلبات الإجازات المعلقة', type: 'number' }
        ]
      }
    ]
  },

  // -----------------------------------------------------------
  // 2. EMPLOYEE DIRECTORY
  // -----------------------------------------------------------
  // 2. EMPLOYEE DIRECTORY & PROFILES
  // -----------------------------------------------------------
  {
    id: 'Employee Directory',
    labelEn: 'Employee Directory',
    labelAr: 'دليل وملفات الموظفين',
    icon: Users,
    actions: [
      { 
        id: 'hr:directory:add_employee', 
        labelEn: 'Add New Employee Profile', 
        labelAr: 'إضافة ملف موظف جديد',
        category: 'crud',
        description: 'Grants access to onboarding wizard and direct employee creation.'
      },
      { 
        id: 'hr:directory:edit_employee', 
        labelEn: 'Edit Employee Details', 
        labelAr: 'تعديل بيانات وملف الموظف',
        category: 'crud',
        description: 'Allows updating personal, job, salary, and system records.'
      },
      { 
        id: 'hr:directory:delete_employee', 
        labelEn: 'Delete / Archive Employee Profile', 
        labelAr: 'حذف أو أرشفة ملف الموظف',
        category: 'crud',
        description: 'Allows archiving or permanently removing employee records.'
      },
      { 
        id: 'hr:directory:share_employee', 
        labelEn: 'Share Employee Profile Link', 
        labelAr: 'مشاركة رابط ملف الموظف',
        category: 'workflow'
      },
      { 
        id: 'hr:directory:export_employees', 
        labelEn: 'Export Employees (Excel / CSV)', 
        labelAr: 'تصدير دليل الموظفين إكسيل',
        category: 'export'
      },
      { 
        id: 'hr:directory:import_employees', 
        labelEn: 'Import Employees from Spreadsheet', 
        labelAr: 'استيراد الموظفين من ملف خارجي',
        category: 'crud'
      },
      { 
        id: 'hr:directory:customize_layout', 
        labelEn: 'Customize Profile Dynamic Layout', 
        labelAr: 'تخصيص هيكل الحقول والملف الشخصي',
        category: 'workflow'
      },
      { 
        id: 'hr:directory:manage_custom_fields', 
        labelEn: 'Manage Custom Fields Schema', 
        labelAr: 'إدارة الحقول المخصصة الإضافية',
        category: 'workflow'
      },
      { 
        id: 'hr:directory:upload_documents', 
        labelEn: 'Upload & Manage Files & Documents', 
        labelAr: 'رفع وإدارة المستندات والملفات',
        category: 'workflow'
      },
      { 
        id: 'hr:directory:download_document', 
        labelEn: 'Download Employee Documents', 
        labelAr: 'تحميل مستندات وملفات الموظف',
        category: 'workflow'
      },
      { 
        id: 'hr:directory:delete_document', 
        labelEn: 'Delete Stored Documents', 
        labelAr: 'حذف المستندات والملفات المرفوعة',
        category: 'crud'
      },
      { 
        id: 'hr:directory:sign_document', 
        labelEn: 'Sign / Request Signature on Documents', 
        labelAr: 'توقيع أو طلب توقيع إلكتروني للمستندات',
        category: 'workflow'
      },
      { 
        id: 'hr:directory:view_edit_login_info', 
        labelEn: 'View / Edit System Login Credentials', 
        labelAr: 'عرض وتعديل بيانات الدخول والأنظمة',
        category: 'sensitive',
        description: 'High-privilege action to access credentials and password vault.'
      },
      { 
        id: 'hr:directory:reveal_sensitive_passwords', 
        labelEn: 'Reveal & Copy Passwords Plaintext', 
        labelAr: 'كشف ونسخ كلمات المرور الحساسة',
        category: 'sensitive',
        description: 'Allows toggling password visibility and copying plain credentials.'
      },
      { 
        id: 'hr:directory:add_login_credential', 
        labelEn: 'Create New System Login Credential', 
        labelAr: 'إضافة حساب ومنصة جديدة للموظف',
        category: 'sensitive'
      },
      { 
        id: 'hr:directory:delete_login_credential', 
        labelEn: 'Delete Stored System Credential', 
        labelAr: 'حذف بيانات دخول لمنصة من سجل الموظف',
        category: 'sensitive'
      },
      { 
        id: 'hr:directory:assign_shift_schedule', 
        labelEn: 'Assign Weekly Shift Schedule', 
        labelAr: 'تكليف وتعديل جدول الورديات للموظف',
        category: 'workflow'
      },
      { 
        id: 'hr:directory:edit_employee_shift', 
        labelEn: 'Modify Shift Timing & Rest Days', 
        labelAr: 'تعديل توقيتات الوردية وأيام الراحة',
        category: 'workflow'
      },
      { 
        id: 'hr:directory:manage_emergency_contacts', 
        labelEn: 'Manage Emergency Contacts', 
        labelAr: 'إدارة جهات اتصال الطوارئ',
        category: 'crud'
      },
      { 
        id: 'hr:directory:record_training_course', 
        labelEn: 'Log Training Courses & Certifications', 
        labelAr: 'تسجيل الدورات التدريبية والشهادات',
        category: 'workflow'
      },
      { 
        id: 'hr:directory:edit_training_course', 
        labelEn: 'Edit Training Course & Scores', 
        labelAr: 'تعديل بيانات الدورة والدرجات',
        category: 'workflow'
      },
      { 
        id: 'hr:directory:delete_training_course', 
        labelEn: 'Delete Training Record', 
        labelAr: 'حذف سجل الدورة التدريبية',
        category: 'crud'
      },
      { 
        id: 'hr:directory:adjust_employee_leave_balance', 
        labelEn: 'Adjust Time-Off & Leave Quotas', 
        labelAr: 'تعديل أرصدة إجازات الموظف السنوية والمرضية',
        category: 'sensitive'
      },
      { 
        id: 'hr:directory:request_employee_leave', 
        labelEn: 'Submit Leave on Behalf of Employee', 
        labelAr: 'تقديم طلب إجازة بالنيابة عن الموظف',
        category: 'workflow'
      },
      { 
        id: 'hr:directory:manage_contract_status', 
        labelEn: 'Update Contract Type & Policy History', 
        labelAr: 'تعديل سياسة ونوع العقد وسجل التحديثات',
        category: 'crud'
      },
      { 
        id: 'hr:directory:manage_direct_reports', 
        labelEn: 'Assign / Reassign Subordinate Direct Reports', 
        labelAr: 'تعيين ونقل المرؤوسين المباشرين للموظف',
        category: 'workflow'
      }
    ],
    sections: [
      {
        key: 'basic_info',
        labelEn: 'Basic Personal Information',
        labelAr: 'البيانات الشخصية الأساسية',
        fields: [
          { key: 'Employee #', labelEn: 'Employee ID Number (#)', labelAr: 'الرقم الوظيفي', type: 'text' },
          { key: 'Status', labelEn: 'Employment Status (Active/Inactive)', labelAr: 'حالة الموظف', type: 'select' },
          { key: 'Status Date', labelEn: 'Status Effective Date', labelAr: 'تاريخ سريان الحالة', type: 'date' },
          { key: 'Status Reason', labelEn: 'Status Reason / Note', labelAr: 'سبب تغيير الحالة', type: 'text' },
          { key: 'First Name', labelEn: 'First Name', labelAr: 'الاسم الأول', type: 'text' },
          { key: 'Middle Name', labelEn: 'Middle Name', labelAr: 'الاسم الأوسط', type: 'text' },
          { key: 'Last Name', labelEn: 'Last Name / Family Name', labelAr: 'اسم العائلة', type: 'text' },
          { key: 'Preferred Name', labelEn: 'Preferred Nickname / Display', labelAr: 'الاسم المفضل', type: 'text' },
          { key: 'Birth Date', labelEn: 'Date of Birth', labelAr: 'تاريخ الميلاد', type: 'date' },
          { key: 'NIN', labelEn: 'National ID / NIN / SSN', labelAr: 'الرقم القومي / الهوية', type: 'text', isSensitive: true },
          { key: 'Passport Number', labelEn: 'Passport Identification Number', labelAr: 'رقم جواز السفر', type: 'text', isSensitive: true },
          { key: 'Gender', labelEn: 'Gender', labelAr: 'الجنس', type: 'select' },
          { key: 'Nationality', labelEn: 'Nationality / Citizenship', labelAr: 'الجنسية', type: 'select' },
          { key: 'Marital Status', labelEn: 'Marital Status', labelAr: 'الحالة الاجتماعية', type: 'select' },
          { key: 'Shirt Size', labelEn: 'Uniform / Shirt Size', labelAr: 'مقاس الزي الموحد', type: 'select' },
          { key: 'Profile Picture', labelEn: 'Profile Avatar Photo', labelAr: 'الصورة الشخصية', type: 'file' },
          { key: 'Bank Details Copy', labelEn: 'Bank Account Slip / Document', labelAr: 'مستند الحساب البنكي', type: 'file', isSensitive: true }
        ]
      },
      {
        key: 'address_info',
        labelEn: 'Residential Address',
        labelAr: 'العنوان ومحل الإقامة',
        fields: [
          { key: 'Street 1', labelEn: 'Street Address 1', labelAr: 'العنوان - سطر 1', type: 'text' },
          { key: 'Street 2', labelEn: 'Street Address 2 (Apt / Suite)', labelAr: 'العنوان - سطر 2', type: 'text' },
          { key: 'Country', labelEn: 'Country', labelAr: 'الدولة', type: 'select' },
          { key: 'State', labelEn: 'State / Governorate / County', labelAr: 'المحافظة / المقاطعة', type: 'text' },
          { key: 'City', labelEn: 'City', labelAr: 'المدينة', type: 'text' },
          { key: 'Postal Code', labelEn: 'Postal / ZIP Code', labelAr: 'الرمز البريدي', type: 'text' }
        ]
      },
      {
        key: 'contact_info',
        labelEn: 'Contact Coordinates',
        labelAr: 'بيانات الاتصال والتواصل',
        fields: [
          { key: 'Work Phone', labelEn: 'Direct Work Phone', labelAr: 'هاتف العمل', type: 'text' },
          { key: 'Extension', labelEn: 'Office Phone Extension (Ext)', labelAr: 'تحويلة المكتب', type: 'text' },
          { key: 'Mobile Phone', labelEn: 'Mobile / Cell Phone', labelAr: 'رقم الجوال الشخصي', type: 'text' },
          { key: 'Home Phone', labelEn: 'Home Landline Phone', labelAr: 'هاتف المنزل', type: 'text' },
          { key: 'Work Email', labelEn: 'Official Work Email', labelAr: 'البريد الإلكتروني للعمل', type: 'text' },
          { key: 'Personal Email', labelEn: 'Personal Email Address', labelAr: 'البريد الإلكتروني الشخصي', type: 'text' }
        ]
      },
      {
        key: 'social_links',
        labelEn: 'Social Profiles & Portfolios',
        labelAr: 'روابط التواصل والملفات المهنية',
        fields: [
          { key: 'LinkedIn', labelEn: 'LinkedIn Profile URL', labelAr: 'رابط حساب لينكد إن', type: 'text' },
          { key: 'Twitter', labelEn: 'Twitter / X Handle', labelAr: 'حساب تويتر (X)', type: 'text' },
          { key: 'Facebook', labelEn: 'Facebook Profile URL', labelAr: 'رابط حساب فيسبوك', type: 'text' },
          { key: 'Instagram', labelEn: 'Instagram Profile URL', labelAr: 'رابط حساب انستغرام', type: 'text' },
          { key: 'YouTube', labelEn: 'YouTube Channel URL', labelAr: 'قناة يوتيوب', type: 'text' },
          { key: 'CV URL', labelEn: 'Curriculum Vitae / Portfolio File URL', labelAr: 'رابط ملف السيرة الذاتية', type: 'text' }
        ]
      },
      {
        key: 'education_info',
        labelEn: 'Higher Education & Language',
        labelAr: 'المؤهلات العلمية واللغات',
        fields: [
          { key: 'College / University', labelEn: 'College or University Name', labelAr: 'الجامعة / الكلية', type: 'text' },
          { key: 'Degree', labelEn: 'Degree / Academic Qualification', labelAr: 'الدرجة العلمية', type: 'text' },
          { key: 'Major', labelEn: 'Major / Academic Specialization', labelAr: 'التخصص الأكاديمي', type: 'text' },
          { key: 'GPA', labelEn: 'Graduation GPA / Grade Rating', labelAr: 'المعدل التراكمي / التقدير', type: 'text' },
          { key: 'Edu Start Date', labelEn: 'Studies Commencement Date', labelAr: 'تاريخ بدء الدراسة', type: 'date' },
          { key: 'Edu End Date', labelEn: 'Graduation Completion Date', labelAr: 'تاريخ التخرج', type: 'date' },
          { key: 'Secondary Language', labelEn: 'Secondary Spoken Language', labelAr: 'اللغة الإضافية', type: 'text' }
        ]
      },
      {
        key: 'employment_contract',
        labelEn: 'Job Placement & Hierarchy',
        labelAr: 'بيانات الوظيفة والتسكين الإداري',
        fields: [
          { key: 'Job Title', labelEn: 'Official Job Title', labelAr: 'المسمى الوظيفي', type: 'text' },
          { key: 'Department', labelEn: 'Parent Department', labelAr: 'القسم التابع له', type: 'select' },
          { key: 'Team', labelEn: 'Assigned Work Team / Squad', labelAr: 'فريق العمل / الوحدة', type: 'select' },
          { key: 'Job Grade', labelEn: 'Career Level / Job Grade', labelAr: 'الدرجة الوظيفية', type: 'select' },
          { key: 'Division', labelEn: 'Corporate Division', labelAr: 'القطاع / الإدارة العامة', type: 'text' },
          { key: 'Sub Department', labelEn: 'Sub-department Unit', labelAr: 'الإدارة الفرعية', type: 'text' },
          { key: 'Direct Supervisor', labelEn: 'Reporting Direct Manager', labelAr: 'المدير المباشر', type: 'select' },
          { key: 'Direct Reports', labelEn: 'Subordinates / Direct Reports', labelAr: 'المرؤوسون المباشرون', type: 'text' },
          { key: 'Work Location', labelEn: 'Branch / Work Location', labelAr: 'مقر وفرع العمل', type: 'select' },
          { key: 'Hiring Date', labelEn: 'Date of Joining / Appointment', labelAr: 'تاريخ التعيين والالتحاق', type: 'date' },
          { key: 'Probationary Date', labelEn: 'End of Probation Period', labelAr: 'تاريخ انتهاء فترة التجربة', type: 'date' },
          { key: 'Attendance Method', labelEn: 'Attendance Log Method (System/Biometric)', labelAr: 'طريقة تسجيل الحضور (سيستم/بصمة)', type: 'select' },
          { key: 'Assigned Shift (Default)', labelEn: 'Default Assigned Work Shift', labelAr: 'وردية العمل الافتراضية', type: 'select' },
          { key: 'Job Description', labelEn: 'Job Description & Duties', labelAr: 'الوصف والمهام الوظيفية', type: 'text' }
        ]
      },
      {
        key: 'contract_policy',
        labelEn: 'Employment Status & Contract Policy',
        labelAr: 'سياسة التعاقد والحالة الوظيفية',
        fields: [
          { key: 'Contract Type', labelEn: 'Employment Contract Type (Full/Part/Contractor)', labelAr: 'نوع التعاقد والدوام', type: 'select' },
          { key: 'Contract Start Date', labelEn: 'Contract Agreement Start Date', labelAr: 'تاريخ بدء سريان العقد', type: 'date' },
          { key: 'Contract End Date', labelEn: 'Contract Expiration / Renewal Date', labelAr: 'تاريخ انتهاء أو تجديد العقد', type: 'date' },
          { key: 'Contract Status History', labelEn: 'Contract Policy Status History', labelAr: 'سجل وتاريخ سياسات العقود السابقة', type: 'text' },
          { key: 'Current Policy Status', labelEn: 'Current Contract Active Status', labelAr: 'حالة سريان العقد الحالية', type: 'select' }
        ]
      },
      {
        key: 'salary_compensation',
        labelEn: 'Compensation, Allowances & Bank',
        labelAr: 'الرواتب والبدلات والحسابات البنكية',
        fields: [
          { key: 'Base Salary', labelEn: 'Base Salary Amount', labelAr: 'الراتب الأساسي', type: 'currency', isSensitive: true },
          { key: 'Allowances', labelEn: 'Monthly Allowances', labelAr: 'إجمالي البدلات الشهرية', type: 'currency', isSensitive: true },
          { key: 'KPI Target Bonus', labelEn: 'KPI Performance Bonus Amount', labelAr: 'حافز ومكافأة الأداء (KPIs)', type: 'currency', isSensitive: true },
          { key: 'Disbursement Method', labelEn: 'Salary Payment Channel (Bank/Cash)', labelAr: 'طريقة صرف الراتب', type: 'select' },
          { key: 'Bank Name', labelEn: 'Disbursement Bank Name', labelAr: 'اسم البنك المعتمد', type: 'text', isSensitive: true },
          { key: 'Bank Account Number', labelEn: 'Bank Account Number', labelAr: 'رقم الحساب البنكي', type: 'text', isSensitive: true },
          { key: 'IBAN', labelEn: 'Bank Account IBAN', labelAr: 'رقم الآيبان (IBAN)', type: 'text', isSensitive: true },
          { key: 'Social Insurance Number', labelEn: 'Social Insurance Number (SIN)', labelAr: 'رقم التأمين الاجتماعي', type: 'text', isSensitive: true },
          { key: 'Tax Identification Number', labelEn: 'Tax ID / Tax File Number', labelAr: 'رقم الملف الضريبي', type: 'text', isSensitive: true }
        ]
      },
      {
        key: 'system_logins_vault',
        labelEn: 'System Credentials Vault',
        labelAr: 'سجل حسابات الأنظمة وكلمات المرور',
        fields: [
          { key: 'Employee #', labelEn: 'Employee ID / Staff Code', labelAr: 'الرقم التعريفي للموظف', type: 'text' },
          { key: 'System Name', labelEn: 'System / Platform Name', labelAr: 'اسم المنصة / النظام', type: 'text' },
          { key: 'System URL', labelEn: 'Login Portal URL', labelAr: 'رابط بوابة الدخول', type: 'text' },
          { key: 'System Email / Username', labelEn: 'System Email / ID', labelAr: 'البريد أو معرف الدخول', type: 'text' },
          { key: 'Username', labelEn: 'Login Username / Handle', labelAr: 'اسم المستخدم للولوج', type: 'text' },
          { key: 'Password', labelEn: 'Stored Password Vault', labelAr: 'كلمة المرور المشفرة', type: 'text', isSensitive: true },
          { key: 'System Extensions', labelEn: 'Internal Extensions / Host Notes', labelAr: 'التحويلات وملاحظات الاستضافة', type: 'text' },
          { key: 'Portal Access Enabled', labelEn: 'Self-Service Portal Access Active', labelAr: 'صلاحية دخول بوابة الخدمة الذاتية', type: 'select' },
          { key: 'System Role Assignment', labelEn: 'Assigned System RBAC Role', labelAr: 'الدور الأمني المسند بالنظام', type: 'select' }
        ]
      },
      {
        key: 'emergency_contacts',
        labelEn: 'Emergency Contacts Registry',
        labelAr: 'سجل جهات اتصال الطوارئ',
        fields: [
          { key: 'Contact Full Name', labelEn: 'Full Name of Emergency Contact', labelAr: 'اسم جهة الاتصال للطوارئ', type: 'text' },
          { key: 'Relationship', labelEn: 'Kinship / Relationship', labelAr: 'صلة القرابة', type: 'text' },
          { key: 'Primary Contact Status', labelEn: 'Designated as Primary Emergency Contact', labelAr: 'جهة الاتصال الرئيسية للطوارئ', type: 'select' },
          { key: 'Work Phone', labelEn: 'Emergency Contact Work Phone', labelAr: 'هاتف عمل جهة الطوارئ', type: 'text' },
          { key: 'Extension', labelEn: 'Work Phone Extension', labelAr: 'التحويلة', type: 'text' },
          { key: 'Home Phone', labelEn: 'Home Landline Phone', labelAr: 'هاتف المنزل لجهة الطوارئ', type: 'text' },
          { key: 'Mobile Phone', labelEn: 'Emergency Mobile Phone', labelAr: 'رقم الموبايل للطوارئ', type: 'text' },
          { key: 'Emergency Email', labelEn: 'Emergency Email Address', labelAr: 'البريد الإلكتروني لجهة الطوارئ', type: 'text' },
          { key: 'Emergency Street 1', labelEn: 'Emergency Residence Street 1', labelAr: 'عنوان سكن الطوارئ - سطر 1', type: 'text' },
          { key: 'Emergency Street 2', labelEn: 'Emergency Residence Street 2', labelAr: 'عنوان سكن الطوارئ - سطر 2', type: 'text' },
          { key: 'Emergency City', labelEn: 'Emergency City', labelAr: 'مدينة جهة الطوارئ', type: 'text' },
          { key: 'Emergency State / Province', labelEn: 'Emergency State / Province', labelAr: 'المحافظة / المقاطعة', type: 'text' },
          { key: 'Emergency Postal Code', labelEn: 'Emergency Postal / ZIP Code', labelAr: 'الرمز البريدي', type: 'text' },
          { key: 'Emergency Country', labelEn: 'Emergency Country', labelAr: 'الدولة لجهة الطوارئ', type: 'select' }
        ]
      },
      {
        key: 'documents_management',
        labelEn: 'Documents & Digital Attachments',
        labelAr: 'المستندات والمرفقات الرقمية',
        fields: [
          { key: 'Document Title', labelEn: 'Document / File Name', labelAr: 'عنوان أو اسم المستند', type: 'text' },
          { key: 'Folder Category', labelEn: 'Storage Folder (Uploads/Resumes/Signed)', labelAr: 'مجلد التصنيف والأرشيف', type: 'select' },
          { key: 'File Attachment', labelEn: 'File Attachment / Document Content', labelAr: 'الملف والمحتوى المرفق', type: 'file' },
          { key: 'Upload Date', labelEn: 'File Upload Timestamp', labelAr: 'تاريخ ووقت الرفع', type: 'date' },
          { key: 'File Size', labelEn: 'Attachment File Size (KB/MB)', labelAr: 'حجم الملف الرقمي', type: 'text' },
          { key: 'Signature Status', labelEn: 'Electronic Signature Status', labelAr: 'حالة التوقيع الإلكتروني', type: 'select' }
        ]
      },
      {
        key: 'training_certifications',
        labelEn: 'Training Courses & Certifications',
        labelAr: 'الدورات التدريبية والشهادات المهنية',
        fields: [
          { key: 'Course Title', labelEn: 'Course / Training Program Title', labelAr: 'عنوان الدورة أو البرنامج التدريبي', type: 'text' },
          { key: 'Training Category', labelEn: 'Course Category (Upcoming/Completed)', labelAr: 'تصنيف التدريب (قادم/مكتمل)', type: 'select' },
          { key: 'Training Status', labelEn: 'Enrollment Status (Completed/Enrolled)', labelAr: 'حالة الالتحاق بالدورة', type: 'select' },
          { key: 'Completion Date', labelEn: 'Course Completion Date', labelAr: 'تاريخ إتمام التدريب', type: 'date' },
          { key: 'Score / Grade', labelEn: 'Evaluation Score / Exam Grade (%)', labelAr: 'الدرجة والتقييم في الدورة', type: 'text' },
          { key: 'Training Cost', labelEn: 'Training Investment / Course Cost', labelAr: 'تكلفة الدورة والتدريب', type: 'currency' }
        ]
      },
      {
        key: 'time_off_balances',
        labelEn: 'Time-Off & Leave Quotas',
        labelAr: 'أرصدة الإجازات والغياب المعتمد',
        fields: [
          { key: 'Annual Leave Balance', labelEn: 'Annual Leave Balance (Days)', labelAr: 'رصيد الإجازات السنوية', type: 'number' },
          { key: 'Sick Leave Balance', labelEn: 'Sick Leave Balance (Days)', labelAr: 'رصيد الإجازات المرضية', type: 'number' },
          { key: 'Casual Leave Balance', labelEn: 'Casual / Emergency Leave Days', labelAr: 'رصيد الإجازات العارضة', type: 'number' },
          { key: 'Unpaid Leave Balance', labelEn: 'Unpaid Absence Record (Days)', labelAr: 'سجل الإجازات غير مدفوعة الأجر', type: 'number' }
        ]
      },
      {
        key: 'notes_timeline',
        labelEn: 'Confidential Notes & Timeline',
        labelAr: 'الملاحظات الإدارية والسجل السري',
        fields: [
          { key: 'Internal HR Notes', labelEn: 'Internal Administrative Notes', labelAr: 'الملاحظات الإدارية الداخلية', type: 'text', isSensitive: true },
          { key: 'Disciplinary Remarks', labelEn: 'Disciplinary Actions & Incident Flags', labelAr: 'الجزاءات والملاحظات التأديبية', type: 'text', isSensitive: true }
        ]
      },
      {
        key: 'custom_fields_section',
        labelEn: 'Custom Fields & Dynamic Layout',
        labelAr: 'الحقول المخصصة والتخطيط الديناميكي',
        fields: [
          { key: 'Custom Field Key/Value', labelEn: 'User-Defined Custom Attribute', labelAr: 'الخاصية المخصصة المعرفة', type: 'text' },
          { key: 'Custom Section Attributes', labelEn: 'Custom Section Layout Grouping', labelAr: 'مجموعة الأقسام المخصصة', type: 'text' }
        ]
      }
    ]
  },

  // -----------------------------------------------------------
  // 3. DEPARTMENTS & STRUCTURE
  // -----------------------------------------------------------
  {
    id: 'Departments & Structure',
    labelEn: 'Departments & Structure',
    labelAr: 'الأقسام والهيكل التنظيمي',
    icon: Building2,
    actions: [
      { 
        id: 'hr:departments:view_department', 
        labelEn: 'View Departments & Structure', 
        labelAr: 'عرض الأقسام والهيكل التنظيمي',
        category: 'workflow'
      },
      { 
        id: 'hr:departments:customize_layout', 
        labelEn: 'Customize Layout & Fields', 
        labelAr: 'تخصيص الهيكل والحقول (Customize Layout)',
        category: 'workflow',
        description: 'Grants access to the Customize Layout dropdown button, schema editor, and field reordering for departments.'
      },
      { 
        id: 'hr:departments:add_department', 
        labelEn: 'Add New Department', 
        labelAr: 'إضافة قسم جديد',
        category: 'crud'
      },
      { 
        id: 'hr:departments:edit_department', 
        labelEn: 'Edit Department Properties', 
        labelAr: 'تعديل بيانات وخواص القسم',
        category: 'crud'
      },
      { 
        id: 'hr:departments:delete_department', 
        labelEn: 'Delete Department', 
        labelAr: 'حذف القسم',
        category: 'crud'
      },
      { 
        id: 'hr:departments:share_department', 
        labelEn: 'Share Department Structure', 
        labelAr: 'مشاركة الهيكل الإداري للقسم',
        category: 'workflow'
      },
      { 
        id: 'hr:departments:add_team', 
        labelEn: 'Create Sub-Team / Squad', 
        labelAr: 'إضافة فريق عمل فرعي',
        category: 'crud'
      },
      { 
        id: 'hr:departments:edit_team', 
        labelEn: 'Edit Team Leadership & Roles', 
        labelAr: 'تعديل قيادة وأدوار الفريق',
        category: 'crud'
      },
      { 
        id: 'hr:departments:delete_team', 
        labelEn: 'Delete Sub-Team', 
        labelAr: 'حذف فريق العمل الفرعي',
        category: 'crud'
      },
      { 
        id: 'hr:departments:add_job_title', 
        labelEn: 'Add New Job Title', 
        labelAr: 'إضافة مسمى وظيفي جديد',
        category: 'crud'
      },
      { 
        id: 'hr:departments:edit_job_title', 
        labelEn: 'Edit Job Title Properties', 
        labelAr: 'تعديل خصائص المسمى الوظيفي',
        category: 'crud'
      },
      { 
        id: 'hr:departments:delete_job_title', 
        labelEn: 'Delete Job Title', 
        labelAr: 'حذف المسمى الوظيفي',
        category: 'crud'
      },
      { 
        id: 'hr:departments:add_job_description', 
        labelEn: 'Create Job Description Charter', 
        labelAr: 'إنشاء ميثاق وصف وظيفي (JD)',
        category: 'crud'
      },
      { 
        id: 'hr:departments:edit_job_description', 
        labelEn: 'Edit Job Description Charter', 
        labelAr: 'تعديل ميثاق الوصف الوظيفي',
        category: 'crud'
      },
      { 
        id: 'hr:departments:delete_job_description', 
        labelEn: 'Delete Job Description', 
        labelAr: 'حذف الوصف الوظيفي',
        category: 'crud'
      }
    ],
    sections: [
      {
        key: 'dept_info',
        labelEn: 'Department Charter & Head',
        labelAr: 'بيانات القسم ورئاسته',
        fields: [
          { key: 'Department Name', labelEn: 'Department Official Name', labelAr: 'اسم القسم الرسمي', type: 'text' },
          { key: 'Department Code', labelEn: 'Short Code / Identifier', labelAr: 'كود / اختصار القسم', type: 'text' },
          { key: 'Description', labelEn: 'Functional Scope & Mission', labelAr: 'الوصف والمهام الرئيسية', type: 'text' },
          { key: 'Department Lead', labelEn: 'Department Director / Head', labelAr: 'رئيس / مدير القسم', type: 'select' },
          { key: 'Is Executive', labelEn: 'Executive Level Department', labelAr: 'قسم ذو طابع تنفيذي', type: 'select' },
          { key: 'Operating Budget', labelEn: 'Annual Operating Budget', labelAr: 'الميزانية التشغيلية السنوية', type: 'currency', isSensitive: true },
          { key: 'Headcount Quota', labelEn: 'Approved Target Headcount', labelAr: 'السعة المعتمدة للموظفين', type: 'number' }
        ]
      },
      {
        key: 'team_specs',
        labelEn: 'Sub-Team Specifications',
        labelAr: 'مواصفات فرق العمل الفرعية',
        fields: [
          { key: 'Team Name', labelEn: 'Team Name', labelAr: 'اسم الفريق', type: 'text' },
          { key: 'Team Description', labelEn: 'Team Responsibilities', labelAr: 'مسؤوليات الفريق', type: 'text' },
          { key: 'Team Lead', labelEn: 'Designated Team Leader', labelAr: 'قائد الفريق المعين', type: 'select' },
          { key: 'Assigned Titles', labelEn: 'Job Titles Under Team', labelAr: 'المسميات الوظيفية التابعة', type: 'text' }
        ]
      },
      {
        key: 'job_description_specs',
        labelEn: 'Job Description Structure (JD)',
        labelAr: 'هيكل الوصف والميثاق الوظيفي',
        fields: [
          { key: 'Job Title', labelEn: 'Designated Job Title', labelAr: 'المسمى الوظيفي', type: 'text' },
          { key: 'Career Grade', labelEn: 'Career Grade Level', labelAr: 'المستوى الوظيفي', type: 'select' },
          { key: 'Salary Band Range', labelEn: 'Approved Salary Band Range', labelAr: 'نطاق الراتب المعتمد', type: 'text', isSensitive: true },
          { key: 'Reports To', labelEn: 'Reports Directly To', labelAr: 'يتبع إدارياً إلى', type: 'text' },
          { key: 'RACI Role', labelEn: 'RACI Framework Role', labelAr: 'الدور في مصفوفة RACI', type: 'select' },
          { key: 'Core Responsibilities', labelEn: 'Core Deliverables & Duties', labelAr: 'المسؤوليات والواجبات الرئيسية', type: 'text' },
          { key: 'Technical Competencies', labelEn: 'Required Technical Competencies', labelAr: 'الكفاءات الفنية المطلوبة', type: 'text' },
          { key: 'Performance KPIs', labelEn: 'Key Performance Indicators (KPIs)', labelAr: 'مؤشرات قياس الأداء للوظيفة', type: 'text' }
        ]
      }
    ]
  },

  // -----------------------------------------------------------
  // 4. HIRING & RECRUITMENT
  // -----------------------------------------------------------
  {
    id: 'Hiring',
    labelEn: 'Hiring & Recruitment',
    labelAr: 'التوظيف والاستقطاب',
    icon: Briefcase,
    actions: [
      { 
        id: 'hr:hiring:request_job_opening', 
        labelEn: 'Request New Job Opening', 
        labelAr: 'طلب فتح وظيفة شاغرة جديدة',
        category: 'workflow'
      },
      { 
        id: 'hr:hiring:customize_layout', 
        labelEn: 'Customize Layout & Fields', 
        labelAr: 'تخصيص الهيكل والحقول (Customize Layout)',
        category: 'workflow',
        description: 'Grants access to the Customize Layout dropdown button, schema editor, and field reordering for recruitment.'
      },
      { 
        id: 'hr:hiring:add_job_posting', 
        labelEn: 'Publish & Create Job Posting', 
        labelAr: 'نشر وإنشاء إعلان الوظيفة',
        category: 'crud'
      },
      { 
        id: 'hr:hiring:view_job_posting', 
        labelEn: 'View Job Posting Details', 
        labelAr: 'عرض تفاصيل الوظيفة الشاغرة',
        category: 'workflow'
      },
      { 
        id: 'hr:hiring:edit_job_posting', 
        labelEn: 'Edit Job Opening Posting', 
        labelAr: 'تعديل إعلان الوظيفة الشاغرة',
        category: 'crud'
      },
      { 
        id: 'hr:hiring:delete_job_posting', 
        labelEn: 'Close / Delete Job Posting', 
        labelAr: 'إغلاق أو حذف الوظيفة الشاغرة',
        category: 'crud'
      },
      { 
        id: 'hr:hiring:share_job_posting', 
        labelEn: 'Share Public Job Board Link', 
        labelAr: 'مشاركة رابط بوابة التقديم',
        category: 'workflow'
      },
      { 
        id: 'hr:hiring:verify_recruitment_budget', 
        labelEn: 'Verify Capital Budget Allocation', 
        labelAr: 'التحقق المالي من ميزانية التوظيف',
        category: 'sensitive',
        description: 'Checks financial ledger balances for candidate compensation approval.'
      },
      { 
        id: 'hr:hiring:register_applicant', 
        labelEn: 'Register New Applicant', 
        labelAr: 'تسجيل متقدم جديد للوظيفة',
        category: 'crud'
      },
      { 
        id: 'hr:hiring:add_candidate', 
        labelEn: 'Add Candidate Direct Entry', 
        labelAr: 'إدخال بيانات مرشح مباشر',
        category: 'crud'
      },
      { 
        id: 'hr:hiring:view_candidate', 
        labelEn: 'View Candidate Profile & Dossier', 
        labelAr: 'عرض ملف وبيانات المرشح',
        category: 'workflow'
      },
      { 
        id: 'hr:hiring:edit_candidate', 
        labelEn: 'Edit Candidate Dossier', 
        labelAr: 'تعديل ملف وملاحظات المرشح',
        category: 'crud'
      },
      { 
        id: 'hr:hiring:delete_candidate', 
        labelEn: 'Delete Candidate Dossier', 
        labelAr: 'حذف ملف المرشح',
        category: 'crud'
      },
      { 
        id: 'hr:hiring:move_candidate_stage', 
        labelEn: 'Advance Stage (Drag & Drop)', 
        labelAr: 'نقل المرشح عبر مراحل التعيين',
        category: 'workflow'
      },
      { 
        id: 'hr:hiring:schedule_interview', 
        labelEn: 'Schedule Candidate Interview', 
        labelAr: 'جدولة موعد مقابلة للمرشح',
        category: 'workflow'
      },
      { 
        id: 'hr:hiring:evaluate_scorecard', 
        labelEn: 'Submit Interview Evaluation Scorecard', 
        labelAr: 'اعتماد وتعبئة بطاقة تقييم المقابلة',
        category: 'workflow'
      },
      { 
        id: 'hr:hiring:send_candidate_email', 
        labelEn: 'Send Automated Emails to Candidates', 
        labelAr: 'إرسال الرسائل والقوالب للمرشحين',
        category: 'workflow'
      }
    ],
    sections: [
      {
        key: 'job_requisition',
        labelEn: 'Job Requisition & Specifications',
        labelAr: 'بيانات ومواصفات الوظيفة الشاغرة',
        fields: [
          { key: 'Job Title', labelEn: 'Opening Job Title', labelAr: 'المسمى الوظيفي المطلوب', type: 'text' },
          { key: 'Department', labelEn: 'Hiring Department', labelAr: 'القسم المستفيد', type: 'select' },
          { key: 'Hiring Lead', labelEn: 'Hiring Manager / Interview Panel', labelAr: 'مسؤول التعيين والمقابلات', type: 'text' },
          { key: 'Headcount Needed', labelEn: 'Target Headcount Needed', labelAr: 'عدد الشواغر المطلوبة', type: 'number' },
          { key: 'Employment Type', labelEn: 'Contract Type (Full-Time/Part-Time)', labelAr: 'نوع الدوام والتعاقد', type: 'select' },
          { key: 'Job Location', labelEn: 'Job Duty Location', labelAr: 'مقر العمل / عن بُعد', type: 'text' },
          { key: 'Salary Range', labelEn: 'Compensation Salary Range', labelAr: 'نطاق الراتب المعروض', type: 'text', isSensitive: true },
          { key: 'Budget Approval Status', labelEn: 'Budget Verification Status', labelAr: 'حالة اعتماد الميزانية', type: 'select' },
          { key: 'Requisition Status', labelEn: 'Posting Status (Active/Closed)', labelAr: 'حالة الإعلان الوظيفي', type: 'select' }
        ]
      },
      {
        key: 'candidate_profile',
        labelEn: 'Candidate Dossier & Credentials',
        labelAr: 'ملف وبيانات المرشح',
        fields: [
          { key: 'Candidate Full Name', labelEn: 'Full Name of Candidate', labelAr: 'اسم المرشح بالكامل', type: 'text' },
          { key: 'Contact Email', labelEn: 'Candidate Email Address', labelAr: 'البريد الإلكتروني للمرشح', type: 'text' },
          { key: 'Phone Number', labelEn: 'Contact Mobile Number', labelAr: 'رقم الهاتف للتواصل', type: 'text' },
          { key: 'Current Location', labelEn: 'Current City / Country', labelAr: 'محل الإقامة الحالي', type: 'text' },
          { key: 'LinkedIn URL', labelEn: 'LinkedIn Profile Link', labelAr: 'رابط ملف لينكد إن', type: 'text' },
          { key: 'CV / Portfolio File', labelEn: 'Attached Resume / CV Link', labelAr: 'رابط السيرة الذاتية المرفقة', type: 'file' },
          { key: 'Recruitment Stage', labelEn: 'Current Pipeline Stage', labelAr: 'مرحلة التوظيف الحالية', type: 'select' },
          { key: 'Screening Score', labelEn: 'Initial Screening Rating (1-5)', labelAr: 'درجة التقييم المبدئي', type: 'number' },
          { key: 'Recruiter Remarks', labelEn: 'Recruiter Assessment Notes', labelAr: 'ملاحظات مسؤول التوظيف', type: 'text' }
        ]
      },
      {
        key: 'interview_scorecards',
        labelEn: 'Interviews & Assessment Matrix',
        labelAr: 'المقابلات ومصفوفة التقييم',
        fields: [
          { key: 'Interview Title', labelEn: 'Interview Round Title', labelAr: 'عنوان جولة المقابلة', type: 'text' },
          { key: 'Interview Date', labelEn: 'Scheduled Timestamp', labelAr: 'تاريخ ووقت المقابلة', type: 'date' },
          { key: 'Interviewer Panelist', labelEn: 'Assigned Panel Interviewer', labelAr: 'المحاور / لجنة المقابلة', type: 'select' },
          { key: 'Meeting Link', labelEn: 'Video Conference Link', labelAr: 'رابط الاتصال المرئي', type: 'text' },
          { key: 'Technical Rating', labelEn: 'Technical Competency Rating', labelAr: 'التقييم الفني والتقني', type: 'number' },
          { key: 'Cultural Fit Rating', labelEn: 'Cultural & Behavioral Fit', labelAr: 'التوافق الثقافي والسلوكي', type: 'number' },
          { key: 'Final Recommendation', labelEn: 'Hiring Recommendation (Yes/No)', labelAr: 'توصية التعيين النهائية', type: 'select' }
        ]
      }
    ]
  },

  // -----------------------------------------------------------
  // 5. PAYROLL & SALARIES
  // -----------------------------------------------------------
  {
    id: 'Payroll & Salaries',
    labelEn: 'Payroll & Salaries',
    labelAr: 'مسيرات الرواتب والمستحقات',
    icon: DollarSign,
    actions: [
      { 
        id: 'hr:payroll:run_payroll', 
        labelEn: 'Run & Calculate Monthly Payroll', 
        labelAr: 'احتساب وتشغيل مسير الرواتب الشهري',
        category: 'workflow',
        description: 'Runs dynamic ledger calculation based on attendance, shifts, and policy rules.'
      },
      { 
        id: 'hr:payroll:customize_layout', 
        labelEn: 'Customize Layout & Fields', 
        labelAr: 'تخصيص الهيكل والحقول (Customize Layout)',
        category: 'workflow',
        description: 'Grants access to the Customize Layout dropdown button, schema editor, and field reordering for payroll.'
      },
      { 
        id: 'hr:payroll:generate_payroll_report', 
        labelEn: 'Generate Payroll Report', 
        labelAr: 'إنشاء تقرير مسير الرواتب',
        category: 'export'
      },
      { 
        id: 'hr:payroll:edit_payroll_entry', 
        labelEn: 'Edit Individual Payroll Record Breakdown', 
        labelAr: 'تعديل بنود واستحقاقات راتب الموظف',
        category: 'sensitive',
        description: 'Allows overriding salary components, manual deductions, and bonuses.'
      },
      { 
        id: 'hr:payroll:delete_payroll', 
        labelEn: 'Delete Payroll Batch / Record', 
        labelAr: 'حذف سجل أو مسير الرواتب',
        category: 'crud'
      },
      { 
        id: 'hr:payroll:approve_payroll_batch', 
        labelEn: 'Approve & Finalize Payroll for Disbursement', 
        labelAr: 'اعتماد مسير الرواتب للصرف البنكي',
        category: 'sensitive'
      },
      { 
        id: 'hr:payroll:export_payroll_excel_csv', 
        labelEn: 'Export Payroll (Excel / CSV)', 
        labelAr: 'تصدير مسير الرواتب إكسيل',
        category: 'export'
      },
      { 
        id: 'hr:payroll:print_pdf_report', 
        labelEn: 'Print Official Payslips (PDF)', 
        labelAr: 'طباعة كشوفات وقسائم الرواتب (PDF)',
        category: 'export'
      },
      { 
        id: 'hr:payroll:export_to_google_sheets', 
        labelEn: 'Sync & Export to Google Sheets', 
        labelAr: 'تزامن وتصدير لـ Google Sheets',
        category: 'export'
      },
      { 
        id: 'hr:payroll:manage_payroll_policy', 
        labelEn: 'Configure Payroll Policy & Rules', 
        labelAr: 'إعداد سياسات وقواعد الرواتب والخصومات',
        category: 'sensitive',
        description: 'Configures tardy slabs, social insurance brackets, and tax rates.'
      },
      { 
        id: 'hr:payroll:calculate_all_payrolls', 
        labelEn: 'Batch Re-Calculate All Active Employees', 
        labelAr: 'إعادة احتساب شامل لكافة الموظفين',
        category: 'workflow'
      }
    ],
    sections: [
      {
        key: 'payroll_summary',
        labelEn: 'Payroll Record Identification',
        labelAr: 'بيانات سجل ومسير الراتب',
        fields: [
          { key: 'Payroll Month', labelEn: 'Disbursement Month (1-12)', labelAr: 'شهر الاستحقاق', type: 'number' },
          { key: 'Payroll Year', labelEn: 'Disbursement Calendar Year', labelAr: 'سنة الاستحقاق', type: 'number' },
          { key: 'Employee Reference', labelEn: 'Beneficiary Employee', labelAr: 'الموظف المستفيد', type: 'select' },
          { key: 'Payroll Status', labelEn: 'Batch Status (Draft/Approved/Paid)', labelAr: 'حالة مسير الراتب', type: 'select' },
          { key: 'Working Days Count', labelEn: 'Payable Working Days Count', labelAr: 'عدد أيام العمل المستحقة', type: 'number' }
        ]
      },
      {
        key: 'earnings_breakdown',
        labelEn: 'Gross Earnings & Components',
        labelAr: 'تفاصيل الاستحقاقات والراتب الإجمالي',
        fields: [
          { key: 'Basic Salary', labelEn: 'Basic Salary Base', labelAr: 'الراتب الأساسي', type: 'currency', isSensitive: true },
          { key: 'Housing Allowance', labelEn: 'Housing Allowance', labelAr: 'بدل السكن', type: 'currency', isSensitive: true },
          { key: 'Transportation Allowance', labelEn: 'Transportation Allowance', labelAr: 'بدل الانتقال', type: 'currency', isSensitive: true },
          { key: 'Overtime Amount', labelEn: 'Approved Overtime Pay', labelAr: 'أجر الساعات الإضافية', type: 'currency', isSensitive: true },
          { key: 'Performance Bonus', labelEn: 'KPI / Performance Bonus', labelAr: 'حافز ومكافأة الأداء', type: 'currency', isSensitive: true },
          { key: 'Commissions', labelEn: 'Sales Commission / Incentives', labelAr: 'العمولات والمكافآت', type: 'currency', isSensitive: true },
          { key: 'Gross Total Salary', labelEn: 'Gross Salary Total (Pre-Deductions)', labelAr: 'إجمالي الراتب المستحق', type: 'currency', isSensitive: true }
        ]
      },
      {
        key: 'deductions_statutory',
        labelEn: 'Deductions, Insurance & Net Pay',
        labelAr: 'الخصومات والتأمينات وصافي الراتب',
        fields: [
          { key: 'Tardy Deductions', labelEn: 'Tardiness Penalties (Hours / Days)', labelAr: 'خصم التأخيرات وساعات التردد', type: 'currency', isSensitive: true },
          { key: 'Absence Penalties', labelEn: 'Unexcused Absence Penalty Days', labelAr: 'خصم أيام الغياب بدون إذن', type: 'currency', isSensitive: true },
          { key: 'Unpaid Leave Deductions', labelEn: 'Unpaid Leave Salary Withholding', labelAr: 'خصم الإجازات بدون راتب', type: 'currency', isSensitive: true },
          { key: 'Advances & Loans', labelEn: 'Salary Advances Repayment', labelAr: 'سداد السلفيات والقروض', type: 'currency', isSensitive: true },
          { key: 'Social Insurance Share', labelEn: 'Social Insurance Employee Share', labelAr: 'حصة الموظف في التأمينات (11%)', type: 'currency', isSensitive: true },
          { key: 'Income Tax Deduction', labelEn: 'Government Income Tax Withholding', labelAr: 'ضريبة كسب العمل والدخل', type: 'currency', isSensitive: true },
          { key: 'Martyrs Fund Deduction', labelEn: 'Martyrs & Veterans Solidarity Fund', labelAr: 'صندوق تكريم الشهداء والضحايا', type: 'currency', isSensitive: true },
          { key: 'Total Deductions', labelEn: 'Total Deductions Sum', labelAr: 'إجمالي الاستقطاعات والخصم', type: 'currency', isSensitive: true },
          { key: 'Net Payable Amount', labelEn: 'Net Take-Home Payable Amount', labelAr: 'صافي الراتب المستحق للصرف', type: 'currency', isSensitive: true }
        ]
      },
      {
        key: 'employer_overhead',
        labelEn: 'Employer Overheads & CTC',
        labelAr: 'أعباء الشركة وتكلفة التوظيف (CTC)',
        fields: [
          { key: 'Social Insurance Employer', labelEn: 'Social Insurance Company Share (18.75%)', labelAr: 'حصة الشركة في التأمينات', type: 'currency', isSensitive: true },
          { key: 'Emergency Workforce Fund', labelEn: 'Emergency Workforce Support Fund', labelAr: 'صندوق الطوارئ العمالي', type: 'currency', isSensitive: true },
          { key: 'Cost to Company (CTC)', labelEn: 'Total Monthly Cost to Company', labelAr: 'إجمالي التكلفة على الشركة (CTC)', type: 'currency', isSensitive: true }
        ]
      }
    ]
  },

  // -----------------------------------------------------------
  // 6. ATTENDANCE & TIME TRACKING
  // -----------------------------------------------------------
  {
    id: 'Attendance',
    labelEn: 'Attendance & Clock In',
    labelAr: 'الحضور والإنصراف وساعات العمل',
    icon: Clock,
    actions: [
      { 
        id: 'hr:attendance:attendance_clock_in_out', 
        labelEn: 'Clock In / Out (Punch)', 
        labelAr: 'تسجيل الحضور والانصراف الذاتي',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:customize_layout', 
        labelEn: 'Customize Layout & Fields', 
        labelAr: 'تخصيص الهيكل والحقول (Customize Layout)',
        category: 'workflow',
        description: 'Grants access to the Customize Layout dropdown button, schema editor, and field reordering for attendance.'
      },
      { 
        id: 'hr:attendance:attendance_smart_sync', 
        labelEn: 'Smart Sync Biometric Logs', 
        labelAr: 'التزامن الذكي لسجلات البصمة',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:attendance_filter_logs', 
        labelEn: 'Filter & Search Daily Logs', 
        labelAr: 'فلترة وبحث سجلات الحضور اليومية',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:attendance_edit_logs', 
        labelEn: 'Edit / Correct Attendance Logs', 
        labelAr: 'تعديل وتصحيح سجلات الحضور يدوياً',
        category: 'sensitive',
        description: 'Allows overriding punch times and manual status corrections.'
      },
      { 
        id: 'hr:attendance:attendance_export', 
        labelEn: 'Export Attendance Timesheets', 
        labelAr: 'تصدير كشوفات الحضور والانصراف',
        category: 'export'
      },
      { 
        id: 'hr:attendance:assign_shift', 
        labelEn: 'Assign Shift to Employee', 
        labelAr: 'تخصيص وردية للموظف',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:create_new_shift', 
        labelEn: 'Create New Shift Template', 
        labelAr: 'إنشاء قالب وردية عمل جديدة',
        category: 'crud'
      },
      { 
        id: 'hr:attendance:edit_shift', 
        labelEn: 'Edit Shift Timing & Slabs', 
        labelAr: 'تعديل توقيتات وفترات الوردية',
        category: 'crud'
      },
      { 
        id: 'hr:attendance:delete_shift', 
        labelEn: 'Delete Shift Template', 
        labelAr: 'حذف قالب الوردية',
        category: 'crud'
      },
      { 
        id: 'hr:attendance:view_edit_shift_schedule', 
        labelEn: 'View / Edit Weekly Roster Schedule', 
        labelAr: 'عرض وتعديل جدول التوزيع الأسبوعي',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:add_break_slot', 
        labelEn: 'Add Break Shift Slot', 
        labelAr: 'إضافة فترة استراحة',
        category: 'crud'
      },
      { 
        id: 'hr:attendance:edit_break_slot', 
        labelEn: 'Edit Break Shift Slot', 
        labelAr: 'تعديل فترة الاستراحة',
        category: 'crud'
      },
      { 
        id: 'hr:attendance:delete_break_slot', 
        labelEn: 'Delete Break Shift Slot', 
        labelAr: 'حذف فترة الاستراحة',
        category: 'crud'
      },
      { 
        id: 'hr:attendance:request_leave', 
        labelEn: 'Request Leave / Time Off', 
        labelAr: 'تقديم طلب إجازة رسمية',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:edit_leave', 
        labelEn: 'Edit Pending Leave Request', 
        labelAr: 'تعديل طلب الإجازة المعلق',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:approve_leaves', 
        labelEn: 'Approve Leave Request', 
        labelAr: 'اعتماد وقبول طلب الإجازة',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:reject_leaves', 
        labelEn: 'Reject Leave Request', 
        labelAr: 'رفض طلب الإجازة',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:bulk_approve_leaves', 
        labelEn: 'Bulk Approve Leaves', 
        labelAr: 'اعتماد جماعي للإجازات المعلقة',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:adjust_leave_balances', 
        labelEn: 'Adjust & Reset Leave Balances', 
        labelAr: 'تعديل وتسوية أرصدة الإجازات',
        category: 'sensitive',
        description: 'Administrative modification of annual, sick, or casual balances.'
      },
      { 
        id: 'hr:attendance:request_shift_swap', 
        labelEn: 'Submit Shift Swap Request', 
        labelAr: 'تقديم طلب تبديل وردية مع زميل',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:swap_manager_approve', 
        labelEn: 'Manager Shift Swap Approval', 
        labelAr: 'موافقة المدير المباشر على التبديل',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:swap_attendance_approve', 
        labelEn: 'Attendance Officer Swap Approval', 
        labelAr: 'اعتماد مسؤول الحضور لتبديل الوردية',
        category: 'workflow'
      },
      { 
        id: 'hr:attendance:delete_shift_swap', 
        labelEn: 'Delete / Cancel Shift Swap', 
        labelAr: 'إلغاء أو حذف طلب تبديل الوردية',
        category: 'crud'
      }
    ],
    sections: [
      {
        key: 'daily_logs_spec',
        labelEn: 'Daily Attendance Punch Records',
        labelAr: 'سجلات البصمة والحضور اليومي',
        fields: [
          { key: 'Log Date', labelEn: 'Attendance Log Date', labelAr: 'تاريخ سجل الحضور', type: 'date' },
          { key: 'Employee Reference', labelEn: 'Employee Name / ID', labelAr: 'اسم ورقم الموظف', type: 'select' },
          { key: 'Check-In Time', labelEn: 'Clock-In Timestamp', labelAr: 'وقت الحضور الفعلي', type: 'text' },
          { key: 'Check-Out Time', labelEn: 'Clock-Out Timestamp', labelAr: 'وقت الانصراف الفعلي', type: 'text' },
          { key: 'Total Working Hours', labelEn: 'Net Completed Work Hours', labelAr: 'إجمالي ساعات العمل المنجزة', type: 'number' },
          { key: 'Late Minutes', labelEn: 'Arrival Delay (Minutes)', labelAr: 'دقائق التأخير الصباحي', type: 'number' },
          { key: 'Early Departure Minutes', labelEn: 'Early Departure (Minutes)', labelAr: 'دقائق الخروج المبكر', type: 'number' },
          { key: 'Overtime Hours', labelEn: 'Calculated Overtime Hours', labelAr: 'ساعات العمل الإضافية', type: 'number' },
          { key: 'Attendance Status', labelEn: 'Daily Status (Present/Late/Absent)', labelAr: 'حالة الحضور (حاضر/متأخر/غائب)', type: 'select' },
          { key: 'Verification Source', labelEn: 'Biometric / Mobile GPS Source', labelAr: 'طريقة التحقق ومصدر البصمة', type: 'text' }
        ]
      },
      {
        key: 'shift_spec',
        labelEn: 'Shift Structure & Configuration',
        labelAr: 'هيكل وإعدادات الورديات',
        fields: [
          { key: 'Shift Name', labelEn: 'Shift Name / Label', labelAr: 'اسم الوردية', type: 'text' },
          { key: 'Shift Type', labelEn: 'Shift Type (Morning/Night/Flexible)', labelAr: 'نوع الوردية (صباحي/مسائي/مرن)', type: 'select' },
          { key: 'Start Time', labelEn: 'Designated Shift Start Time', labelAr: 'توقيت بدء العمل', type: 'text' },
          { key: 'End Time', labelEn: 'Designated Shift End Time', labelAr: 'توقيت نهاية العمل', type: 'text' },
          { key: 'Grace Period', labelEn: 'Late Arrival Grace Window (Mins)', labelAr: 'فترة السماح الصباحية (دقائق)', type: 'number' },
          { key: 'Break Duration', labelEn: 'Allowed Rest Break Window (Mins)', labelAr: 'مدة الاستراحة المسموحة (دقائق)', type: 'number' }
        ]
      },
      {
        key: 'leaves_spec',
        labelEn: 'Leave & Absence Management',
        labelAr: 'إدارة الإجازات والغياب',
        fields: [
          { key: 'Leave Type', labelEn: 'Leave Type (Annual/Sick/Casual/Unpaid)', labelAr: 'نوع الإجازة (سنوية/مرضي/عارضة)', type: 'select' },
          { key: 'Leave Start Date', labelEn: 'Leave Start Date', labelAr: 'تاريخ بداية الإجازة', type: 'date' },
          { key: 'Leave End Date', labelEn: 'Leave End Date', labelAr: 'تاريخ نهاية الإجازة', type: 'date' },
          { key: 'Leave Days Count', labelEn: 'Total Requested Calendar Days', labelAr: 'إجمالي عدد أيام الإجازة', type: 'number' },
          { key: 'Leave Justification', labelEn: 'Reason / Justification Note', labelAr: 'سبب ومبرر طلب الإجازة', type: 'text' },
          { key: 'Medical Attachment', labelEn: 'Medical Certificate / Document', labelAr: 'التقرير الطبي / المرفق', type: 'file' },
          { key: 'Approval Status', labelEn: 'Approval Status (Pending/Approved/Rejected)', labelAr: 'حالة الاعتماد', type: 'select' },
          { key: 'Annual Balance Remaining', labelEn: 'Remaining Available Annual Balance', labelAr: 'الرصيد السنوي المتبقي', type: 'number' }
        ]
      }
    ]
  },

  // -----------------------------------------------------------
  // 7. PERFORMANCE & OKRS
  // -----------------------------------------------------------
  {
    id: 'Performance & OKRs',
    labelEn: 'Performance & OKRs',
    labelAr: 'تقييم الأداء والأهداف الذكية',
    icon: Target,
    actions: [
      { 
        id: 'hr:performance:performance_add_review', 
        labelEn: 'Launch Performance Review', 
        labelAr: 'بدء دورة تقييم أداء جديدة',
        category: 'workflow'
      },
      { 
        id: 'hr:performance:performance_edit_delete', 
        labelEn: 'Edit / Delete Performance Review', 
        labelAr: 'تعديل أو حذف تقييم الأداء',
        category: 'crud'
      },
      { 
        id: 'hr:performance:performance_manage_okrs', 
        labelEn: 'Manage Department & Individual OKRs', 
        labelAr: 'إدارة وتحديد الأهداف الذكية (OKRs)',
        category: 'workflow'
      },
      { 
        id: 'hr:performance:run_appraisal_engine', 
        labelEn: 'Execute Automated Composite Scoring Engine', 
        labelAr: 'تشغيل محرك الاحتساب الموزون للتقييم',
        category: 'workflow'
      },
      { 
        id: 'hr:performance:view_performance_hub_analytics', 
        labelEn: 'Access Performance Analytics Hub', 
        labelAr: 'عرض لوحة تحليلات الأداء والكفاءة',
        category: 'workflow'
      }
    ],
    sections: [
      {
        key: 'appraisal_header',
        labelEn: 'Appraisal Session Metadata',
        labelAr: 'بيانات دورة التقييم والموظف',
        fields: [
          { key: 'Review Cycle', labelEn: 'Appraisal Cycle Period (Q1/Q2/Annual)', labelAr: 'دورة التقييم (ربع سنوي/سنوي)', type: 'text' },
          { key: 'Employee Reference', labelEn: 'Evaluated Employee', labelAr: 'الموظف محل التقييم', type: 'select' },
          { key: 'Framework Code', labelEn: 'Framework Model (360/OKRs/Hybrid)', labelAr: 'نموذج التقييم (360/OKRs/هجين)', type: 'select' },
          { key: 'Composite Score', labelEn: 'Composite Score (0 - 10)', labelAr: 'الدرجة المركبة النهائية (من 10)', type: 'number' },
          { key: 'Productivity Rate', labelEn: 'Productivity Percentage (%)', labelAr: 'نسبة الإنجاز والإنتاجية (%)', type: 'number' }
        ]
      },
      {
        key: 'appraisal_weights',
        labelEn: 'Multi-Rater Scoring & Competencies',
        labelAr: 'المعدلات الموزونة والتقييم متعدد الأطراف',
        fields: [
          { key: 'OKRs Score', labelEn: 'Objective Key Results Score', labelAr: 'درجة تحقيق الأهداف الذكية (OKRs)', type: 'number' },
          { key: 'Manager Score', labelEn: 'Direct Supervisor Evaluation Rating', labelAr: 'تقييم المدير المباشر', type: 'number' },
          { key: 'Peer Score', labelEn: 'Peer Multi-Rater Score', labelAr: 'تقييم زملاء العمل (Peers)', type: 'number' },
          { key: 'Self Assessment', labelEn: 'Employee Self Appraisal Score', labelAr: 'التقييم الذاتي للموظف', type: 'number' },
          { key: 'Competency Ratings', labelEn: 'Core Competency Breakdown', labelAr: 'تقييم الجدارات والكفاءات', type: 'text' },
          { key: 'Strengths & Growth Notes', labelEn: 'Key Strengths & Growth Areas', labelAr: 'نقاط القوة وفرص التطوير', type: 'text' },
          { key: 'Increment Recommendation', labelEn: 'Merit Raise / Promotion Recommendation', labelAr: 'توصية الترقية أو العلاوة', type: 'select', isSensitive: true }
        ]
      }
    ]
  },

  // -----------------------------------------------------------
  // 8. ORG CHART
  // -----------------------------------------------------------
  {
    id: 'Org Chart',
    labelEn: 'Organization Chart',
    labelAr: 'المخطط الهيكلي التفاعلي',
    icon: Network,
    actions: [
      { 
        id: 'hr:orgchart:view_hierarchy_tree', 
        labelEn: 'Explore Interactive Hierarchy Tree', 
        labelAr: 'استعراض الشجرة الهيكلية التفاعلية',
        category: 'workflow'
      },
      { 
        id: 'hr:orgchart:export_org_chart', 
        labelEn: 'Export Org Chart (PNG / PDF)', 
        labelAr: 'تصدير الهيكل صورة أو ملف (PDF/PNG)',
        category: 'export'
      },
      { 
        id: 'hr:orgchart:reassign_reporting_line', 
        labelEn: 'Reassign Hierarchy Reporting Lines', 
        labelAr: 'تعديل خطوط التبعية الإدارية',
        category: 'sensitive',
        description: 'Enables dragging nodes to change department and management hierarchies.'
      }
    ]
  },

  // -----------------------------------------------------------
  // 9. COMPLAINTS & GRIEVANCES
  // -----------------------------------------------------------
  {
    id: 'Complaints & Grievances',
    labelEn: 'Complaints & Grievances',
    labelAr: 'الشكاوى والتظلمات',
    icon: AlertTriangle,
    actions: [
      { 
        id: 'hr:complaints:complaints_submit', 
        labelEn: 'Submit New Grievance / Complaint', 
        labelAr: 'تقديم شكوى أو تظلم جديد',
        category: 'workflow'
      },
      { 
        id: 'hr:complaints:customize_layout', 
        labelEn: 'Customize Layout & Fields', 
        labelAr: 'تخصيص الهيكل والحقول (Customize Layout)',
        category: 'workflow',
        description: 'Grants access to the Customize Layout dropdown button, schema editor, and field reordering for complaints.'
      },
      { 
        id: 'hr:complaints:complaints_view', 
        labelEn: 'View Grievance Case Details', 
        labelAr: 'عرض تفاصيل ملف الشكوى',
        category: 'workflow'
      },
      { 
        id: 'hr:complaints:complaints_edit', 
        labelEn: 'Edit Grievance Incident Report', 
        labelAr: 'تعديل تقرير الواقعة للشكوى',
        category: 'crud'
      },
      { 
        id: 'hr:complaints:complaints_resolve', 
        labelEn: 'Resolve & Issue Official Ruling', 
        labelAr: 'البت واعتماد القرار في الشكوى',
        category: 'sensitive'
      },
      { 
        id: 'hr:complaints:complaints_delete', 
        labelEn: 'Dismiss / Delete Complaint Record', 
        labelAr: 'حذف أو استبعاد سجل الشكوى',
        category: 'crud'
      },
      { 
        id: 'hr:complaints:complaints_share', 
        labelEn: 'Share Complaint Case File', 
        labelAr: 'مشاركة ملف القضية مع المحققين',
        category: 'workflow'
      },
      { 
        id: 'hr:complaints:update_admin_investigation_notes', 
        labelEn: 'Write Private Investigation Notes', 
        labelAr: 'تدوين ملاحظات التحقيق السرية',
        category: 'sensitive',
        description: 'Restricted administrative notes visible only to designated legal/HR investigators.'
      }
    ],
    sections: [
      {
        key: 'grievance_case',
        labelEn: 'Case Filing & Incident Data',
        labelAr: 'بيانات وتفاصيل الواقعة',
        fields: [
          { key: 'Case Title', labelEn: 'Grievance Subject / Title', labelAr: 'موضوع وعنوان الشكوى', type: 'text' },
          { key: 'Category', labelEn: 'Incident Category (Workplace/Harassment/Wage)', labelAr: 'تصنيف الشكوى (بيئة العمل/رواتب/سلوك)', type: 'select' },
          { key: 'Is Anonymous', labelEn: 'Anonymous Submission Flag', labelAr: 'تقديم سري / مجهول المصدر', type: 'select' },
          { key: 'Complainant', labelEn: 'Complainant Employee Profile', labelAr: 'الموظف الشاكي', type: 'select' },
          { key: 'Incident Date', labelEn: 'Incident Timestamp', labelAr: 'تاريخ ووقت الواقعة', type: 'date' },
          { key: 'Incident Description', labelEn: 'Detailed Chronological Description', labelAr: 'شرح تفاصيل الواقعة', type: 'text' },
          { key: 'Attachments', labelEn: 'Evidence Supporting Files', labelAr: 'المستندات والأدلة المرفقة', type: 'file' }
        ]
      },
      {
        key: 'investigation_verdict',
        labelEn: 'Investigation & Official Decision',
        labelAr: 'سير التحقيق والقرار الرسمي',
        fields: [
          { key: 'Investigator', labelEn: 'Assigned Lead HR Investigator', labelAr: 'المحقق المسؤول المعين', type: 'select' },
          { key: 'Case Status', labelEn: 'Status (Open/In Review/Resolved/Closed)', labelAr: 'حالة القضية (مفتوح/قيد التحقيق/منتهي)', type: 'select' },
          { key: 'Admin Notes', labelEn: 'Confidential Legal / Admin Notes', labelAr: 'ملاحظات التحقيق الإدارية السرية', type: 'text', isSensitive: true },
          { key: 'Official Ruling', labelEn: 'Official Resolution & Sanctions Taken', labelAr: 'القرار الإداري والإجراء المتخذ', type: 'text' }
        ]
      }
    ]
  },

  // -----------------------------------------------------------
  // 10. ARCHIVED EMPLOYEES
  // -----------------------------------------------------------
  {
    id: 'Archived Staff',
    labelEn: 'Archived Staff Records',
    labelAr: 'أرشيف الموظفين وإنهاء الخدمة',
    icon: Archive,
    actions: [
      { 
        id: 'hr:archived:view_archived_employee', 
        labelEn: 'View Historical Terminated Records', 
        labelAr: 'عرض سجلات الموظفين المنتهية خدماتهم',
        category: 'workflow'
      },
      { 
        id: 'hr:archived:restore_employee', 
        labelEn: 'Reactivate & Restore Employee', 
        labelAr: 'إلغاء الأرشفة واستعادة الموظف للخدمة',
        category: 'crud'
      },
      { 
        id: 'hr:archived:permanent_delete_employee', 
        labelEn: 'Permanently Purge Employee Record', 
        labelAr: 'الحذف النهائي الشامل لسجل الموظف',
        category: 'sensitive',
        description: 'Irreversible deletion from database.'
      },
      { 
        id: 'hr:archived:export_archived_records', 
        labelEn: 'Export Historical Archive (CSV/Excel)', 
        labelAr: 'تصدير الأرشيف التاريخي إكسيل',
        category: 'export'
      }
    ],
    sections: [
      {
        key: 'termination_audit',
        labelEn: 'Termination & Clearance Data',
        labelAr: 'بيانات إنهاء الخدمة وإخلاء الطرف',
        fields: [
          { key: 'Termination Date', labelEn: 'Official Last Working Day', labelAr: 'تاريخ آخر يوم عمل', type: 'date' },
          { key: 'Separation Reason', labelEn: 'Reason for Separation (Resigned/Terminated)', labelAr: 'سبب انتهاء الخدمة (استقالة/فصل)', type: 'select' },
          { key: 'Severance Indemnity', labelEn: 'End of Service Indemnity (Gratuity)', labelAr: 'مكافأة نهاية الخدمة المستحقة', type: 'currency', isSensitive: true },
          { key: 'Exit Clearance Status', labelEn: 'Asset & IT Clearance Signed Off', labelAr: 'حالة إخلاء الطرف والعهد', type: 'select' }
        ]
      }
    ]
  }
];

// -------------------------------------------------------------
// COMPLETE HR MODULE REGISTRY OBJECT
// -------------------------------------------------------------

export const hrModuleRegistry: ModuleMetadata = {
  id: 'HR',
  canonicalId: 'HR',
  nameEn: 'Human Resources (HR)',
  nameAr: 'الموارد البشرية وشؤون الموظفين',
  icon: Users,
  descriptionEn: 'Core Human Capital Management suite: Directory, Org Structure, Recruitment, Attendance, Payroll, Performance, Grievances, and Access Control.',
  descriptionAr: 'منظومة إدارة رأس المال البشري المتكاملة: دليل الموظفين، الهيكل الإداري، التوظيف، الحضور، الرواتب، تقييم الأداء، والشكاوى.',
  color: '#4F46E5',
  tabs: HR_MODULE_TABS,
  customActions: HR_MODULE_TABS.flatMap(t => t.actions || []),
  settingsLabelEn: 'HR Module Settings & Policy Defaults',
  settingsLabelAr: 'إعدادات وسياسات الموارد البشرية'
};

// -------------------------------------------------------------
// HELPER LOOKUP UTILITIES
// -------------------------------------------------------------

/**
 * Get all available actions for a specific HR sub-tab
 */
export function getHrTabActions(tabId: string): ModuleActionMetadata[] {
  const tab = HR_MODULE_TABS.find(t => 
    t.id.toLowerCase() === tabId.toLowerCase() ||
    t.labelEn.toLowerCase() === tabId.toLowerCase()
  );
  return tab?.actions || [];
}

/**
 * Get all defined sections for an HR tab
 */
export function getHrTabSections(tabId: string): ModuleSectionMetadata[] {
  const tab = HR_MODULE_TABS.find(t => 
    t.id.toLowerCase() === tabId.toLowerCase() ||
    t.labelEn.toLowerCase() === tabId.toLowerCase()
  );
  return tab?.sections || [];
}

/**
 * Returns whether a field in HR is flagged as sensitive (requiring elevated privilege)
 */
export function isHrFieldSensitive(fieldKey: string, sectionKey?: string): boolean {
  for (const tab of HR_MODULE_TABS) {
    if (!tab.sections) continue;
    for (const sec of tab.sections) {
      if (sectionKey && sec.key.toLowerCase() !== sectionKey.toLowerCase()) continue;
      const f = sec.fields.find(field => field.key.toLowerCase() === fieldKey.toLowerCase());
      if (f) return !!f.isSensitive;
    }
  }
  return false;
}

export default hrModuleRegistry;
