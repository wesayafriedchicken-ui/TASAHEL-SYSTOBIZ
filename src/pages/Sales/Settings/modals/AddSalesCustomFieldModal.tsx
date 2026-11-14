import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Type, DollarSign, Calendar, ListFilter, Hash, FileUp, Mail, ToggleLeft } from 'lucide-react';
import { SchemaFieldItem } from '../salesModuleRegistry';

interface AddSalesCustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  onAdd: (field: Omit<SchemaFieldItem, 'type' | 'isCustom'>) => void;
}

export const AddSalesCustomFieldModal: React.FC<AddSalesCustomFieldModalProps> = ({
  isOpen,
  onClose,
  sectionName,
  onAdd
}) => {
  const [label, setLabel] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [dataType, setDataType] = useState<SchemaFieldItem['dataType']>('text');
  const [permLevel, setPermLevel] = useState<number>(0);
  const [isRequired, setIsRequired] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [maskValue, setMaskValue] = useState(false);
  const [optionsStr, setOptionsStr] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLabel(val);
    if (!customKey || customKey.startsWith('cf_')) {
      const generated = 'cf_' + val.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
      setCustomKey(generated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Field label is required');
      return;
    }
    const cleanKey = customKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || `cf_${Date.now()}`;

    const options = dataType === 'select'
      ? optionsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    onAdd({
      id: cleanKey,
      label: label.trim(),
      dataType,
      permLevel,
      isRequired,
      readOnly,
      maskValue,
      options,
      description: description.trim() || undefined
    });

    onClose();
    // Reset state
    setLabel('');
    setCustomKey('');
    setDataType('text');
    setPermLevel(0);
    setIsRequired(false);
    setReadOnly(false);
    setMaskValue(false);
    setOptionsStr('');
    setDescription('');
    setError(null);
  };

  const dataTypesList = [
    { value: 'text', label: 'Single-line Text', icon: Type },
    { value: 'number', label: 'Numeric Value', icon: Hash },
    { value: 'currency', label: 'Financial Currency', icon: DollarSign },
    { value: 'select', label: 'Dropdown Select', icon: ListFilter },
    { value: 'date', label: 'Calendar Date', icon: Calendar },
    { value: 'file', label: 'File / Document Upload', icon: FileUp },
    { value: 'email', label: 'Corporate Email', icon: Mail },
    { value: 'boolean', label: 'Boolean Toggle (Yes / No)', icon: ToggleLeft }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-base font-semibold text-slate-800">Add Custom Field</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Appending to section: <strong className="text-slate-700 font-medium">{sectionName}</strong>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Label & Key */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Field Display Label <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={handleLabelChange}
                placeholder="e.g., Security Deposit Amount"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                System Key Identifier <span className="text-slate-400 font-normal">(Auto)</span>
              </label>
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="cf_security_deposit"
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
              />
            </div>
          </div>

          {/* Data Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Data Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {dataTypesList.map((t) => {
                const Icon = t.icon;
                const isSelected = dataType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setDataType(t.value as any)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all text-xs font-medium ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options for Select */}
          {dataType === 'select' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dropdown Options <span className="text-slate-400 font-normal">(Comma-separated)</span>
              </label>
              <input
                type="text"
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="Low, Medium, High, Critical"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
              />
            </div>
          )}

          {/* Permission Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Access Permission Level
            </label>
            <select
              value={permLevel}
              onChange={(e) => setPermLevel(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
            >
              <option value={0}>Level 0 — Default (All Team Members & Sales Reps)</option>
              <option value={1}>Level 1 — Senior Reps & Team Leads</option>
              <option value={2}>Level 2 — Department Sales Managers</option>
              <option value={3}>Level 3 — Executive Leadership & Commercial Directors</option>
              <option value={4}>Level 4 — Owner Only (C-Level / Super Admin)</option>
            </select>
          </div>

          {/* Behavior & Sensitivity Flags */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-700">Mandatory / Required for submission</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={readOnly}
                onChange={(e) => setReadOnly(e.target.checked)}
                className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-700">Read-Only (System calculated or immutable)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={maskValue}
                onChange={(e) => setMaskValue(e.target.checked)}
                className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-700">
                Mask Sensitive Value (***) for confidential financial data
              </span>
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tooltip / Field Help Text <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Guidance displayed to sales reps when filling this field"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Footer Actions */}
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
              Save Custom Field
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
