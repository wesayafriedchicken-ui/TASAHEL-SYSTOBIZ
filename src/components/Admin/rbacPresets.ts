export interface SystemRolePreset {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  descriptionEn: string;
  descriptionAr: string;
  level: number; // 0: Default/Editable, 1: Editable, 2: Read-Only, 3: Hidden
  dataScope: 'own' | 'team' | 'department' | 'global' | 'custom';
  ifOwner: boolean;
  seeScope: 'all' | 'department' | 'direct_reports' | 'self';
  fieldSecurity: 'editable' | 'readonly' | 'hidden';
  seePermissions: 'no' | 'view' | 'full';
  permissions: {
    select: boolean;
    read: boolean;
    write: boolean;
    create: boolean;
    delete: boolean;
    submit: boolean;
    cancel: boolean;
    amend: boolean;
    report: boolean;
    import: boolean;
    export: boolean;
    print: boolean;
    email: boolean;
    share: boolean;
  };
}

export const SYSTEM_ROLE_PRESETS: SystemRolePreset[] = [
  {
    id: 'viewer',
    nameEn: 'Viewer (Read-Only)',
    nameAr: 'مشاهد فقط',
    icon: '👁️',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-700',
    descriptionEn: 'View and browse data without edit, create, delete, or export capabilities.',
    descriptionAr: 'رؤية وتصفح القوائم والشاشات فقط دون تعديل أو إنشاء أو حذف أو استخراج تقارير.',
    level: 2,
    dataScope: 'department',
    ifOwner: false,
    seeScope: 'department',
    fieldSecurity: 'readonly',
    seePermissions: 'view',
    permissions: {
      select: true, read: true, write: false, create: false, delete: false,
      submit: false, cancel: false, amend: false, report: false, import: false,
      export: false, print: false, email: false, share: false
    }
  },
  {
    id: 'requester',
    nameEn: 'Requester / Form Submitter',
    nameAr: 'مُقدّم طلبات واستمارات',
    icon: '📝',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-700',
    descriptionEn: 'View screens, submit requests through forms, and cancel own pending requests.',
    descriptionAr: 'مشاهدة البيانات وتقديم الطلبات والاستمارات عبر الفتحات والنماذج وإلغاء الطلبات الخاصة.',
    level: 1,
    dataScope: 'own',
    ifOwner: true,
    seeScope: 'self',
    fieldSecurity: 'hidden',
    seePermissions: 'view',
    permissions: {
      select: true, read: true, write: false, create: false, delete: false,
      submit: true, cancel: true, amend: false, report: false, import: false,
      export: false, print: false, email: false, share: false
    }
  },
  {
    id: 'contributor',
    nameEn: 'Contributor / Editor',
    nameAr: 'مُنشئ ومُحرّر بيانات',
    icon: '✏️',
    badgeBg: 'bg-indigo-50 border-indigo-200',
    badgeText: 'text-indigo-700',
    descriptionEn: 'Create, view, and edit data entries without delete or approval permissions.',
    descriptionAr: 'مشاهدة وإنشاء وتعديل البيانات والسجلات دون صلاحيات الحذف أو الاعتماد.',
    level: 1,
    dataScope: 'department',
    ifOwner: true,
    seeScope: 'department',
    fieldSecurity: 'readonly',
    seePermissions: 'full',
    permissions: {
      select: true, read: true, write: true, create: true, delete: false,
      submit: true, cancel: true, amend: false, report: false, import: false,
      export: false, print: false, email: false, share: false
    }
  },
  {
    id: 'manager',
    nameEn: 'Module Manager (Full CRUD)',
    nameAr: 'مدير موديول (تعديل وإنشاء وحذف)',
    icon: '💼',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-700',
    descriptionEn: 'Full module control: Create, Edit, Delete, Submit, and Amend data records.',
    descriptionAr: 'إدارة كاملة للموديول: إنشاء، تعديل، حذف، تقديم، وتأكيد/اعتماد البيانات.',
    level: 1,
    dataScope: 'global',
    ifOwner: false,
    seeScope: 'all',
    fieldSecurity: 'editable',
    seePermissions: 'full',
    permissions: {
      select: true, read: true, write: true, create: true, delete: true,
      submit: true, cancel: true, amend: true, report: true, import: false,
      export: false, print: false, email: false, share: false
    }
  },
  {
    id: 'reporter',
    nameEn: 'Reporter & Exporter',
    nameAr: 'مستخرج تقارير وتصدير',
    icon: '📊',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-700',
    descriptionEn: 'View records, generate KPI/analytics reports, export to Excel/PDF, and print.',
    descriptionAr: 'مشاهدة البيانات، استخراج التقارير، تصدير ملفات (Excel/PDF)، والطباعة.',
    level: 2,
    dataScope: 'global',
    ifOwner: false,
    seeScope: 'all',
    fieldSecurity: 'readonly',
    seePermissions: 'view',
    permissions: {
      select: true, read: true, write: false, create: false, delete: false,
      submit: false, cancel: false, amend: false, report: true, import: false,
      export: true, print: true, email: true, share: true
    }
  },
  {
    id: 'importer',
    nameEn: 'Data Entry & Importer',
    nameAr: 'متخصص استيراد وتغذية بيانات',
    icon: '📥',
    badgeBg: 'bg-teal-50 border-teal-200',
    badgeText: 'text-teal-700',
    descriptionEn: 'Upload CSV/Excel files, feed new records, and view lists.',
    descriptionAr: 'رفع واستيراد البيانات من ملفات CSV/Excel وإدخال البيانات الأساسية.',
    level: 1,
    dataScope: 'department',
    ifOwner: false,
    seeScope: 'department',
    fieldSecurity: 'readonly',
    seePermissions: 'full',
    permissions: {
      select: true, read: true, write: true, create: true, delete: false,
      submit: true, cancel: false, amend: false, report: false, import: true,
      export: false, print: false, email: false, share: false
    }
  },
  {
    id: 'approver',
    nameEn: 'Approver & Order Confirmer',
    nameAr: 'مُعتمِد ومؤكد الطلبات',
    icon: '✅',
    badgeBg: 'bg-cyan-50 border-cyan-200',
    badgeText: 'text-cyan-700',
    descriptionEn: 'Review pending requests, confirm/approve orders, and amend entry details.',
    descriptionAr: 'مراجعة واعتماد الطلبات والموافقات الواردة، التأكيد، والتعديل عند الحاجة.',
    level: 1,
    dataScope: 'department',
    ifOwner: false,
    seeScope: 'department',
    fieldSecurity: 'editable',
    seePermissions: 'full',
    permissions: {
      select: true, read: true, write: true, create: false, delete: false,
      submit: true, cancel: true, amend: true, report: true, import: false,
      export: false, print: false, email: true, share: false
    }
  },
  {
    id: 'collaborator',
    nameEn: 'Collaborator & Sharing',
    nameAr: 'مُشارك ومُتعاون',
    icon: '🤝',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-700',
    descriptionEn: 'View items, share boards and records with team members, and send email notifications.',
    descriptionAr: 'مشاهدة اللوحات، إرسال البريد الإلكتروني، ومشاركة الرابط والمعلومات مع الفريق.',
    level: 2,
    dataScope: 'global',
    ifOwner: false,
    seeScope: 'all',
    fieldSecurity: 'hidden',
    seePermissions: 'view',
    permissions: {
      select: true, read: true, write: false, create: false, delete: false,
      submit: false, cancel: false, amend: false, report: false, import: false,
      export: false, print: false, email: true, share: true
    }
  },
  {
    id: 'super_admin',
    nameEn: 'Super Admin (Unrestricted)',
    nameAr: 'مدير نظام عام (صلاحيات كاملة)',
    icon: '⚡',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-800',
    descriptionEn: 'Full unrestricted system-wide access across all modules, fields, and actions.',
    descriptionAr: 'صلاحيات كاملة ومطلقة بجميع الموديولات والشاشات والتحكم بالنظام.',
    level: 0,
    dataScope: 'global',
    ifOwner: false,
    seeScope: 'all',
    fieldSecurity: 'editable',
    seePermissions: 'full',
    permissions: {
      select: true, read: true, write: true, create: true, delete: true,
      submit: true, cancel: true, amend: true, report: true, import: true,
      export: true, print: true, email: true, share: true
    }
  }
];

export function isActionEnabledForPreset(presetId: string, actionId: string): boolean {
  if (presetId === 'super_admin') {
    return true;
  }
  const act = actionId.toLowerCase();

  // "customize_layout" is a sensitive schema alteration action.
  // It is NEVER granted by default to non-superadmin presets (including manager, viewer, requester, etc.)
  // It must be explicitly granted by the administrator!
  if (act.includes('customize_layout')) {
    return false;
  }

  if (presetId === 'manager') {
    return true;
  }

  if (presetId === 'viewer') {
    return act.includes('view') || act.includes('filter') || act.includes('show');
  }

  if (presetId === 'requester') {
    if (act.includes('delete') || act.includes('approve') || act.includes('reject') || act.includes('adjust') || act.includes('manage') || act.includes('payroll')) {
      return false;
    }
    return act.includes('request') || act.includes('submit') || act.includes('clock_in') || act.includes('view') || act.includes('filter') || act.includes('register') || act.includes('schedule') || act.includes('evaluate');
  }

  if (presetId === 'contributor') {
    if (act.includes('delete_department') || act.includes('adjust_leave_balances') || act.includes('bulk_approve')) {
      return false;
    }
    return act.includes('add') || act.includes('edit') || act.includes('create') || act.includes('request') || act.includes('upload') || act.includes('assign') || act.includes('register') || act.includes('schedule') || act.includes('evaluate') || act.includes('view') || act.includes('filter') || act.includes('move') || act.includes('manage');
  }

  if (presetId === 'reporter') {
    return act.includes('export') || act.includes('print') || act.includes('generate') || act.includes('report') || act.includes('view') || act.includes('filter') || act.includes('show') || act.includes('share') || act.includes('excel') || act.includes('pdf');
  }

  if (presetId === 'importer') {
    return act.includes('import') || act.includes('pull') || act.includes('upload') || act.includes('add') || act.includes('register') || act.includes('view') || act.includes('filter') || act.includes('sync');
  }

  if (presetId === 'approver') {
    if (act.includes('delete_department') || act.includes('create_new_shift')) {
      return false;
    }
    return act.includes('approve') || act.includes('reject') || act.includes('resolve') || act.includes('adjust') || act.includes('view') || act.includes('filter') || act.includes('edit') || act.includes('evaluate') || act.includes('amend');
  }

  if (presetId === 'collaborator') {
    return act.includes('share') || act.includes('email') || act.includes('view') || act.includes('filter') || act.includes('print');
  }

  return true;
}

export const MODULE_SENSITIVE_FIELDS: Record<string, { key: string; labelEn: string; labelAr: string; permLevel: number; defaultStatus: 'editable' | 'readonly' | 'hidden' }[]> = {
  HR: [
    { key: 'basic_salary', labelEn: 'Basic Salary Amount', labelAr: 'قيمة الراتب الأساسي', permLevel: 2, defaultStatus: 'hidden' },
    { key: 'housing_allowance', labelEn: 'Housing & Transport Allowance', labelAr: 'بدل السكن والنقل', permLevel: 2, defaultStatus: 'hidden' },
    { key: 'national_id', labelEn: 'National ID / Passport Number', labelAr: 'رقم الهوية الوطنية / الهوية', permLevel: 1, defaultStatus: 'readonly' },
    { key: 'bank_account', labelEn: 'IBAN & Bank Details', labelAr: 'تفاصيل الحساب البنكي والآيبان', permLevel: 2, defaultStatus: 'hidden' },
    { key: 'performance_score', labelEn: 'Annual Performance Appraisal', labelAr: 'تقييم الأداء السنوي', permLevel: 1, defaultStatus: 'readonly' }
  ],
  CRM: [
    { key: 'deal_value', labelEn: 'Deal Financial Budget / Value', labelAr: 'ميزانية وقيمة الصفقة', permLevel: 0, defaultStatus: 'editable' },
    { key: 'commission_rate', labelEn: 'Sales Commission %', labelAr: 'نسبة عمولة المبيعات', permLevel: 2, defaultStatus: 'hidden' },
    { key: 'discount_level', labelEn: 'Maximum Approved Discount', labelAr: 'أقصى نسبة خصم معتمدة', permLevel: 1, defaultStatus: 'readonly' },
    { key: 'contact_phone', labelEn: 'Direct Client Mobile Number', labelAr: 'رقم جوال العميل المباشر', permLevel: 0, defaultStatus: 'editable' }
  ],
  Accounting: [
    { key: 'net_revenue', labelEn: 'Net Income / Profit Figures', labelAr: 'أرقام صافي الأرباح والإيراد', permLevel: 3, defaultStatus: 'hidden' },
    { key: 'bank_balances', labelEn: 'Real-time Bank Balances', labelAr: 'أرصدة الحسابات البنكية', permLevel: 3, defaultStatus: 'hidden' },
    { key: 'tax_number', labelEn: 'Tax Registration ID (VAT)', labelAr: 'الرقم الضريبي الموحد', permLevel: 1, defaultStatus: 'readonly' }
  ],
  Operations: [
    { key: 'cost_estimate', labelEn: 'Internal Project Cost', labelAr: 'التكلفة الداخلية للمشروع', permLevel: 1, defaultStatus: 'readonly' },
    { key: 'supplier_rates', labelEn: 'Vendor & Supplier Contracting Rates', labelAr: 'أسعار التعاقد مع الموردين', permLevel: 2, defaultStatus: 'hidden' }
  ]
};
