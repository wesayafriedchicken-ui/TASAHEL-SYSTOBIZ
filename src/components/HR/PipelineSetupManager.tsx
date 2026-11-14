import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Workflow, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Award, 
  Users,
  MessageSquarePlus,
  Eye,
  Sliders
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { PipelinePopupModal } from './PipelinePopupModal';

export interface PipelineStatus {
  id: number;
  company_id: number;
  module_key: string;
  name_en: string;
  name_ar: string;
  color: string;
  order_index: number;
  is_default: boolean;
  has_popup?: boolean;
  popup_config?: {
    title?: string;
    message?: string;
    checkbox_label?: string;
    button_label?: string;
    action_type?: string;
    action_target?: string;
  };
  created_at?: string;
}

const modulesList = [
  { 
    key: 'recruitment', 
    labelEn: 'Recruitment (Candidates)', 
    
    descEn: 'Configure stages of recruitment, from Applied to Hired',
    
    icon: Briefcase,
    color: 'text-emerald-600 bg-emerald-50'
  },
  { 
    key: 'leave_requests', 
    labelEn: 'Leave & Attendance', 
    
    descEn: 'Configure approval statuses for employee leave requests',
    
    icon: Calendar,
    color: 'text-amber-600 bg-amber-50'
  },
  { 
    key: 'payroll', 
    labelEn: 'Payroll Management', 
    
    descEn: 'Configure workflow statuses for payroll records',
    
    icon: DollarSign,
    color: 'text-indigo-600 bg-indigo-50'
  },
  { 
    key: 'performance', 
    labelEn: 'Performance Reviews', 
    
    descEn: 'Configure tracking stages of performance appraisals',
    
    icon: Award,
    color: 'text-purple-600 bg-purple-50'
  },
  { 
    key: 'directory', 
    labelEn: 'Employee Lifecycle', 
    
    descEn: 'Configure employee status (Active, Suspended, etc.)',
    
    icon: Users,
    color: 'text-blue-600 bg-blue-50'
  },
];

const PRESET_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#f43f5e', label: 'Rose' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#64748b', label: 'Slate' },
  { value: '#14b8a6', label: 'Teal' },
];

export const PipelineSetupManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string>('recruitment');
  const [pipelines, setPipelines] = useState<PipelineStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form States for Creation / Edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [nameEn, setNameEn] = useState<string>('');
  const [nameAr, setNameAr] = useState<string>('');
  const [color, setColor] = useState<string>('#3b82f6');
  const [orderIndex, setOrderIndex] = useState<number>(0);

  // Popup Trigger Configuration States
  const [hasPopup, setHasPopup] = useState<boolean>(false);
  const [popupTitle, setPopupTitle] = useState<string>('[Candidate Name] got the job!');
  const [popupMessage, setPopupMessage] = useState<string>('Add [Candidate Name] as a new employee now.');
  const [popupCheckboxLabel, setPopupCheckboxLabel] = useState<string>('Close this job opening and remove the public posting');
  const [popupButtonLabel, setPopupButtonLabel] = useState<string>('Add New Employee');
  const [popupActionType, setPopupActionType] = useState<string>('navigate_employee');
  const [popupActionTarget, setPopupActionTarget] = useState<string>('directory');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  const fetchPipelines = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/hr/pipelines?module_key=${selectedModule}`, {
        headers: {
          'x-user-id': currentUser?.id?.toString() || '1'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPipelines(data);
      } else {
        setError('Failed to load pipelines.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while fetching pipelines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
    // Reset form states when module changes
    resetForm();
  }, [selectedModule, currentUser]);

  const resetForm = () => {
    setEditingId(null);
    setNameEn('');
    setNameAr('');
    setColor('#3b82f6');
    setOrderIndex(pipelines.length > 0 ? Math.max(...pipelines.map(p => p.order_index)) + 1 : 1);
    setHasPopup(false);
    setPopupTitle('[Candidate Name] got the job!');
    setPopupMessage('Add [Candidate Name] as a new employee now.');
    setPopupCheckboxLabel('Close this job opening and remove the public posting');
    setPopupButtonLabel('Add New Employee');
    setPopupActionType('navigate_employee');
    setPopupActionTarget('directory');
  };

  const handleEdit = (item: PipelineStatus) => {
    setEditingId(item.id);
    setNameEn(item.name_en);
    setNameAr(item.name_ar);
    setColor(item.color || '#3b82f6');
    setOrderIndex(item.order_index);
    
    // Popup config
    setHasPopup(!!item.has_popup);
    const cfg = item.popup_config || {};
    setPopupTitle(cfg.title || '[Candidate Name] got the job!');
    setPopupMessage(cfg.message || 'Add [Candidate Name] as a new employee now.');
    setPopupCheckboxLabel(cfg.checkbox_label !== undefined ? cfg.checkbox_label : 'Close this job opening and remove the public posting');
    setPopupButtonLabel(cfg.button_label || 'Add New Employee');
    setPopupActionType(cfg.action_type || 'navigate_employee');
    setPopupActionTarget(cfg.action_target || 'directory');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nameEn || !nameAr) {
      setError('Please provide names in both English and Arabic.');
      return;
    }

    try {
      const bodyPayload = {
        module_key: selectedModule,
        name_en: nameEn,
        name_ar: nameAr,
        color,
        order_index: Number(orderIndex),
        has_popup: hasPopup,
        popup_config: {
          title: popupTitle,
          message: popupMessage,
          checkbox_label: popupCheckboxLabel,
          button_label: popupButtonLabel,
          action_type: popupActionType,
          action_target: popupActionTarget
        }
      };

      let res;
      if (editingId) {
        res = await fetch(`/api/hr/pipelines/${editingId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': currentUser?.id?.toString() || '1'
          },
          body: JSON.stringify(bodyPayload)
        });
      } else {
        res = await fetch('/api/hr/pipelines', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': currentUser?.id?.toString() || '1'
          },
          body: JSON.stringify(bodyPayload)
        });
      }

      if (res.ok) {
        setSuccess(editingId ? 'Pipeline updated successfully!' : 'Pipeline stage created successfully!');
        resetForm();
        fetchPipelines();
        // Clear message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to save pipeline status.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to communicate with database server.');
    }
  };

  const handleDelete = async (id: number) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/hr/pipelines/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser?.id?.toString() || '1'
        }
      });

      if (res.ok) {
        setSuccess('Pipeline status deleted successfully.');
        fetchPipelines();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete pipeline.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to communicate with server.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left text-xs text-slate-700">
      {/* Left Column: Module Selection */}
      <div className="lg:col-span-4 space-y-4 border-r border-slate-100 pr-4">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Workflow className="w-4 h-4 text-indigo-600" />
          HR Modules
        </h4>
        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-4">
          Select a module to customize its workflow pipeline states
        </p>

        <div className="space-y-2">
          {modulesList.map((m) => {
            const isSelected = selectedModule === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedModule(m.key)}
                className={cn(
                  "w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5",
                  isSelected 
                    ? "bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-50" 
                    : "bg-white border-slate-100 hover:bg-slate-50"
                )}
              >
                <div className={cn("p-2 rounded-xl shrink-0", m.color)}>
                  <m.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-900 text-[13px]">{m.labelEn}</span>
                    <span className="text-slate-500 font-bold text-[11px] font-sans mt-0.5" dir="rtl">{(m as any).labelAr || ''}</span>
                  </div>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed mt-1.5">
                    {m.descEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Manage Stages & Inputs */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex justify-between items-center bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Workflow Setup</span>
            <h3 className="text-base font-black text-slate-900 font-serif mt-1">
              {modulesList.find(m => m.key === selectedModule)?.labelEn}
            </h3>
            <p className="text-slate-500 text-[11px] font-medium mt-0.5" dir="rtl">
              {(modulesList.find(m => m.key === selectedModule) as any)?.labelAr || ''}
            </p>
          </div>
          <div className="p-2 bg-indigo-50 rounded-2xl">
            <Settings className="w-5 h-5 text-indigo-600 animate-spin-slow" />
          </div>
        </div>

        {/* Feedback alerts */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-rose-50 border border-rose-100 text-rose-700 p-3 px-4 rounded-xl font-bold flex items-center justify-between"
            >
              <span>{error}</span>
              <button onClick={() => setError('')} className="hover:text-rose-900"><X className="w-4 h-4" /></button>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 px-4 rounded-xl font-bold flex items-center justify-between"
            >
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="hover:text-emerald-900"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 space-y-5">
          <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1">
            <Plus className="w-4 h-4 text-emerald-600" />
            {editingId ? 'Edit Pipeline Stage' : 'Add New Pipeline Stage'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* English Label */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Stage Name (EN) *
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Under Review"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Arabic Label */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 text-right">
                Stage Name (Secondary)
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="e.g. Under Review"
                dir="rtl"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Order Index */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Sort Index
              </label>
              <input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
                placeholder="e.g. 1"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Color Hex Picker */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Pipeline Accent Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-transform shrink-0 border relative",
                      color === c.value ? "scale-110 ring-2 ring-indigo-500 ring-offset-2 border-indigo-600" : "hover:scale-105 border-slate-200"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  >
                    {color === c.value && (
                      <Check className="w-3 h-3 text-white absolute inset-0 m-auto font-black" />
                    )}
                  </button>
                ))}
                
                {/* Custom Color input */}
                <input 
                  type="color" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-6 p-0 rounded-md border border-slate-200 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Popup Trigger Configuration Section */}
          <div className="pt-4 border-t border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className={cn("p-2 rounded-xl transition-colors", hasPopup ? "bg-emerald-100 text-[#1E701E]" : "bg-slate-100 text-slate-400")}>
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-slate-800">
                    Enable Popup Notification on Stage Change (إظهار نافذة تفاعلية عند الانتقال لهذه المرحلة)
                  </h5>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Displays an interactive popup window (e.g. celebration / add employee prompt) when moving to this stage.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={hasPopup} 
                  onChange={(e) => setHasPopup(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E701E]"></div>
              </label>
            </div>

            {hasPopup && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                    Configure Stage Popup Content (محتوى وزر النافذة)
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#1E701E] border border-emerald-200 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#1E701E]" />
                    <span>Preview Popup (معاينة الشكل)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title Input */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Popup Title (عنوان النافذة)
                    </label>
                    <input
                      type="text"
                      value={popupTitle}
                      onChange={(e) => setPopupTitle(e.target.value)}
                      placeholder="e.g. [Candidate Name] got the job!"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                    <p className="text-[9px] text-slate-400 font-bold mt-1">
                      Tip: Use <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">[Candidate Name]</code> as a dynamic placeholder.
                    </p>
                  </div>

                  {/* Subtitle / Message Input */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Message / Subtitle (نص الرسالة الفرعي)
                    </label>
                    <input
                      type="text"
                      value={popupMessage}
                      onChange={(e) => setPopupMessage(e.target.value)}
                      placeholder="e.g. Add [Candidate Name] as a new employee now."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Checkbox Option Label */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Checkbox Option Label (نص خيار التحديد)
                    </label>
                    <input
                      type="text"
                      value={popupCheckboxLabel}
                      onChange={(e) => setPopupCheckboxLabel(e.target.value)}
                      placeholder="e.g. Close this job opening and remove the public posting"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  {/* Action Button Label */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Primary Button Label (نص زر الإجراء الرئيسية)
                    </label>
                    <input
                      type="text"
                      value={popupButtonLabel}
                      onChange={(e) => setPopupButtonLabel(e.target.value)}
                      placeholder="e.g. Add New Employee"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Action Type */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Target Action Type (نوع إكمال الإجراء)
                    </label>
                    <select
                      value={popupActionType}
                      onChange={(e) => setPopupActionType(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="navigate_employee">Add New Employee (إضافة موظف جديد ببيانات المرشح)</option>
                      <option value="navigate_module">Navigate to Module / Tab (التحويل لموديول أو تابه أخرى)</option>
                      <option value="link">Open Web Link / URL (فتح رابط خارجي أو داخلي)</option>
                      <option value="text_only">Informational Only (إشعار فقط - إغلاق النافذة)</option>
                    </select>
                  </div>

                  {/* Action Target Details */}
                  {popupActionType === 'navigate_module' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Target Module / Tab (الموديول الموجه إليه)
                      </label>
                      <select
                        value={popupActionTarget}
                        onChange={(e) => setPopupActionTarget(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      >
                        <option value="directory">Employee Directory (دليل الموظفين)</option>
                        <option value="recruitment">Recruitment & Jobs (التوظيف والوظائف)</option>
                        <option value="leave_requests">Leave & Attendance (الإجازات والحضور)</option>
                        <option value="payroll">Payroll Management (المرتبات)</option>
                        <option value="performance">Performance & OKRs (الأداء والتقييمات)</option>
                      </select>
                    </div>
                  )}

                  {popupActionType === 'link' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Target Link / URL (الرابط)
                      </label>
                      <input
                        type="text"
                        value={popupActionTarget}
                        onChange={(e) => setPopupActionTarget(e.target.value)}
                        placeholder="https://example.com or /hr/directory"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
            >
              {editingId ? 'Update Stage' : 'Create Stage'}
            </button>
          </div>
        </form>

        {/* Existing Stages List */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
            Configured Pipelines stages ({pipelines.length})
          </h4>

          {loading ? (
            <div className="py-8 text-center text-slate-400 font-medium">
              Loading current module pipeline...
            </div>
          ) : pipelines.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-3xl font-medium">
              No custom stages set. Default system fallback stages will apply.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {pipelines.map((p, index) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                    {/* Position Label & Info */}
                    <div className="flex items-center gap-4">
                      {/* Step index badge */}
                      <div 
                        className="w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center border shrink-0"
                        style={{ borderColor: p.color + '30', backgroundColor: p.color + '15', color: p.color }}
                      >
                        {p.order_index || (index + 1)}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-[13px]">{p.name_en}</span>
                          {p.is_default && (
                            <span className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                              System
                            </span>
                          )}
                          {p.has_popup && (
                            <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 flex items-center gap-1">
                              <MessageSquarePlus className="w-2.5 h-2.5 text-emerald-600" />
                              Popup Enabled
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-[11px] font-bold text-left" dir="rtl">{p.name_ar}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {/* Color Preview */}
                      <span 
                        className="w-2.5 h-2.5 rounded-full block border border-slate-200 shrink-0 mr-3"
                        style={{ backgroundColor: p.color }}
                      />

                      <button
                        type="button"
                        onClick={() => handleEdit(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit stage"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {deleteConfirmId === p.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 p-1 rounded-xl shrink-0">
                          <span className="text-[9px] font-black text-rose-700 uppercase px-1">Sure?</span>
                          <button
                            type="button"
                            onClick={() => {
                              handleDelete(p.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-1.5 py-0.5 bg-rose-600 text-white font-bold rounded text-[9px] hover:bg-rose-700"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 bg-slate-200 text-slate-700 font-bold rounded text-[9px] hover:bg-slate-300"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(p.id)}
                          className={cn(
                            "p-1.5 text-slate-400 hover:bg-rose-50 rounded-lg transition-colors",
                            p.is_default ? "hover:text-amber-600" : "hover:text-rose-600"
                          )}
                          title={p.is_default ? "Delete System Stage (Caution)" : "Delete Stage"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal for Stage Popup */}
      <PipelinePopupModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        candidateName="Marc"
        config={{
          title: popupTitle,
          message: popupMessage,
          checkbox_label: popupCheckboxLabel,
          button_label: popupButtonLabel,
          action_type: popupActionType,
          action_target: popupActionTarget
        }}
        onConfirmAction={(data) => {
          alert(`Preview Action Executed!\n- Close Job Opening: ${data.closeJobOpening}\n- Action Type: ${data.action_type}\n- Action Target: ${data.action_target}`);
          setShowPreviewModal(false);
        }}
      />
    </div>
  );
};
