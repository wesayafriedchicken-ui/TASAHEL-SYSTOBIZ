import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  X, 
  Check, 
  Sparkles, 
  Search, 
  Layers, 
  Tag, 
  AlertCircle,
  FolderPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface ActionOption {
  id?: number;
  action_name: string;
  category?: string;
  description?: string;
  auto_plan_type?: string;
}

interface ActionRequiredMultiSelectProps {
  value: string | string[];
  onChange: (actions: string[]) => void;
  onAutoPlanTypeChange?: (planType: string) => void;
  label?: string;
  disabled?: boolean;
}

const DEFAULT_PRESET_ACTIONS: ActionOption[] = [
  { action_name: 'Coaching Required', category: 'Training', auto_plan_type: 'Training Action', description: 'Agent requires targeted 1-on-1 coaching on policies and customer interaction standards.' },
  { action_name: 'Process & SOP Update', category: 'Quality', auto_plan_type: 'Quality Action', description: 'Standard operating procedure requires revisions and updated compliance checklists.' },
  { action_name: 'Policy Compliance Review', category: 'HR', auto_plan_type: 'HR Action', description: 'HR and managerial review of operational policy adherence and governance.' },
  { action_name: 'Refund & Credit Issued', category: 'Finance', auto_plan_type: 'Quality Action', description: 'Financial refund, voucher or wallet adjustment processed to reconcile customer dispute.' },
  { action_name: 'Customer Follow-up & Apology', category: 'Customer Care', auto_plan_type: 'Quality Action', description: 'Proactive outreach to re-engage the customer and ensure satisfaction containment.' },
  { action_name: 'Escalate to Department Lead', category: 'Management', auto_plan_type: 'Quality Action', description: 'Direct escalation to functional department leadership for root-cause elimination.' },
  { action_name: 'Knowledge Base Article Revision', category: 'Training', auto_plan_type: 'Training Action', description: 'Update internal knowledge base documentation, guides, and agent training manuals.' },
  { action_name: 'Technical Defect / Bug Fix', category: 'Engineering', auto_plan_type: 'Quality Action', description: 'Route incident to engineering for software defect resolution or bug fixing.' },
  { action_name: 'Disciplinary Action / Written Warning', category: 'HR', auto_plan_type: 'HR Action', description: 'Formal disciplinary notice or warning logged in employee HR file.' },
  { action_name: 'No Action Needed', category: 'General', auto_plan_type: 'Quality Action', description: 'Transaction met standards and closed without requiring remediation tasks.' }
];

export const ActionRequiredMultiSelect: React.FC<ActionRequiredMultiSelectProps> = ({
  value,
  onChange,
  onAutoPlanTypeChange,
  label = 'Action Required',
  disabled = false
}) => {
  const { checkPermission, previewRole, user } = useAuth();
  const isSuperAdmin = !previewRole && (user?.role_id === 1 || (user as any)?.is_super_admin || user?.role === 'Admin' || user?.role_name === 'Admin');
  const canAddNewAction = isSuperAdmin || 
    checkPermission('QA', 'custom:qa_add_new_action') || 
    checkPermission('QA', 'custom:add_new_action') || 
    checkPermission('QA', 'action:Transactions Audit:write') ||
    checkPermission('QA', 'write');

  // Parse incoming value into an array of string action names
  const selectedActions: string[] = React.useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // not JSON, fallback to comma split or single string
    }
    if (typeof value === 'string') {
      if (value.includes(',')) {
        return value.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [value.trim()].filter(Boolean);
    }
    return [];
  }, [value]);

  const [options, setOptions] = useState<ActionOption[]>(DEFAULT_PRESET_ACTIONS);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [newActionCategory, setNewActionCategory] = useState('Quality');
  const [newActionPlanType, setNewActionPlanType] = useState('Quality Action');
  const [savingNew, setSavingNew] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch presets from backend API on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch('/api/qa/action-options');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setOptions(data);
          }
        }
      } catch (err) {
        console.warn('Failed to load action options from API:', err);
      }
    };
    fetchOptions();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAction = (actionName: string) => {
    if (disabled) return;
    let next: string[];
    if (selectedActions.includes(actionName)) {
      next = selectedActions.filter(a => a !== actionName);
    } else {
      next = [...selectedActions, actionName];
      // Automatically advise Action Plan Category if matched
      const matchedOpt = options.find(o => o.action_name === actionName);
      if (matchedOpt && matchedOpt.auto_plan_type && onAutoPlanTypeChange) {
        onAutoPlanTypeChange(matchedOpt.auto_plan_type);
      }
    }
    onChange(next);
  };

  const removeAction = (actionName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedActions.filter(a => a !== actionName));
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionName.trim() || savingNew) return;

    const trimmed = newActionName.trim();
    setSavingNew(true);
    try {
      const res = await fetch('/api/qa/action-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_name: trimmed,
          category: newActionCategory,
          auto_plan_type: newActionPlanType,
          description: `Custom action: ${trimmed}`
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setOptions(prev => {
          if (prev.some(o => o.action_name.toLowerCase() === trimmed.toLowerCase())) return prev;
          return [...prev, saved];
        });
      } else {
        // Local fallback
        setOptions(prev => {
          if (prev.some(o => o.action_name.toLowerCase() === trimmed.toLowerCase())) return prev;
          return [...prev, { action_name: trimmed, category: newActionCategory, auto_plan_type: newActionPlanType }];
        });
      }

      // Add to selected list
      if (!selectedActions.includes(trimmed)) {
        onChange([...selectedActions, trimmed]);
      }
      if (onAutoPlanTypeChange) {
        onAutoPlanTypeChange(newActionPlanType);
      }

      setNewActionName('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create new action:', err);
      if (!selectedActions.includes(trimmed)) {
        onChange([...selectedActions, trimmed]);
      }
      setNewActionName('');
      setIsCreating(false);
    } finally {
      setSavingNew(false);
    }
  };

  const filteredOptions = options.filter(opt => 
    opt.action_name.toLowerCase().includes(search.toLowerCase()) ||
    (opt.category && opt.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-2 relative" ref={containerRef} id="action-required-multi-select-container">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-blue-600" />
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-semibold">(Multi-select enabled)</span>
        </label>
        
        {canAddNewAction && !disabled && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsOpen(true);
              setIsCreating(true);
            }}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add New Action</span>
          </button>
        )}
      </div>

      {/* Selected Actions Chips Container & Trigger */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`min-h-[44px] w-full bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-wrap items-center gap-1.5 cursor-pointer transition-all ${
          isOpen ? 'bg-white ring-2 ring-blue-500/20 border-blue-500 shadow-sm' : 'hover:bg-white hover:border-slate-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {selectedActions.length === 0 ? (
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between w-full px-2 py-0.5">
            <span>Select one or more actions required for this incident...</span>
            <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded">Dropdown</span>
          </div>
        ) : (
          selectedActions.map((action, idx) => {
            const opt = options.find(o => o.action_name === action);
            const category = opt?.category || 'Action';
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200/80 text-blue-900 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs animate-fadeIn"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span className="max-w-[200px] truncate">{action}</span>
                <span className="text-[9px] font-extrabold text-blue-600 uppercase bg-blue-100/60 px-1 py-0.2 rounded">
                  {category}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => removeAction(action, e)}
                    className="p-0.5 hover:bg-blue-200/60 rounded text-blue-700 hover:text-blue-900 transition-colors ml-0.5 cursor-pointer"
                    title="Remove action"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })
        )}
      </div>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn text-xs">
          
          {/* Header Search & Actions */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search preset actions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
              />
            </div>

            {/* Inline Creation Form toggle */}
            {!isCreating ? (
              <div className="flex items-center justify-between pt-0.5 px-1">
                <span className="text-[11px] font-semibold text-slate-500">
                  {selectedActions.length} of {options.length} actions selected
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Custom Action</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateNew} className="bg-blue-50/60 border border-blue-200 rounded-xl p-2.5 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                    <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                    <span>New Action Required</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Enter new action name (e.g. Supplier Escalation)..."
                    value={newActionName}
                    onChange={(e) => setNewActionName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Category</label>
                    <select
                      value={newActionCategory}
                      onChange={(e) => setNewActionCategory(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                    >
                      <option value="Training">Training</option>
                      <option value="Quality">Quality & SOP</option>
                      <option value="HR">HR & Conduct</option>
                      <option value="Finance">Finance & Billing</option>
                      <option value="Customer Care">Customer Care</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Operations">Operations</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Linked Action Plan</label>
                    <select
                      value={newActionPlanType}
                      onChange={(e) => setNewActionPlanType(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                    >
                      <option value="Quality Action">Quality Action</option>
                      <option value="Training Action">Training Action</option>
                      <option value="HR Action">HR Action</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newActionName.trim() || savingNew}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{savingNew ? 'Saving...' : 'Add & Select'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Options Checklist */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <p className="font-semibold text-xs">No matching actions found.</p>
                <button
                  type="button"
                  onClick={() => {
                    setNewActionName(search);
                    setIsCreating(true);
                  }}
                  className="mt-1 text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Create "{search}" as a new action
                </button>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedActions.includes(opt.action_name);
                return (
                  <div
                    key={opt.action_name}
                    onClick={() => toggleAction(opt.action_name)}
                    className={`p-2 rounded-xl flex items-start justify-between gap-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border border-blue-200/80 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 border border-transparent text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="text-xs leading-snug flex items-center gap-1.5">
                          <span>{opt.action_name}</span>
                          {opt.category && (
                            <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200/60">
                              {opt.category}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-[10px] text-slate-400 font-normal leading-relaxed mt-0.5">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {opt.auto_plan_type && (
                      <span className="shrink-0 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                        {opt.auto_plan_type}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              {selectedActions.length} Selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
