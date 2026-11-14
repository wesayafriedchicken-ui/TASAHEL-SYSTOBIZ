import React, { useState } from 'react';
import { X, Plus, Type, List, Calendar, Hash, DollarSign, Mail, CheckSquare } from 'lucide-react';
import { SchemaSectionItem } from '../hrModuleRegistry';

interface AddCustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: SchemaSectionItem[];
  defaultSectionName?: string;
  onAdd: (sectionName: string, fieldData: any) => void;
}

export const AddCustomFieldModal: React.FC<AddCustomFieldModalProps> = ({
  isOpen,
  onClose,
  sections,
  defaultSectionName,
  onAdd
}) => {
  const [sectionName, setSectionName] = useState(defaultSectionName || sections[0]?.name || '');
  const [label, setLabel] = useState('');
  const [dataType, setDataType] = useState<string>('text');
  const [optionsText, setOptionsText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [permLevel, setPermLevel] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const options = dataType === 'select'
      ? optionsText.split('\n').map(o => o.trim()).filter(Boolean)
      : [];

    onAdd(sectionName || sections[0]?.name, {
      label: label.trim(),
      dataType,
      isRequired,
      permLevel,
      options,
      isCustom: true
    });

    setLabel('');
    setOptionsText('');
    setIsRequired(false);
    onClose();
  };

  const fieldTypes = [
    { id: 'text', label: 'Single Line Text', icon: Type },
    { id: 'number', label: 'Numeric Value', icon: Hash },
    { id: 'date', label: 'Date Picker', icon: Calendar },
    { id: 'select', label: 'Dropdown / Select', icon: List },
    { id: 'currency', label: 'Currency (EGP)', icon: DollarSign },
    { id: 'email', label: 'Email Address', icon: Mail },
    { id: 'boolean', label: 'Yes/No Checkbox', icon: CheckSquare }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Add Custom Field</h3>
              <p className="text-xs text-slate-400 mt-0.5">Attach custom attribute to this module</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
          {/* Target Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Placement Section <span className="text-rose-500">*</span>
            </label>
            <select
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
            >
              {sections.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Field Label */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Field Label / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder="e.g. Budget Approval Code"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Data Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Field Data Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {fieldTypes.map((ft) => {
                const Icon = ft.icon;
                const isSelected = dataType === ft.id;
                return (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => setDataType(ft.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs truncate">{ft.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Options if dropdown */}
          {dataType === 'select' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Dropdown Options (One per line)
              </label>
              <textarea
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                rows={3}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          )}

          {/* Security Classification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Access Classification Level
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPermLevel(lvl)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    permLevel === lvl
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  L{lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Mandatory Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500"
            />
            <span className="text-xs font-bold text-slate-800">Make this field mandatory</span>
          </label>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
              <Plus className="w-4 h-4" />
              <span>Create Custom Field</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
