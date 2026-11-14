import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, Sliders, Search, Plus, Check, X, ChevronRight, 
  ChevronDown, ChevronsUpDown, Edit3, Trash2, Eye, EyeOff, GripVertical, ArrowLeft, 
  FileText, Users, Briefcase, Calendar, Clock, DollarSign, Award, 
  ShieldAlert, Package, RefreshCw, Table, SquarePen, Layers, Info, CheckCircle2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CustomizeLayoutDropdown, CustomField, ReorderFieldsModal } from './CustomizeLayoutDropdown';

export interface TargetFormModule {
  id: string;
  category: 'directory' | 'recruitment' | 'leaves' | 'attendance' | 'payroll' | 'performance' | 'complaints' | 'assets' | 'benefits' | 'onboarding' | 'swap';
  categoryLabelAr: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: React.ElementType;
  badgeColor: string;
  defaultSections: {
    name: string;
    items: { id: string; label: string; type: 'field' | 'field_group' | 'table'; isRequired?: boolean }[];
  }[];
}

export const TARGET_HR_FORMS: TargetFormModule[] = [
  // 1. Employee Directory Forms
  {
    id: 'personal',
    category: 'directory',
    categoryLabelAr: 'سجل الموظفين',
    nameEn: 'Employee Personal Info Form',
    nameAr: 'نموذج البيانات الشخصية للموظف',
    descriptionEn: 'Customize standard employee profile fields, identification, address & contact info',
    descriptionAr: 'تخصيص الهيكل والحقول للبيانات الشخصية والتعريف والعناوين والتواصل للموظف',
    icon: Users,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    defaultSections: [
      {
        name: 'Basic Information',
        items: [
          { id: 'emp_num_status', label: 'Employee # & Status', type: 'field_group', isRequired: true },
          { id: 'full_name', label: 'First Name, Middle Name, Last Name & Preferred Name', type: 'field_group', isRequired: true },
          { id: 'birth_date', label: 'Birth Date & Age', type: 'field' },
          { id: 'national_id', label: 'National ID / NIN Number', type: 'field', isRequired: true },
          { id: 'gender_marital', label: 'Gender & Marital Status', type: 'field_group' }
        ]
      },
      {
        name: 'Address & Location',
        items: [
          { id: 'home_address', label: 'Home Address, City & ZIP Code', type: 'field_group' },
          { id: 'country', label: 'Country of Residence', type: 'field' }
        ]
      },
      {
        name: 'Contact Information',
        items: [
          { id: 'work_email', label: 'Work Email Address', type: 'field', isRequired: true },
          { id: 'personal_email', label: 'Personal Email Address', type: 'field' },
          { id: 'mobile_phone', label: 'Mobile Phone Number', type: 'field', isRequired: true }
        ]
      }
    ]
  },
  {
    id: 'job',
    category: 'directory',
    categoryLabelAr: 'سجل الموظفين',
    nameEn: 'Employee Job & Employment Details Form',
    nameAr: 'نموذج بيانات الوظيفة والتعيين',
    descriptionEn: 'Customize job titles, departments, managers, employment status & work location',
    descriptionAr: 'تخصيص مسميات الوظائف، الأقسام، المدراء المباشرين، حالة التوظيف ومقر العمل',
    icon: Briefcase,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    defaultSections: [
      {
        name: 'Job Details',
        items: [
          { id: 'job_title_code', label: 'Job Title & Position Code', type: 'field_group', isRequired: true },
          { id: 'department_div', label: 'Department & Division', type: 'field_group', isRequired: true },
          { id: 'location', label: 'Work Location / Branch Office', type: 'field' },
          { id: 'manager', label: 'Direct Line Manager', type: 'field' }
        ]
      },
      {
        name: 'Employment Status',
        items: [
          { id: 'emp_type', label: 'Employment Type (Full-time / Part-time)', type: 'field' },
          { id: 'hire_probation', label: 'Contract Date & Probation End Date', type: 'field_group', isRequired: true }
        ]
      }
    ]
  },
  {
    id: 'benefits',
    category: 'directory',
    categoryLabelAr: 'سجل الموظفين',
    nameEn: 'Employee Benefits & Allowances Form',
    nameAr: 'نموذج البدلات والمزايا للموظف',
    descriptionEn: 'Customize health insurance, social security, pension plans & dependents fields',
    descriptionAr: 'تخصيص حقول التأمين الطبي، التأمينات الاجتماعية، التقاعد والمعالين للموظف',
    icon: ShieldAlert,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultSections: [
      {
        name: 'Benefits Overview',
        items: [
          { id: 'insurance_policy', label: 'Health Insurance Policy & Category', type: 'field_group' },
          { id: 'gosi_number', label: 'GOSI / Social Insurance Number', type: 'field' },
          { id: 'pension_account', label: 'Pension Fund Account', type: 'field' }
        ]
      },
      {
        name: 'Dependents',
        items: [
          { id: 'dependents_list', label: 'Spouse & Dependents List', type: 'table' }
        ]
      }
    ]
  },
  {
    id: 'emergency',
    category: 'directory',
    categoryLabelAr: 'سجل الموظفين',
    nameEn: 'Emergency Contacts Form',
    nameAr: 'نموذج جهات الاتصال في حالات الطوارئ',
    descriptionEn: 'Customize primary and secondary emergency contact details and relationships',
    descriptionAr: 'تخصيص بيانات وأرقام الطوارئ للأقارب وجهات الاتصال الثانوية',
    icon: ShieldAlert,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    defaultSections: [
      {
        name: 'Primary Emergency Contact',
        items: [
          { id: 'p_contact_name_rel', label: 'Contact Name & Relationship', type: 'field_group', isRequired: true },
          { id: 'p_contact_phone_addr', label: 'Phone Number & Residence Address', type: 'field_group', isRequired: true }
        ]
      }
    ]
  },
  {
    id: 'training',
    category: 'directory',
    categoryLabelAr: 'سجل الموظفين',
    nameEn: 'Employee Training & Skills Form',
    nameAr: 'نموذج التدريب والمهارات',
    descriptionEn: 'Customize training courses, milestones, certificates & professional badges',
    descriptionAr: 'تخصيص حقول الدورات التدريبية، الشهادات المهنية وسجل التطوير الذاتي',
    icon: Award,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    defaultSections: [
      {
        name: 'Training & Development',
        items: [
          { id: 'enrolled_courses', label: 'Enrolled Training Courses & Status', type: 'field_group' },
          { id: 'certificates_list', label: 'Professional Certificates & Expiry Dates', type: 'table' }
        ]
      }
    ]
  },
  {
    id: 'documents',
    category: 'directory',
    categoryLabelAr: 'سجل الموظفين',
    nameEn: 'Official Documents & Contracts Form',
    nameAr: 'نموذج الوثائق والمستندات الرسمية',
    descriptionEn: 'Customize passport, national ID upload, employment contract & NDA attachments',
    descriptionAr: 'تخصيص مرفقات الهوية، جواز السفر، عقد العمل واتفاقيات السرية',
    icon: FileText,
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    defaultSections: [
      {
        name: 'Personal Identification Documents',
        items: [
          { id: 'passport_id_files', label: 'National ID & Passport Copies', type: 'field_group' },
          { id: 'contract_nda_files', label: 'Signed Contract & NDA Documents', type: 'field_group' }
        ]
      }
    ]
  },

  // 2. Recruitment & Jobs
  {
    id: 'recruitment_candidate',
    category: 'recruitment',
    categoryLabelAr: 'التوظيف والاستقطاب',
    nameEn: 'Candidate Application Form',
    nameAr: 'نموذج تقديم المرشحين للوظائف',
    descriptionEn: 'Customize candidate personal data, applied position, CV & interview scoring fields',
    descriptionAr: 'تخصيص حقول بيانات المرشح، الوظيفة المتقدم لها، السيرة الذاتية ورصد نتيجة المقابلة',
    icon: Users,
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    defaultSections: [
      {
        name: 'Candidate Personal Details',
        items: [
          { id: 'cand_full_name', label: 'Candidate Full Name', type: 'field', isRequired: true },
          { id: 'cand_email_phone', label: 'Email Address & Phone Number', type: 'field_group', isRequired: true },
          { id: 'cand_location', label: 'Current Residence City & Country', type: 'field' }
        ]
      },
      {
        name: 'Professional Experience',
        items: [
          { id: 'cand_applied_role', label: 'Applied Job Position & Department', type: 'field_group', isRequired: true },
          { id: 'cand_exp_years', label: 'Years of Experience & Current Salary', type: 'field_group' },
          { id: 'cand_resume_file', label: 'Resume / CV Document Upload', type: 'field', isRequired: true }
        ]
      }
    ]
  },
  {
    id: 'recruitment_job',
    category: 'recruitment',
    categoryLabelAr: 'التوظيف والاستقطاب',
    nameEn: 'Job Opening Requisition Form',
    nameAr: 'نموذج طلب فتح وظيفة شاغرة',
    descriptionEn: 'Customize job title, required experience, department requisition & budget fields',
    descriptionAr: 'تخصيص تفاصيل إعلان الوظيفة، الخبرات المطلوبة، الميزانية والاعتماد المقترح',
    icon: Briefcase,
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    defaultSections: [
      {
        name: 'Job Requisition Details',
        items: [
          { id: 'job_req_title', label: 'Job Title & Target Department', type: 'field_group', isRequired: true },
          { id: 'job_req_exp', label: 'Minimum Years of Experience & Degree', type: 'field_group' },
          { id: 'job_req_salary', label: 'Offered Salary Range & Budget', type: 'field_group' }
        ]
      }
    ]
  },

  // 3. Time Off & Leaves
  {
    id: 'leave_request',
    category: 'leaves',
    categoryLabelAr: 'الإجازات والمغادرات',
    nameEn: 'Leave & Vacation Request Form',
    nameAr: 'نموذج طلب إجازة / مغادرة',
    descriptionEn: 'Customize leave types, date ranges, substitute employee & justification fields',
    descriptionAr: 'تخصيص أنواع الإجازات، تاريخ البدء والانتهاء، الموظف البديل والمرفقات الطبية',
    icon: Calendar,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    defaultSections: [
      {
        name: 'Leave Request Details',
        items: [
          { id: 'leave_type_select', label: 'Leave Type (Annual / Sick / Unpaid)', type: 'field', isRequired: true },
          { id: 'leave_start_end_date', label: 'Start Date & End Date', type: 'field_group', isRequired: true },
          { id: 'leave_substitute_emp', label: 'Substitute Employee Name', type: 'field' },
          { id: 'leave_reason_attach', label: 'Reason for Leave & Attachment', type: 'field_group' }
        ]
      }
    ]
  },

  // 4. Attendance & Clock In
  {
    id: 'attendance_shift',
    category: 'attendance',
    categoryLabelAr: 'الدوام والحضور',
    nameEn: 'Shift & Work Schedule Form',
    nameAr: 'نموذج جدولة الحضور ومناوبات العمل',
    descriptionEn: 'Customize work hours, start/end shift times, grace periods & overtime rules',
    descriptionAr: 'تخصيص ساعات العمل، أوقات الحضور والانصراف، فترة السماح وقواعد الإضافي',
    icon: Clock,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    defaultSections: [
      {
        name: 'Shift Configuration',
        items: [
          { id: 'shift_name_code', label: 'Shift Name & Pattern', type: 'field_group', isRequired: true },
          { id: 'shift_hours', label: 'Work Start Time & Work End Time', type: 'field_group', isRequired: true },
          { id: 'grace_mins', label: 'Late Grace Period (Minutes)', type: 'field' }
        ]
      }
    ]
  },

  // 5. Payroll & Salaries
  {
    id: 'payroll_salary',
    category: 'payroll',
    categoryLabelAr: 'الرواتب والمستحقات',
    nameEn: 'Payroll & Salary Structure Form',
    nameAr: 'نموذج هيكل الراتب ومسيرات الرواتب',
    descriptionEn: 'Customize base salary, housing allowance, transport, bank IBAN & deductions',
    descriptionAr: 'تخصيص الراتب الأساسي، بدل السكن، بدل النقل، رقم الحساب البنكي والاقتطاعات',
    icon: DollarSign,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultSections: [
      {
        name: 'Salary Components',
        items: [
          { id: 'basic_salary', label: 'Basic Salary Amount', type: 'field', isRequired: true },
          { id: 'housing_allowance', label: 'Housing Allowance Amount', type: 'field' },
          { id: 'transport_allowance', label: 'Transport Allowance Amount', type: 'field' }
        ]
      },
      {
        name: 'Bank Details & Deductions',
        items: [
          { id: 'bank_name_iban', label: 'Bank Name & IBAN Account Number', type: 'field_group', isRequired: true },
          { id: 'gosi_deduction_rate', label: 'GOSI Deduction Contribution (%)', type: 'field' }
        ]
      }
    ]
  },

  // 6. Performance & OKRs
  {
    id: 'performance_review',
    category: 'performance',
    categoryLabelAr: 'الأداء والتقييمات',
    nameEn: 'Performance Review & OKR Form',
    nameAr: 'نموذج تقييم الأداء والأهداف (OKRs)',
    descriptionEn: 'Customize goal titles, KPI metrics, manager evaluation scores & self-assessments',
    descriptionAr: 'تخصيص صياغة الأهداف، المؤشرات الرئيسية KPI، تقييم المدير والتقييم الذاتي',
    icon: Award,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    defaultSections: [
      {
        name: 'Goal & Objective Setting',
        items: [
          { id: 'goal_title_cat', label: 'Objective Title & Strategic Category', type: 'field_group', isRequired: true },
          { id: 'goal_kpi_weight', label: 'Target KPI Metric & Weight (%)', type: 'field_group', isRequired: true }
        ]
      },
      {
        name: 'Evaluation Ratings',
        items: [
          { id: 'self_rating_score', label: 'Employee Self-Rating Score (1-5)', type: 'field' },
          { id: 'manager_eval_comments', label: 'Manager Final Evaluation & Feedback', type: 'field_group', isRequired: true }
        ]
      }
    ]
  },

  // 7. Complaints & Grievances
  {
    id: 'complaint_grievance',
    category: 'complaints',
    categoryLabelAr: 'الشكاوى والجزاءات',
    nameEn: 'Complaint & Disciplinary Action Form',
    nameAr: 'نموذج الشكاوى والتحقيقات والجزاءات',
    descriptionEn: 'Customize incident details, witness statements, evidence upload & HR penalties',
    descriptionAr: 'تخصيص حقول تفاصيل الحادثة، أقوال الشهود، أدلة الشكوى والجزاء المتخذ',
    icon: ShieldAlert,
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    defaultSections: [
      {
        name: 'Incident Statement',
        items: [
          { id: 'complaint_title_date', label: 'Incident Type & Date of Occurrence', type: 'field_group', isRequired: true },
          { id: 'complaint_description', label: 'Detailed Description & Incident Location', type: 'field_group', isRequired: true }
        ]
      }
    ]
  },

  // 8. Assets Management
  {
    id: 'assets_allocation',
    category: 'assets',
    categoryLabelAr: 'إدارة العهد والأصول',
    nameEn: 'Asset Custody & Allocation Form',
    nameAr: 'نموذج تسليم عهدة / أصل للموظف',
    descriptionEn: 'Customize asset tag, serial numbers, handover date & return acknowledgment',
    descriptionAr: 'تخصيص كود الأصل، الرقم التسلسلي، تاريخ التسليم وإقرار استلام الموظف للعهدة',
    icon: Package,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    defaultSections: [
      {
        name: 'Asset Information',
        items: [
          { id: 'asset_tag_code', label: 'Asset Code & Tag Number', type: 'field', isRequired: true },
          { id: 'serial_model', label: 'Serial Number & Laptop/Device Model', type: 'field_group', isRequired: true },
          { id: 'handover_date', label: 'Custody Handover Date', type: 'field', isRequired: true }
        ]
      }
    ]
  },

  // 9. Benefits & Allowances
  {
    id: 'allowance_request',
    category: 'benefits',
    categoryLabelAr: 'المزايا والبدلات',
    nameEn: 'Allowance & Expense Claim Form',
    nameAr: 'نموذج طلب بدل أو تعويض مصروفات',
    descriptionEn: 'Customize claim category, amount requested, invoices attachment & approvals',
    descriptionAr: 'تخصيص نوع البدل المالي، المبلغ المطلوب، إرفاق الفواتير والاعتمادات',
    icon: DollarSign,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    defaultSections: [
      {
        name: 'Allowance Claim Details',
        items: [
          { id: 'allowance_type', label: 'Allowance Type (Travel / Education / Relocation)', type: 'field', isRequired: true },
          { id: 'allowance_amount', label: 'Requested Amount & Currency', type: 'field_group', isRequired: true }
        ]
      }
    ]
  },

  // 10. Onboarding & Offboarding
  {
    id: 'onboarding_offboarding',
    category: 'onboarding',
    categoryLabelAr: 'التهيئة وإنهاء الخدمة',
    nameEn: 'Onboarding & Exit Clearance Form',
    nameAr: 'نموذج التهيئة وإنهاء الخدمة والمخالصة',
    descriptionEn: 'Customize orientation task lists, IT setup clearances & exit interview notes',
    descriptionAr: 'تخصيص قائمة مهام الاستقبال، إخلاء الطرف، استلام الصلاحيات ومقابلة ترك العمل',
    icon: Layers,
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    defaultSections: [
      {
        name: 'Clearance & Handover Checklist',
        items: [
          { id: 'process_type_date', label: 'Process Type (Onboarding/Offboarding) & Date', type: 'field_group', isRequired: true },
          { id: 'it_clearance_status', label: 'IT & Facilities Clearance Status', type: 'field' }
        ]
      }
    ]
  },

  // 11. Swap Management
  {
    id: 'shift_swap',
    category: 'swap',
    categoryLabelAr: 'تبديل المناوبات',
    nameEn: 'Shift Swap Request Form',
    nameAr: 'نموذج طلب تبديل مناوبة العمل',
    descriptionEn: 'Customize original shift date, replacement colleague & supervisor authorization',
    descriptionAr: 'تخصيص تاريخ الشفت، الموظف التبادلي، موافقة المزيّل والاعتماد',
    icon: RefreshCw,
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
    defaultSections: [
      {
        name: 'Shift Swap Details',
        items: [
          { id: 'original_shift_date', label: 'Original Shift Date & Pattern', type: 'field_group', isRequired: true },
          { id: 'replacement_colleague', label: 'Replacement Colleague Name', type: 'field', isRequired: true }
        ]
      }
    ]
  }
];

export const HRCustomizationManager: React.FC = () => {
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);

  const selectedForm = useMemo(() => {
    return TARGET_HR_FORMS.find(f => f.id === selectedFormId) || null;
  }, [selectedFormId]);

  // Load custom fields for selected target form
  const fetchCustomFields = async () => {
    if (!selectedFormId) return;
    setLoadingCustomFields(true);
    try {
      const res = await fetch(`/api/hr/custom-fields?entity_type=${selectedFormId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomFields(data);
      }
    } catch (err) {
      console.error('Error fetching custom fields for module:', err);
    } finally {
      setLoadingCustomFields(false);
    }
  };

  useEffect(() => {
    if (selectedFormId) {
      fetchCustomFields();
    }
  }, [selectedFormId]);

  // Filter Target Forms by search and category
  const filteredForms = useMemo(() => {
    return TARGET_HR_FORMS.filter(f => {
      const matchesSearch = 
        (f.nameEn || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        f.nameAr.includes(searchTerm) ||
        (f.descriptionEn || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        f.descriptionAr.includes(searchTerm) ||
        (f.id || '').toLowerCase().includes((searchTerm || '').toLowerCase());

      const matchesCategory = selectedCategoryFilter === 'all' || f.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategoryFilter]);

  const handleSelectForm = (formId: string) => {
    setSelectedFormId(formId);
    setActiveStep(2);
  };

  const handleToggleFieldHide = async (field: CustomField) => {
    try {
      const res = await fetch(`/api/hr/custom-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...field, hidden: !field.hidden })
      });
      if (res.ok) {
        fetchCustomFields();
      }
    } catch (err) {
      console.error('Error updating field visibility:', err);
    }
  };

  const handleToggleFieldRequired = async (field: CustomField) => {
    try {
      const res = await fetch(`/api/hr/custom-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...field, is_required: !field.is_required })
      });
      if (res.ok) {
        fetchCustomFields();
      }
    } catch (err) {
      console.error('Error updating field status:', err);
    }
  };

  const handleDeleteCustomField = async (id: number) => {
    if (!confirm('Are you sure you want to delete this custom field? / هل أنت تأكد من حذف هذا الحقل؟')) return;
    try {
      const res = await fetch(`/api/hr/custom-fields/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCustomFields();
      }
    } catch (err) {
      console.error('Error deleting field:', err);
    }
  };

  return (
    <div className="space-y-8 text-slate-800">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5" /> HR Form Layout Customizer / تخصيص الهيكل والنماذج
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Target Form & Layout Customization Hub
            </h2>
            <p className="text-indigo-200/80 text-xs md:text-sm font-medium max-w-2xl leading-relaxed">
              اختر أي نموذج أو تابة من موديول HR Management في الخطوة الأولى، ثم قم بتعديل الهيكل والحقول إضافةً وترتيباً وإخفاءً في الخطوة الثانية مع الربط المباشر بجميع نماذج النظام.
            </p>
          </div>

          {/* Step Indicator Header Pills */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/15 shrink-0">
            <button
              onClick={() => setActiveStep(1)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                activeStep === 1 
                  ? "bg-white text-indigo-950 shadow-lg" 
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
              <span>Step 1: Target Form</span>
            </button>
            <ChevronRight className="w-4 h-4 text-white/40" />
            <button
              onClick={() => {
                if (selectedFormId) setActiveStep(2);
                else alert('Please select a Target Form first in Step 1!');
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                activeStep === 2 
                  ? "bg-white text-indigo-950 shadow-lg" 
                  : selectedFormId ? "text-white/80 hover:bg-white/10" : "text-white/30 cursor-not-allowed"
              )}
            >
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
              <span>Step 2: Customize Layout</span>
            </button>
          </div>
        </div>
      </div>

      {/* STEP 1 VIEW */}
      {activeStep === 1 && (
        <div className="space-y-6">
          {/* Step 1 Control Bar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs flex items-center justify-center font-black shadow-md">1</span>
                  Step 1: Select Target Form / Module (اختر النموذج أو الموديول المستهدف)
                </h3>
                <p className="text-slate-500 text-xs font-semibold mt-1">
                  اختر من القائمة أدناه النموذج أو التابة التي تريد إعادة ترتيب حقولها أو إضافة سيكشنز وحقول جديدة لها.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search HR forms & modules..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {[
                { id: 'all', label: 'All Forms / جميع النماذج' },
                { id: 'directory', label: 'Employee Profile / ملف الموظف' },
                { id: 'recruitment', label: 'Recruitment / التوظيف' },
                { id: 'leaves', label: 'Leaves / الإجازات' },
                { id: 'attendance', label: 'Attendance / الحضور' },
                { id: 'payroll', label: 'Payroll / الرواتب' },
                { id: 'performance', label: 'Performance / الأداء' },
                { id: 'complaints', label: 'Complaints / الشكاوى' },
                { id: 'assets', label: 'Assets / العهد' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                    selectedCategoryFilter === cat.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Target Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredForms.map((form) => {
              const IconComp = form.icon;
              const isSelected = selectedFormId === form.id;
              return (
                <div
                  key={form.id}
                  onClick={() => handleSelectForm(form.id)}
                  className={cn(
                    "group relative bg-white rounded-3xl p-6 border transition-all cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1",
                    isSelected ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/10" : "border-slate-200 hover:border-indigo-300"
                  )}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn("p-3 rounded-2xl border", form.badgeColor)}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {form.categoryLabelAr}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {form.nameEn}
                      </h4>
                      <p className="text-xs font-bold text-indigo-950 mt-0.5 dir-rtl">
                        {form.nameAr}
                      </p>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 line-clamp-2">
                        {form.descriptionEn}
                      </p>
                    </div>

                    {/* Default Sections Summary */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Includes {form.defaultSections.length} Sections:</span>
                        <span className="text-[10px] text-indigo-600 font-mono font-bold">id: {form.id}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {form.defaultSections.map((sec, idx) => (
                          <span key={idx} className="text-[10px] bg-white text-slate-600 border border-slate-200 font-semibold px-2 py-0.5 rounded-md">
                            {sec.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                    <span>Select & Customize Layout / اختيار وتعديل</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2 VIEW */}
      {activeStep === 2 && selectedForm && (
        <div className="space-y-6">
          {/* Step 2 Header & Action Bar */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveStep(1)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 1</span>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white text-xs flex items-center justify-center font-black shadow-md">2</span>
                    <h3 className="text-xl font-black text-slate-900">
                      Step 2: Customize Layout — {selectedForm.nameEn}
                    </h3>
                  </div>
                  <p className="text-slate-500 text-xs font-semibold mt-0.5">
                    {selectedForm.nameAr} ({selectedForm.id})
                  </p>
                </div>
              </div>

              {/* Exact Customize Layout Dropdown Component as requested! */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReorderModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200 cursor-pointer"
                >
                  <ChevronsUpDown className="w-4 h-4" />
                  Open Full Layout Editor
                </button>

                <CustomizeLayoutDropdown
                  activeTab={selectedForm.id}
                  onRefresh={fetchCustomFields}
                />
              </div>
            </div>

            {/* Step 2 Form Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Default Sections</div>
                  <div className="text-sm font-black text-slate-900">{selectedForm.defaultSections.length} Standard Sections</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                  <SquarePen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Custom Fields Saved</div>
                  <div className="text-sm font-black text-slate-900">{customFields.length} Custom Fields</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Form Integration Status</div>
                  <div className="text-sm font-black text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Linked to Forms
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Embedded Interactive Form Sections & Fields Canvas */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-indigo-600" />
                Form Sections & Fields Layout Reader / استعراض وتعديل سيكشنز وحقول النموذج
              </h4>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReorderModal(true)}
                  className="px-4 py-2 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add / Arrange Fields
                </button>
              </div>
            </div>

            {/* Render Standard Sections + Custom Fields */}
            <div className="space-y-8">
              {selectedForm.defaultSections.map((section, secIdx) => {
                // Find custom fields assigned to this section
                const sectionCustomFields = customFields.filter(f => f.relation_display_column === section.name);

                return (
                  <div key={secIdx} className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                        <h5 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          Section {secIdx + 1}: {section.name}
                        </h5>
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {section.items.length + sectionCustomFields.length} Total Items
                      </span>
                    </div>

                    {/* Section Items List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Standard Fields */}
                      {section.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between shadow-2xs hover:border-indigo-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                            <div>
                              <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                                <span>{item.label}</span>
                                {item.isRequired && <span className="text-rose-500 font-bold text-[10px]">*Required</span>}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Standard Field • {item.type}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                              System Field
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Custom Fields in this section */}
                      {sectionCustomFields.map((field) => (
                        <div
                          key={field.id}
                          className={cn(
                            "bg-white rounded-xl p-4 border flex items-center justify-between shadow-2xs transition-all",
                            field.hidden ? "opacity-50 border-dashed border-slate-300 bg-slate-50" : "border-emerald-200 bg-emerald-50/20"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-emerald-400 cursor-grab" />
                            <div>
                              <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                                <span>{field.field_label_en || field.field_name}</span>
                                {field.is_required && <span className="text-rose-500 font-bold text-[10px]">*Required</span>}
                                {field.hidden && <span className="text-slate-400 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">(Hidden)</span>}
                              </div>
                              <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                                Custom Field • {field.field_type}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleFieldHide(field)}
                              title={field.hidden ? 'Show Field' : 'Hide Field'}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                            >
                              {field.hidden ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                            </button>
                            <button
                              onClick={() => handleDeleteCustomField(field.id)}
                              title="Delete Custom Field"
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Extra Custom Sections if any */}
              {customFields.filter(f => !selectedForm.defaultSections.some(sec => sec.name === f.relation_display_column)).length > 0 && (
                <div className="bg-emerald-50/40 rounded-2xl p-6 border border-emerald-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                    <h5 className="text-sm font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                      <SquarePen className="w-4 h-4 text-emerald-700" /> Custom Added Sections & Fields
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customFields
                      .filter(f => !selectedForm.defaultSections.some(sec => sec.name === f.relation_display_column))
                      .map((field) => (
                        <div key={field.id} className="bg-white rounded-xl p-4 border border-emerald-300 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-black text-slate-800">{field.field_label_en}</div>
                            <div className="text-[10px] text-emerald-600 font-mono">{field.relation_display_column || 'General'} • {field.field_type}</div>
                          </div>
                          <button onClick={() => handleDeleteCustomField(field.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reorder Modal explicitly opened if clicked */}
      {showReorderModal && selectedFormId && (
        <ReorderFieldsModal
          activeTab={selectedFormId}
          onClose={() => setShowReorderModal(false)}
          onSuccess={() => {
            setShowReorderModal(false);
            fetchCustomFields();
          }}
        />
      )}
    </div>
  );
};
