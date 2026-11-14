import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Sliders, Layers, Plus, Trash2, Edit2, Copy, Check, 
  RotateCcw, Sparkles, Building2, Users, Award, Shield, Briefcase, 
  DollarSign, ArrowUp, ArrowDown, ChevronRight, FileText, CheckCircle2, 
  HelpCircle, AlertCircle, ArrowRight, Network, UserCheck, Tag, Info,
  Factory, Rocket, Landmark
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface JobGradeItem {
  id: string;
  code: string;
  name: string;
  category: 'Individual Contributor' | 'Senior Specialist' | 'Team Leadership' | 'Department Management' | 'Executive Leadership' | 'Operational / Factory Staff';
  salary_band_min: number;
  salary_band_max: number;
  currency: string;
  rank_weight: number;
  description: string;
}

export interface DepartmentGovernanceSettings {
  apex_executive_role: string;
  apex_department: string;
  default_reports_to_flow: string;
  department_head_rule: string;
  company_structure_model: string;
  categories: string[];
}

export interface JobDescriptionTemplate {
  id: string;
  name: string;
  target_department: string;
  target_grade: string;
  employment_type: string;
  location: string;
  raci_role: 'Responsible' | 'Accountable' | 'Consulted' | 'Informed';
  objective: string;
  responsibilities: string[];
  education: string;
  technical_skills: string[];
  soft_skills: string[];
  certifications: string[];
  kpis: string[];
}

export interface OrgStructureSettingsData {
  industry_preset: 'corporate' | 'startup' | 'factory';
  job_grades: JobGradeItem[];
  department_settings: DepartmentGovernanceSettings;
  jd_templates: JobDescriptionTemplate[];
  custom_settings?: Record<string, any>;
}

// INDUSTRY PRESETS
export const INDUSTRY_PRESETS: Record<string, { label: string; desc: string; icon: any; data: OrgStructureSettingsData }> = {
  corporate: {
    label: 'Corporate Enterprise',
    desc: 'Structured multi-tier hierarchy (L1-L6), formal salary bands, Board/CEO apex governance.',
    icon: Landmark,
    data: {
      industry_preset: 'corporate',
      job_grades: [
        {
          id: 'g_l1',
          code: 'L1',
          name: 'Entry Level / Associate',
          category: 'Individual Contributor',
          salary_band_min: 20000,
          salary_band_max: 35000,
          currency: 'EGP',
          rank_weight: 10,
          description: 'Foundation individual contributor executing structured operational workflows.'
        },
        {
          id: 'g_l2',
          code: 'L2',
          name: 'Mid-Level / Specialist',
          category: 'Individual Contributor',
          salary_band_min: 35000,
          salary_band_max: 55000,
          currency: 'EGP',
          rank_weight: 25,
          description: 'Independent subject matter specialist driving reliable delivery.'
        },
        {
          id: 'g_l3',
          code: 'L3',
          name: 'Senior Level / Staff Specialist',
          category: 'Senior Specialist',
          salary_band_min: 55000,
          salary_band_max: 85000,
          currency: 'EGP',
          rank_weight: 45,
          description: 'High-impact technical domain lead handling mission-critical initiatives.'
        },
        {
          id: 'g_l4',
          code: 'L4',
          name: 'Team Lead / Principal',
          category: 'Team Leadership',
          salary_band_min: 85000,
          salary_band_max: 120000,
          currency: 'EGP',
          rank_weight: 65,
          description: 'Squad supervisor leading sprint execution, quality, and peer mentorship.'
        },
        {
          id: 'g_l5',
          code: 'L5',
          name: 'Director / Department Head',
          category: 'Department Management',
          salary_band_min: 120000,
          salary_band_max: 180000,
          currency: 'EGP',
          rank_weight: 85,
          description: 'Strategic department leader steering departmental budgets, OKRs, and personnel.'
        },
        {
          id: 'g_l6',
          code: 'L6',
          name: 'Executive / C-Suite (CEO/COO/CFO)',
          category: 'Executive Leadership',
          salary_band_min: 180000,
          salary_band_max: 350000,
          currency: 'EGP',
          rank_weight: 100,
          description: 'Apex corporate leadership steering enterprise strategy and board governance.'
        }
      ],
      department_settings: {
        apex_executive_role: 'Chief Executive Officer (CEO)',
        apex_department: 'Executive Leadership & Board',
        default_reports_to_flow: 'Employee -> Team Lead -> Department Head -> CEO',
        department_head_rule: 'designee_or_manager',
        company_structure_model: 'Corporate Multi-Tier Structure',
        categories: [
          'Core Business & Revenue',
          'Engineering & Product',
          'Operations & Logistics',
          'General & Administrative',
          'Executive Governance'
        ]
      },
      jd_templates: [
        {
          id: 'tmpl_corp_exec',
          name: 'Executive Leadership (C-Suite / GM)',
          target_department: 'Executive Leadership & Board',
          target_grade: 'L6',
          employment_type: 'Full-Time',
          location: 'Headquarters / Hybrid',
          raci_role: 'Accountable',
          objective: 'Lead overall corporate strategy, organizational governance, financial performance, and multi-departmental execution.',
          responsibilities: [
            'Define and execute company vision, 3-year strategic roadmaps, and annual enterprise OKRs.',
            'Oversee executive department heads across Engineering, Sales, Operations, and Finance.',
            'Report governance, risk mitigation, and financial audits directly to the Board.',
            'Spearhead strategic partnerships, capital allocation, and investor relations.'
          ],
          education: 'Master of Business Administration (MBA) or equivalent executive credentials.',
          technical_skills: ['Corporate Governance', 'Capital Allocation', 'Strategic Scaling', 'Risk Management'],
          soft_skills: ['Visionary Leadership', 'Crisis Management', 'Executive Communication', 'Strategic Negotiation'],
          certifications: ['Certified Corporate Director', 'Executive Governance Board Member'],
          kpis: [
            'Annual Corporate Revenue Target Achievement >= 95%',
            'Enterprise EBIDTA Margin Compliance',
            'Leadership Retention & Succession Readiness >= 90%'
          ]
        },
        {
          id: 'tmpl_corp_eng',
          name: 'Senior Software Engineer / Technical Lead',
          target_department: 'Engineering',
          target_grade: 'L3',
          employment_type: 'Full-Time',
          location: 'Hybrid / Remote',
          raci_role: 'Responsible',
          objective: 'Design, develop, and maintain high-performance software modules, robust APIs, and resilient data architectures.',
          responsibilities: [
            'Architect and code clean, testable frontend and backend services.',
            'Optimize database queries, indices, and server-side response times.',
            'Participate in sprint planning, architectural design reviews, and code quality audits.',
            'Maintain automated CI/CD pipelines, unit testing coverage, and deployment safety.'
          ],
          education: 'Bachelor degree in Computer Science, Software Engineering, or equivalent experience.',
          technical_skills: ['React / TypeScript', 'Node.js', 'PostgreSQL / SQL', 'REST APIs & Docker', 'Git / CI-CD'],
          soft_skills: ['Problem Decomposition', 'Technical Communication', 'Continuous Learning', 'Agile Mindset'],
          certifications: ['AWS Certified Developer', 'Cloud Architecture Associate'],
          kpis: [
            'Sprint Story Point Delivery >= 90%',
            'Code Review SLA < 24 Hours',
            'Zero High-Severity Production Regressions'
          ]
        },
        {
          id: 'tmpl_corp_sales',
          name: 'Enterprise Commercial & Sales Executive',
          target_department: 'Sales & Commercial',
          target_grade: 'L2',
          employment_type: 'Full-Time',
          location: 'On-Site / Field Visits',
          raci_role: 'Responsible',
          objective: 'Drive B2B sales pipelines, close high-value accounts, and expand enterprise market share.',
          responsibilities: [
            'Generate and qualify enterprise prospective client leads through direct outreach.',
            'Conduct tailored product demonstrations and structure competitive commercial proposals.',
            'Negotiate contract terms, pricing structures, and closing timelines with decision makers.',
            'Maintain clean CRM pipeline tracking, deal stages, and revenue forecasts.'
          ],
          education: 'Bachelor degree in Business, Marketing, or relevant commercial discipline.',
          technical_skills: ['CRM Systems (HubSpot / Salesforce)', 'Pipeline Forecasting', 'B2B Solution Selling'],
          soft_skills: ['Active Listening', 'Persuasive Negotiation', 'Client Relationship Building', 'Resilience'],
          certifications: ['Certified Professional Salesperson (CPS)', 'Inbound Sales Certification'],
          kpis: [
            'Monthly Closed-Won Revenue Quota >= 100%',
            'Opportunity Conversion Rate >= 25%',
            'Client Retention & Renewal Rate >= 90%'
          ]
        }
      ]
    }
  },
  startup: {
    label: 'Agile Tech Startup',
    desc: 'Lean, flat hierarchy with autonomous squads, fast velocity, and flexible title tracks.',
    icon: Rocket,
    data: {
      industry_preset: 'startup',
      job_grades: [
        {
          id: 'g_s1',
          code: 'IC-1',
          name: 'Junior / Associate Builder',
          category: 'Individual Contributor',
          salary_band_min: 18000,
          salary_band_max: 30000,
          currency: 'EGP',
          rank_weight: 15,
          description: 'Eager builder contributing directly to core product and rapid shipping cycles.'
        },
        {
          id: 'g_s2',
          code: 'IC-2',
          name: 'Core Contributor / Full-Stack',
          category: 'Individual Contributor',
          salary_band_min: 30000,
          salary_band_max: 60000,
          currency: 'EGP',
          rank_weight: 35,
          description: 'Autonomous builder owning end-to-end product features and user problems.'
        },
        {
          id: 'g_s3',
          code: 'IC-3',
          name: 'Senior / Staff Specialist',
          category: 'Senior Specialist',
          salary_band_min: 60000,
          salary_band_max: 100000,
          currency: 'EGP',
          rank_weight: 60,
          description: 'High-leverage technical or domain specialist driving architecture and scale.'
        },
        {
          id: 'g_s4',
          code: 'LEAD',
          name: 'Squad Lead / Head of Craft',
          category: 'Team Leadership',
          salary_band_min: 90000,
          salary_band_max: 140000,
          currency: 'EGP',
          rank_weight: 80,
          description: 'Leads product squads, velocity, hiring, and cross-functional alignment.'
        },
        {
          id: 'g_s5',
          code: 'FOUNDER',
          name: 'Co-Founder / CEO / VP',
          category: 'Executive Leadership',
          salary_band_min: 120000,
          salary_band_max: 250000,
          currency: 'EGP',
          rank_weight: 100,
          description: 'Founder leadership steering product-market fit, fundraising, and strategy.'
        }
      ],
      department_settings: {
        apex_executive_role: 'Founder & Chief Executive Officer (CEO)',
        apex_department: 'Founders & Core Leadership',
        default_reports_to_flow: 'Contributor -> Squad Lead -> Founder / CEO',
        department_head_rule: 'lead_or_founder',
        company_structure_model: 'Flat Agile Network',
        categories: [
          'Product & Engineering',
          'Growth & Marketing',
          'Customer Experience',
          'General Operations'
        ]
      },
      jd_templates: [
        {
          id: 'tmpl_startup_pm',
          name: 'Growth Product Manager / Squad Lead',
          target_department: 'Product & Engineering',
          target_grade: 'LEAD',
          employment_type: 'Full-Time',
          location: 'Remote / Flexible',
          raci_role: 'Accountable',
          objective: 'Discover user pain points, define product hypotheses, and ship experiments that drive rapid user activation.',
          responsibilities: [
            'Own product discovery, user interviews, and backlog prioritization.',
            'Collaborate daily with engineers and designers in bi-weekly agile sprints.',
            'Instrument analytics funnels to measure retention, conversion, and referral loops.'
          ],
          education: 'Bachelor degree or proven track record of shipping successful digital products.',
          technical_skills: ['Product Analytics (Mixpanel / PostHog)', 'Figma', 'Agile Roadmapping', 'SQL Basics'],
          soft_skills: ['Extreme Ownership', 'Speed of Execution', 'Empathy for Users'],
          certifications: ['Agile Product Owner Certified'],
          kpis: [
            'Monthly Active User (MAU) Growth >= 15% MoM',
            'Feature Activation Rate >= 40%',
            'On-Time Sprint Release Rate >= 90%'
          ]
        }
      ]
    }
  },
  factory: {
    label: 'Industrial & Manufacturing Plant',
    desc: 'Shift-based operational hierarchy, shop floor supervisors, quality leads, and Plant Director.',
    icon: Factory,
    data: {
      industry_preset: 'factory',
      job_grades: [
        {
          id: 'g_f1',
          code: 'FAC-1',
          name: 'Plant Operator / Assembly Staff',
          category: 'Operational / Factory Staff',
          salary_band_min: 8000,
          salary_band_max: 14000,
          currency: 'EGP',
          rank_weight: 10,
          description: 'Production line operator executing assembly, packing, and machine operations.'
        },
        {
          id: 'g_f2',
          code: 'FAC-2',
          name: 'Maintenance Technician / Electrician',
          category: 'Operational / Factory Staff',
          salary_band_min: 12000,
          salary_band_max: 20000,
          currency: 'EGP',
          rank_weight: 25,
          description: 'Technical specialist maintaining plant equipment, electromechanics, and tooling.'
        },
        {
          id: 'g_f3',
          code: 'FAC-3',
          name: 'Production Line Supervisor',
          category: 'Team Leadership',
          salary_band_min: 18000,
          salary_band_max: 30000,
          currency: 'EGP',
          rank_weight: 45,
          description: 'Supervises shift workers, daily output targets, raw material scrap, and line safety.'
        },
        {
          id: 'g_f4',
          code: 'FAC-4',
          name: 'Quality Assurance & HSE Lead',
          category: 'Department Management',
          salary_band_min: 25000,
          salary_band_max: 45000,
          currency: 'EGP',
          rank_weight: 70,
          description: 'Enforces ISO quality standards, occupational health, safety, and audit inspections.'
        },
        {
          id: 'g_f5',
          code: 'FAC-5',
          name: 'Plant General Manager / Operations Director',
          category: 'Executive Leadership',
          salary_band_min: 60000,
          salary_band_max: 120000,
          currency: 'EGP',
          rank_weight: 100,
          description: 'Directs full manufacturing plant output, supply chain, inventory, and labor safety.'
        }
      ],
      department_settings: {
        apex_executive_role: 'Plant General Manager / Operations Director',
        apex_department: 'Plant Leadership & Operations Office',
        default_reports_to_flow: 'Operator -> Line Supervisor -> Shift Manager -> Plant GM',
        department_head_rule: 'shift_manager',
        company_structure_model: 'Shift & Plant Manufacturing Hierarchy',
        categories: [
          'Production & Assembly',
          'Maintenance & Electromechanical',
          'Quality Assurance (QA) & HSE',
          'Supply Chain & Warehousing',
          'Plant Administration'
        ]
      },
      jd_templates: [
        {
          id: 'tmpl_fac_sup',
          name: 'Production Line Shift Supervisor',
          target_department: 'Production & Assembly',
          target_grade: 'FAC-3',
          employment_type: 'Full-Time / Shifts',
          location: 'Plant Shop Floor',
          raci_role: 'Accountable',
          objective: 'Supervise daily production line workers, maintain machine throughput, minimize scrap rates, and uphold safety protocols.',
          responsibilities: [
            'Assign shift duties and monitor hourly machine output against target yields.',
            'Ensure zero safety violations and full PPE compliance on the shop floor.',
            'Log downtime, scrap percentages, and coordinate with maintenance technicians for repairs.',
            'Conduct shift handover meetings and log daily production reports.'
          ],
          education: 'Diploma or Bachelor degree in Industrial Engineering, Electromechanics, or relevant field.',
          technical_skills: ['Lean Manufacturing / 5S', 'Equipment Safety (OSHA)', 'Shift Management', 'Scrap Reduction'],
          soft_skills: ['Disciplined Leadership', 'Punctuality', 'Safety Awareness', 'Crisis Response'],
          certifications: ['OSHA 30-Hour General Industry', 'Six Sigma Yellow/Green Belt'],
          kpis: [
            'Shift Output Target Compliance >= 98%',
            'Line Scrap Rate < 1.5%',
            'Zero Reportable Safety Incidents per Quarter'
          ]
        }
      ]
    }
  }
};

interface OrgStructureSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: any[];
  employees: any[];
  onRefreshData?: () => void;
  showCustomToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const OrgStructureSettingsModal: React.FC<OrgStructureSettingsModalProps> = ({
  isOpen,
  onClose,
  departments,
  employees,
  onRefreshData,
  showCustomToast
}) => {
  const [activeTab, setActiveTab] = useState<'grades' | 'hierarchy' | 'templates' | 'presets'>('grades');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // State for all settings
  const [settings, setSettings] = useState<OrgStructureSettingsData>(() => INDUSTRY_PRESETS.corporate.data);
  
  // Grade Form Modal / Inline Edit
  const [editingGrade, setEditingGrade] = useState<JobGradeItem | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

  // JD Template Form Modal
  const [editingTemplate, setEditingTemplate] = useState<JobDescriptionTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newResponsibilityInput, setNewResponsibilityInput] = useState('');
  const [newTechSkillInput, setNewTechSkillInput] = useState('');
  const [newSoftSkillInput, setNewSoftSkillInput] = useState('');
  const [newKpiInput, setNewKpiInput] = useState('');

  // Fetch settings from API on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchOrgSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/hr/org-structure/settings', {
          headers: { 'x-user-id': '1' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.job_grades) {
            setSettings({
              industry_preset: data.industry_preset || 'corporate',
              job_grades: Array.isArray(data.job_grades) ? data.job_grades : JSON.parse(data.job_grades || '[]'),
              department_settings: typeof data.department_settings === 'object' ? data.department_settings : JSON.parse(data.department_settings || '{}'),
              jd_templates: Array.isArray(data.jd_templates) ? data.jd_templates : JSON.parse(data.jd_templates || '[]'),
              custom_settings: data.custom_settings || {}
            });
          }
        }
      } catch (err) {
        console.error('Error fetching org structure settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgSettings();
  }, [isOpen]);

  // Save Settings to Backend API
  const handleSaveAll = async (customData?: OrgStructureSettingsData) => {
    setSaving(true);
    const payload = customData || settings;
    try {
      const res = await fetch('/api/hr/org-structure/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showCustomToast?.('Organizational structure settings saved successfully.', 'success');
        if (onRefreshData) onRefreshData();
      } else {
        showCustomToast?.('Failed to save settings. Please verify details.', 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomToast?.('Network error while saving settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Switch / Apply Industry Preset
  const handleApplyPreset = (presetKey: 'corporate' | 'startup' | 'factory') => {
    const preset = INDUSTRY_PRESETS[presetKey];
    if (!preset) return;
    if (window.confirm(`Are you sure you want to load the "${preset.label}" structure template? This will update your default grades, hierarchy rules, and template blueprints.`)) {
      setSettings(preset.data);
      handleSaveAll(preset.data);
      showCustomToast?.(`Applied "${preset.label}" organizational configuration.`, 'success');
    }
  };

  // GRADE ACTIONS
  const handleOpenAddGrade = () => {
    const nextCode = `L${(settings.job_grades?.length || 0) + 1}`;
    setEditingGrade({
      id: `grade_${Date.now()}`,
      code: nextCode,
      name: '',
      category: 'Individual Contributor',
      salary_band_min: 25000,
      salary_band_max: 45000,
      currency: 'EGP',
      rank_weight: ((settings.job_grades?.length || 0) + 1) * 15,
      description: ''
    });
    setIsGradeModalOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade || !editingGrade.name.trim() || !editingGrade.code.trim()) {
      showCustomToast?.('Please enter both Grade Code and Title.', 'error');
      return;
    }

    let updatedGrades = [...settings.job_grades];
    const existingIndex = updatedGrades.findIndex(g => g.id === editingGrade.id);

    if (existingIndex >= 0) {
      updatedGrades[existingIndex] = editingGrade;
    } else {
      updatedGrades.push(editingGrade);
    }

    // Sort by rank_weight ascending
    updatedGrades.sort((a, b) => (a.rank_weight || 0) - (b.rank_weight || 0));

    const updatedSettings = {
      ...settings,
      job_grades: updatedGrades
    };

    setSettings(updatedSettings);
    setIsGradeModalOpen(false);
    setEditingGrade(null);
    handleSaveAll(updatedSettings);
  };

  const handleDeleteGrade = (gradeId: string) => {
    if (window.confirm('Are you sure you want to delete this job grade level?')) {
      const updatedGrades = settings.job_grades.filter(g => g.id !== gradeId);
      const updatedSettings = {
        ...settings,
        job_grades: updatedGrades
      };
      setSettings(updatedSettings);
      handleSaveAll(updatedSettings);
    }
  };

  const handleDuplicateGrade = (grade: JobGradeItem) => {
    const newGrade: JobGradeItem = {
      ...grade,
      id: `grade_${Date.now()}`,
      code: `${grade.code}-COPY`,
      name: `${grade.name} (Copy)`,
      rank_weight: grade.rank_weight + 5
    };
    const updatedGrades = [...settings.job_grades, newGrade].sort((a, b) => a.rank_weight - b.rank_weight);
    const updatedSettings = { ...settings, job_grades: updatedGrades };
    setSettings(updatedSettings);
    handleSaveAll(updatedSettings);
  };

  // JD TEMPLATE ACTIONS
  const handleOpenAddTemplate = () => {
    setEditingTemplate({
      id: `tmpl_${Date.now()}`,
      name: '',
      target_department: departments[0]?.name || 'Engineering',
      target_grade: settings.job_grades[0]?.code || 'L1',
      employment_type: 'Full-Time',
      location: 'Hybrid / Flexible',
      raci_role: 'Responsible',
      objective: '',
      responsibilities: [],
      education: 'Bachelor degree in relevant domain or equivalent practical experience.',
      technical_skills: [],
      soft_skills: [],
      certifications: [],
      kpis: []
    });
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.name.trim()) {
      showCustomToast?.('Please specify the Template Name.', 'error');
      return;
    }

    let updatedTemplates = [...(settings.jd_templates || [])];
    const existingIdx = updatedTemplates.findIndex(t => t.id === editingTemplate.id);

    if (existingIdx >= 0) {
      updatedTemplates[existingIdx] = editingTemplate;
    } else {
      updatedTemplates.push(editingTemplate);
    }

    const updatedSettings = {
      ...settings,
      jd_templates: updatedTemplates
    };

    setSettings(updatedSettings);
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
    handleSaveAll(updatedSettings);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this Job Description template?')) {
      const updatedTemplates = settings.jd_templates.filter(t => t.id !== templateId);
      const updatedSettings = {
        ...settings,
        jd_templates: updatedTemplates
      };
      setSettings(updatedSettings);
      handleSaveAll(updatedSettings);
    }
  };

  const handleDuplicateTemplate = (tmpl: JobDescriptionTemplate) => {
    const newTmpl: JobDescriptionTemplate = {
      ...tmpl,
      id: `tmpl_${Date.now()}`,
      name: `${tmpl.name} (Copy)`
    };
    const updatedTemplates = [...settings.jd_templates, newTmpl];
    const updatedSettings = { ...settings, jd_templates: updatedTemplates };
    setSettings(updatedSettings);
    handleSaveAll(updatedSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 my-auto">
        
        {/* MODAL HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Organizational Structure Settings</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wide">
                  Enterprise Config
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tailor job grades, salary bands, hierarchy rules, and JD templates to fit your organization's operating model.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              type="button"
              onClick={() => handleSaveAll()}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm transition-all text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION SUB-TABS */}
        <div className="flex items-center gap-2 pt-4 pb-3 border-b border-slate-100 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('grades')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
              activeTab === 'grades'
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Award className="w-4 h-4 text-indigo-500" />
            <span>📊 Job Grades & Levels ({settings.job_grades?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hierarchy')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
              activeTab === 'hierarchy'
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>🏢 Departments & Hierarchy Governance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
              activeTab === 'templates'
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>📜 JD Templates ({settings.jd_templates?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
              activeTab === 'presets'
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>⚡ Industry Presets & Profiles</span>
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading organization settings...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: JOB GRADES & LEVELS */}
              {activeTab === 'grades' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">Job Grades & Compensation Bands</h4>
                      <p className="text-[11px] text-slate-500">
                        Define career tracks, salary brackets, and rank weights for seniority sorting and org chart hierarchy.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddGrade}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Grade Level</span>
                    </button>
                  </div>

                  {/* GRADES TABLE */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-20">Code</th>
                          <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Level Title & Track</th>
                          <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Default Salary Band</th>
                          <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-28 text-center">Rank Weight</th>
                          <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-28 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(settings.job_grades || []).map((grade) => (
                          <tr key={grade.id} className="hover:bg-slate-50/60 transition-colors group">
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-200/60">
                                {grade.code}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-extrabold text-xs text-slate-800">{grade.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {grade.category}
                                </span>
                                {grade.description && (
                                  <span className="text-[10px] text-slate-400 italic line-clamp-1">
                                    {grade.description}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <span>{grade.salary_band_min?.toLocaleString()}</span>
                                <span className="text-slate-400">-</span>
                                <span>{grade.salary_band_max?.toLocaleString()}</span>
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                  {grade.currency || 'EGP'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                                {grade.rank_weight} pts
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateGrade(grade)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Duplicate Grade"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingGrade(grade); setIsGradeModalOpen(true); }}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Grade"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGrade(grade.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Grade"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {(settings.job_grades || []).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs">
                              No job grades created yet. Click "Add Grade Level" or load an Industry Preset.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: DEPARTMENTS & HIERARCHY GOVERNANCE */}
              {activeTab === 'hierarchy' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-200/60">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Executive Hierarchy & Apex Governance
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">
                          Designated Top Executive / CEO Title
                        </label>
                        <input
                          type="text"
                          value={settings.department_settings?.apex_executive_role || ''}
                          onChange={e => setSettings({
                            ...settings,
                            department_settings: { ...settings.department_settings, apex_executive_role: e.target.value }
                          })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Chief Executive Officer (CEO)"
                        />
                        <p className="text-[10px] text-slate-400 pl-1">Root authority at the top of the company organizational chart.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">
                          Apex Leadership Department
                        </label>
                        <input
                          type="text"
                          value={settings.department_settings?.apex_department || ''}
                          onChange={e => setSettings({
                            ...settings,
                            department_settings: { ...settings.department_settings, apex_department: e.target.value }
                          })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Executive Leadership & Board"
                        />
                        <p className="text-[10px] text-slate-400 pl-1">Top-level administrative division governing other departments.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">
                          Default Reports-To Chain Flow
                        </label>
                        <input
                          type="text"
                          value={settings.department_settings?.default_reports_to_flow || ''}
                          onChange={e => setSettings({
                            ...settings,
                            department_settings: { ...settings.department_settings, default_reports_to_flow: e.target.value }
                          })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Employee -> Team Lead -> Department Head -> CEO"
                        />
                        <p className="text-[10px] text-slate-400 pl-1">Defines automatic managerial escalation path.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">
                          Company Operating Model
                        </label>
                        <input
                          type="text"
                          value={settings.department_settings?.company_structure_model || ''}
                          onChange={e => setSettings({
                            ...settings,
                            department_settings: { ...settings.department_settings, company_structure_model: e.target.value }
                          })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Corporate Multi-Tier Structure"
                        />
                        <p className="text-[10px] text-slate-400 pl-1">Organizational taxonomy descriptor.</p>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE DEPARTMENTS OVERVIEW */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Active Departments Blueprint ({departments.length})
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        Synced with Database
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {departments.map((d: any) => {
                        const headEmp = employees.find((e: any) => e.id === d.department_head_id);
                        return (
                          <div key={d.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5 hover:border-indigo-300 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-800">{d.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                                ID #{d.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <UserCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span>Head: <strong className="text-slate-700">{headEmp?.name || 'Unassigned'}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: JD TEMPLATES */}
              {activeTab === 'templates' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">Job Description (JD) Card Templates</h4>
                      <p className="text-[11px] text-slate-500">
                        Reusable blueprints containing role objectives, key responsibilities, qualifications, and KPIs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddTemplate}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Template</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(settings.jd_templates || []).map((tmpl) => (
                      <div
                        key={tmpl.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5 flex flex-col justify-between hover:border-indigo-300 transition-all"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-200/60">
                                {tmpl.target_grade || 'All Grades'}
                              </span>
                              <h5 className="text-sm font-black text-slate-900 mt-1">{tmpl.name}</h5>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDuplicateTemplate(tmpl)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Duplicate Template"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditingTemplate(tmpl); setIsTemplateModalOpen(true); }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Template"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(tmpl.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <strong>Objective:</strong> {tmpl.objective || 'No objective outlined.'}
                          </div>

                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Key Responsibilities ({tmpl.responsibilities?.length || 0})
                            </div>
                            <ul className="text-[11px] text-slate-600 space-y-1 pl-3.5 list-disc">
                              {(tmpl.responsibilities || []).slice(0, 3).map((r, i) => (
                                <li key={i} className="line-clamp-1">{r}</li>
                              ))}
                            </ul>
                          </div>

                          {(tmpl.technical_skills || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {tmpl.technical_skills.slice(0, 4).map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                                  {s}
                                </span>
                              ))}
                              {tmpl.technical_skills.length > 4 && (
                                <span className="text-[10px] text-slate-400 font-bold self-center">
                                  +{tmpl.technical_skills.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Dept: <strong className="text-slate-700">{tmpl.target_department}</strong></span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200/60 text-[10px]">
                            RACI: {tmpl.raci_role || 'Responsible'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {(settings.jd_templates || []).length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                        No JD templates available. Click "Create Template" or apply an Industry Preset.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: INDUSTRY PRESETS & PROFILES */}
              {activeTab === 'presets' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                        Industry-Tailored Organization Frameworks
                      </h4>
                      <p className="text-[11px] text-indigo-900/80 mt-0.5">
                        Instantly populate your organizational hierarchy with standard industry presets suitable for Corporate Enterprises, Agile Startups, or Industrial & Manufacturing Plants.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {Object.entries(INDUSTRY_PRESETS).map(([key, p]) => {
                      const Icon = p.icon;
                      const isCurrent = settings.industry_preset === key;
                      return (
                        <div
                          key={key}
                          className={cn(
                            "p-5 rounded-3xl border transition-all space-y-4 flex flex-col justify-between",
                            isCurrent
                              ? "bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20"
                              : "bg-white border-slate-200 hover:border-indigo-300 shadow-xs"
                          )}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center">
                                <Icon className="w-5 h-5" />
                              </div>
                              {isCurrent && (
                                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase">
                                  Current Model
                                </span>
                              )}
                            </div>

                            <div>
                              <h5 className="text-sm font-black text-slate-900">{p.label}</h5>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div className="font-bold text-slate-700">Includes:</div>
                              <div>• {p.data.job_grades.length} Standard Job Grades</div>
                              <div>• {p.data.jd_templates.length} Pre-built JD Templates</div>
                              <div>• {p.data.department_settings.company_structure_model}</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplyPreset(key as any)}
                            className={cn(
                              "w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                              isCurrent
                                ? "bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                            )}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{isCurrent ? 'Reset to Preset Default' : `Apply ${p.label}`}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-500" />
            <span>Changes are persisted in organization structure settings for all HR modules.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* =========================================================================
         MODAL 1: ADD/EDIT JOB GRADE
         ========================================================================= */}
      {isGradeModalOpen && editingGrade && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-black text-slate-800">
                  {editingGrade.id.startsWith('grade_') && !settings.job_grades.some(g => g.id === editingGrade.id)
                    ? 'Add New Job Grade'
                    : 'Edit Job Grade Level'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsGradeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Grade Code</label>
                  <input
                    type="text"
                    required
                    value={editingGrade.code}
                    onChange={e => setEditingGrade({ ...editingGrade, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="L1 / SENIOR"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Grade Title</label>
                  <input
                    type="text"
                    required
                    value={editingGrade.name}
                    onChange={e => setEditingGrade({ ...editingGrade, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Senior Specialist / Staff"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Career Track / Category</label>
                  <select
                    value={editingGrade.category}
                    onChange={e => setEditingGrade({ ...editingGrade, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="Individual Contributor">Individual Contributor</option>
                    <option value="Senior Specialist">Senior Specialist</option>
                    <option value="Team Leadership">Team Leadership</option>
                    <option value="Department Management">Department Management</option>
                    <option value="Executive Leadership">Executive Leadership</option>
                    <option value="Operational / Factory Staff">Operational / Factory Staff</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rank Weight (Priority)</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={editingGrade.rank_weight}
                    onChange={e => setEditingGrade({ ...editingGrade, rank_weight: parseInt(e.target.value) || 10 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* SALARY BAND */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Default Salary Band</label>
                  <select
                    value={editingGrade.currency || 'EGP'}
                    onChange={e => setEditingGrade({ ...editingGrade, currency: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-black text-indigo-600"
                  >
                    <option value="EGP">EGP</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Min Salary</span>
                    <input
                      type="number"
                      min={0}
                      value={editingGrade.salary_band_min}
                      onChange={e => setEditingGrade({ ...editingGrade, salary_band_min: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="20000"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Max Salary</span>
                    <input
                      type="number"
                      min={0}
                      value={editingGrade.salary_band_max}
                      onChange={e => setEditingGrade({ ...editingGrade, salary_band_max: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="40000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Level Description & Scope</label>
                <textarea
                  rows={2}
                  value={editingGrade.description}
                  onChange={e => setEditingGrade({ ...editingGrade, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Expected experience and scope of autonomy for this level..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl text-xs shadow-sm"
                >
                  Save Grade Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 2: ADD/EDIT JD TEMPLATE
         ========================================================================= */}
      {isTemplateModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-black text-slate-800">
                  {editingTemplate.id.startsWith('tmpl_') && !settings.jd_templates.some(t => t.id === editingTemplate.id)
                    ? 'Create JD Card Template'
                    : 'Edit JD Card Template'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Template Name</label>
                  <input
                    type="text"
                    required
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Senior Frontend Specialist Template"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Target Department</label>
                  <select
                    value={editingTemplate.target_department}
                    onChange={e => setEditingTemplate({ ...editingTemplate, target_department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                    {departments.length === 0 && (
                      <option value="General">General Department</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Target Job Grade</label>
                  <select
                    value={editingTemplate.target_grade}
                    onChange={e => setEditingTemplate({ ...editingTemplate, target_grade: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {(settings.job_grades || []).map(g => (
                      <option key={g.id} value={g.code}>{g.code} - {g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Employment Type</label>
                  <select
                    value={editingTemplate.employment_type}
                    onChange={e => setEditingTemplate({ ...editingTemplate, employment_type: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract / Freelance">Contract / Freelance</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">RACI Role</label>
                  <select
                    value={editingTemplate.raci_role}
                    onChange={e => setEditingTemplate({ ...editingTemplate, raci_role: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="Responsible">Responsible (R)</option>
                    <option value="Accountable">Accountable (A)</option>
                    <option value="Consulted">Consulted (C)</option>
                    <option value="Informed">Informed (I)</option>
                  </select>
                </div>
              </div>

              {/* ROLE OBJECTIVE */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Role Objective</label>
                <textarea
                  rows={2}
                  value={editingTemplate.objective}
                  onChange={e => setEditingTemplate({ ...editingTemplate, objective: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Summarize the core mission and purpose of this role..."
                />
              </div>

              {/* KEY RESPONSIBILITIES */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Key Responsibilities</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newResponsibilityInput}
                    onChange={e => setNewResponsibilityInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newResponsibilityInput.trim()) {
                          setEditingTemplate({
                            ...editingTemplate,
                            responsibilities: [...(editingTemplate.responsibilities || []), newResponsibilityInput.trim()]
                          });
                          setNewResponsibilityInput('');
                        }
                      }
                    }}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Add a key responsibility and press Enter..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newResponsibilityInput.trim()) {
                        setEditingTemplate({
                          ...editingTemplate,
                          responsibilities: [...(editingTemplate.responsibilities || []), newResponsibilityInput.trim()]
                        });
                        setNewResponsibilityInput('');
                      }
                    }}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {(editingTemplate.responsibilities || []).map((resp, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-700">
                      <span>• {resp}</span>
                      <button
                        type="button"
                        onClick={() => setEditingTemplate({
                          ...editingTemplate,
                          responsibilities: editingTemplate.responsibilities.filter((_, idx) => idx !== i)
                        })}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* TECHNICAL SKILLS */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Required Skills (Tags)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTechSkillInput}
                    onChange={e => setNewTechSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTechSkillInput.trim() && !editingTemplate.technical_skills.includes(newTechSkillInput.trim())) {
                          setEditingTemplate({
                            ...editingTemplate,
                            technical_skills: [...(editingTemplate.technical_skills || []), newTechSkillInput.trim()]
                          });
                          setNewTechSkillInput('');
                        }
                      }
                    }}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. React, PostgreSQL, Negotiation..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTechSkillInput.trim() && !editingTemplate.technical_skills.includes(newTechSkillInput.trim())) {
                        setEditingTemplate({
                          ...editingTemplate,
                          technical_skills: [...(editingTemplate.technical_skills || []), newTechSkillInput.trim()]
                        });
                        setNewTechSkillInput('');
                      }
                    }}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100"
                  >
                    Add Skill
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(editingTemplate.technical_skills || []).map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-100">
                      {skill}
                      <button
                        type="button"
                        onClick={() => setEditingTemplate({
                          ...editingTemplate,
                          technical_skills: editingTemplate.technical_skills.filter((_, i) => i !== idx)
                        })}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* FOOTER */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl text-xs shadow-sm"
                >
                  Save JD Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
