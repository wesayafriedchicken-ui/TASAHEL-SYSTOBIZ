import React, { useState, useEffect } from 'react';
import { X, Shield, Check, Info } from 'lucide-react';
import { SchemaActionItem } from '../hrModuleRegistry';

interface ConfigureActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: SchemaActionItem | null;
  onSave: (updated: Partial<SchemaActionItem>) => void;
}

export const ConfigureActionModal: React.FC<ConfigureActionModalProps> = ({
  isOpen,
  onClose,
  action,
  onSave
}) => {
  const [labelEn, setLabelEn] = useState('');
  const [labelAr, setLabelAr] = useState('');
  const [state, setState] = useState<'active' | 'disabled' | 'hidden'>('active');
  const [permScope, setPermScope] = useState<'super_admin' | 'direct_manager' | 'self' | 'everyone'>('everyone');
  const [tooltip, setTooltip] = useState('');

  useEffect(() => {
    if (action) {
      setLabelEn(action.label_en || '');
      setLabelAr(action.label_ar || '');
      setState(action.state || 'active');
      setPermScope(action.permission_scope || 'everyone');
      setTooltip(action.tooltip_text || '');
    }
  }, [action]);

  if (!isOpen || !action) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      label_en: labelEn,
      label_ar: labelAr,
      state,
      permission_scope: permScope,
      tooltip_text: tooltip
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Configure Button & Action Security</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Key: {action.action_key}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-left">
          {/* Labels */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Action Button Label (English) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                placeholder="e.g. Schedule Assessment"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Arabic Label (Optional)
              </label>
              <input
                type="text"
                dir="rtl"
                value={labelAr}
                onChange={(e) => setLabelAr(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-right"
                placeholder="مثال: جدولة المقابلة"
              />
            </div>
          </div>

          {/* Visibility & Behavior State */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Action Visibility & State
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'active', label: 'Visible & Active', desc: 'Clickable normally' },
                { id: 'disabled', label: 'Disabled (Greyed)', desc: 'Visible but non-clickable' },
                { id: 'hidden', label: 'Hidden from UI', desc: 'Completely removed' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setState(opt.id as any)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    state === opt.id
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${state === opt.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {opt.label}
                    </span>
                    {state === opt.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Permission Scope */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Authorized Role Scope
            </label>
            <div className="space-y-2">
              {[
                { id: 'super_admin', label: 'Super Admin Only', desc: 'Restricted strictly to company primary admin' },
                { id: 'direct_manager', label: 'Department / Direct Manager', desc: 'Department heads, leads & HR officers' },
                { id: 'self', label: 'Self / Employee Only', desc: 'Applicable to the record owner' },
                { id: 'everyone', label: 'Everyone with Tab Access', desc: 'Any user who has access to this module page' }
              ].map((scope) => (
                <label
                  key={scope.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    permScope === scope.id
                      ? 'border-indigo-600 bg-indigo-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="permScope"
                    checked={permScope === scope.id}
                    onChange={() => setPermScope(scope.id as any)}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{scope.label}</span>
                    <span className="text-[11px] text-slate-500">{scope.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Tooltip */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Hover Tooltip (Optional)
            </label>
            <input
              type="text"
              value={tooltip}
              onChange={(e) => setTooltip(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              placeholder="e.g. Schedule technical assessment round"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Security Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
