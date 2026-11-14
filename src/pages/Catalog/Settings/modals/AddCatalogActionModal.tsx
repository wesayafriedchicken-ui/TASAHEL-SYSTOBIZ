import React, { useState } from 'react';
import { X, Play, AlertCircle } from 'lucide-react';

interface AddCatalogActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  onAdd: (actionData: {
    action_key: string;
    label_en: string;
    permission_scope: 'super_admin' | 'everyone' | 'direct_manager' | 'self';
    state: 'active' | 'disabled' | 'hidden';
    tooltip_text?: string;
  }) => void;
}

export const AddCatalogActionModal: React.FC<AddCatalogActionModalProps> = ({
  isOpen,
  onClose,
  sectionName,
  onAdd
}) => {
  const [labelEn, setLabelEn] = useState('');
  const [actionKey, setActionKey] = useState('');
  const [permissionScope, setPermissionScope] = useState<'super_admin' | 'everyone' | 'direct_manager' | 'self'>('everyone');
  const [state, setState] = useState<'active' | 'disabled' | 'hidden'>('active');
  const [tooltipText, setTooltipText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLabelEn(val);
    if (!actionKey || actionKey.startsWith('act_')) {
      const generated = 'act_' + val.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
      setActionKey(generated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelEn.trim()) {
      setError('Action button label is required');
      return;
    }
    const cleanKey = actionKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || `act_${Date.now()}`;

    onAdd({
      action_key: cleanKey,
      label_en: labelEn.trim(),
      permission_scope: permissionScope,
      state,
      tooltip_text: tooltipText.trim() || undefined
    });

    onClose();
    setLabelEn('');
    setActionKey('');
    setPermissionScope('everyone');
    setState('active');
    setTooltipText('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Play className="w-4 h-4" />
              </span>
              <h3 className="text-base font-semibold text-slate-800">Add Action / Button Control</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Appending to section: <strong className="text-slate-700 font-medium">{sectionName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Action Button Label <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={labelEn}
              onChange={handleLabelChange}
              placeholder="e.g., Export Technical Specifications PDF"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 placeholder-slate-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              System Action Key <span className="text-slate-400 font-normal">(Auto)</span>
            </label>
            <input
              type="text"
              value={actionKey}
              onChange={(e) => setActionKey(e.target.value)}
              placeholder="act_export_pdf"
              className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Initial State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
              >
                <option value="active">Active & Enabled</option>
                <option value="disabled">Disabled (Grayed out)</option>
                <option value="hidden">Hidden from View</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Access Authorization Scope
              </label>
              <select
                value={permissionScope}
                onChange={(e) => setPermissionScope(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
              >
                <option value="everyone">Everyone (All Operators)</option>
                <option value="direct_manager">Direct Manager & Team Lead</option>
                <option value="super_admin">Super Admin / Owner Only</option>
                <option value="self">Self (Author / Owner Only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tooltip / Description Hint <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={tooltipText}
              onChange={(e) => setTooltipText(e.target.value)}
              placeholder="Explains what this action performs when clicked"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Add Action Button
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
