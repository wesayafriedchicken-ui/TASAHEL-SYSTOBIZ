import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { ALL_NEW_DEAL_FIELDS, autoMatchColumnToDealField } from '../dealsFieldsRegistry';

export interface ColumnMappingItem {
  sheetColumn: string;
  crmField: string;
  isRequired?: boolean;
}

interface GoogleSheetsMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: ColumnMappingItem[];
  sheetTabName?: string;
  discoveredColumns?: string[];
  onSave: (updatedMappings: ColumnMappingItem[]) => void;
}

export const GoogleSheetsMappingModal: React.FC<GoogleSheetsMappingModalProps> = ({
  isOpen,
  onClose,
  mappings: initialMappings,
  sheetTabName,
  discoveredColumns = [],
  onSave
}) => {
  const [mappings, setMappings] = useState<ColumnMappingItem[]>(() => [...initialMappings]);
  const [newSheetCol, setNewSheetCol] = useState('');
  const [newCrmField, setNewCrmField] = useState('title');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Categories for rendering organized optgroups
  const categories = Array.from(new Set(ALL_NEW_DEAL_FIELDS.map((f) => f.category)));

  const handleAddMapping = () => {
    if (!newSheetCol.trim()) {
      setError('Google Sheet column header name is required');
      return;
    }
    if (mappings.some((m) => m.sheetColumn.toLowerCase() === newSheetCol.trim().toLowerCase())) {
      setError('This sheet column header is already mapped');
      return;
    }

    const fieldMeta = ALL_NEW_DEAL_FIELDS.find((f) => f.key === newCrmField);

    setMappings((prev) => [
      ...prev,
      {
        sheetColumn: newSheetCol.trim(),
        crmField: newCrmField,
        isRequired: fieldMeta?.isRequired || false
      }
    ]);
    setNewSheetCol('');
    setError(null);
  };

  const handleRemoveMapping = (index: number) => {
    setMappings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, newField: string) => {
    const fieldMeta = ALL_NEW_DEAL_FIELDS.find((f) => f.key === newField);
    setMappings((prev) =>
      prev.map((m, i) =>
        i === index
          ? {
              ...m,
              crmField: newField,
              isRequired: fieldMeta?.isRequired ?? m.isRequired
            }
          : m
      )
    );
  };

  const handleToggleRequired = (index: number) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, isRequired: !m.isRequired } : m))
    );
  };

  // Auto-Match from discovered columns
  const handleAutoMatchFromDiscovered = () => {
    if (discoveredColumns.length === 0) return;
    const newMapped: ColumnMappingItem[] = discoveredColumns.map((col) => {
      const matchedFieldKey = autoMatchColumnToDealField(col);
      const fieldMeta = ALL_NEW_DEAL_FIELDS.find((f) => f.key === matchedFieldKey);
      return {
        sheetColumn: col,
        crmField: matchedFieldKey,
        isRequired: fieldMeta?.isRequired || false
      };
    });
    setMappings(newMapped);
    setError(null);
  };

  const handleSave = () => {
    onSave(mappings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800">
                  Google Sheets & Pipeline Deals Column Mapping
                </h3>
                {sheetTabName && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Tab: {sheetTabName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Exhaustive field bindings for all attributes in <strong className="text-slate-700 font-semibold">/sales/pipeline/deals/new</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Notice Banner */}
          <div className="flex items-start justify-between gap-3 p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-xs text-emerald-950">
            <div className="flex items-start gap-2">
              <Layers className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">All /sales/pipeline/deals/new fields supported</span>
                <span className="text-[11px] text-emerald-800/90 block mt-0.5">
                  Every parameter (Title, Value, Customer Name, Phone, Email, Company, Pipeline Stage, Assigned Rep, Line Items, and Memo) can be mapped without exception.
                </span>
              </div>
            </div>

            {discoveredColumns.length > 0 && (
              <button
                type="button"
                onClick={handleAutoMatchFromDiscovered}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold shadow-2xs transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Match Columns</span>
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add New Custom Mapping Form */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">
              Add New Column Binding
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <input
                type="text"
                value={newSheetCol}
                onChange={(e) => setNewSheetCol(e.target.value)}
                placeholder="Spreadsheet Column Header (e.g., Contract Value)"
                className="w-full sm:flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
              <select
                value={newCrmField}
                onChange={(e) => setNewCrmField(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              >
                {categories.map((cat) => (
                  <optgroup key={cat} label={`── ${cat} ──`}>
                    {ALL_NEW_DEAL_FIELDS.filter((f) => f.category === cat).map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label} {opt.isRequired ? '(Required)' : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddMapping}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Map</span>
              </button>
            </div>
          </div>

          {/* Active Mappings Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Configured Field Mappings ({mappings.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                Matches rows into /sales/pipeline/deals/new
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {mappings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No column mappings configured. Click "Auto-Match Columns" or add bindings manually above.
                </div>
              ) : (
                mappings.map((m, index) => {
                  const currentFieldMeta = ALL_NEW_DEAL_FIELDS.find((f) => f.key === m.crmField);

                  return (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Left: Sheet Column -> CRM Field */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 truncate max-w-[180px]">
                          {m.sheetColumn}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={m.crmField}
                          onChange={(e) => handleUpdateField(index, e.target.value)}
                          className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden max-w-[280px]"
                        >
                          {categories.map((cat) => (
                            <optgroup key={cat} label={`── ${cat} ──`}>
                              {ALL_NEW_DEAL_FIELDS.filter((f) => f.category === cat).map((opt) => (
                                <option key={opt.key} value={opt.key}>
                                  {opt.label} {opt.isRequired ? '(Required)' : ''}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      {/* Right: Badge & Controls */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        {currentFieldMeta?.isRequired ? (
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            Mandatory Field
                          </span>
                        ) : (
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.isRequired}
                              onChange={() => handleToggleRequired(index)}
                              className="w-3.5 h-3.5 rounded-sm text-emerald-600 border-slate-300 focus:ring-emerald-500"
                            />
                            <span className="text-[11px]">Strict Check</span>
                          </label>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveMapping(index)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove mapping"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            {mappings.length} columns will be parsed on each sync run
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors"
            >
              Save Mappings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
