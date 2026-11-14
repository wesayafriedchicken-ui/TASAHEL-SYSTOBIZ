import React, { useState } from 'react';
import { 
  X, Shield, CheckCircle2, Ban, EyeOff, Info, 
  MousePointerClick, Lock, Globe, UserCheck, User, Save, Trash2
} from 'lucide-react';
import { ActionControl } from '../../hooks/useActionControls';
import { cn } from '../../lib/utils';

interface ConfigureButtonSecurityModalProps {
  control: ActionControl | null; // null if creating a new action button
  selectedTab: string;
  selectedSection?: string;
  availableSections?: string[];
  onClose: () => void;
  onSave: (data: Partial<ActionControl>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export const ConfigureButtonSecurityModal: React.FC<ConfigureButtonSecurityModalProps> = ({
  control,
  selectedTab,
  selectedSection,
  availableSections,
  onClose,
  onSave,
  onDelete,
}) => {
  const isNew = !control;

  const [labelEn, setLabelEn] = useState(control?.label_en || '');
  const [labelAr, setLabelAr] = useState(control?.label_ar || '');
  const [actionKey, setActionKey] = useState(control?.action_key || '');
  const [targetTab, setTargetTab] = useState(control?.tab_id || selectedTab);
  const [sectionName, setSectionName] = useState(control?.section_name || selectedSection || 'General');
  
  // Three exclusive security states: 'active' | 'disabled' | 'hidden'
  const [state, setState] = useState<'active' | 'disabled' | 'hidden'>(control?.state || 'active');

  // Permission Scope: 'super_admin' | 'direct_manager' | 'self' | 'everyone'
  const [permissionScope, setPermissionScope] = useState<'super_admin' | 'direct_manager' | 'self' | 'everyone'>(
    control?.permission_scope || 'everyone'
  );

  const [tooltipText, setTooltipText] = useState(
    control?.tooltip_text || 'You are not authorized to perform this action'
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelEn.trim()) {
      setError('Button Label (English) is required.');
      return;
    }

    if (isNew && !actionKey.trim()) {
      setError('Action Identifier / Key is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: Partial<ActionControl> = {
        label_en: labelEn.trim(),
        label_ar: labelAr.trim() || labelEn.trim(),
        tab_id: targetTab,
        section_name: sectionName.trim(),
        state,
        permission_scope: permissionScope,
        tooltip_text: tooltipText.trim()
      };

      if (isNew) {
        payload.action_key = actionKey.trim().toLowerCase().startsWith('act_') 
          ? actionKey.trim().toLowerCase() 
          : `act_${actionKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Error saving action security:', err);
      setError(err.message || 'Failed to save action security settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!control || !onDelete) return;
    if (!window.confirm(`Are you sure you want to delete the action button "${control.label_en}"?`)) return;

    try {
      setDeleting(true);
      await onDelete(control.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete action control.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-[#fcfbfa] rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200/60 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1b5e20] flex items-center justify-center">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-black text-[#1b5e20]">
                {isNew ? 'Add Action / Button Control' : 'Configure Button & Action Security'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Set visibility status, permission scopes, and behavior for this interactive control
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="p-8 overflow-y-auto space-y-6 text-left flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Button Labels & Identifiers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Button Identity & Placement
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Button Label (English) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={labelEn}
                  onChange={(e) => setLabelEn(e.target.value)}
                  placeholder="e.g. Adjust Leave Balances"
                  required
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1b5e20] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Button Label (Arabic)
                </label>
                <input
                  type="text"
                  value={labelAr}
                  onChange={(e) => setLabelAr(e.target.value)}
                  placeholder="e.g. تعديل أرصدة الإجازات"
                  dir="rtl"
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1b5e20] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target Section Name
                </label>
                {availableSections && availableSections.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={availableSections.includes(sectionName) ? sectionName : 'custom'}
                      onChange={(e) => {
                        if (e.target.value !== 'custom') {
                          setSectionName(e.target.value);
                        } else {
                          setSectionName('');
                        }
                      }}
                      className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1b5e20] focus:bg-white transition-all cursor-pointer"
                    >
                      {availableSections.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="custom">-- Custom Section Name --</option>
                    </select>
                    {(!availableSections.includes(sectionName) || sectionName === '') && (
                      <input
                        type="text"
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        placeholder="Type custom section name..."
                        className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 outline-none focus:border-[#1b5e20] focus:bg-white transition-all"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder="e.g. Leave Balances & Policies"
                    className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1b5e20] focus:bg-white transition-all"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Action Key (System ID)
                </label>
                <input
                  type="text"
                  value={actionKey}
                  onChange={(e) => setActionKey(e.target.value)}
                  disabled={!isNew}
                  placeholder="e.g. act_adjust_leave_balances"
                  className={cn(
                    "w-full text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none transition-all",
                    !isNew ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "focus:border-[#1b5e20] focus:bg-white"
                  )}
                />
                {!isNew && (
                  <p className="text-[10px] text-slate-400 mt-1">Standard action keys are system managed.</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Visibility & State (Radio Buttons / Exclusive States) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Visibility & State (حالة الزر للدور)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose how this button behaves across user sessions. These states are strictly mutually exclusive.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Active */}
              <label 
                className={cn(
                  "relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all text-left",
                  state === 'active'
                    ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span className="text-xs font-black text-slate-800">Visible & Active</span>
                  </div>
                  <input
                    type="radio"
                    name="action_state"
                    value="active"
                    checked={state === 'active'}
                    onChange={() => setState('active')}
                    className="w-4 h-4 accent-[#1b5e20] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Button is visible, enabled, and fully interactive for authorized users.
                </p>
              </label>

              {/* Disabled */}
              <label 
                className={cn(
                  "relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all text-left",
                  state === 'disabled'
                    ? "border-amber-500 bg-amber-50/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-black text-slate-800">Disabled (Greyed Out)</span>
                  </div>
                  <input
                    type="radio"
                    name="action_state"
                    value="disabled"
                    checked={state === 'disabled'}
                    onChange={() => setState('disabled')}
                    className="w-4 h-4 accent-amber-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Visible but locked and greyed out with a helpful authorization tooltip.
                </p>
              </label>

              {/* Hidden */}
              <label 
                className={cn(
                  "relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all text-left",
                  state === 'hidden'
                    ? "border-rose-600 bg-rose-50/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <span className="text-xs font-black text-slate-800">Hidden</span>
                  </div>
                  <input
                    type="radio"
                    name="action_state"
                    value="hidden"
                    checked={state === 'hidden'}
                    onChange={() => setState('hidden')}
                    className="w-4 h-4 accent-rose-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Completely removed from the UI for all regular users.
                </p>
              </label>
            </div>
          </div>

          {/* Section 3: Permission Scope */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Permission Scope (نطاق الصلاحيات)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Designate which roles and relationships are authorized to trigger this button.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Super Admin Only */}
              <label 
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all",
                  permissionScope === 'super_admin'
                    ? "border-purple-600 bg-purple-50/30 text-purple-950 font-bold"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                )}
              >
                <input
                  type="radio"
                  name="perm_scope"
                  value="super_admin"
                  checked={permissionScope === 'super_admin'}
                  onChange={() => setPermissionScope('super_admin')}
                  className="mt-0.5 accent-purple-600 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    <span>Super Admin Only</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Restricted strictly to system administrators with full permissions.
                  </p>
                </div>
              </label>

              {/* Direct Manager */}
              <label 
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all",
                  permissionScope === 'direct_manager'
                    ? "border-blue-600 bg-blue-50/30 text-blue-950 font-bold"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                )}
              >
                <input
                  type="radio"
                  name="perm_scope"
                  value="direct_manager"
                  checked={permissionScope === 'direct_manager'}
                  onChange={() => setPermissionScope('direct_manager')}
                  className="mt-0.5 accent-blue-600 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Direct Manager</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Authorized for the employee's designated manager or Super Admins.
                  </p>
                </div>
              </label>

              {/* Self */}
              <label 
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all",
                  permissionScope === 'self'
                    ? "border-indigo-600 bg-indigo-50/30 text-indigo-950 font-bold"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                )}
              >
                <input
                  type="radio"
                  name="perm_scope"
                  value="self"
                  checked={permissionScope === 'self'}
                  onChange={() => setPermissionScope('self')}
                  className="mt-0.5 accent-indigo-600 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Self (Employee Only)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Authorized for the profile owner themselves or Super Admins.
                  </p>
                </div>
              </label>

              {/* Everyone */}
              <label 
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all",
                  permissionScope === 'everyone'
                    ? "border-emerald-600 bg-emerald-50/30 text-emerald-950 font-bold"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                )}
              >
                <input
                  type="radio"
                  name="perm_scope"
                  value="everyone"
                  checked={permissionScope === 'everyone'}
                  onChange={() => setPermissionScope('everyone')}
                  className="mt-0.5 accent-[#1b5e20] cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Everyone</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Accessible to all authorized team members viewing this profile.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Tooltip Text */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Tooltip & Feedback Text (When Disabled)
            </h3>
            <input
              type="text"
              value={tooltipText}
              onChange={(e) => setTooltipText(e.target.value)}
              placeholder="e.g. You are not authorized to perform this action"
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1b5e20] focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-400">
              This message appears as a tooltip hover when unauthorized users attempt to click the disabled button.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            {!isNew && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Deleting...' : 'Delete Control'}</span>
              </button>
            )}
            
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1b5e20] hover:bg-[#154a19] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Action Security'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
