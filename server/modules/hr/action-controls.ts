import express from "express";
import { pool } from "../../db/schema.js";
import { memoryCache } from "../../utils/cache.js";

export interface ActionControlItem {
  id?: number;
  company_id?: number;
  action_key: string;
  tab_id: string;
  section_name: string;
  label_en: string;
  label_ar?: string;
  state: 'active' | 'disabled' | 'hidden';
  permission_scope: 'super_admin' | 'direct_manager' | 'self' | 'everyone';
  tooltip_text?: string;
  order_index?: number;
}

export const DEFAULT_HR_ACTION_CONTROLS: Omit<ActionControlItem, 'id' | 'company_id'>[] = [
  // ==========================================
  // 1. Top Header / Profile Actions (Personal Tab)
  // ==========================================
  { action_key: 'act_header_request_change', tab_id: 'personal', section_name: 'Basic Information', label_en: 'Request a Change', label_ar: 'طلب تعديل بيانات', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_header_customize_layout', tab_id: 'personal', section_name: 'Basic Information', label_en: 'Customize Layout', label_ar: 'تخصيص المظهر', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_header_more_options', tab_id: 'personal', section_name: 'Basic Information', label_en: 'More Options', label_ar: 'المزيد من الخيارات', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_header_switch_edit', tab_id: 'personal', section_name: 'Basic Information', label_en: 'Edit Mode / Switch to Edit', label_ar: 'وضع التعديل', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_header_switch_view', tab_id: 'personal', section_name: 'Basic Information', label_en: 'Switch to View', label_ar: 'وضع العرض', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_header_export_sheet', tab_id: 'personal', section_name: 'Basic Information', label_en: 'Export Sheet', label_ar: 'تصدير البيانات', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_header_add_employee', tab_id: 'personal', section_name: 'Basic Information', label_en: 'Add Employee', label_ar: 'إضافة موظف', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_personal_add_entry', tab_id: 'personal', section_name: 'Contact', label_en: 'Add Contact Entry', label_ar: 'إضافة جهة اتصال', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_personal_delete_entry', tab_id: 'personal', section_name: 'Contact', label_en: 'Delete Contact Entry', label_ar: 'حذف جهة اتصال', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_add_education', tab_id: 'personal', section_name: 'Education', label_en: 'Add Education Degree', label_ar: 'إضافة مؤهل تعليمي', permission_scope: 'super_admin', state: 'active' },

  // ==========================================
  // 2. Job Tab
  // ==========================================
  { action_key: 'act_header_salary_hidden', tab_id: 'job', section_name: 'Compensation', label_en: 'Salary Hidden (Toggle Visibility)', label_ar: 'إخفاء/إظهار الراتب', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_save_job_details', tab_id: 'job', section_name: 'Job Details', label_en: 'Save Job Details', label_ar: 'حفظ تفاصيل الوظيفة', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_job_details_policy', tab_id: 'job', section_name: 'Job Details', label_en: 'Add Policy / Save', label_ar: 'إضافة سياسة / حفظ', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_emp_status_history', tab_id: 'job', section_name: 'Employment Status', label_en: 'Add History Record', label_ar: 'إضافة سجل وظيفي', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_emp_status_policy', tab_id: 'job', section_name: 'Employment Status', label_en: 'Add Policy', label_ar: 'إضافة سياسة', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_job_info_change_role', tab_id: 'job', section_name: 'Job Information', label_en: 'Change Role / Promotion', label_ar: 'تغيير المسمى الوظيفي / ترقية', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_job_info_policy', tab_id: 'job', section_name: 'Job Information', label_en: 'Add Policy', label_ar: 'إضافة سياسة', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_comp_add_policy', tab_id: 'job', section_name: 'Compensation', label_en: 'Add Compensation Policy', label_ar: 'إضافة سياسة التعويضات', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_compensation_history_add', tab_id: 'job', section_name: 'Compensation', label_en: 'Add Compensation Record', label_ar: 'إضافة سجل تعويض', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_save_kpi_settings', tab_id: 'job', section_name: 'Key Performance Indicators (KPIs)', label_en: 'Save KPI Settings', label_ar: 'حفظ إعدادات مؤشرات الأداء', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_save_potential_bonus', tab_id: 'job', section_name: 'Potential Bonus', label_en: 'Save Potential Bonus', label_ar: 'حفظ المكافأة المحتملة', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_bonus_add_policy', tab_id: 'job', section_name: 'Bonus', label_en: 'Add Bonus Policy', label_ar: 'إضافة سياسة المكافآت', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_commission_add_policy', tab_id: 'job', section_name: 'Commission', label_en: 'Add Commission Policy', label_ar: 'إضافة سياسة العمولات', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_add_penalty_record', tab_id: 'job', section_name: 'Penalty History & Issues', label_en: 'Add Penalty Record', label_ar: 'إضافة سجل جزاء', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_penalty_add_policy', tab_id: 'job', section_name: 'Penalty History & Issues', label_en: 'Add Penalty Policy', label_ar: 'إضافة سياسة الجزاءات', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_equity_add_policy', tab_id: 'job', section_name: 'Equity Grants', label_en: 'Add Equity Policy', label_ar: 'إضافة سياسة الأسهم', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_shift_allowance_add_policy', tab_id: 'job', section_name: 'Shift Differential Allowance', label_en: 'Add Shift Allowance Policy', label_ar: 'إضافة سياسة بدل الورديات', permission_scope: 'super_admin', state: 'active' },

  // ==========================================
  // 3. Time Off Tab
  // ==========================================
  { action_key: 'act_adjust_leave_balances', tab_id: 'time_off', section_name: 'Leave Balances & Policies', label_en: 'Adjust Leave Balances', label_ar: 'تعديل أرصدة الإجازات', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_leave_policy_settings', tab_id: 'time_off', section_name: 'Leave Balances & Policies', label_en: 'Policy Settings (Gear Icon)', label_ar: 'إعدادات السياسات (أيقونة الترس)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_add_break_slot', tab_id: 'time_off', section_name: 'Break Schedule & Slot Assignments', label_en: 'Add Break Slot', label_ar: 'إضافة فترة استراحة', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_request_leave', tab_id: 'time_off', section_name: 'Upcoming Time Off', label_en: 'Request Leave Button', label_ar: 'زر تقديم طلب إجازة', permission_scope: 'everyone', state: 'active' },

  // ==========================================
  // 4. Emergency Tab
  // ==========================================
  { action_key: 'act_add_emergency_contact', tab_id: 'emergency', section_name: 'Primary Contact', label_en: 'Add Emergency Contact', label_ar: 'إضافة جهة اتصال طوارئ', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_add_first_contact', tab_id: 'emergency', section_name: 'Primary Contact', label_en: 'Add First Contact', label_ar: 'إضافة أول جهة اتصال', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_delete_emergency_contact', tab_id: 'emergency', section_name: 'Emergency Contacts List', label_en: 'Delete Emergency Contact (Trash Icon)', label_ar: 'حذف جهة اتصال طوارئ (أيقونة الحذف)', permission_scope: 'super_admin', state: 'active' },

  // ==========================================
  // 5. Recognition Tab
  // ==========================================
  { action_key: 'act_recognition_add_award', tab_id: 'recognition', section_name: 'Recognition & Spot Bonuses', label_en: 'Add Award / Spot Bonus', label_ar: 'إضافة مكافأة / تكريم فوري', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_recognition_delete_award', tab_id: 'recognition', section_name: 'Recognitions & Honors List', label_en: 'Delete Recognition Record (Trash Icon)', label_ar: 'حذف سجل تكريم (أيقونة الحذف)', permission_scope: 'super_admin', state: 'active' },

  // ==========================================
  // 6. Performance Tab
  // ==========================================
  { action_key: 'act_performance_recalculate_rank', tab_id: 'performance', section_name: 'Performance Evaluation & Scoring', label_en: 'Recalculate Rank Button (Refresh Icon)', label_ar: 'زر إعادة احتساب الرانك والتصنيف (أيقونة التحديث)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_performance_new_review', tab_id: 'performance', section_name: 'Performance Evaluation & Scoring', label_en: 'New Review Button (+)', label_ar: 'زر تقييم جديد (+)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_performance_date_filter_update', tab_id: 'performance', section_name: 'Performance Evaluation & Scoring', label_en: 'Update Analytics Live Button', label_ar: 'زر تحديث التحليل المباشر', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_conduct_review', tab_id: 'performance', section_name: 'Performance Reviews & Appraisals', label_en: 'Conduct Review Button', label_ar: 'زر إجراء تقييم الأداء', permission_scope: 'direct_manager', state: 'active' },
  { action_key: 'act_performance_view_details', tab_id: 'performance', section_name: 'Performance Reviews & Appraisals', label_en: 'View Review Details Icon (Eye)', label_ar: 'أيقونة عرض تفاصيل التقييم (العين)', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_performance_edit_review', tab_id: 'performance', section_name: 'Performance Reviews & Appraisals', label_en: 'Edit Review Record (Pencil Icon)', label_ar: 'تعديل سجل التقييم (أيقونة القلم)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_performance_delete_review', tab_id: 'performance', section_name: 'Performance Reviews & Appraisals', label_en: 'Delete Review Record (Trash Icon)', label_ar: 'حذف سجل التقييم (أيقونة الحذف)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_performance_manage_okrs', tab_id: 'performance', section_name: 'Performance Evaluation & Scoring', label_en: 'Manage OKRs & Key Goals', label_ar: 'إدارة الأهداف والنتائج الرئيسية', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_performance_run_appraisal', tab_id: 'performance', section_name: 'Performance Reviews & Appraisals', label_en: 'Run Appraisal Engine', label_ar: 'تشغيل محرك التقييم', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_performance_export_report', tab_id: 'performance', section_name: 'Performance Reviews & Appraisals', label_en: 'Export Performance Report', label_ar: 'تصدير تقرير التقييم', permission_scope: 'super_admin', state: 'active' },

  // ==========================================
  // 7. Training Tab
  // ==========================================
  { action_key: 'act_training_toggle_complete', tab_id: 'training', section_name: 'Training Courses & Programs', label_en: 'Mark Course Completed Checkbox', label_ar: 'مربع تحديد إكمال الدورة التدريبية', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_training_click_course', tab_id: 'training', section_name: 'Training Courses & Programs', label_en: 'Open Course Details Link', label_ar: 'رابط تفاصيل الدورة التدريبية', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_training_add_course', tab_id: 'training', section_name: 'Training Courses & Programs', label_en: 'Add Training Course Button', label_ar: 'زر إضافة دورة تدريبية', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_record_training', tab_id: 'training', section_name: 'Completed Training & Certificates', label_en: 'Record a Training Button (+)', label_ar: 'زر تسجيل دورة تدريبية (+)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_training_edit_record', tab_id: 'training', section_name: 'Completed Training & Certificates', label_en: 'Edit Training Record (Pencil Icon)', label_ar: 'تعديل سجل تدريب (أيقونة القلم)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_training_delete_record', tab_id: 'training', section_name: 'Completed Training & Certificates', label_en: 'Delete Training Record (Trash Icon)', label_ar: 'حذف سجل تدريب (أيقونة الحذف)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_training_view_certificate', tab_id: 'training', section_name: 'Completed Training & Certificates', label_en: 'View / Download Certificate Icon', label_ar: 'عرض / تحميل الشهادة', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_training_filter_year', tab_id: 'training', section_name: 'Completed Training & Certificates', label_en: 'Filter Training By Year / Sort', label_ar: 'تصفية التدريبات حسب السنة والترتيب', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_training_export', tab_id: 'training', section_name: 'Completed Training & Certificates', label_en: 'Export Training History', label_ar: 'تصدير سجل التدريبات', permission_scope: 'super_admin', state: 'active' },

  // ==========================================
  // 8. Documents Tab
  // ==========================================
  { action_key: 'act_documents_id_upload', tab_id: 'documents', section_name: 'Personal & System Identification', label_en: 'Upload National ID / Passport', label_ar: 'رفع الهوية الوطنية / جواز السفر', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_documents_contract_upload', tab_id: 'documents', section_name: 'Personal & System Identification', label_en: 'Upload Contract Document', label_ar: 'رفع عقد العمل', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_documents_upload', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'Upload Document Button', label_ar: 'زر رفع المستندات', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_documents_create_folder', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'Create Folder Icon (FolderPlus)', label_ar: 'أيقونة إنشاء مجلد جديد', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_documents_view_options', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'View Layout Options Icon (LayoutGrid)', label_ar: 'خيارات طريقة العرض (شبكة/قائمة)', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_documents_search', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'Search Documents Input', label_ar: 'حقل البحث في المستندات', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_documents_filter_settings', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'Filter & Sliders Settings Icon', label_ar: 'أيقونة الفلاتر والإعدادات (المحددات)', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_documents_preview', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'Preview Document Eye Icon', label_ar: 'معاينة المستند (أيقونة العين)', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_documents_download', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'Download / Open Document Icon', label_ar: 'تحميل / فتح المستند في نافذة جديدة', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_documents_delete', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'Delete Document Trash Icon', label_ar: 'حذف المستند (أيقونة سلة المهملات)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_documents_sign', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'Sign Document Icon (FileSignature)', label_ar: 'توقيع المستند رقمياً', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_documents_drag_drop', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'Drag & Drop Upload Zone', label_ar: 'منطقة السحب والإفلات للرفع السريع', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_documents_add_link', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'Add New Link/Doc', label_ar: 'إضافة رابط أو مستند جديد', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_documents_rename', tab_id: 'documents', section_name: 'Employee Documents Repository', label_en: 'Rename Document / File Icon', label_ar: 'إعادة تسمية الملف / المستند', permission_scope: 'super_admin', state: 'active' },

  // ==========================================
  // 9. Login Info Tab
  // ==========================================
  { action_key: 'act_edit_fingerprint_code', tab_id: 'login_info', section_name: 'Attendance & System Identifiers', label_en: 'Edit Fingerprint Code Button', label_ar: 'تعديل كود البصمة', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_add_system_login', tab_id: 'login_info', section_name: 'System Credentials & Logins', label_en: 'Add System Login Button', label_ar: 'إضافة حساب نظام', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_add_first_system_login', tab_id: 'login_info', section_name: 'System Credentials & Logins', label_en: 'Add First System Login Button', label_ar: 'إضافة أول حساب نظام', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_delete_system_login', tab_id: 'login_info', section_name: 'System Credentials & Logins', label_en: 'Delete System Login (Trash Icon)', label_ar: 'حذف حساب نظام (أيقونة الحذف)', permission_scope: 'super_admin', state: 'active' },

  // ==========================================
  // 10. Notes Tab
  // ==========================================
  { action_key: 'act_notes_add_entry', tab_id: 'notes', section_name: 'Comments & Notes', label_en: 'Add Note / Comment Button', label_ar: 'إضافة ملاحظة / تعليق', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_notes_delete_entry', tab_id: 'notes', section_name: 'Comments & Notes', label_en: 'Delete Note (Trash Icon)', label_ar: 'حذف ملاحظة (أيقونة الحذف)', permission_scope: 'super_admin', state: 'active' },

  // ==========================================
  // 11. Assets Tab
  // ==========================================
  { action_key: 'act_assets_add_entry', tab_id: 'assets', section_name: 'Assigned Assets & Hardware', label_en: 'Add Entry Button (+)', label_ar: 'زر إضافة عهدة / أصل (+)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_assets_cancel_entry', tab_id: 'assets', section_name: 'Assigned Assets & Hardware', label_en: 'Cancel Asset Entry Button', label_ar: 'زر إلغاء إدخال العهدة', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_assets_save_entry', tab_id: 'assets', section_name: 'Assigned Assets & Hardware', label_en: 'Save Asset (Check Icon)', label_ar: 'حفظ العهدة (أيقونة الصح)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_assets_delete_entry', tab_id: 'assets', section_name: 'Assigned Assets & Hardware', label_en: 'Delete Asset (Trash Icon)', label_ar: 'حذف عهدة (أيقونة سلة المهملات)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_assets_edit_entry', tab_id: 'assets', section_name: 'Assigned Assets & Hardware', label_en: 'Edit Asset Record (Pencil Icon)', label_ar: 'تعديل سجل العهدة (أيقونة القلم)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_assets_export', tab_id: 'assets', section_name: 'Assigned Assets & Hardware', label_en: 'Export Assets List', label_ar: 'تصدير قائمة العهد والأصول', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_assets_search', tab_id: 'assets', section_name: 'Assigned Assets & Hardware', label_en: 'Search Assets Input', label_ar: 'حقل البحث في العهد والأصول', permission_scope: 'everyone', state: 'active' },

  // ==========================================
  // 12. Benefits Tab
  // ==========================================
  { action_key: 'act_benefits_add_dependent', tab_id: 'benefits', section_name: 'Benefits & Insurance Plans', label_en: 'Add Dependent Button (+)', label_ar: 'زر إضافة معال (+)', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_benefits_cancel_dependent', tab_id: 'benefits', section_name: 'Benefits & Insurance Plans', label_en: 'Cancel Dependent Button', label_ar: 'زر إلغاء إضافة معال', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_benefits_save_dependent', tab_id: 'benefits', section_name: 'Benefits & Insurance Plans', label_en: 'Save Dependent (Check Icon)', label_ar: 'حفظ المعال (أيقونة الصح)', permission_scope: 'everyone', state: 'active' },
  { action_key: 'act_benefits_delete_dependent', tab_id: 'benefits', section_name: 'Benefits & Insurance Plans', label_en: 'Delete Dependent (Trash Icon)', label_ar: 'حذف معال (أيقونة الحذف)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_benefits_edit_dependent', tab_id: 'benefits', section_name: 'Benefits & Insurance Plans', label_en: 'Edit Dependent (Pencil Icon)', label_ar: 'تعديل بيانات المعال (أيقونة القلم)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_benefits_add_policy', tab_id: 'benefits', section_name: 'Benefits & Insurance Plans', label_en: 'Add Policy / Plan Button (+)', label_ar: 'زر إضافة خطة / وثيقة تأمين (+)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_benefits_add_history', tab_id: 'benefits', section_name: 'Benefits & Insurance Plans', label_en: 'Add History Record Button', label_ar: 'زر إضافة سجل وثيقة تأمين', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_benefits_cancel_policy', tab_id: 'benefits', section_name: 'Benefits & Insurance Plans', label_en: 'Cancel Policy Button', label_ar: 'زر إلغاء وثيقة التأمين', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_benefits_save_record', tab_id: 'benefits', section_name: 'Benefits & Insurance Plans', label_en: 'Save Benefit Record (Check Icon)', label_ar: 'حفظ سجل التأمين (أيقونة الصح)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_benefits_delete_history', tab_id: 'benefits', section_name: 'Benefits & Insurance Plans', label_en: 'Delete Benefit History (Trash Icon)', label_ar: 'حذف سجل تأمين (أيقونة الحذف)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_benefits_edit_history', tab_id: 'benefits', section_name: 'Benefits & Insurance Plans', label_en: 'Edit Policy Record (Pencil Icon)', label_ar: 'تعديل وثيقة التأمين (أيقونة القلم)', permission_scope: 'super_admin', state: 'active' },

  // ==========================================
  // 13. Onboarding Tab
  // ==========================================
  { action_key: 'act_onboarding_new_task', tab_id: 'onboarding', section_name: 'Onboarding Checklist & Status', label_en: 'New Task Button (+)', label_ar: 'زر مهمة تهيئة جديدة (+)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_onboarding_add_task_list', tab_id: 'onboarding', section_name: 'Onboarding Checklist & Status', label_en: 'Add Task List(s) Button', label_ar: 'زر إضافة قائمة مهام', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_onboarding_settings', tab_id: 'onboarding', section_name: 'Onboarding Checklist & Status', label_en: 'Onboarding Settings (Gear Icon)', label_ar: 'إعدادات التهيئة (أيقونة الترس)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_onboarding_save_task', tab_id: 'onboarding', section_name: 'Onboarding Checklist & Status', label_en: 'Save Task (Check Icon)', label_ar: 'حفظ المهمة (أيقونة الصح)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_onboarding_cancel_task', tab_id: 'onboarding', section_name: 'Onboarding Checklist & Status', label_en: 'Cancel Task Button', label_ar: 'زر إلغاء المهمة', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_onboarding_complete_checkbox', tab_id: 'onboarding', section_name: 'Onboarding Checklist & Status', label_en: 'Mark Task Complete Checkbox', label_ar: 'مربع تحديد إكمال المهمة', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_onboarding_delete_task', tab_id: 'onboarding', section_name: 'Onboarding Checklist & Status', label_en: 'Delete Task (Trash Icon)', label_ar: 'حذف مهمة التهيئة (أيقونة الحذف)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_onboarding_edit_task', tab_id: 'onboarding', section_name: 'Onboarding Checklist & Status', label_en: 'Edit Task (Pencil Icon)', label_ar: 'تعديل مهمة التهيئة (أيقونة القلم)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_onboarding_filter_status', tab_id: 'onboarding', section_name: 'Onboarding Checklist & Status', label_en: 'Filter Tasks by Status', label_ar: 'تصفية المهام حسب الحالة', permission_scope: 'everyone', state: 'active' },

  // ==========================================
  // 14. Offboarding Tab
  // ==========================================
  { action_key: 'act_offboarding_new_task', tab_id: 'offboarding', section_name: 'Offboarding Clearance & Handover', label_en: 'New Task Button (+)', label_ar: 'زر مهمة إنهاء خدمة جديدة (+)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_offboarding_settings', tab_id: 'offboarding', section_name: 'Offboarding Clearance & Handover', label_en: 'Offboarding Settings (Gear Icon)', label_ar: 'إعدادات إنهاء الخدمة (أيقونة الترس)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_offboarding_save_task', tab_id: 'offboarding', section_name: 'Offboarding Clearance & Handover', label_en: 'Save Task (Check Icon)', label_ar: 'حفظ المهمة (أيقونة الصح)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_offboarding_cancel_task', tab_id: 'offboarding', section_name: 'Offboarding Clearance & Handover', label_en: 'Cancel Task Button', label_ar: 'زر إلغاء المهمة', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_offboarding_complete_checkbox', tab_id: 'offboarding', section_name: 'Offboarding Clearance & Handover', label_en: 'Mark Task Complete Checkbox', label_ar: 'مربع تحديد إكمال المهمة', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_offboarding_delete_task', tab_id: 'offboarding', section_name: 'Offboarding Clearance & Handover', label_en: 'Delete Task (Trash Icon)', label_ar: 'حذف مهمة إنهاء الخدمة (أيقونة الحذف)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_offboarding_edit_task', tab_id: 'offboarding', section_name: 'Offboarding Clearance & Handover', label_en: 'Edit Task (Pencil Icon)', label_ar: 'تعديل مهمة إنهاء الخدمة (أيقونة القلم)', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_offboarding_initiate_clearance', tab_id: 'offboarding', section_name: 'Offboarding Clearance & Handover', label_en: 'Initiate Clearance Workflow Button', label_ar: 'بدء إجراءات إخلاء الطرف', permission_scope: 'super_admin', state: 'active' },
  { action_key: 'act_offboarding_handover_complete', tab_id: 'offboarding', section_name: 'Offboarding Clearance & Handover', label_en: 'Confirm Handover Complete Button', label_ar: 'تأكيد اكتمال التسليم والاستلام', permission_scope: 'super_admin', state: 'active' }
];

const seededCompanies = new Set<number>();

export async function seedActionControlsIfEmpty(companyId = 1) {
  if (seededCompanies.has(companyId)) {
    return;
  }

  try {
    // Quick check if company already has action controls
    const existing = await pool.query(
      `SELECT 1 FROM hr_action_controls WHERE company_id = $1 LIMIT 1`,
      [companyId]
    );

    if (existing.rows.length > 0) {
      seededCompanies.add(companyId);
      return;
    }

    // If completely empty for this company, batch insert all default action controls in a single query
    const valueClauses: string[] = [];
    const params: any[] = [companyId];
    let pIdx = 2;

    for (const act of DEFAULT_HR_ACTION_CONTROLS) {
      valueClauses.push(`($1, $${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, $${pIdx + 6})`);
      params.push(act.action_key, act.tab_id, act.section_name, act.label_en, act.label_ar || act.label_en, act.state, act.permission_scope);
      pIdx += 7;
    }

    if (valueClauses.length > 0) {
      await pool.query(
        `INSERT INTO hr_action_controls (company_id, action_key, tab_id, section_name, label_en, label_ar, state, permission_scope)
         VALUES ${valueClauses.join(', ')}
         ON CONFLICT (company_id, action_key) DO NOTHING`,
        params
      );
    }

    seededCompanies.add(companyId);
  } catch (err) {
    console.error("Error seeding hr_action_controls:", err);
  }
}

/**
 * Backend Controller Gatekeeper
 * Verifies if user has permission to execute an action key based on hr_action_controls
 */
export async function checkActionPermission(
  companyId: number,
  actionKey: string,
  user: any,
  targetEmployeeUserId?: number | string | null
): Promise<{ allowed: boolean; message?: string }> {
  try {
    const res = await pool.query(
      `SELECT * FROM hr_action_controls WHERE company_id = $1 AND action_key = $2 LIMIT 1`,
      [companyId, actionKey]
    );

    if (res.rows.length === 0) {
      // Default: allowed if unconstrained
      return { allowed: true };
    }

    const control = res.rows[0];

    if (control.state === 'hidden') {
      return { 
        allowed: false, 
        message: 'Action is currently hidden and unavailable.' 
      };
    }

    const isSuperAdmin = Boolean(
      user && (
        user.is_super_admin || 
        user.role === 'admin' || 
        user.role === 'super_admin' || 
        user.permissions?.includes('all') ||
        user.permissions?.includes('super_admin')
      )
    );

    if (control.state === 'disabled') {
      // Disabled state prevents execution for non-super-admins
      if (!isSuperAdmin) {
        return { 
          allowed: false, 
          message: control.tooltip_text || 'You are not authorized to perform this action' 
        };
      }
    }

    // Check scope
    switch (control.permission_scope) {
      case 'super_admin':
        if (!isSuperAdmin) {
          return { allowed: false, message: 'Only Super Admins are authorized to perform this action' };
        }
        break;

      case 'direct_manager':
        if (isSuperAdmin) return { allowed: true };
        // Check if user is manager of target employee
        if (targetEmployeeUserId) {
          const empCheck = await pool.query(
            `SELECT reporting_to FROM hr_employees WHERE user_id = $1 OR id = $1 LIMIT 1`,
            [targetEmployeeUserId]
          );
          if (empCheck.rows.length > 0 && String(empCheck.rows[0].reporting_to) === String(user?.id)) {
            return { allowed: true };
          }
        }
        return { allowed: false, message: 'Only direct managers and Super Admins are authorized to perform this action' };

      case 'self':
        if (isSuperAdmin) return { allowed: true };
        if (targetEmployeeUserId && String(user?.id) === String(targetEmployeeUserId)) {
          return { allowed: true };
        }
        return { allowed: false, message: 'Only the employee themselves or a Super Admin is authorized to perform this action' };

      case 'everyone':
      default:
        return { allowed: true };
    }

    return { allowed: true };
  } catch (err) {
    console.error(`Error checking action permission for ${actionKey}:`, err);
    return { allowed: true }; // fail-open for unforeseen errors to avoid halting system
  }
}

export function createActionControlsRouter() {
  const router = express.Router();

  // GET all action controls for company
  router.get("/", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const { tab_id } = req.query;

      const cacheKey = `hr:action_controls:${companyId}:${tab_id || 'all'}`;
      const cached = memoryCache.get<any[]>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Seed if empty (guarded and fast)
      await seedActionControlsIfEmpty(companyId);

      let query = `SELECT * FROM hr_action_controls WHERE company_id = $1`;
      const params: any[] = [companyId];

      if (tab_id) {
        query += ` AND tab_id = $2`;
        params.push(tab_id);
      }

      query += ` ORDER BY order_index ASC, id ASC`;
      const result = await pool.query(query, params);
      memoryCache.set(cacheKey, result.rows, 120); // Cache for 2 minutes
      res.json(result.rows);
    } catch (err: any) {
      console.error("Failed to fetch action controls:", err);
      res.status(500).json({ error: "Failed to fetch action controls" });
    }
  });

  // POST create a new button/action control
  router.post("/", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const {
        action_key,
        tab_id,
        section_name,
        label_en,
        label_ar,
        state = 'active',
        permission_scope = 'everyone',
        tooltip_text = 'You are not authorized to perform this action'
      } = req.body;

      if (!action_key || !label_en || !tab_id || !section_name) {
        return res.status(400).json({ error: "action_key, label_en, tab_id, and section_name are required" });
      }

      const cleanKey = action_key.startsWith('act_') ? action_key : `act_${action_key}`;

      const result = await pool.query(
        `INSERT INTO hr_action_controls (company_id, action_key, tab_id, section_name, label_en, label_ar, state, permission_scope, tooltip_text)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (company_id, action_key) DO UPDATE SET
           tab_id = EXCLUDED.tab_id,
           section_name = EXCLUDED.section_name,
           label_en = EXCLUDED.label_en,
           label_ar = EXCLUDED.label_ar,
           state = EXCLUDED.state,
           permission_scope = EXCLUDED.permission_scope,
           tooltip_text = EXCLUDED.tooltip_text,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [companyId, cleanKey, tab_id, section_name, label_en, label_ar || label_en, state, permission_scope, tooltip_text]
      );

      memoryCache.invalidatePrefix(`hr:action_controls:${companyId}`);
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error("Failed to create action control:", err);
      res.status(500).json({ error: "Failed to create action control" });
    }
  });

  // PUT update button/action control
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = (req as any).user?.company_id || 1;
      const {
        label_en,
        label_ar,
        state,
        permission_scope,
        tooltip_text,
        section_name,
        tab_id,
        order_index
      } = req.body;

      const result = await pool.query(
        `UPDATE hr_action_controls
         SET label_en = COALESCE($1, label_en),
             label_ar = COALESCE($2, label_ar),
             state = COALESCE($3, state),
             permission_scope = COALESCE($4, permission_scope),
             tooltip_text = COALESCE($5, tooltip_text),
             section_name = COALESCE($6, section_name),
             tab_id = COALESCE($7, tab_id),
             order_index = COALESCE($8, order_index),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $9 AND company_id = $10
         RETURNING *`,
        [label_en, label_ar, state, permission_scope, tooltip_text, section_name, tab_id, order_index, id, companyId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Action control not found" });
      }

      memoryCache.invalidatePrefix(`hr:action_controls:${companyId}`);
      res.json(result.rows[0]);
    } catch (err: any) {
      console.error("Failed to update action control:", err);
      res.status(500).json({ error: "Failed to update action control" });
    }
  });

  // DELETE action control
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = (req as any).user?.company_id || 1;

      await pool.query(
        `DELETE FROM hr_action_controls WHERE id = $1 AND company_id = $2`,
        [id, companyId]
      );

      memoryCache.invalidatePrefix(`hr:action_controls:${companyId}`);

      res.json({ success: true, message: "Action control deleted" });
    } catch (err: any) {
      console.error("Failed to delete action control:", err);
      res.status(500).json({ error: "Failed to delete action control" });
    }
  });

  // POST reset/reseed default controls
  router.post("/reset", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      await seedActionControlsIfEmpty(companyId);
      const all = await pool.query(`SELECT * FROM hr_action_controls WHERE company_id = $1 ORDER BY id ASC`, [companyId]);
      res.json({ success: true, count: all.rows.length, controls: all.rows });
    } catch (err: any) {
      console.error("Failed to reset action controls:", err);
      res.status(500).json({ error: "Failed to reset action controls" });
    }
  });

  // GET check specific action permission
  router.get("/check/:actionKey", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const { actionKey } = req.params;
      const { target_employee_id } = req.query;

      const perm = await checkActionPermission(
        companyId,
        actionKey,
        (req as any).user,
        target_employee_id as string
      );

      res.json(perm);
    } catch (err: any) {
      res.status(500).json({ allowed: true });
    }
  });

  return router;
}
