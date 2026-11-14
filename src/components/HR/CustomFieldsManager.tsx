import React, { useState, useEffect } from 'react';
import { ReorderFieldsModal } from './CustomizeLayoutDropdown';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Database, 
  Link2, 
  Check, 
  X, 
  Settings, 
  Layers, 
  Sparkles, 
  Info,
  Calendar,
  ChevronDown,
  Search,
  Loader2,
  ChevronsUpDown,
  FileText,
  Paperclip,
  Users,
  Briefcase,
  UserCheck,
  DollarSign,
  Image as ImageIcon,
  Clock,
  Award,
  Sliders,
  Eye,
  HelpCircle,
  CheckSquare,
  QrCode,
  Play,
  Palette,
  Columns,
  Hash,
  ChevronsDown,
  MapPin,
  Type,
  Code2,
  FileCode,
  Activity,
  Braces,
  ExternalLink,
  FileSignature,
  Lock,
  Percent,
  Phone,
  EyeOff,
  Star,
  Layout,
  PenTool,
  Grid,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { cn } from '../../lib/utils'; // wait, does cn exist? Yes, it's imported in HRManagement.tsx.

// Entity type configurations for HR forms
export const HR_ENTITY_TYPES = [
  { value: 'employee', labelEn: 'Employee Directory', icon: 'Users' },
  { value: 'job_opening', labelEn: 'Recruitment Jobs', icon: 'Briefcase' },
  { value: 'candidate', labelEn: 'Recruitment Candidates', icon: 'UserCheck' },
  { value: 'payroll', labelEn: 'Payroll Record', icon: 'DollarSign' },
  { value: 'attendance', labelEn: 'Attendance Log', icon: 'Clock' },
  { value: 'performance', labelEn: 'Performance Review', icon: 'Award' }
];

export const TARGET_RELATION_TABLES = [
  { value: 'departments', label: 'Departments', defaultCol: 'name' },
  { value: 'users', label: 'Users & Employees', defaultCol: 'name' },
  { value: 'sops', label: 'SOPs', defaultCol: 'title' },
  { value: 'crm_customers', label: 'CRM Customers', defaultCol: 'name' },
  { value: 'products', label: 'Products', defaultCol: 'name' },
  { value: 'orders', label: 'Orders', defaultCol: 'id' },
  { value: 'kaizen_suggestions', label: 'Kaizen Suggestions', defaultCol: 'title' },
  { value: 'hr_shifts', label: 'HR Shifts', defaultCol: 'name' }
];

export interface CustomField {
  id: number;
  company_id: number;
  entity_type: string;
  field_name: string;
  field_label_ar: string;
  field_label_en: string;
  field_type: string;
  is_required: boolean;
  options: string | null;
  relation_target_table: string | null;
  relation_display_column: string | null;
  allow_search?: boolean;
  add_to_filter?: boolean;
  order_index?: number;
  hidden?: boolean;
  bold?: boolean;
  allow_in_quick_entry?: boolean;
  translatable?: boolean;
  print_hide?: boolean;
  report_hide?: boolean;
  in_list_view?: boolean;
  in_list_filter?: boolean;
  in_preview?: boolean;
  sticky?: boolean;
  in_filter?: boolean;
  in_global_search?: boolean;
  read_only?: boolean;
  allow_on_submit?: boolean;
  perm_level?: number;
  ignore_xss_filter?: boolean;
  mask_value?: boolean;
  created_at: string;
}

// ----------------------------------------------------
// 1. ADMIN CONFIGURATION COMPONENT (No-Code Builder)
// ----------------------------------------------------
export const CustomFieldsConfigManager: React.FC = () => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showManageLayoutModal, setShowManageLayoutModal] = useState(false);
  
  // Create / Edit State
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [entityType, setEntityType] = useState('employee');
  const [fieldName, setFieldName] = useState('');
  const [fieldLabelAr, setFieldLabelAr] = useState('');
  const [fieldLabelEn, setFieldLabelEn] = useState('');
  const [fieldType, setFieldType] = useState<string>('text');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState('');
  const [relationTargetTable, setRelationTargetTable] = useState('');
  const [relationDisplayColumn, setRelationDisplayColumn] = useState('name');
  const [orderIndex, setOrderIndex] = useState<number>(0);

  // Visibility section
  const [hidden, setHidden] = useState(false);
  const [bold, setBold] = useState(false);
  const [allowInQuickEntry, setAllowInQuickEntry] = useState(false);
  const [translatable, setTranslatable] = useState(false);
  const [printHide, setPrintHide] = useState(false);
  const [reportHide, setReportHide] = useState(false);

  // List / Search Settings section
  const [inListView, setInListView] = useState(false);
  const [inListFilter, setInListFilter] = useState(false);
  const [inPreview, setInPreview] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [inFilter, setInFilter] = useState(false);
  const [inGlobalSearch, setInGlobalSearch] = useState(false);

  // Permissions section
  const [readOnly, setReadOnly] = useState(false);
  const [allowOnSubmit, setAllowOnSubmit] = useState(false);
  const [permLevel, setPermLevel] = useState(0);
  const [ignoreXssFilter, setIgnoreXssFilter] = useState(false);
  
  // Validation / Error / Success
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Delete confirm modal state
  const [deleteConfirmField, setDeleteConfirmField] = useState<CustomField | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/custom-fields');
      if (res.ok) {
        const data = await res.json();
        setFields(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [roles, setRoles] = useState<any[]>([]);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/hr/permissions/roles');
      if (res.ok) {
        const ct = res.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setRoles(data);
          }
        }
      }
    } catch (err) {
      console.warn("Could not load roles for custom fields builder", err);
    }
  };

  useEffect(() => {
    fetchFields();
    fetchRoles();
  }, []);

  const resetForm = () => {
    setEditingFieldId(null);
    setFieldName('');
    setFieldLabelAr('');
    setFieldLabelEn('');
    setFieldType('text');
    setIsRequired(false);
    setOptions('');
    setRelationTargetTable('');
    setRelationDisplayColumn('name');
    setOrderIndex(0);
    setError('');
    setHidden(false);
    setBold(false);
    setAllowInQuickEntry(false);
    setTranslatable(false);
    setPrintHide(false);
    setReportHide(false);
    setInListView(false);
    setInListFilter(false);
    setInPreview(false);
    setSticky(false);
    setInFilter(false);
    setInGlobalSearch(false);
    setReadOnly(false);
    setAllowOnSubmit(false);
    setPermLevel(0);
    setIgnoreXssFilter(false);
  };

  const handleEdit = (field: CustomField) => {
    setEditingFieldId(field.id);
    setEntityType(field.entity_type);
    setFieldName(field.field_name);
    setFieldLabelAr(field.field_label_ar || '');
    setFieldLabelEn(field.field_label_en);
    setFieldType(field.field_type);
    setIsRequired(field.is_required);
    setOptions(field.options || '');
    setRelationTargetTable(field.relation_target_table || '');
    setRelationDisplayColumn(field.relation_display_column || 'name');
    setOrderIndex(field.order_index || 0);
    setError('');
    setHidden(field.hidden || false);
    setBold(field.bold || false);
    setAllowInQuickEntry(field.allow_in_quick_entry || false);
    setTranslatable(field.translatable || false);
    setPrintHide(field.print_hide || false);
    setReportHide(field.report_hide || false);
    setInListView(field.in_list_view || false);
    setInListFilter(field.in_list_filter || false);
    setInPreview(field.in_preview || false);
    setSticky(field.sticky || false);
    setInFilter(field.in_filter || false);
    setInGlobalSearch(field.in_global_search || false);
    setReadOnly(field.read_only || false);
    setAllowOnSubmit(field.allow_on_submit || false);
    setPermLevel(field.perm_level || 0);
    setIgnoreXssFilter(field.ignore_xss_filter || false);
    
    // Scroll the left panel form smoothly into view
    const formElement = document.getElementById('field-creator-form-panel');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleMoveField = async (fieldId: number, direction: 'up' | 'down') => {
    setError('');
    setSuccess('');
    
    // Get fields for the specific entity_type sorted by order_index, then ID
    const fieldToMove = fields.find(f => f.id === fieldId);
    if (!fieldToMove) return;

    const moduleFields = fields
      .filter(f => f.entity_type === fieldToMove.entity_type)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0) || a.id - b.id);

    const index = moduleFields.findIndex(f => f.id === fieldId);
    if (index === -1) return;

    let targetIndex = -1;
    if (direction === 'up' && index > 0) {
      targetIndex = index - 1;
    } else if (direction === 'down' && index < moduleFields.length - 1) {
      targetIndex = index + 1;
    }

    if (targetIndex === -1) return;

    const targetField = moduleFields[targetIndex];

    // Swapping order indexes
    const currentOrder = fieldToMove.order_index || 0;
    const targetOrder = targetField.order_index || 0;

    let newCurrentOrder = targetOrder;
    let newTargetOrder = currentOrder;

    if (newCurrentOrder === newTargetOrder) {
      if (direction === 'up') {
        newCurrentOrder = Math.max(0, targetOrder - 1);
        newTargetOrder = targetOrder + 1;
      } else {
        newCurrentOrder = targetOrder + 1;
        newTargetOrder = Math.max(0, targetOrder - 1);
      }
    }

    try {
      const res1 = await fetch(`/api/hr/custom-fields/${fieldToMove.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newCurrentOrder })
      });

      const res2 = await fetch(`/api/hr/custom-fields/${targetField.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newTargetOrder })
      });

      if (res1.ok && res2.ok) {
        setSuccess('Field order updated successfully');
        fetchFields();
      } else {
        setError('Failed to update field order on server.');
      }
    } catch (err) {
      setError('Network error. Failed to update field order.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Normalize field name to slug format
    const normalizedName = (fieldName || '').toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (!normalizedName) {
      setError('Field English Name (Slug) is required.');
      return;
    }

    // Default Arabic label to English label if left empty, for database compatibility
    const finalLabelAr = fieldLabelAr.trim() || fieldLabelEn.trim();

    // Auto calculate order index for new fields if left as 0
    let finalOrderIndex = orderIndex;
    if (!editingFieldId && orderIndex === 0) {
      const moduleFields = fields.filter(f => f.entity_type === entityType);
      if (moduleFields.length > 0) {
        const maxOrder = Math.max(...moduleFields.map(f => f.order_index || 0));
        finalOrderIndex = maxOrder + 10;
      } else {
        finalOrderIndex = 10;
      }
    }

    const payload = {
      entity_type: entityType,
      field_name: normalizedName,
      field_label_ar: finalLabelAr,
      field_label_en: fieldLabelEn.trim(),
      field_type: fieldType,
      is_required: isRequired,
      options: fieldType === 'select' ? options : null,
      relation_target_table: fieldType === 'relation' ? relationTargetTable : null,
      relation_display_column: fieldType === 'relation' ? relationDisplayColumn : null,
      order_index: finalOrderIndex,
      hidden,
      bold,
      allow_in_quick_entry: allowInQuickEntry,
      translatable,
      print_hide: printHide,
      report_hide: reportHide,
      in_list_view: inListView,
      in_list_filter: inListFilter,
      in_preview: inPreview,
      sticky,
      in_filter: inFilter,
      in_global_search: inGlobalSearch,
      read_only: readOnly,
      allow_on_submit: allowOnSubmit,
      perm_level: permLevel,
      ignore_xss_filter: ignoreXssFilter
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
        setSuccess(editingFieldId ? 'Custom field updated successfully!' : 'Custom field registered successfully!');
        resetForm();
        fetchFields();
        if (typeof (window as any).invalidateCustomFieldsCache === 'function') {
          (window as any).invalidateCustomFieldsCache(entityType);
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to save custom field configuration.');
      }
    } catch (err) {
      setError('Network error. Failed to communicate with the database.');
    }
  };

  const handleDelete = (id: number) => {
    const target = fields.find(f => f.id === id);
    if (target) {
      setDeleteConfirmField(target);
    } else {
      executeDelete(id);
    }
  };

  const executeDelete = async (id: number, labelEn?: string) => {
    setDeletingId(id);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/hr/custom-fields/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess(`Custom field ${labelEn ? `"${labelEn}"` : ''} deleted successfully.`);
        setFields(prev => prev.filter(f => f.id !== id));
        setDeleteConfirmField(null);
        fetchFields();
        if (typeof (window as any).invalidateCustomFieldsCache === 'function') {
          (window as any).invalidateCustomFieldsCache(entityType);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to delete custom field.');
      }
    } catch (err) {
      setError('Failed to delete custom field due to a network error.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredFields = activeFilter === 'all' 
    ? fields 
    : fields.filter(f => f.entity_type === activeFilter);

  // Helper mapping for icons
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-5 h-5" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5" />;
      case 'UserCheck': return <UserCheck className="w-5 h-5" />;
      case 'DollarSign': return <DollarSign className="w-5 h-5" />;
      case 'Clock': return <Clock className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  // Helper description mapping for modules
  const getModuleDescription = (value: string) => {
    switch (value) {
      case 'employee': return 'Customize the Master Employee Directory profile form.';
      case 'job_opening': return 'Add custom specifications, requirements & metadata for open roles.';
      case 'candidate': return 'Log candidate qualifications, custom attributes, & dossiers.';
      case 'payroll': return 'Introduce custom compensation factors on salary registers.';
      case 'attendance': return 'Customize shift-tracking, timing, or metric logs.';
      case 'performance': return 'Integrate custom appraisal metrics and scorecard KPIs.';
      default: return 'No-code fields builder form.';
    }
  };

  return (
    <div className="space-y-8 text-slate-800 font-sans">
      {/* Intro Alert */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10 max-w-2xl">
          <h4 className="font-black text-lg tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            No-Code Form Customization & Relations Engine
          </h4>
          <p className="text-slate-300 text-xs leading-relaxed font-medium">
            Seamlessly build, configure, and inject dynamic inputs into any HR form without deploying new code. 
            Define custom text fields, numeric thresholds, calendar date pickers, dropdown lists, or 
            <strong> Relational Lookups</strong> that seamlessly query external ERP tables inside Supabase.
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-2xl flex items-center gap-2 shrink-0 relative z-10">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Database Sync Active</span>
        </div>
      </div>

      {/* 1. INTERACTIVE MODULE SELECTION GRID */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Step 1: Select Target Form Module
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManageLayoutModal(true)}
              className="px-3.5 py-1.5 bg-[#1b5e20] text-white hover:bg-[#123e15] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Manage Layout Hierarchy (Tabs → Sections → Fields)</span>
            </button>
            <button 
              onClick={() => {
                setActiveFilter('all');
                setEntityType('employee');
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all",
                activeFilter === 'all' 
                  ? "bg-slate-950 text-white border-slate-950 shadow-md" 
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              )}
            >
              Show All Modules ({fields.length})
            </button>
          </div>
        </div>

        {showManageLayoutModal && (
          <ReorderFieldsModal
            activeTab="personal"
            onClose={() => setShowManageLayoutModal(false)}
            onSuccess={() => {
              setShowManageLayoutModal(false);
              fetchFields();
            }}
          />
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {HR_ENTITY_TYPES.map(type => {
            const count = fields.filter(f => f.entity_type === type.value).length;
            const isSelected = activeFilter === type.value;
            
            return (
              <button
                key={type.value}
                onClick={() => {
                  setActiveFilter(type.value);
                  setEntityType(type.value);
                  setError('');
                  setSuccess('');
                }}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between h-[125px] relative overflow-hidden group",
                  isSelected 
                    ? "bg-white border-indigo-600 ring-2 ring-indigo-600/10 shadow-lg" 
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md bg-gradient-to-b hover:from-slate-50/50 hover:to-white"
                )}
              >
                <div className="flex justify-between items-start w-full">
                  <div className={cn(
                    "p-2.5 rounded-xl transition-all",
                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                  )}>
                    {getIcon(type.icon)}
                  </div>
                  <span className={cn(
                    "text-[10px] font-extrabold px-2 py-0.5 rounded-lg border",
                    isSelected ? "bg-indigo-50 border-indigo-100 text-indigo-700" : "bg-slate-50 border-slate-100 text-slate-500"
                  )}>
                    {count} {count === 1 ? 'field' : 'fields'}
                  </span>
                </div>

                <div className="mt-4">
                  <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {type.labelEn}
                  </h5>
                  <p className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">
                    {getModuleDescription(type.value)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONFIGURATION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Field Constructor form */}
        <div 
          id="field-creator-form-panel"
          className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-1">
              Field Constructor & Architect
            </span>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              {editingFieldId 
                ? 'Edit Custom Field' 
                : `Add Field to: ${HR_ENTITY_TYPES.find(t => t.value === entityType)?.labelEn || 'Form'}`
              }
            </h4>
            <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-wider">
              Define database parameters and rendering styles below
            </p>
          </div>

          {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">{error}</div>}
          {success && <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-100">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Form Select (Readonly context if possible, otherwise editable) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Target HR Form Module
              </label>
              <select
                disabled={!!editingFieldId}
                value={entityType}
                onChange={e => {
                  setEntityType(e.target.value);
                  if (activeFilter !== 'all') {
                    setActiveFilter(e.target.value);
                  }
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {HR_ENTITY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Field English Name (slug) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Database Attribute Key (Slug)
              </label>
              <input
                required
                type="text"
                disabled={!!editingFieldId}
                placeholder="e.g., secondary_email, blood_type"
                value={fieldName}
                onChange={e => setFieldName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
              />
              <span className="text-[9px] text-slate-400 block font-bold">
                Lowercase letters, numbers, and underscores only. Works as the database table key.
              </span>
            </div>

            {/* Field Display Label (English) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Field Label (English)
              </label>
              <input
                required
                type="text"
                placeholder="e.g., Blood Group"
                value={fieldLabelEn}
                onChange={e => setFieldLabelEn(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-[9px] text-slate-400 block font-bold">
                The visual label that will be shown directly on the user-facing form.
              </span>
            </div>

            {/* Field Display Label (Arabic - Optional, defaults to English under the hood) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider flex justify-between">
                <span>Arabic Label</span>
                <span className="text-slate-400 italic font-normal">Optional</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Blood Type"
                value={fieldLabelAr}
                onChange={e => setFieldLabelAr(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 text-right outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-[9px] text-slate-400 block font-bold">
                Used for billing, payroll, or Arabic localization of forms.
              </span>
            </div>

            {/* Field Type Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Input Type & Component
              </label>
              <select
                value={fieldType}
                onChange={e => {
                  setFieldType(e.target.value);
                  if (e.target.value === 'relation' && !relationTargetTable) {
                    setRelationTargetTable(TARGET_RELATION_TABLES[0].value);
                    setRelationDisplayColumn(TARGET_RELATION_TABLES[0].defaultCol);
                  }
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {/* 43 Requested Field Types */}
                <option value="Autocomplete">Autocomplete (Search Suggestion)</option>
                <option value="Attach">Attach (File Uploader)</option>
                <option value="Attach Image">Attach Image (Upload with Preview)</option>
                <option value="Barcode">Barcode (Scan Reader Field)</option>
                <option value="Button">Button (Action Trigger)</option>
                <option value="Check">Check (Checkbox/Toggle Switch)</option>
                <option value="Code">Code (Monospace Source Editor)</option>
                <option value="Color">Color (Hex Palette Selector)</option>
                <option value="Column Break">Column Break (Grid Separation)</option>
                <option value="Currency">Currency (Formatted Money Numeric)</option>
                <option value="Data">Data (Single Line Text String)</option>
                <option value="Date">Date (Calendar Picker)</option>
                <option value="Datetime">Datetime (Calendar & Clock Picker)</option>
                <option value="Duration">Duration (Time Interval)</option>
                <option value="Dynamic Link">Dynamic Link (Cross-Entity Connector)</option>
                <option value="Float">Float (Decimal Floating Number)</option>
                <option value="Fold">Fold (Collapsible Form Accordion)</option>
                <option value="Geolocation">Geolocation (GPS Coordinates & Map)</option>
                <option value="Heading">Heading (Visual Form Title Separator)</option>
                <option value="HTML">HTML (Raw Content Renderer)</option>
                <option value="HTML Editor">HTML Editor (Rich WYSIWYG Content)</option>
                <option value="Icon">Icon (Lucide Symbol Chooser)</option>
                <option value="Image">Image (Static URL Preview Frame)</option>
                <option value="Int">Int (Integer Whole Numbers)</option>
                <option value="JSON">JSON (Structured Objects Key-Value)</option>
                <option value="Link">Link (Hyperlink Web URL Redirector)</option>
                <option value="Long Text">Long Text (Large Multiline Content Box)</option>
                <option value="Markdown Editor">Markdown Editor (Styled Markup Write-Preview)</option>
                <option value="Password">Password (Masked Secure Box)</option>
                <option value="Percent">Percent (Percentage Ratio Value)</option>
                <option value="Phone">Phone (Telephone formatted digits)</option>
                <option value="Read Only">Read Only (Non-Editable Label Box)</option>
                <option value="Rating">Rating (Five Star Scoring Component)</option>
                <option value="Section Break">Section Break (Divider separator line)</option>
                <option value="Select">Select (Custom Choices Dropdown)</option>
                <option value="Signature">Signature (Digital Pen Draw Pad)</option>
                <option value="Small Text">Small Text (Mid-sized Short Textarea)</option>
                <option value="Tab Break">Tab Break (Horizontal Navigation Tab Line)</option>
                <option value="Table">Table (Dynamic Sub-item child grid rows)</option>
                <option value="Table MultiSelect">Table MultiSelect (Pill Choice Grid Selector)</option>
                <option value="Text">Text (Standard Text Box)</option>
                <option value="Text Editor">Text Editor (Standard WYSIWYG formatting)</option>
                <option value="Time">Time (Hours & Minutes Picker)</option>

                {/* Legacy compatibility fallback list */}
                <option value="text">Text (Legacy Short Answer)</option>
                <option value="number">Numeric Input (Legacy Decimals)</option>
                <option value="date">Date Picker (Legacy)</option>
                <option value="select">Dropdown Options (Legacy)</option>
                <option value="relation">Relational Lookup (Legacy Database Relation) 🔗</option>
              </select>
            </div>

            {/* Conditional: Predefined Options (Dropdown select and Autocomplete choices) */}
            {(fieldType === 'select' || fieldType === 'Select' || fieldType === 'Autocomplete' || fieldType === 'Table MultiSelect') && (
              <div className="space-y-1.5 p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[10px] font-black uppercase text-indigo-950 block tracking-wider">
                  List Options
                </label>
                <textarea
                  required
                  placeholder="e.g., Option A, Option B, Option C"
                  value={options}
                  onChange={e => setOptions(e.target.value)}
                  className="w-full p-3 bg-white border border-indigo-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 h-20 text-slate-800 resize-none"
                />
                <span className="text-[9px] text-indigo-700 font-bold block">
                  Add distinct options separated by commas. These become clickable in the input dropdown or autocomplete.
                </span>
              </div>
            )}

            {/* Conditional: Relational database Lookup */}
            {(fieldType === 'relation' || fieldType === 'Dynamic Link') && (
              <div className="space-y-4 p-4 bg-amber-50/40 rounded-2xl border border-amber-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-amber-950 block tracking-wider">
                    Source ERP Database Table
                  </label>
                  <select
                    value={relationTargetTable}
                    onChange={e => {
                      const val = e.target.value;
                      setRelationTargetTable(val);
                      const matched = TARGET_RELATION_TABLES.find(t => t.value === val);
                      if (matched) {
                        setRelationDisplayColumn(matched.defaultCol);
                      }
                    }}
                    className="w-full p-2.5 bg-white border border-amber-200 rounded-xl font-bold text-xs text-slate-700 outline-none"
                  >
                    {TARGET_RELATION_TABLES.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.label.split('/')[0].trim()}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-amber-950 block tracking-wider">
                    Display Field Column
                  </label>
                  <input
                    required
                    type="text"
                    value={relationDisplayColumn}
                    onChange={e => setRelationDisplayColumn(e.target.value)}
                    className="w-full p-2.5 bg-white border border-amber-200 rounded-xl font-bold text-xs text-slate-800 outline-none"
                    placeholder="e.g., name, title, display_value"
                  />
                  <span className="text-[9px] text-amber-800 font-bold block leading-normal">
                    The specific column on that external table whose value will be shown inside the dropdown list.
                  </span>
                </div>
              </div>
            )}

            {/* Required field checkbox toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={e => setIsRequired(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500/20"
                />
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                  Require users to fill this field (Mandatory Validation)
                </span>
              </label>
            </div>

            {/* Visibility Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">Visibility</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={hidden}
                    onChange={e => setHidden(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">Hidden</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={bold}
                    onChange={e => setBold(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">Bold</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={allowInQuickEntry}
                    onChange={e => setAllowInQuickEntry(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">Allow in Quick Entry</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={translatable}
                    onChange={e => setTranslatable(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">Translatable</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={printHide}
                    onChange={e => setPrintHide(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">Print Hide</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={reportHide}
                    onChange={e => setReportHide(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">Report Hide</span>
                </label>
              </div>
            </div>

            {/* List / Search Settings Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">List / Search Settings</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={inListView}
                      onChange={e => setInListView(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">In List View</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={inListFilter}
                      onChange={e => setInListFilter(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">In List Filter</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={inPreview}
                      onChange={e => setInPreview(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">In Preview</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={sticky}
                      onChange={e => setSticky(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">Sticky</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={inFilter}
                      onChange={e => setInFilter(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">In Filter</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={inGlobalSearch}
                      onChange={e => setInGlobalSearch(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">In Global Search</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">Permissions</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={readOnly}
                      onChange={e => setReadOnly(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">Read Only</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={allowOnSubmit}
                      onChange={e => setAllowOnSubmit(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">Allow on Submit</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      Perm Level (Access Role)
                    </label>
                    <select
                      value={permLevel}
                      onChange={e => setPermLevel(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value={0}>Public / Everyone</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={ignoreXssFilter}
                      onChange={e => setIgnoreXssFilter(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/20"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">Ignore XSS Filter</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Custom order index field to specify precise ordering index manually */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Order Index
              </label>
              <input
                type="number"
                placeholder="0"
                value={orderIndex}
                onChange={e => setOrderIndex(parseInt(e.target.value, 10) || 0)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-850 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-[9px] text-slate-400 block font-bold">
                Lower numbers are shown first. Leave as 0 to auto-append at the end.
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              {editingFieldId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black transition-all flex-1"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 flex-1"
              >
                <Save className="w-4 h-4" />
                {editingFieldId ? 'Save Changes' : 'Register Custom Field'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Active Fields Catalog with Live Layout Preview */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-indigo-500" />
                Dynamic Fields Catalog
              </h4>
              <p className="text-slate-400 text-[10px] uppercase font-bold mt-0.5 tracking-wider">
                {activeFilter === 'all' 
                  ? `Showing all active custom fields (${filteredFields.length})`
                  : `Active custom fields for: ${HR_ENTITY_TYPES.find(t => t.value === activeFilter)?.labelEn || activeFilter} (${filteredFields.length})`
                }
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span>Retrieving fields schema configurations from database...</span>
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="py-24 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3">
              <Info className="w-9 h-9 text-slate-300" />
              <h5 className="font-extrabold text-slate-700">No Custom Fields Registered</h5>
              <p className="text-[10px] text-slate-400 max-w-[320px] mx-auto leading-relaxed">
                There are no custom dynamic fields defined for this form. Use the Field Constructor form on the left to add your first no-code dynamic field!
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {filteredFields.map(field => {
                const targetType = HR_ENTITY_TYPES.find(t => t.value === field.entity_type);
                return (
                  <div 
                    key={field.id} 
                    className="p-5 bg-slate-50 border border-slate-200/75 rounded-2xl transition-all duration-300 hover:border-slate-300 hover:shadow-sm space-y-4 group relative"
                  >
                    {/* Header: Title, Type Badge and Actions */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900">
                            {field.field_label_en}
                          </span>
                          {field.field_label_ar && (
                            <span className="text-[10px] text-slate-400 font-bold font-mono">
                              / {field.field_label_ar}
                            </span>
                          )}
                          <span className="text-[8px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                            {field.field_type}
                          </span>
                          {field.is_required && (
                            <span className="text-[8px] bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                              Mandatory
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold mt-1.5">
                          <span>Database Key: <code className="font-mono text-[9px] bg-white border border-slate-100 text-indigo-600 px-1 py-0.5 rounded">{field.field_name}</code></span>
                          <span>•</span>
                          <span>Form: <strong className="text-slate-600">{targetType?.labelEn || field.entity_type}</strong></span>
                        </div>

                        {/* Selected advanced options summary badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {field.hidden && (
                            <span className="text-[9px] font-extrabold bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                              Hidden
                            </span>
                          )}
                          {field.bold && (
                            <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                              Bold
                            </span>
                          )}
                          {field.allow_in_quick_entry && (
                            <span className="text-[9px] font-extrabold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-100">
                              Quick Entry
                            </span>
                          )}
                          {field.translatable && (
                            <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                              Translatable
                            </span>
                          )}
                          {field.print_hide && (
                            <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100">
                              Print Hide
                            </span>
                          )}
                          {field.report_hide && (
                            <span className="text-[9px] font-extrabold bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100">
                              Report Hide
                            </span>
                          )}
                          {field.in_list_view && (
                            <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                              In List View
                            </span>
                          )}
                          {field.in_list_filter && (
                            <span className="text-[9px] font-extrabold bg-violet-50 text-violet-700 px-2 py-0.5 rounded border border-violet-100">
                              In List Filter
                            </span>
                          )}
                          {field.in_preview && (
                            <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                              In Preview
                            </span>
                          )}
                          {field.sticky && (
                            <span className="text-[9px] font-extrabold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded border border-cyan-100">
                              Sticky
                            </span>
                          )}
                          {field.in_filter && (
                            <span className="text-[9px] font-extrabold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">
                              In Filter
                            </span>
                          )}
                          {field.in_global_search && (
                            <span className="text-[9px] font-extrabold bg-fuchsia-50 text-fuchsia-700 px-2 py-0.5 rounded border border-fuchsia-100">
                              In Global Search
                            </span>
                          )}
                          {field.read_only && (
                            <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                              Read Only
                            </span>
                          )}
                          {field.allow_on_submit && (
                            <span className="text-[9px] font-extrabold bg-lime-50 text-lime-700 px-2 py-0.5 rounded border border-lime-100">
                              Allow on Submit
                            </span>
                          )}
                          {field.perm_level !== undefined && field.perm_level > 0 ? (() => {
                            const matchingRole = roles.find(r => r.id === field.perm_level);
                            return (
                              <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                                Role Required: {matchingRole ? matchingRole.name : `ID ${field.perm_level}`}
                              </span>
                            );
                          })() : null}
                          {field.ignore_xss_filter && (
                            <span className="text-[9px] font-extrabold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200">
                              Ignore XSS
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit/Delete & Ordering Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-1 rounded-lg border border-indigo-100 mr-1" title="Order Index">
                          #{field.order_index || 0}
                        </span>
                        
                        <button
                          onClick={() => handleMoveField(field.id, 'up')}
                          className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
                          title="Move Field Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveField(field.id, 'down')}
                          className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
                          title="Move Field Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleEdit(field)}
                          className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
                          title="Modify Field Attributes"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(field.id);
                          }}
                          className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl text-rose-400 hover:text-rose-600 transition-all shadow-sm cursor-pointer"
                          title="Delete Custom Field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* LIVE LAYOUT PREVIEW (Shows exactly how the field renders) */}
                    <div className="bg-white border border-slate-200/50 rounded-xl p-3.5 space-y-1.5 shadow-inner">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                        Form Rendering Mockup Preview
                      </span>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          {field.field_label_en}
                          {field.is_required && <span className="text-rose-500">*</span>}
                        </label>
                        
                        {/* Rendering the appropriate mockup input */}
                        {(field.field_type === 'text' || field.field_type === 'Text' || field.field_type === 'Data' || field.field_type === 'Phone' || field.field_type === 'Link') && (
                          <input
                            disabled
                            type="text"
                            placeholder={field.field_type === 'Phone' ? "+1 (555) 000-0000" : field.field_type === 'Link' ? "https://example.com" : "Enter text..."}
                            className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none"
                          />
                        )}

                        {field.field_type === 'Autocomplete' && (
                          <div className="relative">
                            <input
                              disabled
                              type="text"
                              placeholder="Type to search suggestions..."
                              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none pr-8"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                          </div>
                        )}

                        {field.field_type === 'Attach' && (
                          <div className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/30 flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1.5 font-medium">
                              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                              Drag & drop or browse files
                            </span>
                            <span className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg font-bold border border-slate-200 cursor-not-allowed">
                              Choose File
                            </span>
                          </div>
                        )}

                        {field.field_type === 'Attach Image' && (
                          <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/30 flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                            <ImageIcon className="w-7 h-7 text-slate-300" />
                            <span className="font-semibold text-[10px]">Upload high-quality photo (.png, .jpg)</span>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold border border-slate-200">
                              Upload Image
                            </span>
                          </div>
                        )}

                        {field.field_type === 'Barcode' && (
                          <div className="relative">
                            <input
                              disabled
                              type="text"
                              placeholder="Scan or type barcode..."
                              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none pr-8 font-mono"
                            />
                            <QrCode className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                          </div>
                        )}

                        {field.field_type === 'Button' && (
                          <button
                            disabled
                            className="px-4 py-2 bg-indigo-50 border border-indigo-150 rounded-xl text-xs font-bold text-indigo-600 flex items-center gap-1.5 cursor-not-allowed"
                          >
                            <Play className="w-3 h-3 text-indigo-400" />
                            {field.field_label_en}
                          </button>
                        )}

                        {(field.field_type === 'Check' || field.field_type === 'checkbox') && (
                          <div className="flex items-center gap-2">
                            <input
                              disabled
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 bg-slate-50 cursor-not-allowed"
                            />
                            <span className="text-[11px] text-slate-400 font-bold">Checkbox state selector</span>
                          </div>
                        )}

                        {field.field_type === 'Code' && (
                          <div className="font-mono text-[10px] bg-slate-900 text-slate-300 rounded-xl p-3 border border-slate-950 space-y-1">
                            <div className="flex justify-between text-[8px] text-slate-500 pb-1.5 border-b border-slate-800">
                              <span>SOURCE CODE</span>
                              <span>TSX</span>
                            </div>
                            <span className="text-emerald-400">const</span> customField = <span className="text-indigo-300">"ERPNext Style Code"</span>;
                          </div>
                        )}

                        {field.field_type === 'Color' && (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 border border-white shadow-sm shrink-0" />
                            <input
                              disabled
                              type="text"
                              value="#6366F1"
                              className="w-24 p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-center font-mono text-[10px] text-slate-400 outline-none"
                            />
                            <Palette className="w-4 h-4 text-slate-300" />
                          </div>
                        )}

                        {field.field_type === 'Column Break' && (
                          <div className="border border-dashed border-indigo-150 rounded-xl p-2 bg-indigo-50/20 text-center text-[9px] font-bold text-indigo-600 flex items-center justify-center gap-1.5">
                            <Columns className="w-3.5 h-3.5" />
                            <span>[ Column Break - Side-by-Side Form Splitter ]</span>
                          </div>
                        )}

                        {(field.field_type === 'Currency' || field.field_type === 'Float' || field.field_type === 'Int' || field.field_type === 'number' || field.field_type === 'Percent') && (
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                              {field.field_type === 'Currency' ? 'SAR' : field.field_type === 'Percent' ? '%' : '#'}
                            </span>
                            <input
                              disabled
                              type="text"
                              placeholder="0.00"
                              className="w-full pl-12 pr-4 p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none"
                            />
                          </div>
                        )}

                        {(field.field_type === 'Date' || field.field_type === 'date') && (
                          <div className="relative">
                            <input
                              disabled
                              type="text"
                              placeholder="YYYY-MM-DD"
                              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none pr-8"
                            />
                            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                          </div>
                        )}

                        {field.field_type === 'Datetime' && (
                          <div className="relative">
                            <input
                              disabled
                              type="text"
                              placeholder="YYYY-MM-DD HH:MM AM/PM"
                              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none pr-8"
                            />
                            <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                          </div>
                        )}

                        {field.field_type === 'Duration' && (
                          <div className="flex gap-2">
                            <input
                              disabled
                              type="text"
                              placeholder="e.g. 15"
                              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none"
                            />
                            <span className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 whitespace-nowrap">
                              hours / hours
                            </span>
                          </div>
                        )}

                        {field.field_type === 'Geolocation' && (
                          <div className="space-y-1 bg-slate-50/50 border border-slate-200 rounded-xl p-3">
                            <div className="flex gap-2 text-[10px] font-mono">
                              <span className="bg-white border border-slate-100 rounded px-1 text-slate-500">LAT: 24.7136° N</span>
                              <span className="bg-white border border-slate-100 rounded px-1 text-slate-500">LNG: 46.6753° E</span>
                            </div>
                            <span className="text-[9px] text-indigo-600 font-extrabold flex items-center gap-1 cursor-not-allowed">
                              <MapPin className="w-3 h-3" /> Detect coordinates from GPS
                            </span>
                          </div>
                        )}

                        {field.field_type === 'Heading' && (
                          <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1.5 mt-2">
                            <Type className="w-4 h-4 text-slate-400" />
                            {field.field_label_en}
                          </h4>
                        )}

                        {field.field_type === 'HTML' && (
                          <div className="border border-slate-100 bg-emerald-50/10 rounded-xl p-2.5 text-xs text-slate-400 font-mono">
                            <Code2 className="w-3.5 h-3.5 text-emerald-500 mb-1" />
                            &lt;div class="badge"&gt;HTML Custom Render&lt;/div&gt;
                          </div>
                        )}

                        {field.field_type === 'HTML Editor' && (
                          <div className="border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none overflow-hidden">
                            <div className="bg-slate-100 border-b border-slate-200 p-1 flex gap-1">
                              <span className="px-1.5 py-0.5 text-[10px] font-extrabold border border-slate-200 rounded bg-white">&lt;/&gt;</span>
                              <span className="px-1.5 py-0.5 text-[10px] font-bold">WYSIWYG Mode</span>
                            </div>
                            <div className="p-3 italic">Write formatted document...</div>
                          </div>
                        )}

                        {field.field_type === 'Icon' && (
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                              <Activity className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-bold text-slate-400">Activity symbol selected</span>
                          </div>
                        )}

                        {field.field_type === 'JSON' && (
                          <div className="font-mono text-[10px] bg-slate-900 text-emerald-400 rounded-xl p-2.5 border border-slate-950">
                            <Braces className="w-4 h-4 text-indigo-400 mb-1" />
                            &#123; "key": "value" &#125;
                          </div>
                        )}

                        {field.field_type === 'Long Text' && (
                          <textarea
                            disabled
                            placeholder="Enter description..."
                            className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none h-16 resize-none"
                          />
                        )}

                        {field.field_type === 'Markdown Editor' && (
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
                            <div className="bg-slate-100 border-b border-slate-200 px-2 py-1 flex gap-2 text-[10px] font-bold text-slate-500">
                              <span className="text-indigo-600 border-b border-indigo-600 px-1">Write Markdown</span>
                              <span>Live Preview</span>
                            </div>
                            <div className="p-3 font-mono text-[10px] text-slate-400"># Header 1<br/>* Bullet list item</div>
                          </div>
                        )}

                        {field.field_type === 'Password' && (
                          <div className="relative">
                            <input
                              disabled
                              type="password"
                              value="••••••••••••"
                              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none pr-8 font-mono"
                            />
                            <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                          </div>
                        )}

                        {field.field_type === 'Read Only' && (
                          <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 flex items-center gap-1.5 cursor-not-allowed">
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            [ Computed / Read-Only Automatic Value ]
                          </div>
                        )}

                        {field.field_type === 'Rating' && (
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
                            ))}
                            <span className="text-[10px] font-black text-amber-600 ml-1.5">5.0</span>
                          </div>
                        )}

                        {field.field_type === 'Section Break' && (
                          <div className="py-2 border-b-2 border-dashed border-slate-200 text-center text-[9px] font-black text-slate-400 flex items-center justify-center gap-1">
                            <Layout className="w-3.5 h-3.5 text-slate-300" />
                            <span>SECTION SEPARATOR</span>
                          </div>
                        )}

                        {(field.field_type === 'Select' || field.field_type === 'select') && (
                          <div className="relative">
                            <select
                              disabled
                              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none appearance-none"
                            >
                              <option>-- Select option --</option>
                              {field.options?.split(',').map((opt, idx) => (
                                <option key={idx}>{opt.trim()}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                          </div>
                        )}

                        {field.field_type === 'Signature' && (
                          <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/20 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-1.5">
                            <PenTool className="w-6 h-6 text-slate-300" />
                            <span className="text-[9px] font-bold">Draw signature inside digital pad frame</span>
                            <span className="text-[8px] text-indigo-500 font-extrabold cursor-not-allowed">CLEAR CANVAS</span>
                          </div>
                        )}

                        {field.field_type === 'Small Text' && (
                          <textarea
                            disabled
                            placeholder="Enter brief notes..."
                            className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none h-10 resize-none"
                          />
                        )}

                        {field.field_type === 'Tab Break' && (
                          <div className="flex gap-1 border-b border-slate-200">
                            <span className="px-3 py-1 bg-white border-x border-t border-slate-200 rounded-t-lg font-bold text-[10px] text-indigo-600">Active Tab</span>
                            <span className="px-3 py-1 text-slate-400 font-bold text-[10px]">Disabled Tab</span>
                          </div>
                        )}

                        {field.field_type === 'Table' && (
                          <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px] bg-white">
                            <div className="bg-slate-150 p-2 font-bold text-slate-600 border-b border-slate-200 flex justify-between">
                              <span>Dynamic Child Sub-Rows</span>
                              <span className="text-indigo-600">+ Add Row</span>
                            </div>
                            <div className="p-3 text-slate-400 italic text-center">No nested records added yet</div>
                          </div>
                        )}

                        {field.field_type === 'Table MultiSelect' && (
                          <div className="flex flex-wrap gap-1 p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                            {field.options?.split(',').slice(0,3).map((opt, idx) => (
                              <span key={idx} className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                                {opt.trim()} <X className="w-2.5 h-2.5 text-indigo-400" />
                              </span>
                            )) || <span className="text-slate-400">Select multiple options...</span>}
                          </div>
                        )}

                        {(field.field_type === 'relation' || field.field_type === 'Dynamic Link') && (
                          <div className="relative">
                            <div className="w-full p-2 border border-amber-200 rounded-xl bg-amber-50/30 text-xs text-slate-500 outline-none flex items-center justify-between">
                              <span className="flex items-center gap-1.5 font-bold text-amber-800">
                                <Link2 className="w-3.5 h-3.5 text-amber-500" />
                                Lookup relation: {TARGET_RELATION_TABLES.find(t => t.value === field.relation_target_table)?.label.split('/')[0].trim() || field.relation_target_table}
                              </span>
                              <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded">
                                DB Key: {field.relation_display_column}
                              </span>
                            </div>
                          </div>
                        )}

                        {field.field_type === 'Time' && (
                          <div className="relative">
                            <input
                              disabled
                              type="text"
                              placeholder="HH:MM"
                              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 outline-none pr-8"
                            />
                            <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmField && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center font-bold border border-rose-100 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Permanent Custom Field Removal
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-slate-800">
                Field: <span className="text-indigo-600 font-extrabold">{deleteConfirmField.field_label_en}</span> {deleteConfirmField.field_label_ar && `(/ ${deleteConfirmField.field_label_ar})`}
              </p>
              <p className="text-[11px] font-semibold text-rose-700 leading-relaxed">
                Are you sure you want to permanently delete this custom field? All stored values for this field will be removed and cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmField(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => executeDelete(deleteConfirmField.id, deleteConfirmField.field_label_en)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-rose-600/20 cursor-pointer flex items-center gap-2"
              >
                {deletingId !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ----------------------------------------------------
// LAZY AUTOCOMPLETE SELECT COMPONENT FOR LOOKUPS & MULTI-SELECT TAGS
// ----------------------------------------------------
interface LazyAutocompleteSelectProps {
  targetTable?: string;
  relationDisplayColumn?: string;
  entityType?: string; // for self-relation
  isSelf?: boolean;
  value: string; // "123" for single, or "12, 34, 56" for multiple
  onChange: (val: string) => void;
  multiple?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const LazyAutocompleteSelect: React.FC<LazyAutocompleteSelectProps> = ({
  targetTable,
  relationDisplayColumn = 'name',
  entityType,
  isSelf = false,
  value,
  onChange,
  multiple = false,
  placeholder = "Search and select...",
  required = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});

  // Parse current values
  const selectedIds = React.useMemo(() => {
    if (!value) return [];
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }, [value]);

  // Fetch initial labels for selected IDs on mount/value change
  useEffect(() => {
    const fetchLabels = async () => {
      if (selectedIds.length === 0) return;
      const newLabels = { ...selectedLabels };
      let updated = false;

      for (const id of selectedIds) {
        if (!newLabels[id]) {
          try {
            if (isSelf) {
              // Self relation labels
              const res = await fetch(`/api/hr/custom-fields/self-relation-data?entity_type=${encodeURIComponent(entityType || '')}&q=${id}`);
              if (res.ok) {
                const list = await res.json();
                const matched = list.find((item: any) => String(item.id) === String(id));
                if (matched) {
                  newLabels[id] = matched.display_value;
                  updated = true;
                } else {
                  newLabels[id] = `Record #${id}`;
                  updated = true;
                }
              }
            } else if (targetTable) {
              // Standard relation labels
              const res = await fetch(`/api/hr/custom-fields/relation-record/${targetTable}/${id}`);
              if (res.ok) {
                const record = await res.json();
                newLabels[id] = record[relationDisplayColumn] || `Record #${id}`;
                updated = true;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      if (updated) {
        setSelectedLabels(newLabels);
      }
    };
    fetchLabels();
  }, [value, isSelf, targetTable, relationDisplayColumn, entityType]);

  // Load options dynamically based on search & page
  const loadOptions = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const nextPage = reset ? 1 : page;
    
    try {
      let url = "";
      if (isSelf) {
        url = `/api/hr/custom-fields/self-relation-data?entity_type=${encodeURIComponent(entityType || '')}&q=${encodeURIComponent(search)}`;
      } else if (targetTable) {
        url = `/api/hr/custom-fields/relation-data/${targetTable}?display_column=${relationDisplayColumn}&q=${encodeURIComponent(search)}&page=${nextPage}&limit=15`;
      }

      if (url) {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (reset) {
            setOptions(data);
            setPage(2);
            setHasMore(data.length >= 15);
          } else {
            setOptions(prev => {
              const existingIds = new Set(prev.map(item => String(item.id)));
              const filteredNew = data.filter((item: any) => !existingIds.has(String(item.id)));
              return [...prev, ...filteredNew];
            });
            setPage(nextPage + 1);
            setHasMore(data.length >= 15);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load autocomplete options", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search option reload
  useEffect(() => {
    if (isOpen) {
      loadOptions(true);
    }
  }, [search, isOpen]);

  // Handle scrolling of options drop list
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (hasMore && !loading && target.scrollHeight - target.scrollTop <= target.clientHeight + 30) {
      loadOptions(false);
    }
  };

  const toggleSelect = (id: string, label: string) => {
    setSelectedLabels(prev => ({ ...prev, [id]: label }));

    if (multiple) {
      let nextIds = [...selectedIds];
      if (nextIds.includes(id)) {
        nextIds = nextIds.filter(x => x !== id);
      } else {
        nextIds.push(id);
      }
      onChange(nextIds.join(', '));
    } else {
      onChange(id);
      setIsOpen(false);
    }
  };

  const removeId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIds = selectedIds.filter(x => x !== id);
    onChange(nextIds.join(', '));
  };

  return (
    <div className="relative w-full text-slate-700">
      {/* Search Input Box / Selection summary */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full min-h-[38px] px-3 py-1.5 border rounded-xl flex flex-wrap items-center gap-1.5 transition-all shadow-sm",
          disabled 
            ? "bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400" 
            : "bg-white border-slate-250 cursor-pointer hover:border-slate-350 focus-within:ring-2 focus-within:ring-indigo-500/10"
        )}
      >
        {selectedIds.length === 0 && (
          <span className="text-xs text-slate-400 font-bold select-none">{placeholder}</span>
        )}

        {/* Selected Tags */}
        {selectedIds.map(id => (
          <span 
            key={id} 
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border",
              disabled 
                ? "bg-slate-200 text-slate-500 border-slate-300"
                : "bg-indigo-50/70 text-indigo-700 border-indigo-100/60"
            )}
          >
            {selectedLabels[id] || `ID: ${id}`}
            {!disabled && (
              <button 
                type="button"
                onClick={(e) => removeId(id, e)}
                className="text-indigo-400 hover:text-indigo-600 rounded p-0.5 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        ))}

        <div className="ml-auto flex items-center gap-1 shrink-0">
          {loading && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Floating Options Dropdown */}
      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-[200px] flex flex-col">
            {/* Embedded Search input */}
            <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
              <Search className="w-3 h-3 text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type to filter..."
                className="w-full bg-transparent border-none text-[11px] font-bold outline-none placeholder:text-slate-400 text-slate-700"
                autoFocus
              />
            </div>

            {/* Scrollable list */}
            <div 
              onScroll={handleScroll}
              className="overflow-y-auto divide-y divide-slate-50"
            >
              {options.length === 0 ? (
                <div className="p-4 text-center text-[10px] text-slate-400 font-bold">
                  {loading ? "Searching..." : "No matches found"}
                </div>
              ) : (
                options.map(opt => {
                  const optId = String(opt.id);
                  const isSelected = selectedIds.includes(optId);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => toggleSelect(optId, opt.display_value)}
                      className={cn(
                        "px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-600 cursor-pointer transition-all flex items-center justify-between",
                        isSelected && "bg-indigo-50 text-indigo-700"
                      )}
                    >
                      <span>{opt.display_value}</span>
                      <span className="text-[9px] text-slate-400 font-mono">#{opt.id}</span>
                    </div>
                  );
                })
              )}

              {loading && options.length > 0 && (
                <div className="p-2 text-center text-[10px] text-indigo-500 font-bold animate-pulse">
                  Loading more...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};


// ----------------------------------------------------
// HELPER COMPONENTS FOR RICH DYNAMIC FIELDS (SIGNATURE, CHILD TABLES, MULTISELECT)
// ----------------------------------------------------
interface SignaturePadProps {
  value: string;
  onChange: (val: string) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ value, onChange }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    // If we have an existing value, draw it
    if (value && value.startsWith('data:image')) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    } else if (!value) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange('');
  };

  return (
    <div className="space-y-1.5">
      <div className="border border-slate-200 bg-white rounded-xl overflow-hidden relative h-28 cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={400}
          height={112}
          className="w-full h-full block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <button
          type="button"
          onClick={clear}
          className="absolute bottom-2 right-2 text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-bold"
        >
          Clear Pad
        </button>
      </div>
    </div>
  );
};

interface TableFieldProps {
  value: string;
  onChange: (val: string) => void;
}

const TableField: React.FC<TableFieldProps> = ({ value, onChange }) => {
  const rows = React.useMemo(() => {
    try {
      return value ? JSON.parse(value) : [];
    } catch(e) {
      return [];
    }
  }, [value]);

  const updateRow = (index: number, key: string, val: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [key]: val };
    onChange(JSON.stringify(updated));
  };

  const addRow = () => {
    const updated = [...rows, { item: '', value: '' }];
    onChange(JSON.stringify(updated));
  };

  const removeRow = (index: number) => {
    const updated = rows.filter((_: any, i: number) => i !== index);
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
            <th className="p-2 border-r border-slate-200">Attribute/Key</th>
            <th className="p-2">Value</th>
            <th className="p-2 w-10 text-center"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-slate-100 last:border-none">
              <td className="p-1 border-r border-slate-200">
                <input
                  type="text"
                  value={row.item || ''}
                  onChange={e => updateRow(idx, 'item', e.target.value)}
                  placeholder="e.g. Key"
                  className="w-full p-1 bg-transparent text-xs font-semibold outline-none border-none focus:bg-indigo-50/30 rounded"
                />
              </td>
              <td className="p-1">
                <input
                  type="text"
                  value={row.value || ''}
                  onChange={e => updateRow(idx, 'value', e.target.value)}
                  placeholder="e.g. Value"
                  className="w-full p-1 bg-transparent text-xs font-semibold outline-none border-none focus:bg-indigo-50/30 rounded"
                />
              </td>
              <td className="p-1 text-center">
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="p-3 text-center text-slate-400 italic text-[11px]">
                No table rows added yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="bg-slate-50 p-2 border-t border-slate-150 flex justify-end">
        <button
          type="button"
          onClick={addRow}
          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg border border-indigo-150 flex items-center gap-1 transition"
        >
          <Plus className="w-3 h-3" /> Add Row
        </button>
      </div>
    </div>
  );
};

interface TableMultiSelectFieldProps {
  options: string;
  value: string;
  onChange: (val: string) => void;
}

const TableMultiSelectField: React.FC<TableMultiSelectFieldProps> = ({ options, value, onChange }) => {
  const allOpts = React.useMemo(() => {
    return (options || '').split(',').map((o: string) => o.trim()).filter(Boolean);
  }, [options]);

  const selected = React.useMemo(() => {
    return (value || '').split(',').map((o: string) => o.trim()).filter(Boolean);
  }, [value]);

  const toggleOption = (opt: string) => {
    let next: string[];
    if (selected.includes(opt)) {
      next = selected.filter(x => x !== opt);
    } else {
      next = [...selected, opt];
    }
    onChange(next.join(', '));
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2.5 border border-slate-200 rounded-xl bg-slate-50/30">
      {allOpts.map((opt: string) => {
        const isSel = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggleOption(opt)}
            className={cn(
              "px-3 py-1 text-[10px] font-black rounded-full border transition-all flex items-center gap-1 cursor-pointer",
              isSel
                ? "bg-indigo-100 text-indigo-700 border-indigo-200/80 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {opt}
            {isSel && <Check className="w-3 h-3 text-indigo-500" />}
          </button>
        );
      })}
      {allOpts.length === 0 && (
        <span className="text-slate-400 italic text-[11px]">No options configured for multi-selection.</span>
      )}
    </div>
  );
};


// ----------------------------------------------------
// 2. REUSABLE FORM FILLER COMPONENT
// ----------------------------------------------------
interface CustomFieldsFormProps {
  entityType: string;
  entityId: number | null; // Null if creating new, Number if editing
  onChange?: (values: Record<number, string>) => void;
  // This callback exposes values to host component, helpful if they submit together
}

export const CustomFieldsForm: React.FC<CustomFieldsFormProps> = ({ entityType, entityId, onChange }) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<number, string>>({});
  const [relationOptions, setRelationOptions] = useState<Record<number, Array<{ id: number, display_value: string }>>>({});
  const [loading, setLoading] = useState(false);
  const [selectedTabKey, setSelectedTabKey] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [quickEntryMode, setQuickEntryMode] = useState(false);
  const [showHiddenFields, setShowHiddenFields] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  const { tabbedFields, tabLabels, tabKeys } = React.useMemo(() => {
    let currentTabId = 'pre-tab';
    const grouped: Record<string, CustomField[]> = { 'pre-tab': [] };
    const labels: Record<string, { en: string, ar?: string }> = { 'pre-tab': { en: 'General' } };

    fields.forEach(f => {
      const typeLower = (f.field_type || '').toLowerCase();
      const isFormTab = typeLower === 'form_tab' || typeLower === 'tab break' || typeLower === 'tabbreak' || f.field_name.startsWith('layout_form_tab') || f.field_name.startsWith('layout_tab_break');
      if (isFormTab) {
        currentTabId = String(f.id);
        grouped[currentTabId] = [];
        labels[currentTabId] = { en: f.field_label_en, ar: f.field_label_ar };
      } else {
        grouped[currentTabId].push(f);
      }
    });

    if (grouped['pre-tab'].length === 0) {
      delete grouped['pre-tab'];
      delete labels['pre-tab'];
    }

    const keys = Object.keys(grouped);
    return { tabbedFields: grouped, tabLabels: labels, tabKeys: keys };
  }, [fields]);

  useEffect(() => {
    if (tabKeys.length > 0 && !tabKeys.includes(selectedTabKey)) {
      setSelectedTabKey(tabKeys[0]);
    }
  }, [tabKeys, selectedTabKey]);

  const fieldsToRender = React.useMemo(() => {
    const rawList = tabKeys.length > 0 ? (tabbedFields[selectedTabKey] || []) : fields;
    return rawList.filter(f => {
      const typeLower = (f.field_type || '').toLowerCase();
      const isLayout = typeLower.includes('break') || typeLower.includes('heading') || f.field_name.startsWith('layout_');
      if (isLayout) return true;

      // 1. Hidden check
      if (f.hidden && !showHiddenFields) return false;

      // 2. Quick entry check
      if (quickEntryMode && !f.allow_in_quick_entry) return false;

      return true;
    });
  }, [tabKeys, tabbedFields, selectedTabKey, fields, showHiddenFields, quickEntryMode]);

  useEffect(() => {
    const loadFieldsAndData = async () => {
      setLoading(true);
      try {
        // 1. Fetch custom fields for this form
        const fieldsRes = await fetch(`/api/hr/custom-fields?entity_type=${entityType}`);
        if (!fieldsRes.ok) return;
        const fieldsData: CustomField[] = await fieldsRes.json();
        setFields(fieldsData);

        // 2. If editing (entityId provided), load existing values
        let existingVals: Record<number, string> = {};
        if (entityId) {
          const valsRes = await fetch(`/api/hr/custom-fields/values?entity_type=${entityType}&entity_id=${entityId}`);
          if (valsRes.ok) {
            const valsData = await valsRes.json();
            valsData.forEach((v: any) => {
              existingVals[v.field_id] = v.value || '';
            });
          }
        }
        
        // Initialize values state
        const initialVals: Record<number, string> = {};
        fieldsData.forEach(f => {
          initialVals[f.id] = existingVals[f.id] !== undefined ? existingVals[f.id] : '';
        });
        setValues(initialVals);
        if (onChange) onChange(initialVals);

        // 3. For any relation field, fetch lookup options
        const optionsMap: Record<number, any[]> = {};
        for (const f of fieldsData) {
          if (f.field_type === 'relation' && f.relation_target_table) {
            try {
              const relRes = await fetch(`/api/hr/custom-fields/relation-data/${f.relation_target_table}?display_column=${f.relation_display_column || 'name'}`);
              if (relRes.ok) {
                optionsMap[f.id] = await relRes.json();
              }
            } catch (err) {
              console.error(`Failed to load relation options for field ${f.field_name}:`, err);
            }
          }
        }
        setRelationOptions(optionsMap);

        // Fetch roles for permissions mapping
        try {
          const rolesRes = await fetch('/api/hr/permissions/roles');
          if (rolesRes.ok) {
            const ct = rolesRes.headers.get("content-type");
            if (ct && ct.includes("application/json")) {
              const data = await rolesRes.json();
              if (Array.isArray(data)) {
                setRoles(data);
              }
            }
          }
        } catch (err) {
          console.warn("Could not load roles inside CustomFieldsForm:", err);
        }

      } catch (err) {
        console.error("Error loading custom fields:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFieldsAndData();
  }, [entityType, entityId]);

  const handleFieldChange = async (fieldId: number, val: string) => {
    const updated = { ...values, [fieldId]: val };
    
    // Find if there are any dependent pull fields in the form
    const changedField = fields.find(f => f.id === fieldId);
    if (changedField) {
      const dependentPulls = fields.filter(f => f.field_type === 'pull' && f.relation_target_table === changedField.field_name);
      
      for (const pullField of dependentPulls) {
        if (!val) {
          updated[pullField.id] = '';
        } else {
          try {
            const isSelfRel = changedField.field_type === 'relation_self';
            const targetTable = isSelfRel ? '_self' : changedField.relation_target_table;
            
            let res;
            if (targetTable === '_self') {
              res = await fetch(`/api/hr/custom-fields/self-relation-data?entity_type=${encodeURIComponent(entityType)}&q=${val}`);
            } else if (targetTable) {
              res = await fetch(`/api/hr/custom-fields/relation-record/${targetTable}/${val}`);
            }

            if (res && res.ok) {
              const data = await res.json();
              let pulledValue = '';
              if (targetTable === '_self') {
                const matched = Array.isArray(data) ? data.find((item: any) => String(item.id) === String(val)) : null;
                pulledValue = matched ? matched.display_value : '';
              } else {
                pulledValue = data[pullField.relation_display_column || ''] || '';
              }
              updated[pullField.id] = String(pulledValue);
            }
          } catch (e) {
            console.error("Failed to pull dependent value:", e);
          }
        }
      }
    }

    setValues(updated);
    if (onChange) onChange(updated);
  };

  // If there are no fields, don't show anything
  if (loading) return <div className="text-slate-400 text-xs font-bold py-2 animate-pulse">Loading custom attributes...</div>;
  if (fields.length === 0) return null;

  return (
    <div className="bg-slate-50/40 p-5 rounded-2xl border border-slate-200/50 space-y-4 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-slate-800">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-black uppercase tracking-wider">Dynamic Fields</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={quickEntryMode}
              onChange={e => setQuickEntryMode(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/10"
            />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Quick Entry</span>
          </label>
          {fields.some(f => f.hidden) && (
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showHiddenFields}
                onChange={e => setShowHiddenFields(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500/10"
              />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Show Hidden</span>
            </label>
          )}
        </div>
      </div>

      {tabKeys.length > 1 && (
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl mb-4 w-full border border-slate-200">
          {tabKeys.map(key => {
            const isSelected = selectedTabKey === key;
            const label = tabLabels[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTabKey(key)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex-1 md:flex-none text-center",
                  isSelected
                    ? "bg-white text-violet-700 shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                )}
              >
                <span>{label.en}</span>
                {label.ar && label.ar !== label.en && <span className="text-[10px] opacity-70 block sm:inline sm:ml-1 font-normal font-sans">({label.ar})</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldsToRender.map(field => {
          const val = values[field.id] || '';
          
          const typeLower = (field.field_type || '').toLowerCase();
          const isSectionBreak = typeLower === 'section_break' || typeLower === 'section break' || typeLower === 'heading' || field.field_name.startsWith('layout_section_break');
          const isColumnBreak = typeLower === 'column_break' || typeLower === 'column break' || typeLower === 'empty_column' || typeLower === 'empty column' || field.field_name.startsWith('layout_column_break') || field.field_name.startsWith('layout_empty_column') || typeLower === 'fold';
          
          if (isSectionBreak) {
            return (
              <div key={field.id} className="col-span-1 md:col-span-2 pt-4 pb-1 border-b border-indigo-100 mb-2">
                <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  {field.field_label_en} / {field.field_label_ar}
                </span>
              </div>
            );
          }

          if (isColumnBreak) {
            return (
              <div key={field.id} className="hidden md:block" />
            );
          }

          // Helper style classes
          const baseInputClass = "w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm";
          const inputClassName = cn(
            baseInputClass, 
            field.bold && "font-black text-indigo-950 bg-indigo-50/10 border-indigo-300 shadow-md", 
            field.read_only && "bg-slate-100 cursor-not-allowed text-slate-400 border-slate-200 shadow-none"
          );
          const baseNumberInputClass = "w-full py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm";
          const numberInputClassName = cn(
            baseNumberInputClass, 
            field.bold && "font-black text-indigo-950 bg-indigo-50/10 border-indigo-300 shadow-md", 
            field.read_only && "bg-slate-100 cursor-not-allowed text-slate-400 border-slate-200 shadow-none",
            typeLower === 'currency' ? "pl-12 pr-4" : typeLower === 'percent' ? "pl-4 pr-10" : "px-4"
          );

          return (
            <div 
              key={field.id} 
              className={cn(
                "space-y-1.5 transition-all duration-200", 
                (typeLower === 'longtext' || typeLower === 'long text' || typeLower === 'relation_m2m' || typeLower === 'table' || typeLower === 'table multiselect' || typeLower === 'table_multiselect') && "md:col-span-2",
                field.sticky && "sticky top-[60px] bg-slate-50/95 backdrop-blur-xs border border-indigo-200/60 z-10 p-3 shadow-md rounded-2xl md:col-span-2"
              )}
            >
              <label className={cn("text-[10px] uppercase tracking-wider flex items-center justify-between gap-1 flex-wrap", field.bold ? "text-indigo-900 font-extrabold pb-0.5 border-b border-indigo-100/50" : "text-slate-500 font-black")}>
                <span className="flex items-center gap-1.5 flex-wrap">
                  {field.field_label_en} 
                  {field.is_required && <span className="text-rose-500">*</span>}
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-150/70 text-slate-500 rounded lowercase">({field.field_type})</span>
                  
                  {/* Visual feature badges */}
                  {field.translatable && <span className="text-[10px] cursor-help" title="Translatable Field">🌐</span>}
                  {field.print_hide && <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-100/60 px-1.5 py-0.2 rounded font-black uppercase tracking-wider" title="Hidden from Print layouts">Print Hide</span>}
                  {field.report_hide && <span className="text-[8px] bg-orange-50 text-orange-700 border border-orange-100/60 px-1.5 py-0.2 rounded font-black uppercase tracking-wider" title="Hidden from reports">Report Hide</span>}
                  {field.perm_level !== undefined && field.perm_level > 0 && (() => {
                    const matchingRole = roles.find(r => r.id === field.perm_level);
                    return (
                      <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shrink-0" title="Permission Role Required">
                        <Lock className="w-2.5 h-2.5" /> Role: {matchingRole ? matchingRole.name : `ID ${field.perm_level}`}
                      </span>
                    );
                  })()}
                </span>
                <span className="text-right text-slate-400 font-bold">{field.field_label_ar}</span>
              </label>

              {(typeLower === 'text' || typeLower === 'data' || typeLower === 'phone' || typeLower === 'link' || typeLower === 'barcode' || typeLower === 'duration') && (
                <input
                  required={field.is_required}
                  disabled={field.read_only}
                  type="text"
                  value={val}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  className={inputClassName}
                  placeholder={
                    typeLower === 'phone' ? '+1 (555) 000-0000' :
                    typeLower === 'link' ? 'https://example.com' :
                    typeLower === 'barcode' ? 'Scan or enter barcode...' :
                    typeLower === 'duration' ? 'e.g. 5 days' :
                    'Enter text...'
                  }
                />
              )}

              {(typeLower === 'longtext' || typeLower === 'long text' || typeLower === 'smalltext' || typeLower === 'small text' || typeLower === 'code' || typeLower === 'json' || typeLower === 'html editor' || typeLower === 'text editor' || typeLower === 'markdown editor') && (
                <textarea
                  required={field.is_required}
                  disabled={field.read_only}
                  rows={typeLower.includes('long') || typeLower.includes('editor') ? 4 : 2}
                  value={val}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  className={cn(
                    inputClassName,
                    (typeLower === 'code' || typeLower === 'json') && "font-mono bg-slate-900/5 border-slate-300 text-slate-850"
                  )}
                  placeholder={
                    typeLower === 'json' ? '{ "key": "value" }' :
                    typeLower === 'code' ? 'const code = () => {};' :
                    typeLower.includes('markdown') ? 'Write Markdown code here...' :
                    typeLower.includes('html') ? 'Write HTML tags here...' :
                    'Enter detailed notes...'
                  }
                />
              )}

              {(typeLower === 'number' || typeLower === 'int' || typeLower === 'currency' || typeLower === 'float' || typeLower === 'decimal' || typeLower === 'percent') && (
                <div className="relative">
                  {typeLower === 'currency' && <span className="absolute left-3.5 top-2.5 text-[10px] font-black text-slate-400 select-none">SAR</span>}
                  {typeLower === 'percent' && <span className="absolute right-3.5 top-2.5 text-[10px] font-black text-slate-400 select-none">%</span>}
                  <input
                    required={field.is_required}
                    disabled={field.read_only}
                    type="number"
                    step={typeLower === 'int' || typeLower === 'number' ? '1' : '0.01'}
                    value={val}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    className={numberInputClassName}
                    placeholder="0.00"
                  />
                </div>
              )}

              {(typeLower === 'date' || typeLower === 'datetime') && (
                <input
                  required={field.is_required}
                  disabled={field.read_only}
                  type={typeLower === 'datetime' ? 'datetime-local' : 'date'}
                  value={val}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  className={inputClassName}
                />
              )}

              {typeLower === 'time' && (
                <input
                  required={field.is_required}
                  disabled={field.read_only}
                  type="time"
                  value={val}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  className={inputClassName}
                />
              )}

              {typeLower === 'select' && (
                <select
                  required={field.is_required}
                  disabled={field.read_only}
                  value={val}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  className={inputClassName}
                >
                  <option value="">Select option...</option>
                  {(field.options || '').split(',').map(opt => {
                    const cleanOpt = opt.trim();
                    return <option key={cleanOpt} value={cleanOpt}>{cleanOpt}</option>;
                  })}
                </select>
              )}

              {typeLower === 'autocomplete' && (
                <div className="relative">
                  <input
                    required={field.is_required}
                    disabled={field.read_only}
                    type="text"
                    list={`datalist-${field.id}`}
                    value={val}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    className={inputClassName}
                    placeholder="Type to search suggestions..."
                  />
                  <datalist id={`datalist-${field.id}`}>
                    {(field.options || '').split(',').map(opt => (
                      <option key={opt.trim()} value={opt.trim()} />
                    ))}
                  </datalist>
                </div>
              )}

              {(typeLower === 'checkbox' || typeLower === 'check') && (
                <div className="flex items-center gap-3 py-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      required={field.is_required && !val}
                      checked={val === 'true' || val === 'yes'}
                      onChange={e => handleFieldChange(field.id, e.target.checked ? 'true' : 'false')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-600 select-none">
                    {val === 'true' || val === 'yes' ? 'Yes' : 'No'}
                  </span>
                </div>
              )}

              {(typeLower === 'file' || typeLower === 'attach' || typeLower === 'attach image') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        required={field.is_required}
                        type="text"
                        readOnly
                        value={val}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-default outline-none shadow-sm"
                        placeholder="No file attached"
                      />
                      <Paperclip className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <label className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 text-indigo-700 text-xs font-bold rounded-xl cursor-pointer transition shadow-xs flex items-center gap-1 shrink-0">
                      <Plus className="w-3 h-3" /> Select File
                      <input
                        type="file"
                        accept={typeLower === 'attach image' ? 'image/*' : undefined}
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFieldChange(field.id, file.name);
                          }
                        }}
                      />
                    </label>
                    {val && (
                      <button
                        type="button"
                        onClick={() => handleFieldChange(field.id, '')}
                        className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 rounded-xl transition shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {val && typeLower === 'attach image' && (
                    <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-inner flex items-center justify-center text-[10px] text-slate-400 font-bold">
                      Image
                    </div>
                  )}
                </div>
              )}

              {(typeLower === 'relation' || typeLower === 'dynamic link' || typeLower === 'relation_o2m' || typeLower === 'relation_self') && (
                <LazyAutocompleteSelect
                  targetTable={typeLower === 'relation_self' ? undefined : (field.relation_target_table || undefined)}
                  relationDisplayColumn={field.relation_display_column || undefined}
                  entityType={typeLower === 'relation_self' ? entityType : undefined}
                  isSelf={typeLower === 'relation_self'}
                  value={val}
                  onChange={v => handleFieldChange(field.id, v)}
                  placeholder="Search and link related record..."
                  required={field.is_required}
                  disabled={field.read_only}
                />
              )}

              {typeLower === 'relation_m2m' && (
                <LazyAutocompleteSelect
                  targetTable={field.relation_target_table || undefined}
                  relationDisplayColumn={field.relation_display_column || undefined}
                  value={val}
                  onChange={v => handleFieldChange(field.id, v)}
                  multiple={true}
                  placeholder="Search and attach multiple tags..."
                  required={field.is_required}
                  disabled={field.read_only}
                />
              )}

              {typeLower === 'pull' && (
                <div className="relative">
                  <input
                    disabled
                    type="text"
                    value={val}
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed outline-none"
                    placeholder="Will pull automatically from connection..."
                  />
                </div>
              )}

              {typeLower === 'button' && (
                <button
                  type="button"
                  onClick={() => alert(`Button "${field.field_label_en}" triggered.`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                  {field.field_label_en} / {field.field_label_ar}
                </button>
              )}

              {typeLower === 'color' && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={val || '#6366f1'}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-250 overflow-hidden cursor-pointer"
                  />
                  <input
                    type="text"
                    value={val}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    placeholder="#FFFFFF"
                    className="w-32 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono"
                  />
                </div>
              )}

              {typeLower === 'geolocation' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      required={field.is_required}
                      type="text"
                      value={val}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                      placeholder="Latitude, Longitude"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            pos => handleFieldChange(field.id, `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
                            () => alert("Unable to find location. Please type manually.")
                          );
                        } else {
                          alert("Geolocation not supported by browser.");
                        }
                      }}
                      className="px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-1 shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Detect
                    </button>
                  </div>
                </div>
              )}

              {typeLower === 'icon' && (
                <input
                  required={field.is_required}
                  type="text"
                  value={val}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  placeholder="e.g. Star, Calendar, Users..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm"
                />
              )}

              {typeLower === 'image' && (
                <div className="space-y-2">
                  <input
                    required={field.is_required}
                    type="text"
                    value={val}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm"
                  />
                  {val && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-w-xs shadow-inner">
                      <img src={val} alt="Custom Field Frame" referrerPolicy="no-referrer" className="w-full max-h-32 object-cover block" />
                    </div>
                  )}
                </div>
              )}

              {typeLower === 'password' && (
                <div className="relative">
                  <input
                    required={field.is_required}
                    type={showPasswords[field.id] ? 'text' : 'password'}
                    value={val}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all pr-10 font-mono"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(p => ({ ...p, [field.id]: !p[field.id] }))}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPasswords[field.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {(typeLower === 'read only' || typeLower === 'readonly') && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-500 select-all cursor-not-allowed">
                  {val || '[ System Auto-Generated / Read-Only ]'}
                </div>
              )}

              {typeLower === 'rating' && (
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map(starNum => {
                    const ratingVal = Number(val) || 0;
                    const isLit = starNum <= ratingVal;
                    return (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => handleFieldChange(field.id, String(starNum))}
                        className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star className={cn("w-5 h-5", isLit ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                      </button>
                    );
                  })}
                  <span className="text-[11px] font-black text-amber-600 ml-1">({val || '0'}.0)</span>
                </div>
              )}

              {typeLower === 'signature' && (
                <SignaturePad value={val} onChange={sigUrl => handleFieldChange(field.id, sigUrl)} />
              )}

              {typeLower === 'table' && (
                <TableField value={val} onChange={tblJson => handleFieldChange(field.id, tblJson)} />
              )}

              {(typeLower === 'table multiselect' || typeLower === 'table_multiselect') && (
                <TableMultiSelectField options={field.options || ''} value={val} onChange={tblSel => handleFieldChange(field.id, tblSel)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


// Helper function to submit custom field values (can be called by any form handler)
export const saveCustomFieldValues = async (entityId: number, values: Record<number, string>, entityType?: string) => {
  try {
    await fetch('/api/hr/custom-fields/values', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: entityId, values })
    });
    if (typeof (window as any).invalidateCustomFieldsCache === 'function') {
      (window as any).invalidateCustomFieldsCache(entityType);
    }
  } catch (err) {
    console.error("Failed to save custom field values:", err);
  }
};


// ----------------------------------------------------
// 3. REUSABLE DATA DISCOVERY/DISPLAY VIEW COMPONENT
// ----------------------------------------------------
interface CustomFieldsDisplayProps {
  entityType: string;
  entityId: number;
}

export const CustomFieldsDisplay: React.FC<CustomFieldsDisplayProps> = ({ entityType, entityId }) => {
  const [data, setData] = useState<Array<{ field: CustomField, value: string, lookupValue?: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchValues = async () => {
      setLoading(true);
      try {
        // Fetch fields
        const fieldsRes = await fetch(`/api/hr/custom-fields?entity_type=${entityType}`);
        if (!fieldsRes.ok) return;
        const fields: CustomField[] = await fieldsRes.json();

        // Fetch values
        const valuesRes = await fetch(`/api/hr/custom-fields/values?entity_type=${entityType}&entity_id=${entityId}`);
        if (!valuesRes.ok) return;
        const values = await valuesRes.json();

        const loadedData: typeof data = [];

        for (const f of fields) {
          const matchVal = values.find((v: any) => v.field_id === f.id);
          const rawVal = matchVal ? matchVal.value : '';
          
          if (rawVal) {
            let lookupValue = '';
            const typeLower = (f.field_type || '').toLowerCase();
            const isRelation = typeLower === 'relation' || typeLower === 'dynamic link' || typeLower === 'relation_o2m' || typeLower === 'relation_m2m' || typeLower === 'relation_self';
            if (isRelation && f.relation_target_table) {
              // Fetch single relation lookup text
              try {
                const relRes = await fetch(`/api/hr/custom-fields/relation-data/${f.relation_target_table}?display_column=${f.relation_display_column || 'name'}`);
                if (relRes.ok) {
                  const options: Array<{ id: number, display_value: string }> = await relRes.json();
                  const found = options.find(o => String(o.id) === String(rawVal));
                  lookupValue = found ? found.display_value : `ID: ${rawVal}`;
                }
              } catch (e) {
                lookupValue = `ID: ${rawVal}`;
              }
            }
            loadedData.push({ field: f, value: rawVal, lookupValue });
          }
        }
        setData(loadedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      fetchValues();
    }
  }, [entityType, entityId]);

  if (loading || data.length === 0) return null;

  return (
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2 mt-3 text-xs text-left">
      <div className="flex items-center gap-1.5 font-bold text-indigo-700 uppercase tracking-wider text-[10px] mb-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Additional Attributes</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {data.map(({ field, value, lookupValue }) => {
          const typeLower = (field.field_type || '').toLowerCase();
          
          return (
            <div 
              key={field.id} 
              className={cn(
                "bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm space-y-1.5",
                (typeLower === 'table' || typeLower === 'signature') && "sm:col-span-2 md:col-span-3"
              )}
            >
              <span className="text-[9px] text-slate-400 font-bold block leading-none">
                {field.field_label_en} / {field.field_label_ar}
              </span>
              <div className="font-extrabold text-slate-700 block text-[11px]">
                {(typeLower === 'relation' || typeLower === 'dynamic link' || typeLower === 'relation_o2m' || typeLower === 'relation_self' || typeLower === 'relation_m2m') ? (
                  <span className="text-indigo-600 flex items-center gap-0.5">
                    <Link2 className="w-3 h-3 text-indigo-400" />
                    {lookupValue || value}
                  </span>
                ) : (typeLower === 'date' || typeLower === 'datetime') ? (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {value}
                  </span>
                ) : (typeLower === 'checkbox' || typeLower === 'check') ? (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block",
                    (value === 'true' || value === 'yes') ? "bg-emerald-50 text-emerald-700 border border-emerald-150" : "bg-slate-100 text-slate-600 border border-slate-200"
                  )}>
                    {value === 'true' || value === 'yes' ? 'Yes' : 'No'}
                  </span>
                ) : typeLower === 'color' ? (
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-slate-200 block shadow-xs" 
                      style={{ backgroundColor: value }}
                    />
                    <span className="font-mono text-[10px] text-slate-600 uppercase">{value}</span>
                  </div>
                ) : typeLower === 'rating' ? (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => {
                      const active = s <= (Number(value) || 0);
                      return (
                        <Star 
                          key={s} 
                          className={cn("w-3 h-3", active ? "text-amber-400 fill-amber-400" : "text-slate-200")} 
                        />
                      );
                    })}
                    <span className="text-[9px] font-bold text-amber-600 ml-1">({value}.0)</span>
                  </div>
                ) : typeLower === 'signature' ? (
                  <div className="border border-slate-100 rounded-lg p-1 bg-slate-50/50 max-w-sm mt-1">
                    {value.startsWith('data:image') ? (
                      <img 
                        src={value} 
                        alt="Digital Signature" 
                        referrerPolicy="no-referrer" 
                        className="max-h-16 object-contain block bg-white border border-slate-150 rounded"
                      />
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">Signed: {value}</span>
                    )}
                  </div>
                ) : typeLower === 'image' || typeLower === 'attach image' ? (
                  <div className="mt-1 border border-slate-150 rounded-lg overflow-hidden max-w-[120px] bg-slate-50 shadow-inner">
                    <img 
                      src={value} 
                      alt="Thumbnail Preview" 
                      referrerPolicy="no-referrer" 
                      className="w-full h-16 object-cover block"
                      onError={(e) => {
                        // Fallback label if not actual URL
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="p-1 text-[9px] text-slate-500 font-mono block truncate text-center">{value}</span>
                  </div>
                ) : typeLower === 'link' ? (
                  <a 
                    href={value} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    {value} <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
                  </a>
                ) : typeLower === 'phone' ? (
                  <a href={`tel:${value}`} className="text-indigo-600 hover:underline">
                    {value}
                  </a>
                ) : typeLower === 'table' ? (
                  <div className="border border-slate-150 rounded-lg overflow-hidden bg-slate-50/20 text-[10px] mt-1.5 shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 font-black text-slate-500 uppercase tracking-wider text-[8px]">
                          <th className="p-1 border-r border-slate-150">Key</th>
                          <th className="p-1">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          try {
                            const parsed = JSON.parse(value);
                            if (Array.isArray(parsed)) {
                              return parsed.map((row: any, idx: number) => (
                                <tr key={idx} className="border-b border-slate-100 last:border-none">
                                  <td className="p-1 font-mono font-bold text-slate-500 border-r border-slate-150">{row.item || '-'}</td>
                                  <td className="p-1 font-bold text-slate-700">{row.value || '-'}</td>
                                </tr>
                              ));
                            }
                          } catch (e) {}
                          return (
                            <tr>
                              <td colSpan={2} className="p-1.5 text-center italic text-slate-400">Empty table data</td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <span className="break-all">{value}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ----------------------------------------------------
// 4. LIGHTWEIGHT PERSISTENT CACHED LIST RENDERER
// ----------------------------------------------------
const listFieldsCache: Record<string, {
  fields: CustomField[];
  values: Array<{ id: number; field_id: number; entity_id: number; value: string }>;
  loading: boolean;
  subscribers: Array<() => void>;
}> = {};

export const invalidateCustomFieldsCache = (entityType?: string) => {
  const types = entityType ? [entityType] : Object.keys(listFieldsCache);
  types.forEach(async (type) => {
    if (!listFieldsCache[type]) {
      listFieldsCache[type] = {
        fields: [],
        values: [],
        loading: false,
        subscribers: []
      };
    }
    const cache = listFieldsCache[type];
    cache.loading = true;
    cache.subscribers.forEach(sub => sub());

    try {
      const [fRes, vRes] = await Promise.all([
        fetch(`/api/hr/custom-fields?entity_type=${type}`),
        fetch(`/api/hr/custom-fields/values?entity_type=${type}`)
      ]);

      if (fRes.ok && vRes.ok) {
        const fields: CustomField[] = await fRes.json();
        const values = await vRes.json();
        cache.fields = fields.filter(f => !!f.in_list_view && !f.hidden);
        cache.values = values;
      }
    } catch (err) {
      console.error(`Failed to refresh list-view custom fields cache for ${type}`, err);
    } finally {
      cache.loading = false;
      cache.subscribers.forEach(sub => sub());
    }
  });
};

// Bind to window for cross-module or global access
if (typeof window !== 'undefined') {
  (window as any).invalidateCustomFieldsCache = invalidateCustomFieldsCache;
}

export const CustomFieldsListDisplay: React.FC<{
  entityType: string;
  entityId: number;
  layout?: 'row' | 'badges';
}> = ({ entityType, entityId, layout = 'badges' }) => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    let active = true;
    if (!listFieldsCache[entityType]) {
      listFieldsCache[entityType] = {
        fields: [],
        values: [],
        loading: true,
        subscribers: []
      };

      const loadAll = async () => {
        try {
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${localStorage.getItem('systo_token') || ''}`,
            'x-user-id': '1'
          };
          const [fRes, vRes] = await Promise.all([
            fetch(`/api/hr/custom-fields?entity_type=${entityType}`, { headers }).catch(() => null),
            fetch(`/api/hr/custom-fields/values?entity_type=${entityType}`, { headers }).catch(() => null)
          ]);

          if (!active) return;

          if (fRes?.ok && vRes?.ok) {
            const fields: CustomField[] = await fRes.json().catch(() => []);
            const values = await vRes.json().catch(() => []);
            listFieldsCache[entityType].fields = Array.isArray(fields) ? fields.filter(f => !!f.in_list_view && !f.hidden) : [];
            listFieldsCache[entityType].values = Array.isArray(values) ? values : [];
          }
        } catch (err: any) {
          console.warn("Notice: could not prefetch list-view custom fields:", err?.message || err);
        } finally {
          if (active) {
            listFieldsCache[entityType].loading = false;
            listFieldsCache[entityType].subscribers.forEach(sub => sub());
          }
        }
      };

      loadAll();
    }

    const cacheEntry = listFieldsCache[entityType];
    const onUpdate = () => {
      if (active) forceUpdate(n => n + 1);
    };

    cacheEntry.subscribers.push(onUpdate);
    return () => {
      active = false;
      cacheEntry.subscribers = cacheEntry.subscribers.filter(sub => sub !== onUpdate);
    };
  }, [entityType]);

  const entry = listFieldsCache[entityType];
  if (!entry || entry.loading) return null;

  const fields = entry.fields;
  const values = entry.values;

  const matchingFields = fields.map(f => {
    const vMatch = values.find(v => Number(v.field_id) === Number(f.id) && Number(v.entity_id) === Number(entityId));
    return {
      field: f,
      value: vMatch ? vMatch.value : ''
    };
  }).filter(item => item.value !== undefined && item.value !== null && item.value !== '');

  if (matchingFields.length === 0) return null;

  if (layout === 'row') {
    return (
      <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 font-bold max-w-[200px] text-left mt-1">
        {matchingFields.map(({ field, value }) => (
          <div key={field.id} className="truncate flex items-center gap-1">
            <span className="text-indigo-600 shrink-0 font-extrabold">{field.field_label_en || field.field_name}:</span>
            <span className="text-slate-700 truncate font-black">{value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100">
      {matchingFields.map(({ field, value }) => {
        const typeLower = (field.field_type || '').toLowerCase();
        let displayValue = value;
        if (typeLower === 'checkbox' || typeLower === 'check') {
          displayValue = value === 'true' || value === 'yes' ? 'Yes' : 'No';
        }

        return (
          <div 
            key={field.id} 
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tight bg-indigo-50/40 border border-indigo-100/50 text-indigo-950 px-2 py-0.5 rounded-lg shadow-2xs"
            title={`${field.field_label_en} / ${field.field_label_ar}`}
          >
            <Sparkles className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
            <span className="text-indigo-700 font-extrabold">{field.field_label_en || field.field_name}:</span>
            <span className="text-slate-800">{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
};

