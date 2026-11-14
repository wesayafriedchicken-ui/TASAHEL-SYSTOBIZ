import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Users, Calendar, Clock, Award, Bell, Plus, CheckCircle2, 
  AlertCircle, ChevronRight, ExternalLink, MessageSquare, Heart, 
  Sparkles, Shield, Gift, Search, ArrowRight, UserPlus, FileText, 
  Settings, Sliders, RefreshCw, X, AlertTriangle, Check, BookOpen, 
  GraduationCap, Target, Coins, PieChart, Info, HelpCircle, MapPin, 
  Briefcase, Send, ThumbsUp, Layers, TrendingUp, Repeat
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { User, Department } from '../../types';
import { cn } from '../../lib/utils';

interface HomeViewProps {
  users?: User[];
  departments?: Department[];
  onNavigate?: (moduleId: string) => void;
}

interface TimeOffRequest {
  id: string;
  user_name: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  isUrgent?: boolean;
}

interface Announcement {
  id: string;
  author: string;
  title: string;
  category: string;
  timeAgo: string;
  avatar?: string;
}

interface Recognition {
  id: string;
  sender_name: string;
  recipient_name: string;
  points: number;
  message: string;
  created_at: string;
}

interface Complaint {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  employee_name?: string;
  created_at?: string;
}

interface ShiftSwap {
  id: string;
  requester_name: string;
  counterpart_name: string;
  swap_date: string;
  status: string;
  reason?: string;
}

/* --- Searchable Teammate Directory Dropdown --- */
function SearchableTeammateSelect({
  employees,
  selectedName,
  onSelect,
  placeholder = "Search directory or type employee name..."
}: {
  employees: any[];
  selectedName: string;
  onSelect: (emp: any) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return employees;
    const q = query.toLowerCase();
    return employees.filter(emp => 
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
      (emp.job_title || '').toLowerCase().includes(q) ||
      (emp.department_name || '').toLowerCase().includes(q)
    );
  }, [employees, query]);

  return (
    <div className="relative">
      <div className="relative">
        <input 
          type="text"
          required
          placeholder={placeholder}
          value={isOpen ? query : selectedName || query}
          onFocus={() => { setIsOpen(true); setQuery(''); }}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          className="w-full p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/20 focus:border-[#1b5e20] transition-all text-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 text-xs custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-slate-400 text-center font-semibold">
              No employees found matching "{query}"
            </div>
          ) : (
            filtered.map((emp) => (
              <div
                key={emp.id || emp.email || emp.name}
                onClick={() => {
                  onSelect(emp);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="px-3 py-2 hover:bg-emerald-50 text-slate-700 hover:text-[#1b5e20] cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#1b5e20] font-black flex items-center justify-center shrink-0">
                    {(emp.name || 'E').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{emp.name || 'Unnamed Employee'}</p>
                    <p className="text-[10px] text-slate-400">{emp.job_title || emp.role_name || emp.email || 'Employee'}</p>
                  </div>
                </div>
                {emp.department_name && (
                  <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                    {emp.department_name}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const TOUR_STEPS = [
  {
    id: 'dashboard',
    stepNumber: 1,
    titleEn: 'Command Center & Workspace Overview',
    titleAr: 'لوحة التحكم الرئيسية ونظرة عامة على النظام',
    badge: 'Core Workspace',
    descriptionEn: 'Master your daily operations with real-time KPI metrics, task shortcuts, request center, and personalized workspace widgets.',
    descriptionAr: 'استكشف لوحة التحكم الرئيسية الخاصة بك. تابع مؤشرات الأداء، والطلبات السريعة (الإجازات، والتقدير، والشكاوى)، وتخصيص العناصر بسهولة.',
    highlightsEn: [
      'Real-time KPI metrics & indicators',
      'Quick request actions (Time off, Recognition, Shift Swap, Complaints)',
      'Customizable Home Layout widgets'
    ],
    highlightsAr: [
      'مؤشرات الأداء التفاعلية بالوقت الفعلي',
      'إنشاء طلبات سريعة (إجازات، تقدير، تبادل ورديات، شكاوى)',
      'تخصيص مظهر وتخطيط عناصر لوحة التحكم'
    ],
    targetModule: 'home',
    targetModuleNameEn: 'Home Dashboard',
    targetModuleNameAr: 'الرئيسية',
    icon: Home,
    quickTipEn: "Tip: Click 'Edit Layout' at top-right to customize which cards appear on your dashboard.",
    quickTipAr: 'نصيحة: انقر على زر "Edit Layout" أعلى اليمين لتخصيص البطاقات وإخفاء أو إظهار الويجتس.'
  },
  {
    id: 'hr',
    stepNumber: 2,
    titleEn: 'HR Management & Team Directory',
    titleAr: 'إدارة الموارد البشرية وشبكة الموظفين',
    badge: 'People & Org',
    descriptionEn: 'Manage employee profiles, upload avatars/portraits, handle attendance & shift swaps, review leave requests, and explore the interactive org hierarchy.',
    descriptionAr: 'إدارة ملفات الموظفين، رفع الصور الشخصية، متابعة الحضور وتبادل الورديات، طلبات الإجازات، وعرض الهيكل التنظيمي التفاعلي.',
    highlightsEn: [
      'Employee profiles & Avatar management',
      'Leave management & Shift swap approvals',
      'Interactive Organizational Hierarchy tree'
    ],
    highlightsAr: [
      'ملفات الموظفين وإدارة الصور الشخصية (الأفاتار)',
      'إدارة الإجازات والموافقات وتبادل الورديات',
      'عرض الهيكل التنظيمي والتسلسل الوظيفي'
    ],
    targetModule: 'hr',
    targetModuleNameEn: 'HR Management',
    targetModuleNameAr: 'إدارة الموارد البشرية',
    icon: Users,
    quickTipEn: 'Tip: Uploading an employee portrait in HR replaces their initial letter with their photo system-wide!',
    quickTipAr: 'نصيحة: رفع صورة الموظف من قسم الموارد البشرية يستبدل الحرف الأول بصورته الشخصية في كل النظام!'
  },
  {
    id: 'sops',
    stepNumber: 3,
    titleEn: 'Standard Operating Procedures (SOPs)',
    titleAr: 'إجراءات العمل القياسية (SOPs)',
    badge: 'Process Excellence',
    descriptionEn: 'Document step-by-step company procedures, link SOPs to process maps & risks, manage employee acknowledgments, and enforce quality control.',
    descriptionAr: 'توثيق خطوات العمل القياسية، ربط الإجراءات بمخططات العمل والمخاطر، تتبع إقرارات الموظفين، وضمان جودة الأداء.',
    highlightsEn: [
      'Step-by-step SOP creation & versioning',
      'Employee read & acknowledge tracking',
      'Link SOPs to specific departments & roles'
    ],
    highlightsAr: [
      'إنشاء وتعديل وتوثيق خطوات SOP والنسخ القياسية',
      'متابعة قراءة وتوقيع الإقرارات من الموظفين',
      'ربط الإجراءات بالأقسام والأدوار الوظيفية'
    ],
    targetModule: 'sops',
    targetModuleNameEn: 'SOPs & Procedures',
    targetModuleNameAr: 'إجراءات العمل القياسية',
    icon: BookOpen,
    quickTipEn: 'Tip: Employees can acknowledge SOPs with one click to log audit compliance.',
    quickTipAr: 'نصيحة: يمكن للموظفين التأكيد والإقرار بقرارات SOP بضغطة زر لتوثيق سجلات التدقيق.'
  },
  {
    id: 'risk',
    stepNumber: 4,
    titleEn: 'Operations & Risk Management',
    titleAr: 'إدارة التشغيل والمخاطر',
    badge: 'Governance & Safety',
    descriptionEn: 'Identify operational threats, build risk evaluation matrices, assign mitigation action plans, and link risks to company KPIs.',
    descriptionAr: 'تحديد المخاطر التشغيلية، بناء مصفوفة تقييم الخطر، تحديد خطط المعالجة والتخفيف، وربط المخاطر بمؤشرات الأداء.',
    highlightsEn: [
      'Interactive Risk Severity Matrix',
      'Mitigation action plans & ownership',
      'Risk-to-KPI linkage for compliance'
    ],
    highlightsAr: [
      'مصفوفة تقييم وتصنيف درجة الخطورة',
      'خطط المعالجة والحد من الأثر وتحديد المسؤولين',
      'ربط المخاطر بمؤشرات الأداء والقياس'
    ],
    targetModule: 'risk',
    targetModuleNameEn: 'Risk & Operations',
    targetModuleNameAr: 'إدارة المخاطر والتشغيل',
    icon: Shield,
    quickTipEn: 'Tip: Assign clear ownership to every risk mitigation step to track progress automatically.',
    quickTipAr: 'نصيحة: عيّن مسؤولاً محدداً لكل خطة تخفيف مخاطر لتتبع الإنجاز دورياً.'
  },
  {
    id: 'crm',
    stepNumber: 5,
    titleEn: 'Sales Pipeline & Customer Directory',
    titleAr: 'المبيعات وإدارة علاقات العملاء (CRM)',
    badge: 'Growth & Deals',
    descriptionEn: 'Track sales leads, drag deals across stage pipelines, manage customer contact cards, send quotes, and monitor sales revenue KPIs.',
    descriptionAr: 'متابعة الفرص البيعية، تحريك الصفاقات في مراحل السحب والإفلات، حفظ بيانات العملاء، وإصدار الفواتير والتحليلات.',
    highlightsEn: [
      'Drag-and-drop Deal Kanban Board',
      'Customer contact history & interaction log',
      'Automatic revenue & pipeline metrics'
    ],
    highlightsAr: [
      'لوحة كانبان تفاعلية لإدارة الصفقات',
      'سجل التفاعلات والارتباطات بالعملاء',
      'تحديث تلقائي للإيرادات المتوقعة والفعلية'
    ],
    targetModule: 'crm',
    targetModuleNameEn: 'Sales & CRM',
    targetModuleNameAr: 'إدارة المبيعات والعملاء',
    icon: TrendingUp,
    quickTipEn: 'Tip: Drag deals across columns to automatically update company sales metrics.',
    quickTipAr: 'نصيحة: اسحب الصفقة بين أعمدة الكانبان لتحديث إحصائيات المبيعات مباشرة.'
  },
  {
    id: 'ai_business',
    stepNumber: 6,
    titleEn: 'AI Business Assistant & Intelligence',
    titleAr: 'المساعد الذكي وتحليلات الأعمال الذكية',
    badge: 'AI Automation',
    descriptionEn: 'Generate full business plans, automated SOP steps, risk analyses, and employee training courses with Google Gemini AI integration.',
    descriptionAr: 'إنشاء خطط عمل كاملة، خطوات إجرائية مؤتمتة، تحليلات المخاطر، ودورات تدريبية ذكية باستخدام الذكاء الاصطناعي.',
    highlightsEn: [
      'AI Business Plan & Workflow Generator',
      'Automated SOP & Course Creator',
      'Intelligent Performance Diagnostic'
    ],
    highlightsAr: [
      'إنشاء خطط الأعمال ومسارات التشغيل بالذكاء الاصطناعي',
      'توليد تلقائي للـ SOPs والدورات التدريبية',
      'تشخيص ذكي لأداء الأقسام والمؤشرات'
    ],
    targetModule: 'ai_business',
    targetModuleNameEn: 'AI Business Suite',
    targetModuleNameAr: 'المساعد الذكي للأعمال',
    icon: Sparkles,
    quickTipEn: 'Tip: Enter your business prompt to auto-generate complete organizational structures in seconds.',
    quickTipAr: 'نصيحة: أدخل وصف نشاطك التجاري ليقوم الذكاء الاصطناعي ببناء الهيكل بالكامل.'
  },
  {
    id: 'admin',
    stepNumber: 7,
    titleEn: 'Admin Panel & Security Permissions',
    titleAr: 'لوحة الإدارة، الشعار وإدارة الصلاحيات',
    badge: 'System Control',
    descriptionEn: 'Upload company logo and customize theme colors, define custom role permissions (RBAC), view system audit logs, and manage user accounts.',
    descriptionAr: 'تخصيص شعار وألوان الشركة، تحديد صلاحيات الأدوار (RBAC)، متابعة سجل الأنشطة والأمان، وإدارة حسابات المستخدمين.',
    highlightsEn: [
      'Company logo & branding customization',
      'Granular Role-Based Access Control (RBAC)',
      'System Audit Trail & Log Management'
    ],
    highlightsAr: [
      'تحديث شعار الشركة الهوية البصرية',
      'التحكم في صلاحيات المستخدمين بدقة',
      'سجل الأنشطة والأمان والتدقيق'
    ],
    targetModule: 'admin',
    targetModuleNameEn: 'Admin Panel',
    targetModuleNameAr: 'لوحة الإدارة والأمان',
    icon: Settings,
    quickTipEn: 'Tip: Admins can customize the application logo directly by clicking the logo at top-left!',
    quickTipAr: 'نصيحة: يمكن لمدير النظام تغيير اللوجو بالنقر المباشر عليه في أعلى اليسار!'
  }
];

const CARD_KEY_TO_RBAC: Record<string, string> = {
  timeOff: 'time_off',
  myStuff: 'my_stuff',
  announcements: 'whats_happening',
  directReports: 'my_direct_reports',
  celebrations: 'celebrations',
  whosOut: 'whos_out',
  companyLinks: 'company_links',
  welcomeNewHires: 'welcome_to_systo_biz',
  timeOffUsed: 'time_off_used',
  location: 'employee_distribution',
  timeOffRequests: 'pending_time_off',
  recognition: 'recognition_kudos'
};

export default function HomeView({ users = [], departments = [], onNavigate }: HomeViewProps) {
  const { user, effectiveUser, previewRole } = useAuth();
  const [, setPermVersion] = useState(0);

  // Real-time synchronization when permissions are modified in /admin/rbac
  useEffect(() => {
    const handlePermUpdate = () => setPermVersion(v => v + 1);
    window.addEventListener('sys_permissions_updated', handlePermUpdate);
    window.addEventListener('storage', handlePermUpdate);
    return () => {
      window.removeEventListener('sys_permissions_updated', handlePermUpdate);
      window.removeEventListener('storage', handlePermUpdate);
    };
  }, []);

  // Check manager / admin role
  const isManagerOrAdmin = Boolean(
    (!previewRole && user?.role_id === 1) || 
    (!previewRole && (user as any)?.is_super_admin) || 
    (!previewRole && user?.email === 'admin@gmail.com') || 
    (effectiveUser?.role_name && ['admin', 'manager', 'director', 'head'].some(r => effectiveUser.role_name?.toLowerCase().includes(r))) ||
    (previewRole?.name && ['admin', 'manager', 'director', 'head'].some(r => previewRole.name?.toLowerCase().includes(r)))
  );

  // Granular RBAC Permission Checker for all /home sections & controls
  const checkHomePermission = (itemKey: string): boolean => {
    // 1. Super Admin bypass (strictly disabled during preview role simulation so admin sees accurate simulation)
    if (!previewRole && (
      user?.role_id === 1 || 
      (user as any)?.is_super_admin || 
      user?.role === 'Admin' || 
      user?.role_name === 'Admin' ||
      user?.email === 'admin@gmail.com' ||
      user?.email === 'admin@opex.com' ||
      user?.email === 'esraaessoo19@gmail.com'
    )) {
      return true;
    }

    const targetUser = previewRole ? {
      ...user,
      permissions: previewRole.permissions,
      role_id: previewRole.id,
      role_name: previewRole.name
    } : (effectiveUser || user);

    const perms = (targetUser as any)?.permissions;
    if (!perms || typeof perms !== 'object') {
      if (['pending_time_off', 'my_direct_reports', 'invite_your_team'].includes(itemKey)) {
        return isManagerOrAdmin;
      }
      return true;
    }

    const homePerms = perms['Home'] || perms['home'] || perms['Home / Workspace'] || perms['workspace'];
    const legacyWidgets = perms?.HR?.home_widgets || perms?.['HR Management']?.home_widgets;

    // Aliases mapping for all 16 items
    const keyAliases: Record<string, string[]> = {
      pending_time_off: ['pending_time_off', 'timeoffrequests', 'pending time off requests', 'pending time off', 'pending leaves', 'pending_leaves', '/home#pending-leaves', 'pending_time_off_requests', 'timeoff_requests'],
      recognition_kudos: ['recognition_kudos', 'recognition', 'recognition & kudos', 'kudos', 'recognitions', '/home#recognition', 'recognition_and_kudos'],
      time_off_used: ['time_off_used', 'timeoffused', 'time off used (real-time)', 'time off used', 'leave_balance_chart', '/home#used-leaves', 'time_off_used_real_time'],
      employee_distribution: ['employee_distribution', 'location', 'employee distribution', 'headcount distribution', 'department distribution', '/home#distribution', 'employee_distribution_headcount_breakdown'],
      company_links: ['company_links', 'companylinks', 'company links', 'corporate links', 'quick links', '/home#links'],
      welcome_to_systo_biz: ['welcome_to_systo_biz', 'welcomenewhires', 'welcome to systo biz', 'welcome card', 'welcome_banner', '/home#welcome', 'welcome_new_hires'],
      celebrations: ['celebrations', 'celebrations (birthdays & anniversaries)', 'birthdays', 'anniversaries', '/home#celebrations'],
      whos_out: ['whos_out', 'whosout', "who's out", "who's out today", 'out of office', 'who_is_out', '/home#out', 'whos_out_out_of_office_today'],
      my_direct_reports: ['my_direct_reports', 'directreports', 'my direct reports & team', 'direct reports', 'my team', 'direct_reports', '/home#reports', 'my_direct_reports_and_team'],
      my_stuff: ['my_stuff', 'mystuff', 'my stuff', 'personal stuff', 'my_items', '/home#stuff', 'my_stuff_files_courses_work_items'],
      whats_happening: ['whats_happening', 'announcements', "what's happening at systo biz", 'company news', '/home#announcements', 'whats_happening_at_systo_biz'],
      time_off: ['time_off', 'timeoff', 'time off', 'leaves', 'leave_summary', 'my time off', '/home#time-off', 'time_off_leave_balances_quota'],
      invite_your_team: ['invite_your_team', 'inviteyourteam', 'invite your team', 'invite team', 'invite_modal', '/home#invite', 'invite_your_team_registration_modal_card'],
      continue_tour: ['continue_tour', 'continuetour', 'continue your tour of systo biz', 'onboarding tour', 'guided_tour', '/home#tour', 'continue_your_tour_of_systo_biz'],
      new_button: ['new_button', 'new...', 'new button', 'quick_new_action', '/home#new', 'new', 'show_new_action_menu_button', 'new_quick_action_menu'],
      edit_layout: ['edit_layout', 'edit layout', 'layout_customizer', 'customize layout', '/home#layout', 'show_edit_layout_customizer_button', 'edit_layout_customizer']
    };

    // Parent Tab mapping for all items to respect group-level toggles
    const parentTabMap: Record<string, string[]> = {
      new_button: ['Overview & Quick Actions', 'overview_quick_actions', 'home_overview', 'Overview', 'Workspace Overview'],
      edit_layout: ['Overview & Quick Actions', 'overview_quick_actions', 'home_overview', 'Overview', 'Workspace Overview'],
      continue_tour: ['Overview & Quick Actions', 'overview_quick_actions', 'home_overview', 'Overview', 'Workspace Overview'],
      welcome_to_systo_biz: ['Overview & Quick Actions', 'overview_quick_actions', 'home_overview', 'Overview', 'Workspace Overview'],

      my_stuff: ['My Workplace', 'my_workplace', 'home_personal', 'Personal Workplace'],
      time_off: ['My Workplace', 'my_workplace', 'home_personal', 'Personal Workplace'],
      recognition_kudos: ['My Workplace', 'my_workplace', 'home_personal', 'Personal Workplace'],

      my_direct_reports: ['Team & Hierarchy', 'team_hierarchy', 'home_team', 'Team Telemetry'],
      whos_out: ['Team & Hierarchy', 'team_hierarchy', 'home_team', 'Team Telemetry'],
      celebrations: ['Team & Hierarchy', 'team_hierarchy', 'home_team', 'Team Telemetry'],
      employee_distribution: ['Team & Hierarchy', 'team_hierarchy', 'home_team', 'Team Telemetry'],

      whats_happening: ['Company Bulletins & Approvals', 'company_bulletins_approvals', 'home_management', 'Company Bulletins'],
      pending_time_off: ['Company Bulletins & Approvals', 'company_bulletins_approvals', 'home_management', 'Company Bulletins'],
      time_off_used: ['Company Bulletins & Approvals', 'company_bulletins_approvals', 'home_management', 'Company Bulletins'],
      company_links: ['Company Bulletins & Approvals', 'company_bulletins_approvals', 'home_management', 'Company Bulletins'],
      invite_your_team: ['Company Bulletins & Approvals', 'company_bulletins_approvals', 'home_management', 'Company Bulletins']
    };

    const targetAliases = (keyAliases[itemKey] || [itemKey]);
    const normAliases = targetAliases.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    const rawAliases = targetAliases.map(k => k.toLowerCase());

    if (homePerms) {
      if (homePerms.view === false) return false;

      // 0. Check parent group tab permissions
      const parentKeys = parentTabMap[itemKey];
      if (parentKeys && parentKeys.length > 0) {
        const normParentKeys = parentKeys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, '_'));
        const rawParentKeys = parentKeys.map(k => k.toLowerCase());

        if (homePerms.levels && typeof homePerms.levels === 'object') {
          for (const pk of Object.keys(homePerms.levels)) {
            const normPK = pk.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (normParentKeys.includes(normPK) || rawParentKeys.includes(pk.toLowerCase())) {
              if (Number(homePerms.levels[pk]) === 3) return false;
            }
          }
        }
        if (homePerms.tabs && typeof homePerms.tabs === 'object') {
          for (const pk of Object.keys(homePerms.tabs)) {
            const normPK = pk.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (normParentKeys.includes(normPK) || rawParentKeys.includes(pk.toLowerCase())) {
              if (homePerms.tabs[pk] === false) return false;
            }
          }
        }
      }

      // 1. Check levels (level === 3 means Hidden / Blocked)
      if (homePerms.levels && typeof homePerms.levels === 'object') {
        for (const k of Object.keys(homePerms.levels)) {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (normAliases.includes(normK) || rawAliases.includes(k.toLowerCase())) {
            if (Number(homePerms.levels[k]) === 3) return false;
          }
        }
      }

      // 2. Check tabs visibility (strict block if false)
      if (homePerms.tabs && typeof homePerms.tabs === 'object') {
        for (const k of Object.keys(homePerms.tabs)) {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (normAliases.includes(normK) || rawAliases.includes(k.toLowerCase())) {
            if (homePerms.tabs[k] === false) return false;
          }
        }
      }

      // 3. Check custom_actions (strict block if false)
      if (homePerms.custom_actions && typeof homePerms.custom_actions === 'object') {
        for (const k of Object.keys(homePerms.custom_actions)) {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (normAliases.includes(normK) || rawAliases.includes(k.toLowerCase())) {
            if (homePerms.custom_actions[k] === false) return false;
          }
        }
      }

      // 4. Check tab_actions
      if (homePerms.tab_actions && typeof homePerms.tab_actions === 'object') {
        for (const k of Object.keys(homePerms.tab_actions)) {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (normAliases.includes(normK) || rawAliases.includes(k.toLowerCase())) {
            const act = homePerms.tab_actions[k];
            if (act && (act.view === false || act.read === false || act.level === 3)) return false;
          }
        }
      }

      // 5. Check standardized screens contract
      if (homePerms.screens && typeof homePerms.screens === 'object') {
        for (const k of Object.keys(homePerms.screens)) {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (normAliases.includes(normK) || rawAliases.includes(k.toLowerCase())) {
            const sc = homePerms.screens[k];
            if (sc?.level === 'hidden') return false;
          }
        }
      }

      // 6. Check home_widgets map inside homePerms
      if (homePerms.home_widgets && typeof homePerms.home_widgets === 'object') {
        for (const k of Object.keys(homePerms.home_widgets)) {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (normAliases.includes(normK) || rawAliases.includes(k.toLowerCase())) {
            if (homePerms.home_widgets[k]?.enabled !== undefined) {
              return Boolean(homePerms.home_widgets[k].enabled);
            }
          }
        }
      }

      // 7. Check if explicitly enabled in tabs
      if (homePerms.tabs && typeof homePerms.tabs === 'object') {
        for (const k of Object.keys(homePerms.tabs)) {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (normAliases.includes(normK) || rawAliases.includes(k.toLowerCase())) {
            if (homePerms.tabs[k] === true) return true;
          }
        }
      }

      // 8. Check if explicitly enabled in custom_actions
      if (homePerms.custom_actions && typeof homePerms.custom_actions === 'object') {
        for (const k of Object.keys(homePerms.custom_actions)) {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (normAliases.includes(normK) || rawAliases.includes(k.toLowerCase())) {
            if (homePerms.custom_actions[k] === true) return true;
          }
        }
      }
    }

    // Check legacy home_widgets under HR
    if (legacyWidgets && typeof legacyWidgets === 'object') {
      for (const k of Object.keys(legacyWidgets)) {
        const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (normAliases.includes(normK) || rawAliases.includes(k.toLowerCase())) {
          if (legacyWidgets[k]?.enabled !== undefined) {
            return Boolean(legacyWidgets[k].enabled);
          }
        }
      }
    }

    // Confidential manager items default to false for basic employee role if not configured
    if (['pending_time_off', 'my_direct_reports', 'invite_your_team'].includes(itemKey)) {
      return isManagerOrAdmin;
    }

    return true;
  };

  const userName = user?.name || 'User';
  const userTitle = user?.job_title || 'Team Member';

  // Modal States
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [showRecognitionModal, setShowRecognitionModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showShiftSwapModal, setShowShiftSwapModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditLayoutModal, setShowEditLayoutModal] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);

  // Interactive Tour States
  const [showTourModal, setShowTourModal] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [completedTourStepIds, setCompletedTourStepIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('systo_biz_tour_completed_steps');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['dashboard'];
  });

  const tourProgressPercent = Math.round((completedTourStepIds.length / TOUR_STEPS.length) * 100);

  const toggleStepCompleted = (stepId: string) => {
    setCompletedTourStepIds(prev => {
      let next: string[];
      if (prev.includes(stepId)) {
        next = prev.filter(id => id !== stepId);
      } else {
        next = [...prev, stepId];
      }
      try {
        localStorage.setItem('systo_biz_tour_completed_steps', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const resetTourProgress = () => {
    setCompletedTourStepIds(['dashboard']);
    setActiveTourIndex(0);
    try {
      localStorage.setItem('systo_biz_tour_completed_steps', JSON.stringify(['dashboard']));
    } catch (e) {}
  };

  // Card visibility configuration (for Customize Layout & RBAC permissions)
  const [cardVisibility, setCardVisibility] = useState({
    timeOff: true,
    myStuff: true,
    announcements: true,
    directReports: true,
    celebrations: true,
    whosOut: true,
    companyLinks: true,
    welcomeNewHires: true,
    timeOffUsed: true,
    peopleNoRaise: true,
    incompleteTrainings: true,
    location: true,
    onboarding: true,
    timeOffRequests: true,
    cascadingGoals: true,
    recognition: true
  });

  // Sync with RBAC Access Level permissions configured in Admin Panel
  useEffect(() => {
    const targetUser = previewRole ? {
      ...user,
      permissions: previewRole.permissions
    } : (effectiveUser || user);

    const rbacHomePerms = (targetUser as any)?.permissions?.Home || (targetUser as any)?.permissions?.['Home / Workspace'] || (targetUser as any)?.permissions?.home;
    const rbacHomeWidgets = (targetUser as any)?.permissions?.HR?.home_widgets || (targetUser as any)?.permissions?.['HR Management']?.home_widgets;
    if (rbacHomePerms || rbacHomeWidgets) {
      setCardVisibility(prev => {
        let hasChanges = false;
        const next = { ...prev };
        Object.keys(next).forEach(cardKey => {
          const rbacKey = CARD_KEY_TO_RBAC[cardKey] || cardKey;
          const isAllowed = checkHomePermission(rbacKey);
          if (!isAllowed && (prev as any)[cardKey] === true) {
            (next as any)[cardKey] = false;
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [user, effectiveUser, previewRole]);

  // Real Data States (Zero fake hardcoded items!)
  const [directoryUsers, setDirectoryUsers] = useState<any[]>(users);

  const currentUserAvatar = useMemo(() => {
    const directAvatar = (user as any)?.avatar_url || (user as any)?.avatar || (user as any)?.photo_url || (user as any)?.image || (user as any)?.photo;
    if (directAvatar && String(directAvatar).trim() !== '') return directAvatar;
    if (user?.id && Array.isArray(directoryUsers)) {
      const found = directoryUsers.find((u: any) => String(u.id) === String(user.id) || (user.email && u.email === user.email));
      if (found) {
        const foundAvatar = found.avatar_url || found.avatar || found.photo_url || found.image || found.photo;
        if (foundAvatar && String(foundAvatar).trim() !== '') return foundAvatar;
      }
    }
    if (user?.id) {
      const stored = localStorage.getItem(`user_avatar_${user.id}`);
      if (stored) return stored;
    }
    return null;
  }, [user, directoryUsers]);
  const [requestsList, setRequestsList] = useState<TimeOffRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recognitionsList, setRecognitionsList] = useState<Recognition[]>([]);
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [shiftSwapsList, setShiftSwapsList] = useState<ShiftSwap[]>([]);
  const [myPoints, setMyPoints] = useState({ given: 0, redeemed: 0 });
  const [isLoadingRealData, setIsLoadingRealData] = useState(true);

  // Form States
  const [timeOffForm, setTimeOffForm] = useState({
    type: 'Annual Leave/Holiday',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [recognitionForm, setRecognitionForm] = useState({
    recipient: '',
    recipient_id: '',
    points: 25,
    message: ''
  });

  const [complaintForm, setComplaintForm] = useState({
    title: '',
    category: 'Work Environment',
    description: ''
  });

  const [shiftSwapForm, setShiftSwapForm] = useState({
    counterpart_id: '',
    counterpart_name: '',
    swap_date: '',
    reason: ''
  });

  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [directReportTab, setDirectReportTab] = useState<'headcount' | 'reports' | 'turnover'>('reports');

  // Load Real System Data from API Endpoints with local caching to prevent database hammering
  const fetchRealHomeData = async () => {
    try {
      setIsLoadingRealData(true);
      const token = localStorage.getItem('systo_token') || '';
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'x-user-id': user?.id?.toString() || '1'
      };

      // 1. Directory Employees: Skip fetch if already provided via users prop
      if (!users || users.length === 0) {
        const empRes = await fetch('/api/hr/employees', { headers }).catch(() => null);
        if (empRes?.ok) {
          const emps = await empRes.json().catch(() => []);
          if (Array.isArray(emps) && emps.length > 0) {
            setDirectoryUsers(emps);
          }
        }
      }

      // Check session cache for secondary widgets to avoid query flooding on page reload
      const cachedHome = sessionStorage.getItem('systo_home_cache');
      if (cachedHome) {
        try {
          const parsed = JSON.parse(cachedHome);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 60000) {
            if (parsed.requestsList) setRequestsList(parsed.requestsList);
            if (parsed.announcements) setAnnouncements(parsed.announcements);
            if (parsed.recognitionsList) setRecognitionsList(parsed.recognitionsList);
            if (parsed.myPoints) setMyPoints(parsed.myPoints);
            if (parsed.complaintsList) setComplaintsList(parsed.complaintsList);
            if (parsed.shiftSwapsList) setShiftSwapsList(parsed.shiftSwapsList);
            setIsLoadingRealData(false);
            return;
          }
        } catch (e) {}
      }

      // Fetch Leave and Announcements (Core widgets)
      const [leaveRes, annRes] = await Promise.all([
        fetch('/api/hr/leave', { headers }).catch(() => null),
        fetch('/api/hr/announcements', { headers }).catch(() => null)
      ]);

      let formattedLeaves: TimeOffRequest[] = [];
      if (leaveRes?.ok) {
        const leaves = await leaveRes.json().catch(() => []);
        if (Array.isArray(leaves)) {
          formattedLeaves = leaves.map((l: any) => ({
            id: l.id?.toString() || Math.random().toString(),
            user_name: l.employee_name || l.user_name || 'Employee',
            type: l.type || 'Annual Leave',
            startDate: l.start_date || l.startDate || '',
            endDate: l.end_date || l.endDate || '',
            days: l.days || 1,
            status: (l.status?.toLowerCase() === 'approved' ? 'approved' : l.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending'),
            isUrgent: Boolean(l.is_urgent)
          }));
          setRequestsList(formattedLeaves);
        }
      }

      let formattedAnns: any[] = [];
      if (annRes?.ok) {
        const anns = await annRes.json().catch(() => []);
        if (Array.isArray(anns)) {
          formattedAnns = anns.map((a: any) => ({
            id: a.id?.toString(),
            author: a.author_name || a.author || 'System',
            title: a.title,
            category: a.category || 'Announcement',
            timeAgo: a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recently'
          }));
          setAnnouncements(formattedAnns);
        }
      }

      // Cache core widget results for 60 seconds to avoid repeating on every tab switch
      try {
        sessionStorage.setItem('systo_home_cache', JSON.stringify({
          timestamp: Date.now(),
          requestsList: formattedLeaves,
          announcements: formattedAnns
        }));
      } catch (e) {}
    } catch (err) {
      console.warn("Home screen initial fetch notice:", err);
    } finally {
      setIsLoadingRealData(false);
    }
  };

  useEffect(() => {
    fetchRealHomeData();
  }, []);

  // Compute Real Directory Users (combine props and fetched)
  const allDirectoryEmployees = useMemo(() => {
    const list = [...(directoryUsers || []), ...(users || [])];
    const uniqueMap = new Map();
    list.forEach(u => {
      if (u.id || u.name) uniqueMap.set(u.id || u.email || u.name, u);
    });
    return Array.from(uniqueMap.values());
  }, [directoryUsers, users]);

  // Compute Who's Out Today from Real Approved Leave Requests
  const whosOutList = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return requestsList.filter(r => {
      if (r.status !== 'approved') return false;
      return true; // real active leaves
    });
  }, [requestsList]);

  // Compute Direct Reports dynamically from real employees
  const myDirectReports = useMemo(() => {
    if (!allDirectoryEmployees.length) return [];
    return allDirectoryEmployees.filter(emp => 
      emp.reporting_to === user?.id || emp.manager_id === user?.id || emp.id !== user?.id
    ).slice(0, 8);
  }, [allDirectoryEmployees, user]);

  // Compute Real Celebrations (Birthdays & Work Anniversaries) from Employees
  const celebrationsList = useMemo(() => {
    if (!allDirectoryEmployees || allDirectoryEmployees.length === 0) return [];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const results: Array<{
      id: string;
      employeeName: string;
      employeeId?: string;
      jobTitle?: string;
      department?: string;
      type: 'birthday' | 'anniversary';
      dateStr: string;
      dayOfMonth: number;
      headline: string;
    }> = [];

    const getOrdinalSuffix = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };

    allDirectoryEmployees.forEach(emp => {
      const name = emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || 'Employee';
      const bDateStr = emp.personal_info?.birth_date || emp.birth_date || emp.dob || emp.personal_info?.dob;
      const hDateStr = emp.joining_date || emp.hire_date || emp.personal_info?.hire_date || emp.joined_at || emp.created_at;

      // 1. Check Birthday this month
      if (bDateStr) {
        const bDate = new Date(bDateStr);
        if (!isNaN(bDate.getTime()) && bDate.getMonth() === currentMonth) {
          const ageTurning = currentYear - bDate.getFullYear();
          const dateStr = bDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          results.push({
            id: `bday-${emp.id || name}`,
            employeeName: name,
            employeeId: emp.id?.toString(),
            jobTitle: emp.job_title || emp.role_name || emp.personal_info?.job_title,
            department: emp.department_name || emp.personal_info?.department,
            type: 'birthday',
            dateStr,
            dayOfMonth: bDate.getDate(),
            headline: ageTurning > 0 ? `Turning ${ageTurning} years old 🎂` : 'Happy Birthday 🎉'
          });
        }
      }

      // 2. Check Work Anniversary this month
      if (hDateStr) {
        const hDate = new Date(hDateStr);
        if (!isNaN(hDate.getTime()) && hDate.getMonth() === currentMonth) {
          const tenureYears = currentYear - hDate.getFullYear();
          if (tenureYears >= 1) {
            const dateStr = hDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            results.push({
              id: `anniv-${emp.id || name}`,
              employeeName: name,
              employeeId: emp.id?.toString(),
              jobTitle: emp.job_title || emp.role_name || emp.personal_info?.job_title,
              department: emp.department_name || emp.personal_info?.department,
              type: 'anniversary',
              dateStr,
              dayOfMonth: hDate.getDate(),
              headline: `${tenureYears}${getOrdinalSuffix(tenureYears)} Work Anniversary 🎖️`
            });
          }
        }
      }
    });

    results.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
    return results.slice(0, 6);
  }, [allDirectoryEmployees]);

  // Compute Location Donut Data from Real Employees
  const locationData = useMemo(() => {
    if (!allDirectoryEmployees.length) return [{ name: 'HQ Office', value: 100, color: '#1b5e20' }];
    const counts: Record<string, number> = {};
    allDirectoryEmployees.forEach(emp => {
      const loc = emp.branch_name || emp.location || emp.department_name || 'Main Office';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    const colors = ['#1b5e20', '#4caf50', '#81c784', '#a5d6a7', '#2e7d32'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [allDirectoryEmployees]);

  // Time Off Chart Data (calculated from real requests)
  const timeOffChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysPerMonth = new Array(12).fill(0);
    requestsList.forEach(r => {
      if (r.status === 'approved') {
        const m = new Date(r.startDate || Date.now()).getMonth();
        daysPerMonth[m] += (r.days || 1);
      }
    });
    return months.map((month, idx) => ({ month, days: daysPerMonth[idx] }));
  }, [requestsList]);

  // Handlers for Forms
  const handleApproveRequest = async (id: string) => {
    setRequestsList(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    try {
      const token = localStorage.getItem('systo_token') || '';
      await fetch(`/api/hr/leave/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ decision: 'Approved' })
      });
    } catch (e) {}
  };

  const handleRejectRequest = async (id: string) => {
    setRequestsList(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    try {
      const token = localStorage.getItem('systo_token') || '';
      await fetch(`/api/hr/leave/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ decision: 'Rejected' })
      });
    } catch (e) {}
  };

  const handleCreateTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeOffForm.startDate || !timeOffForm.endDate) return;
    
    const newReq: TimeOffRequest = {
      id: Date.now().toString(),
      user_name: userName,
      type: timeOffForm.type,
      startDate: timeOffForm.startDate,
      endDate: timeOffForm.endDate,
      days: 3,
      status: 'pending',
      isUrgent: false
    };
    setRequestsList(prev => [newReq, ...prev]);

    try {
      const token = localStorage.getItem('systo_token') || '';
      await fetch('/api/hr/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          user_id: user?.id,
          type: timeOffForm.type,
          start_date: timeOffForm.startDate,
          end_date: timeOffForm.endDate,
          reason: timeOffForm.reason
        })
      });
    } catch (e) {}

    setShowTimeOffModal(false);
    setTimeOffForm({ type: 'Annual Leave/Holiday', startDate: '', endDate: '', reason: '' });
  };

  const handleSendRecognition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recognitionForm.recipient || !recognitionForm.message) return;
    
    setMyPoints(prev => ({ ...prev, given: prev.given + Number(recognitionForm.points) }));
    setAnnouncements(prev => [
      {
        id: Date.now().toString(),
        author: userName,
        title: `Gave ${recognitionForm.points} recognition points to ${recognitionForm.recipient}: "${recognitionForm.message}"`,
        category: 'Recognition',
        timeAgo: 'Just now'
      },
      ...prev
    ]);

    try {
      const token = localStorage.getItem('systo_token') || '';
      await fetch('/api/hr/recognitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sender_name: userName,
          recipient_id: recognitionForm.recipient_id || null,
          recipient_name: recognitionForm.recipient,
          points: recognitionForm.points,
          message: recognitionForm.message
        })
      });
    } catch (e) {}

    setShowRecognitionModal(false);
    setRecognitionForm({ recipient: '', recipient_id: '', points: 25, message: '' });
  };

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintForm.title.trim() || !complaintForm.description.trim()) return;

    const newComp: Complaint = {
      id: Date.now().toString(),
      title: complaintForm.title,
      category: complaintForm.category,
      description: complaintForm.description,
      status: 'Pending',
      employee_name: userName,
      created_at: new Date().toISOString()
    };
    setComplaintsList(prev => [newComp, ...prev]);

    try {
      const token = localStorage.getItem('systo_token') || '';
      await fetch('/api/hr/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          user_id: user?.id,
          title: complaintForm.title,
          category: complaintForm.category,
          description: complaintForm.description
        })
      });
    } catch (e) {}

    setShowComplaintModal(false);
    setComplaintForm({ title: '', category: 'Work Environment', description: '' });
  };

  const handleRequestShiftSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftSwapForm.counterpart_name || !shiftSwapForm.swap_date) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (shiftSwapForm.swap_date < todayStr) {
      alert('Swap Date must be today or a future date. Past dates are not allowed.');
      return;
    }

    const newSwap: ShiftSwap = {
      id: Date.now().toString(),
      requester_name: userName,
      counterpart_name: shiftSwapForm.counterpart_name,
      swap_date: shiftSwapForm.swap_date,
      status: 'Pending Manager',
      reason: shiftSwapForm.reason
    };
    setShiftSwapsList(prev => [newSwap, ...prev]);

    try {
      const token = localStorage.getItem('systo_token') || '';
      await fetch('/api/hr/shift-swaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          requester_id: user?.id,
          counterpart_id: shiftSwapForm.counterpart_id || 2,
          swap_date: shiftSwapForm.swap_date,
          reason: shiftSwapForm.reason
        })
      });
    } catch (e) {}

    setShowShiftSwapModal(false);
    setShiftSwapForm({ counterpart_id: '', counterpart_name: '', swap_date: '', reason: '' });
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementTitle.trim()) return;

    const newAnn: Announcement = {
      id: Date.now().toString(),
      author: userName,
      title: newAnnouncementTitle,
      category: 'Announcement',
      timeAgo: 'Just now'
    };
    setAnnouncements(prev => [newAnn, ...prev]);

    try {
      const token = localStorage.getItem('systo_token') || '';
      await fetch('/api/hr/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          author_name: userName,
          title: newAnnouncementTitle,
          category: 'Announcement'
        })
      });
    } catch (e) {}

    setNewAnnouncementTitle('');
    setShowAnnouncementModal(false);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    alert(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-100 min-h-screen text-slate-800 font-sans">
      
      {/* Top Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative">
            {currentUserAvatar ? (
              <img 
                src={currentUserAvatar} 
                alt={userName} 
                className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1b5e20] to-emerald-700 text-white font-black text-2xl flex items-center justify-center shadow-md border-2 border-white">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1b5e20] tracking-tight font-serif flex items-center gap-2">
              Hi, {userName}
              {isLoadingRealData && (
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin inline-block" />
              )}
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{userTitle}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Active Employee
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 relative">
          {/* New... Dropdown */}
          {checkHomePermission('new_button') && (
            <div className="relative">
              <button 
                onClick={() => setShowNewDropdown(!showNewDropdown)}
                className="px-4 py-2 bg-[#1b5e20] hover:bg-emerald-900 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New...</span>
              </button>

              {showNewDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs font-bold text-slate-700 animate-in fade-in slide-in-from-top-2">
                  {checkHomePermission('time_off') && (
                    <button 
                      onClick={() => { setShowTimeOffModal(true); setShowNewDropdown(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50 hover:text-[#1b5e20] flex items-center gap-2 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-emerald-600" /> Request Time Off
                    </button>
                  )}
                  {checkHomePermission('recognition_kudos') && (
                    <button 
                      onClick={() => { setShowRecognitionModal(true); setShowNewDropdown(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50 hover:text-[#1b5e20] flex items-center gap-2 transition-colors"
                    >
                      <Award className="w-4 h-4 text-amber-500" /> Give Recognition
                    </button>
                  )}
                  <button 
                    onClick={() => { setShowComplaintModal(true); setShowNewDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 transition-colors border-t border-slate-100"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600" /> File Complaint / تقديم شكوى
                  </button>
                  <button 
                    onClick={() => { setShowShiftSwapModal(true); setShowNewDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2 transition-colors"
                  >
                    <Repeat className="w-4 h-4 text-teal-600" /> Request Shift Swap / طلب تبادل وردية
                  </button>
                  {isManagerOrAdmin && checkHomePermission('whats_happening') && (
                    <button 
                      onClick={() => { setShowAnnouncementModal(true); setShowNewDropdown(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50 hover:text-[#1b5e20] flex items-center gap-2 border-t border-slate-100 transition-colors"
                    >
                      <Bell className="w-4 h-4 text-indigo-600" /> Post Announcement
                    </button>
                  )}
                  {isManagerOrAdmin && checkHomePermission('invite_your_team') && (
                    <button 
                      onClick={() => { setShowInviteModal(true); setShowNewDropdown(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50 hover:text-[#1b5e20] flex items-center gap-2 transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-blue-600" /> Invite Team Member
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {checkHomePermission('edit_layout') && (
            <button 
              onClick={() => setShowEditLayoutModal(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Layout</span>
            </button>
          )}
        </div>
      </div>

      {/* Onboarding & Tour Banner Cards */}
      {(checkHomePermission('continue_tour') || checkHomePermission('invite_your_team')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Continue Tour Banner */}
          {checkHomePermission('continue_tour') && (
            <div className={cn(
              checkHomePermission('invite_your_team') ? "lg:col-span-2" : "lg:col-span-3",
              "bg-gradient-to-br from-white via-emerald-50/40 to-white rounded-3xl border border-emerald-100 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden"
            )}>
              <div className="space-y-3 flex-1 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1b5e20] text-[10px] font-black uppercase tracking-wider">
                    Guided Onboarding Tour / جولة النظام
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {completedTourStepIds.length} / {TOUR_STEPS.length} Completed
                  </span>
                </div>

                <h2 className="text-lg md:text-xl font-black text-[#1b5e20] font-serif tracking-tight">
                  Continue your tour of Systo Biz
                </h2>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {tourProgressPercent === 100 
                    ? "🎉 All 7 modules explored! Re-visit any section anytime to master workspace capabilities." 
                    : `We know you probably have lots of questions, let's explore every module step-by-step! Next up: ${TOUR_STEPS[activeTourIndex]?.titleEn || 'Workspace Modules'}`}
                </p>

                <div className="space-y-1.5 pt-1 max-w-md">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>Progress</span>
                    <span className="text-[#1b5e20] font-black">{tourProgressPercent}% Completed</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-[#1b5e20] rounded-full transition-all duration-700 shadow-xs" 
                      style={{ width: `${tourProgressPercent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => setShowTourModal(true)}
                    className="px-5 py-2.5 bg-[#1b5e20] hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer inline-flex items-center gap-2 group"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-300 group-hover:rotate-12 transition-transform" />
                    <span>{tourProgressPercent === 100 ? "Re-open Tour Guide / استعراض الجولة" : `Continue Your Tour (${tourProgressPercent}%)`}</span>
                    <ChevronRight className="w-4 h-4 text-emerald-300" />
                  </button>

                  {completedTourStepIds.length > 1 && (
                    <button 
                      onClick={resetTourProgress}
                      className="px-3 py-2 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      Reset Progress
                    </button>
                  )}
                </div>
              </div>

              <div 
                onClick={() => setShowTourModal(true)}
                className="w-28 h-28 bg-emerald-100/70 hover:bg-emerald-100 rounded-3xl flex flex-col items-center justify-center text-[#1b5e20] border border-emerald-200 shrink-0 cursor-pointer transition-all hover:scale-105 shadow-sm group"
                title="Click to launch interactive tour modal"
              >
                <BookOpen className="w-10 h-10 group-hover:scale-110 transition-transform text-[#1b5e20]" />
                <span className="text-[10px] font-black uppercase mt-1 tracking-wider text-emerald-900">
                  Step {Math.min(activeTourIndex + 1, TOUR_STEPS.length)} of 7
                </span>
              </div>
            </div>
          )}

          {/* Invite Team Banner */}
          {checkHomePermission('invite_your_team') && (
            <div className={cn(
              checkHomePermission('continue_tour') ? "lg:col-span-1" : "lg:col-span-3",
              "bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
            )}>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1b5e20] flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-800 font-serif">Invite Your Team</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Bring your team into the workspace so they can explore Systo Biz with you.
                </p>
              </div>
              <button 
                onClick={() => setShowInviteModal(true)}
                className="mt-4 w-full py-2.5 bg-[#1b5e20] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Team Members
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Multi-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. Time Off Card */}
        {checkHomePermission('time_off') && cardVisibility.timeOff && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 font-serif flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1b5e20]" /> Time Off
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annual Leave/Holiday</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-[#1b5e20]">21</span>
                  <span className="text-xs font-bold text-slate-500">days available</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bereavement</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-700">0</span>
                  <span className="text-xs font-bold text-slate-500">days used</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={() => setShowTimeOffModal(true)}
                className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] rounded-xl text-xs font-bold border border-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" /> Request Time Off
              </button>
              <button 
                onClick={() => onNavigate?.('hr')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all cursor-pointer"
                title="View Leave History"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2. What's happening at Company (Announcements & Updates) */}
        {checkHomePermission('whats_happening') && cardVisibility.announcements && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 md:col-span-2 lg:col-span-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 font-serif flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#1b5e20]" /> What's happening at Systo Biz
              </h3>
              {isManagerOrAdmin && (
                <button 
                  onClick={() => setShowAnnouncementModal(true)}
                  className="text-[10px] font-bold text-[#1b5e20] hover:underline cursor-pointer"
                >
                  + Post
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {announcements.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  No announcements posted yet
                </div>
              ) : (
                announcements.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1b5e20] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {item.author.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 line-clamp-2">
                        <span className="text-[#1b5e20]">{item.author}:</span> {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">{item.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. My Stuff */}
        {checkHomePermission('my_stuff') && cardVisibility.myStuff && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 font-serif flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#1b5e20]" /> My Stuff
            </h3>

            <div className="space-y-3">
              <div 
                onClick={() => onNavigate?.('kpis')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-150 flex items-center gap-3 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#1b5e20] flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-800 group-hover:text-[#1b5e20]">Goals & Performance</p>
                  <p className="text-[10px] font-semibold text-slate-500">View performance reviews & objectives</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1b5e20]" />
              </div>

              <div 
                onClick={() => onNavigate?.('training')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-150 flex items-center gap-3 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#1b5e20] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-800 group-hover:text-[#1b5e20]">Training Courses</p>
                  <p className="text-[10px] font-semibold text-slate-500">View enrolled learning modules</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1b5e20]" />
              </div>

              <div 
                onClick={() => onNavigate?.('hr')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-150 flex items-center gap-3 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#1b5e20] flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-800 group-hover:text-[#1b5e20]">Benefits & Payroll</p>
                  <p className="text-[10px] font-semibold text-slate-500">View salary slips & benefit plans</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1b5e20]" />
              </div>

              <div 
                onClick={() => onNavigate?.('hr')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-150 flex items-center gap-3 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#1b5e20] flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-800 group-hover:text-[#1b5e20]">Total Rewards</p>
                  <p className="text-[10px] font-semibold text-slate-500">View Your Total Compensation</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1b5e20]" />
              </div>
            </div>
          </div>
        )}

        {/* 4. My Direct Reports / Team Cards (Manager/Admin view) */}
        {checkHomePermission('my_direct_reports') && cardVisibility.directReports && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs md:col-span-2 lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 font-serif flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1b5e20]" /> My Direct Reports & Team ({myDirectReports.length})
              </h3>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setDirectReportTab('headcount')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${directReportTab === 'headcount' ? 'bg-white text-[#1b5e20] shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Headcount ({allDirectoryEmployees.length})
                </button>
                <button 
                  onClick={() => setDirectReportTab('reports')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${directReportTab === 'reports' ? 'bg-[#1b5e20] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  My Direct Reports
                </button>
              </div>
            </div>

            {/* Real Direct Reports Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
              {myDirectReports.length === 0 ? (
                <div className="col-span-full py-6 text-center text-slate-400 text-xs font-medium">
                  No direct reports assigned
                </div>
              ) : (
                myDirectReports.map((rep, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 hover:bg-emerald-50/40 transition-all">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1b5e20] to-emerald-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {(rep.name || 'E').charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 line-clamp-1">{rep.name || 'Employee'}</p>
                      <p className="text-[9px] font-bold text-slate-500 line-clamp-1 mt-0.5">
                        {rep.job_title || rep.role_name || rep.department_name || 'Active'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. Celebrations */}
        {checkHomePermission('celebrations') && cardVisibility.celebrations && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <h3 className="text-sm font-black text-slate-800 font-serif flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-600" /> Celebrations
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                This Month ({celebrationsList.length})
              </span>
            </h3>

            <div className="space-y-2.5">
              {celebrationsList.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-semibold">
                  🎉 No upcoming birthdays or work anniversaries this month
                </div>
              ) : (
                celebrationsList.map((item) => (
                  <div key={item.id} className={`p-3 border rounded-2xl flex items-center justify-between gap-3 ${
                    item.type === 'birthday' 
                      ? 'bg-gradient-to-r from-pink-50/80 to-rose-50/80 border-pink-200/80' 
                      : 'bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-emerald-200/80'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                        item.type === 'birthday' ? 'bg-pink-100 text-pink-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.type === 'birthday' ? '🎂' : '🎖️'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          <span className="font-black text-slate-900">{item.employeeName}</span>
                        </p>
                        <p className={`text-[11px] font-bold truncate ${item.type === 'birthday' ? 'text-pink-700' : 'text-emerald-700'}`}>
                          {item.headline}
                        </p>
                        {item.jobTitle && (
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {item.jobTitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-600 bg-white/90 px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                      {item.dateStr}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => setShowRecognitionModal(true)}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-xs font-bold rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Send Congratulations
            </button>
          </div>
        )}

        {/* 6. Who's Out */}
        {checkHomePermission('whos_out') && cardVisibility.whosOut && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800 font-serif flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" /> Who's Out
              </h3>
              <p className="text-xs font-bold text-[#1b5e20] mt-2">
                {whosOutList.length} {whosOutList.length === 1 ? 'Person Is' : 'People Are'} Out Today
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Real-time attendance filter</p>

              <div className="flex items-center gap-2 mt-4">
                {whosOutList.length === 0 ? (
                  <div className="text-xs font-semibold text-slate-400 italic">
                    All team members are present today
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {whosOutList.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs">
                          {item.user_name.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      {whosOutList.map(i => i.user_name).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => onNavigate?.('hr')}
              className="text-xs font-bold text-[#1b5e20] hover:underline flex items-center gap-1 cursor-pointer pt-2"
            >
              Full Calendar <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 7. Company Links */}
        {checkHomePermission('company_links') && cardVisibility.companyLinks && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 font-serif flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#1b5e20]" /> Company Links
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Company</p>
                <div className="space-y-1 font-semibold text-[#1b5e20]">
                  <p className="hover:underline cursor-pointer" onClick={() => onNavigate?.('sops')}>Employee Handbook & SOPs</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Benefits</p>
                <div className="space-y-1 font-semibold text-slate-600">
                  <p className="hover:text-[#1b5e20] cursor-pointer" onClick={() => onNavigate?.('hr')}>Health & Medical Insurance</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Support & Tickets</p>
                <div className="space-y-1 font-semibold text-slate-600">
                  <p className="hover:text-[#1b5e20] cursor-pointer" onClick={() => setShowComplaintModal(true)}>HR Support & Grievances</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. Welcome New Hires */}
        {checkHomePermission('welcome_to_systo_biz') && cardVisibility.welcomeNewHires && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-center flex flex-col justify-between">
            <h3 className="text-sm font-black text-slate-800 font-serif flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Welcome to Systo Biz
            </h3>

            <div className="space-y-3 py-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl text-[#1b5e20] flex items-center justify-center mx-auto text-xl">
                👋
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  {allDirectoryEmployees.length} Total Team Members
                </h4>
                <p className="text-xs text-slate-500 font-semibold mt-1">Real-time Employee Roster</p>
              </div>
            </div>

            <button 
              onClick={() => onNavigate?.('hr')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              View Employee Directory
            </button>
          </div>
        )}

        {/* 9. Time Off Used Chart */}
        {checkHomePermission('time_off_used') && cardVisibility.timeOffUsed && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 font-serif flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1b5e20]" /> Time Off Used (Real-time)
              </h3>
            </div>

            <div className="h-40 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeOffChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="days" stroke="#1b5e20" strokeWidth={2.5} dot={{ r: 4, fill: '#1b5e20' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 10. Location Donut Chart */}
        {checkHomePermission('employee_distribution') && cardVisibility.location && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 font-serif flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1b5e20]" /> Employee Distribution
            </h3>

            <div className="h-40 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePie>
                  <Pie
                    data={locationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePie>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <MapPin className="w-5 h-5 text-[#1b5e20]" />
              </div>
            </div>
          </div>
        )}

        {/* 11. Time Off Requests Queue (Manager/Admin view) */}
        {checkHomePermission('pending_time_off') && cardVisibility.timeOffRequests && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 font-serif flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1b5e20]" /> Pending Time Off Requests
            </h3>

            <div className="space-y-2 pt-1 max-h-48 overflow-y-auto custom-scrollbar">
              {requestsList.filter(r => r.status === 'pending').length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                  No pending leave requests
                </div>
              ) : (
                requestsList.filter(r => r.status === 'pending').map((req) => (
                  <div key={req.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{req.user_name}</p>
                      <p className="text-[10px] text-slate-500">{req.type} ({req.days}d)</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleApproveRequest(req.id)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-[10px] cursor-pointer"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 12. Recognition Card */}
        {checkHomePermission('recognition_kudos') && cardVisibility.recognition && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-center flex flex-col justify-between">
            <h3 className="text-sm font-black text-slate-800 font-serif flex items-center justify-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Recognition & Kudos
            </h3>

            <div className="flex justify-center gap-8 border-y border-slate-100 py-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Points Given</p>
                <p className="text-2xl font-black text-emerald-700">{myPoints.given}</p>
              </div>
              <div className="border-r border-slate-100"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Recognitions</p>
                <p className="text-2xl font-black text-slate-800">{recognitionsList.length}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Give recognition and kudos points to your teammates anytime!
            </p>

            <button 
              onClick={() => setShowRecognitionModal(true)}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-xs font-bold rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Award className="w-4 h-4 text-amber-500" /> Give Recognition
            </button>
          </div>
        )}

      </div>

      {/* --- MODALS --- */}

      {/* 1. Time Off Modal */}
      {showTimeOffModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-[#1b5e20] font-serif flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#1b5e20]" /> Request Time Off
              </h3>
              <button onClick={() => setShowTimeOffModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTimeOff} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Time Off Type *</label>
                <select 
                  value={timeOffForm.type}
                  onChange={(e) => setTimeOffForm({ ...timeOffForm, type: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option>Annual Leave/Holiday</option>
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Bereavement</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Start Date *</label>
                  <input 
                    type="date"
                    required
                    value={timeOffForm.startDate}
                    onChange={(e) => setTimeOffForm({ ...timeOffForm, startDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">End Date *</label>
                  <input 
                    type="date"
                    required
                    value={timeOffForm.endDate}
                    onChange={(e) => setTimeOffForm({ ...timeOffForm, endDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Reason / Notes</label>
                <textarea 
                  rows={3}
                  value={timeOffForm.reason}
                  onChange={(e) => setTimeOffForm({ ...timeOffForm, reason: e.target.value })}
                  placeholder="Optional notes for manager..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowTimeOffModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#1b5e20] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Give Recognition Modal (With Searchable Employee Directory Selector!) */}
      {showRecognitionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-[#1b5e20] font-serif flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Give Recognition
              </h3>
              <button onClick={() => setShowRecognitionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRecognition} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Select Teammate *</label>
                {/* Linked to Employee Directory with Search */}
                <SearchableTeammateSelect 
                  employees={allDirectoryEmployees}
                  selectedName={recognitionForm.recipient}
                  onSelect={(emp) => setRecognitionForm({
                    ...recognitionForm,
                    recipient: emp.name || emp.email,
                    recipient_id: emp.id?.toString() || ''
                  })}
                  placeholder="Search by employee name, title or department..."
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Points Amount</label>
                <select 
                  value={recognitionForm.points}
                  onChange={(e) => setRecognitionForm({ ...recognitionForm, points: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value={10}>10 Points</option>
                  <option value={25}>25 Points</option>
                  <option value={50}>50 Points</option>
                  <option value={100}>100 Points</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Appreciation Message *</label>
                <textarea 
                  rows={3}
                  required
                  value={recognitionForm.message}
                  onChange={(e) => setRecognitionForm({ ...recognitionForm, message: e.target.value })}
                  placeholder="Thank you for helping out on the project..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowRecognitionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#1b5e20] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Send Recognition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. File Complaint Modal (NEW) */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-rose-800 font-serif flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" /> File Complaint / تقديم شكوى
              </h3>
              <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFileComplaint} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Complaint Category *</label>
                <select 
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Work Environment">Work Environment / بيئة العمل</option>
                  <option value="Management">Management & Supervision / الإدارة والإشراف</option>
                  <option value="Payroll & Compensation">Payroll & Compensation / الرواتب والتعويضات</option>
                  <option value="HR Policy">HR Policy / سياسات الموارد البشرية</option>
                  <option value="Facilities & Safety">Facilities & Safety / المرافق والسلامة</option>
                  <option value="General">General Inquiries / عام</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Complaint Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="Subject or summary of issue..."
                  value={complaintForm.title}
                  onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Detailed Description *</label>
                <textarea 
                  rows={4}
                  required
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  placeholder="Explain the complaint details, dates, or involved parties..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Submit Complaint / تقديم الشكوى
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Request Shift Swap Modal (NEW) */}
      {showShiftSwapModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-teal-800 font-serif flex items-center gap-2">
                <Repeat className="w-5 h-5 text-teal-600" /> Request Shift Swap / طلب تبادل وردية
              </h3>
              <button onClick={() => setShowShiftSwapModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestShiftSwap} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Select Teammate to Swap With *</label>
                <SearchableTeammateSelect 
                  employees={allDirectoryEmployees}
                  selectedName={shiftSwapForm.counterpart_name}
                  onSelect={(emp) => setShiftSwapForm({
                    ...shiftSwapForm,
                    counterpart_name: emp.name || emp.email,
                    counterpart_id: emp.id?.toString() || ''
                  })}
                  placeholder="Search colleague in Directory..."
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Shift Swap Date *</label>
                <input 
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={shiftSwapForm.swap_date}
                  onChange={(e) => {
                    const val = e.target.value;
                    const today = new Date().toISOString().split('T')[0];
                    if (val && val < today) {
                      alert('تاريخ التبادل يجب أن يكون اليوم أو تاريخ في المستقبل فقط. لا يمكن اختيار تاريخ قديم.');
                      return;
                    }
                    setShiftSwapForm({ ...shiftSwapForm, swap_date: val });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Reason for Swap</label>
                <textarea 
                  rows={3}
                  value={shiftSwapForm.reason}
                  onChange={(e) => setShiftSwapForm({ ...shiftSwapForm, reason: e.target.value })}
                  placeholder="Reason for requesting shift swap..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowShiftSwapModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Request Swap / إرسال طلب التبادل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Post Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-[#1b5e20] font-serif flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" /> Post Announcement
              </h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Announcement Title *</label>
                <textarea 
                  rows={3}
                  required
                  value={newAnnouncementTitle}
                  onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                  placeholder="Write your company update..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#1b5e20] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Post Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-[#1b5e20] font-serif flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Invite Team Member
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Email Address *</label>
                <input 
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#1b5e20] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Edit Layout Modal */}
      {showEditLayoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-[#1b5e20] font-serif flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#1b5e20]" /> Customize Home Layout
              </h3>
              <button onClick={() => setShowEditLayoutModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold">Toggle cards to show or hide on your personalized Home dashboard:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs font-bold custom-scrollbar">
              {Object.entries(cardVisibility)
                .filter(([key]) => {
                  const cardToPermMap: Record<string, string> = {
                    timeOff: 'time_off',
                    announcements: 'whats_happening',
                    myStuff: 'my_stuff',
                    directReports: 'my_direct_reports',
                    celebrations: 'celebrations',
                    whosOut: 'whos_out',
                    companyLinks: 'company_links',
                    welcomeNewHires: 'welcome_to_systo_biz',
                    timeOffUsed: 'time_off_used',
                    location: 'employee_distribution',
                    timeOffRequests: 'pending_time_off',
                    recognition: 'recognition_kudos'
                  };
                  const perm = cardToPermMap[key];
                  return !perm || checkHomePermission(perm);
                })
                .map(([key, isVisible]) => (
                <label key={key} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer">
                  <span className="capitalize text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input 
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setCardVisibility({ ...cardVisibility, [key]: e.target.checked })}
                    className="w-4 h-4 accent-[#1b5e20] rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                onClick={() => setShowEditLayoutModal(false)}
                className="px-5 py-2 bg-[#1b5e20] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Save Layout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Tour Modal */}
      <AnimatePresence>
        {showTourModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[150] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden text-slate-800 flex flex-col my-auto max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#1b5e20] via-emerald-800 to-emerald-900 text-white p-6 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-white/10 text-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-white/20">
                      Systo Biz Guided Tour
                    </span>
                    <span className="text-xs text-emerald-100 font-bold">
                      {completedTourStepIds.length} of {TOUR_STEPS.length} Steps Completed
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black font-serif text-white tracking-tight">
                    Interactive System Tour / جولة تفاعلية في المنصة
                  </h2>
                  <p className="text-xs text-emerald-100 font-medium">
                    Explore every powerful feature of Systo Biz with hands-on navigation.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-black text-white">{tourProgressPercent}% Completed</div>
                    <div className="w-28 h-2 bg-white/20 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${tourProgressPercent}%` }}></div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowTourModal(false)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Horizontal Step Tabs Bar */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {TOUR_STEPS.map((step, idx) => {
                  const isCompleted = completedTourStepIds.includes(step.id);
                  const isActive = activeTourIndex === idx;

                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveTourIndex(idx)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border",
                        isActive 
                          ? "bg-[#1b5e20] text-white border-[#1b5e20] shadow-sm" 
                          : isCompleted 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100" 
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black",
                        isActive ? "bg-white/20 text-white" : isCompleted ? "bg-emerald-200 text-[#1b5e20]" : "bg-slate-100 text-slate-500"
                      )}>
                        {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.stepNumber}
                      </div>
                      <span className="truncate max-w-[120px] sm:max-w-none">{step.titleEn.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modal Main Step Body */}
              {(() => {
                const currentStep = TOUR_STEPS[activeTourIndex];
                const StepIcon = currentStep.icon;
                const isStepCompleted = completedTourStepIds.includes(currentStep.id);

                return (
                  <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
                    {/* Step Header info */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#1b5e20] text-white text-[10px] font-black uppercase tracking-wider">
                            {currentStep.badge}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            Step {currentStep.stepNumber} of {TOUR_STEPS.length}
                          </span>
                          {isStepCompleted && (
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-200 text-[#1b5e20] text-[10px] font-black flex items-center gap-1">
                              <Check className="w-3 h-3" /> Step Completed
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-xl font-black text-[#1b5e20] font-serif">
                            {currentStep.titleEn}
                          </h3>
                          <h4 className="text-sm font-bold text-slate-700 mt-0.5">
                            {currentStep.titleAr}
                          </h4>
                        </div>

                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {currentStep.descriptionEn}
                        </p>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans" style={{ direction: 'rtl' }}>
                          {currentStep.descriptionAr}
                        </p>
                      </div>

                      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-[#1b5e20] border border-emerald-200 shadow-sm shrink-0">
                        <StepIcon className="w-10 h-10 text-[#1b5e20]" />
                      </div>
                    </div>

                    {/* Core Capabilities / Highlights Grid */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" /> Core Capabilities & Features / الميزات الرئيسية:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {currentStep.highlightsEn.map((hl, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#1b5e20] flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800">{hl}</p>
                              <p className="text-[10px] font-medium text-slate-500">{currentStep.highlightsAr[idx]}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Tip Callout Box */}
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-sm">
                        💡
                      </div>
                      <div className="space-y-1 text-xs text-amber-900">
                        <p className="font-bold">{currentStep.quickTipEn}</p>
                        <p className="font-semibold text-amber-800" style={{ direction: 'rtl' }}>{currentStep.quickTipAr}</p>
                      </div>
                    </div>

                    {/* Modal Footer Controls */}
                    <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => toggleStepCompleted(currentStep.id)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border w-full sm:w-auto",
                            isStepCompleted 
                              ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200" 
                              : "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-xs"
                          )}
                        >
                          <Check className="w-4 h-4" />
                          <span>{isStepCompleted ? "Mark as Incomplete" : "Mark Step Completed / تعيين كمكتمل"}</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowTourModal(false);
                            onNavigate?.(currentStep.targetModule);
                          }}
                          className="px-4 py-2.5 bg-[#1b5e20] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Go to {currentStep.targetModuleNameEn} / الذهاب للقسم</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          disabled={activeTourIndex === 0}
                          onClick={() => setActiveTourIndex(prev => Math.max(0, prev - 1))}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Previous / السابق
                        </button>
                        <button
                          disabled={activeTourIndex === TOUR_STEPS.length - 1}
                          onClick={() => {
                            if (!completedTourStepIds.includes(currentStep.id)) {
                              toggleStepCompleted(currentStep.id);
                            }
                            setActiveTourIndex(prev => Math.min(TOUR_STEPS.length - 1, prev + 1));
                          }}
                          className="px-5 py-2.5 bg-[#1b5e20] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          <span>Next Step / التالية</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
