import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Eye,
  EyeOff,
  Edit3,
  Lock,
  Check,
  AlertCircle,
  HelpCircle,
  Hash
} from 'lucide-react';
import { SchemaFieldItem } from '../salesModuleRegistry';

interface SalesFieldSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  field: SchemaFieldItem | null;
  onSave: (updates: Partial<SchemaFieldItem>) => void;
}

export const SalesFieldSecurityModal: React.FC<SalesFieldSecurityModalProps> = ({
  isOpen,
  onClose,
  sectionName,
  field,
  onSave
}) => {
  const [label, setLabel] = useState('');
  const [behaviorMode, setBehaviorMode] = useState<'editable' | 'readonly' | 'hidden'>('editable');
  const [permLevel, setPermLevel] = useState<number>(0);
  const [maskValue, setMaskValue] = useState<boolean>(false);
  const [isRequired, setIsRequired] = useState<boolean>(false);
  const [optionsStr, setOptionsStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    if (field) {
      setLabel(field.label || '');
      if (field.hidden) {
        setBehaviorMode('hidden');
      } else if (field.readOnly) {
        setBehaviorMode('readonly');
      } else {
        setBehaviorMode('editable');
      }
      setPermLevel(field.permLevel ?? 0);
      setMaskValue(!!field.maskValue);
      setIsRequired(!!field.isRequired);
      setOptionsStr(field.options?.join(', ') || '');
      setDescription(field.description || '');
    }
  }, [field]);

  if (!isOpen || !field) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updates: Partial<SchemaFieldItem> = {
      label: label.trim(),
      readOnly: behaviorMode === 'readonly',
      hidden: behaviorMode === 'hidden',
      permLevel,
      maskValue,
      isRequired: behaviorMode === 'editable' ? isRequired : false,
      description: description.trim() || undefined
    };

    if (field.dataType === 'select') {
      updates.options = optionsStr.split(',').map((s) => s.trim()).filter(Boolean);
    }

    onSave(updates);
    onClose();
  };

  const permLevelDescriptions: Record<number, { title: string; desc: string }> = {
    0: { title: 'Level 0 — Default (All Team Members)', desc: 'Visible and accessible to all verified sales reps and support staff.' },
    1: { title: 'Level 1 — Senior Reps & Leads', desc: 'Restricted to team leaders, account executives, and authorized staff.' },
    2: { title: 'Level 2 — Department Sales Managers', desc: 'Managerial access only for pipeline supervisors and branch heads.' },
    3: { title: 'Level 3 — Commercial Directors & Executives', desc: 'High-security financial figures, profit margins, and executive metrics.' },
    4: { title: 'Level 4 — Owner Only (C-Level / Super Admin)', desc: 'Absolute confidentiality (commission splits, proprietary pricing, equity).' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Shield className="w-4 h-4" />
              </span>
              <h3 className="text-base font-semibold text-slate-800">
                Field Security & Behavior Inspector
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspecting: <code className="font-mono text-emerald-700 font-semibold">{field.id}</code> in <span className="text-slate-700 font-medium">{sectionName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Field Name & System Key */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Display Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                System Key Identifier <span className="text-slate-400 font-normal">(Immutable)</span>
              </label>
              <input
                type="text"
                value={field.id}
                readOnly
                disabled
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Exclusive Behavior Modes: Editable, Read-Only, Hidden */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Behavior & Interaction Mode
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setBehaviorMode('editable')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  behaviorMode === 'editable'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Edit3 className={`w-5 h-5 mb-1.5 ${behaviorMode === 'editable' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold">Editable</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Read & Write by rep</span>
              </button>

              <button
                type="button"
                onClick={() => setBehaviorMode('readonly')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  behaviorMode === 'readonly'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-900 shadow-xs ring-1 ring-amber-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Lock className={`w-5 h-5 mb-1.5 ${behaviorMode === 'readonly' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold">Read-Only</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Calculated / Locked</span>
              </button>

              <button
                type="button"
                onClick={() => setBehaviorMode('hidden')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  behaviorMode === 'hidden'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-900 shadow-xs ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <EyeOff className={`w-5 h-5 mb-1.5 ${behaviorMode === 'hidden' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold">Hidden</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Not rendered in UI</span>
              </button>
            </div>
          </div>

          {/* Permission Level selector (Level 0 - Default to Level 4 - Owner Only) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Minimum Security Permission Level
              </label>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                Level {permLevel}
              </span>
            </div>
            <select
              value={permLevel}
              onChange={(e) => setPermLevel(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
            >
              <option value={0}>Level 0 — Default (All Team Members)</option>
              <option value={1}>Level 1 — Senior Sales Reps & Team Leads</option>
              <option value={2}>Level 2 — Department Sales Managers</option>
              <option value={3}>Level 3 — Commercial Directors & Executives</option>
              <option value={4}>Level 4 — Owner Only (C-Level / Super Admin)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-start gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
              <span>{permLevelDescriptions[permLevel]?.desc}</span>
            </p>
          </div>

          {/* Sensitivity flag: Mask Sensitive Value (***) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={maskValue}
                onChange={(e) => setMaskValue(e.target.checked)}
                className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300 mt-0.5"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Mask Sensitive Value (***)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Protects confidential account details, profit margins, cost estimates, or representative commission splits from unauthorized viewing or screen recording.
                </span>
              </div>
            </label>

            {behaviorMode === 'editable' && (
              <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-200/60">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300 mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Mandatory Field (Required before saving form)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Prevents moving deals forward or saving records when this input is empty.
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* Select Options */}
          {field.dataType === 'select' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dropdown Select Choices <span className="text-slate-400 font-normal">(Comma-separated)</span>
              </label>
              <input
                type="text"
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="Option 1, Option 2, Option 3"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>
          )}

          {/* Tooltip / Guidance */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Field Guidance / Tooltip Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Explanatory guidance shown to users when interacting with this field"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors"
            >
              Apply Security Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
