import React, { useState, useEffect } from 'react';
import { X, Shield, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { SchemaFieldItem } from '../hrModuleRegistry';

interface ConfigureFieldSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: SchemaFieldItem | null;
  onSave: (updated: Partial<SchemaFieldItem>) => void;
}

export const ConfigureFieldSecurityModal: React.FC<ConfigureFieldSecurityModalProps> = ({
  isOpen,
  onClose,
  field,
  onSave
}) => {
  const [label, setLabel] = useState('');
  const [permLevel, setPermLevel] = useState<number>(0);
  const [ownOnly, setOwnOnly] = useState(false);
  const [mode, setMode] = useState<'editable' | 'readonly' | 'hidden'>('editable');
  const [isRequired, setIsRequired] = useState(false);
  const [maskValue, setMaskValue] = useState(false);
  const [allowOnSubmit, setAllowOnSubmit] = useState(true);

  useEffect(() => {
    if (field) {
      setLabel(field.label || '');
      setPermLevel(field.permLevel ?? 0);
      setOwnOnly(field.ownOnly ?? false);
      if (field.hidden) {
        setMode('hidden');
      } else if (field.readOnly) {
        setMode('readonly');
      } else {
        setMode('editable');
      }
      setIsRequired(field.isRequired ?? false);
      setMaskValue(field.maskValue ?? false);
      setAllowOnSubmit(field.allowOnSubmit ?? true);
    }
  }, [field]);

  if (!isOpen || !field) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      label,
      permLevel,
      ownOnly,
      readOnly: mode === 'readonly',
      hidden: mode === 'hidden',
      isRequired,
      maskValue,
      allowOnSubmit
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Configure Field Security & Validation</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {field.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-left">
          {/* Label */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Field Label / Display Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Permission Level 0-4 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Security Classification Level (0-4)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { lvl: 0, title: 'L0: Public', desc: 'General staff' },
                { lvl: 1, title: 'L1: Manager', desc: 'Dept / Team' },
                { lvl: 2, title: 'L2: Sensitive', desc: 'HR Specialists' },
                { lvl: 3, title: 'L3: Exec', desc: 'Directors' },
                { lvl: 4, title: 'L4: Root', desc: 'Super Admin' }
              ].map((item) => (
                <button
                  key={item.lvl}
                  type="button"
                  onClick={() => setPermLevel(item.lvl)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    permLevel === item.lvl
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-xs font-bold">{item.title}</span>
                  <span className="block text-[9px] text-slate-400 mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Access Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Field Interaction Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'editable', label: 'Editable', icon: Eye, desc: 'Visible and modifiable' },
                { id: 'readonly', label: 'Read-Only', icon: Lock, desc: 'Visible but non-editable' },
                { id: 'hidden', label: 'Hidden', icon: EyeOff, desc: 'Hidden from ordinary view' }
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMode(opt.id as any)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      mode === opt.id
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${mode === opt.id ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {opt.label}
                      </span>
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Flags */}
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Mandatory Required Field</span>
                <span className="text-[11px] text-slate-400">User cannot submit forms without completing this field</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={maskValue}
                onChange={(e) => setMaskValue(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Mask Sensitive Value (••••••)</span>
                <span className="text-[11px] text-slate-400">Obfuscate value unless specifically unmasked by authorized viewers</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={ownOnly}
                onChange={(e) => setOwnOnly(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Self / Own-Record Visibility Only</span>
                <span className="text-[11px] text-slate-400">Restricts non-admin viewers strictly to records where they are the owner</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={allowOnSubmit}
                onChange={(e) => setAllowOnSubmit(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Render During Record Creation</span>
                <span className="text-[11px] text-slate-400">Display this field during initial new entity creation forms</span>
              </div>
            </label>
          </div>

          {/* Footer */}
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Field Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
