import React, { useState } from 'react';
import { X, Table, AlertCircle } from 'lucide-react';

interface AddCatalogCustomTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  onAdd: (tableData: { id: string; label: string; permLevel?: number; description?: string }) => void;
}

export const AddCatalogCustomTableModal: React.FC<AddCatalogCustomTableModalProps> = ({
  isOpen,
  onClose,
  sectionName,
  onAdd
}) => {
  const [label, setLabel] = useState('');
  const [tableKey, setTableKey] = useState('');
  const [permLevel, setPermLevel] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLabel(val);
    if (!tableKey || tableKey.startsWith('tbl_')) {
      const generated = 'tbl_' + val.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
      setTableKey(generated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Table name / label is required');
      return;
    }
    const cleanKey = tableKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || `tbl_${Date.now()}`;

    onAdd({
      id: cleanKey,
      label: label.trim(),
      permLevel,
      description: description.trim() || undefined
    });

    onClose();
    setLabel('');
    setTableKey('');
    setPermLevel(1);
    setDescription('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                <Table className="w-4 h-4" />
              </span>
              <h3 className="text-base font-semibold text-slate-800">Add Catalog Custom Table / Repeater</h3>
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
              Table Display Label <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={handleLabelChange}
              placeholder="e.g., Regional Distributor Price Matrix"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              System Key Identifier <span className="text-slate-400 font-normal">(Auto)</span>
            </label>
            <input
              type="text"
              value={tableKey}
              onChange={(e) => setTableKey(e.target.value)}
              placeholder="tbl_distributor_matrix"
              className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Access Permission Level
            </label>
            <select
              value={permLevel}
              onChange={(e) => setPermLevel(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            >
              <option value={0}>Level 0 — Default (All Team Members)</option>
              <option value={1}>Level 1 — Senior Specialists & Pricing Leads</option>
              <option value={2}>Level 2 — Catalog & Product Managers</option>
              <option value={3}>Level 3 — Commercial & Financial Directors</option>
              <option value={4}>Level 4 — Owner Only (C-Level / Super Admin)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Instructions <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose and columns managed within this repeating structure"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
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
              className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Add Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
