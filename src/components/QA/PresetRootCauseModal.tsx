import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Sliders, 
  Wand2, 
  CheckSquare, 
  Square, 
  Info, 
  Building2, 
  Percent, 
  Sparkles, 
  Layers, 
  HelpCircle,
  RotateCcw,
  Check,
  AlertCircle,
  FileText
} from 'lucide-react';
import { IncidentType } from './IncidentWorkflowStepper';

export interface PresetSubReasonItem {
  id: string;
  name: string;
  weight_percentage: number;
  is_active: boolean;
}

export interface PresetFormModel {
  id?: number;
  type: IncidentType;
  department: string;
  root_cause_name: string;
  weight: number;
  sub_reasons: PresetSubReasonItem[];
}

interface PresetRootCauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: PresetFormModel | null;
  departmentsList: string[];
  onSave: (savedPreset: PresetFormModel) => Promise<void> | void;
  saving?: boolean;
}

export const PresetRootCauseModal: React.FC<PresetRootCauseModalProps> = ({
  isOpen,
  onClose,
  preset,
  departmentsList,
  onSave,
  saving = false
}) => {
  const [type, setType] = useState<IncidentType>('complaint');
  const [department, setDepartment] = useState<string>('Operations');
  const [customDept, setCustomDept] = useState<string>('');
  const [isCustomDept, setIsCustomDept] = useState<boolean>(false);
  const [rootCauseName, setRootCauseName] = useState<string>('');
  const [weight, setWeight] = useState<number>(25);
  const [subReasons, setSubReasons] = useState<PresetSubReasonItem[]>([
    { id: 'sr-1', name: '', weight_percentage: 100, is_active: true }
  ]);
  const [quickPasteText, setQuickPasteText] = useState<string>('');
  const [showQuickPaste, setShowQuickPaste] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Initialize or reset form when preset prop changes
  useEffect(() => {
    if (preset) {
      setType(preset.type || 'complaint');
      
      const deptVal = preset.department || 'Operations';
      if (departmentsList.includes(deptVal)) {
        setDepartment(deptVal);
        setIsCustomDept(false);
      } else if (departmentsList.length > 0 && !departmentsList.includes(deptVal)) {
        setDepartment('__custom__');
        setCustomDept(deptVal);
        setIsCustomDept(true);
      } else {
        setDepartment(deptVal);
        setIsCustomDept(false);
      }

      setRootCauseName(preset.root_cause_name || '');
      setWeight(preset.weight !== undefined && preset.weight !== null ? Number(preset.weight) : 25);
      
      if (preset.sub_reasons && preset.sub_reasons.length > 0) {
        setSubReasons(preset.sub_reasons.map((sr, idx) => ({
          id: sr.id || `sr-${idx}-${Date.now()}`,
          name: sr.name || '',
          weight_percentage: Number(sr.weight_percentage) || 0,
          is_active: sr.is_active !== undefined ? sr.is_active : true
        })));
      } else {
        setSubReasons([
          { id: `sr-1-${Date.now()}`, name: '', weight_percentage: 100, is_active: true }
        ]);
      }
    } else {
      setType('complaint');
      setDepartment(departmentsList[0] || 'Operations');
      setIsCustomDept(false);
      setCustomDept('');
      setRootCauseName('');
      setWeight(25);
      setSubReasons([
        { id: `sr-1-${Date.now()}`, name: '', weight_percentage: 100, is_active: true }
      ]);
    }
    setErrorText(null);
    setShowQuickPaste(false);
    setQuickPasteText('');
  }, [preset, departmentsList, isOpen]);

  // Compute sum of sub-reason weight percentages
  const totalPercentage = useMemo(() => {
    return subReasons.reduce((sum, item) => sum + (Number(item.weight_percentage) || 0), 0);
  }, [subReasons]);

  const activeCount = useMemo(() => {
    return subReasons.filter(item => item.is_active && item.name.trim().length > 0).length;
  }, [subReasons]);

  // Auto-distribute percentages evenly across all sub-reasons
  const handleDistributeEvenly = () => {
    if (subReasons.length === 0) return;
    const count = subReasons.length;
    const basePct = Math.floor(100 / count);
    const remainder = 100 - basePct * count;

    setSubReasons(prev =>
      prev.map((item, index) => ({
        ...item,
        weight_percentage: index === 0 ? basePct + remainder : basePct
      }))
    );
  };

  // Add new sub-reason row
  const handleAddSubReason = () => {
    const newId = `sr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newCount = subReasons.length + 1;
    const basePct = Math.floor(100 / newCount);
    const remainder = 100 - basePct * newCount;

    setSubReasons(prev => [
      ...prev.map((item, idx) => ({
        ...item,
        weight_percentage: idx === 0 ? basePct + remainder : basePct
      })),
      { id: newId, name: '', weight_percentage: basePct, is_active: true }
    ]);
  };

  // Remove sub-reason row
  const handleRemoveSubReason = (id: string) => {
    if (subReasons.length === 1) {
      setSubReasons([{ id: `sr-${Date.now()}`, name: '', weight_percentage: 100, is_active: true }]);
      return;
    }
    const filtered = subReasons.filter(item => item.id !== id);
    const count = filtered.length;
    const basePct = Math.floor(100 / count);
    const remainder = 100 - basePct * count;

    setSubReasons(
      filtered.map((item, index) => ({
        ...item,
        weight_percentage: index === 0 ? basePct + remainder : basePct
      }))
    );
  };

  // Update specific sub-reason
  const handleUpdateSubReason = (id: string, field: keyof PresetSubReasonItem, value: any) => {
    setSubReasons(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Handle Quick Paste of comma/newline separated reasons
  const handleApplyQuickPaste = () => {
    if (!quickPasteText.trim()) return;
    const lines = quickPasteText
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const count = lines.length;
    const basePct = Math.floor(100 / count);
    const remainder = 100 - basePct * count;

    const generated: PresetSubReasonItem[] = lines.map((line, idx) => ({
      id: `sr-${Date.now()}-${idx}`,
      name: line,
      weight_percentage: idx === 0 ? basePct + remainder : basePct,
      is_active: true
    }));

    setSubReasons(generated);
    setShowQuickPaste(false);
    setQuickPasteText('');
  };

  // Handle Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCauseName.trim()) {
      setErrorText('Please enter a Root Cause Category Name.');
      return;
    }

    const effectiveDept = isCustomDept ? customDept.trim() : department;
    if (!effectiveDept) {
      setErrorText('Please select or specify a valid department.');
      return;
    }

    const validSubReasons = subReasons
      .filter(item => item.name.trim().length > 0)
      .map(item => ({
        ...item,
        name: item.name.trim(),
        weight_percentage: Number(item.weight_percentage) || 0
      }));

    if (validSubReasons.length === 0) {
      setErrorText('Please add at least one valid sub-reason to the checklist.');
      return;
    }

    const payload: PresetFormModel = {
      id: preset?.id,
      type,
      department: effectiveDept,
      root_cause_name: rootCauseName.trim(),
      weight: Number(weight) || 0,
      sub_reasons: validSubReasons
    };

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base">
                  {preset?.id ? 'Edit Preset Root Cause' : 'Add New Root Cause Preset'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {type}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Configure root cause scoring weight and weighted sub-reason distribution
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {errorText && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Type & Department Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Incident Type */}
            <div>
              <label className="block font-black text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                Incident Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IncidentType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs"
              >
                <option value="complaint">Complaint</option>
                <option value="delay">Delay</option>
                <option value="refund">Refund</option>
                <option value="cancellation">Cancellation</option>
              </select>
            </div>

            {/* Department (Dynamic from HR Management) */}
            <div>
              <label className="block font-black text-slate-700 mb-1.5 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Department (HR Directory)</span>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  HR Synced
                </span>
              </label>

              {!isCustomDept ? (
                <div className="space-y-1.5">
                  <select
                    value={department}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomDept(true);
                      } else {
                        setDepartment(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs"
                  >
                    {departmentsList.map((deptName) => (
                      <option key={deptName} value={deptName}>
                        {deptName}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom Department...</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom department..."
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDept(false);
                      setDepartment(departmentsList[0] || 'Operations');
                    }}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all shrink-0 cursor-pointer"
                    title="Back to list"
                  >
                    List
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Root Cause Category Name & Weight Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Category Name */}
            <div className="sm:col-span-2">
              <label className="block font-black text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                Root Cause Category Name
              </label>
              <input
                type="text"
                placeholder="e.g. Agent Communication Gap, Billing Error"
                value={rootCauseName}
                onChange={(e) => setRootCauseName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs shadow-inner"
              />
            </div>

            {/* Total Root Cause Weight (QA Score Impact) */}
            <div>
              <label className="block font-black text-slate-700 mb-1.5 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>QA Score Weight</span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                  Max Impact
                </span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={weight}
                  onChange={(e) => setWeight(Math.max(1, Math.min(100, parseFloat(e.target.value) || 0)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-12 py-2.5 font-extrabold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs"
                />
                <span className="absolute right-3 text-[10px] font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                  pts
                </span>
              </div>
            </div>
          </div>

          {/* Quick preset weight buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[10px] font-bold text-slate-400">Quick Weights:</span>
            {[15, 20, 25, 30, 50, 100].map((wVal) => (
              <button
                key={wVal}
                type="button"
                onClick={() => setWeight(wVal)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  weight === wVal
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {wVal} pts
              </button>
            ))}
          </div>

          {/* Sub-Reasons Checklist Header */}
          <div className="pt-3 border-t border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                    Weighted Sub-Reasons Checklist
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    totalPercentage === 100 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : totalPercentage > 100
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}>
                    Sum: {totalPercentage}% {totalPercentage === 100 ? '✓' : '(Target: 100%)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Check active reasons and assign percentage shares of the {weight} pts Root Cause weight.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDistributeEvenly}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Distribute 100% equally among all items"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Distribute Evenly %</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickPaste(!showQuickPaste)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showQuickPaste ? 'Hide Paste' : 'Bulk Paste'}</span>
                </button>
              </div>
            </div>

            {/* Quick Bulk Paste Drawer */}
            {showQuickPaste && (
              <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-2 animate-fadeIn">
                <label className="block text-[11px] font-bold text-indigo-950">
                  Paste comma-separated or newline-separated sub-reasons:
                </label>
                <textarea
                  rows={2}
                  value={quickPasteText}
                  onChange={(e) => setQuickPasteText(e.target.value)}
                  placeholder="e.g. Inaccurate Information, Rude Tone, Delayed First Response"
                  className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickPaste(false)}
                    className="px-3 py-1 bg-white text-slate-600 rounded-lg font-bold text-[11px] border border-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyQuickPaste}
                    className="px-3.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[11px] hover:bg-indigo-700 cursor-pointer"
                  >
                    Generate Checklist Items
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Checklist Rows Table */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner p-2 space-y-2">
              {subReasons.map((item, index) => {
                const qaImpactPoints = ((Number(item.weight_percentage) || 0) / 100) * (Number(weight) || 0);

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      item.is_active 
                        ? 'bg-white border-slate-200 shadow-2xs' 
                        : 'bg-slate-100/70 border-slate-200/50 opacity-60'
                    }`}
                  >
                    {/* Active Checkbox & Reason Name Input */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateSubReason(item.id, 'is_active', !item.is_active)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          item.is_active 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                        }`}
                        title={item.is_active ? 'Active Checklist Item' : 'Inactive Item'}
                      >
                        {item.is_active ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                      </button>

                      <span className="text-[10px] font-black text-slate-400 w-4 text-center">
                        {index + 1}.
                      </span>

                      <input
                        type="text"
                        placeholder="Enter sub-reason title / failure mode..."
                        value={item.name}
                        onChange={(e) => handleUpdateSubReason(item.id, 'name', e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    {/* Weight % Share & Calculated QA Score Impact */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-7 sm:pl-0">
                      
                      {/* Weight Percentage Input */}
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500">Weight:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.weight_percentage}
                          onChange={(e) =>
                            handleUpdateSubReason(
                              item.id,
                              'weight_percentage',
                              Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                            )
                          }
                          className="w-12 text-center bg-white border border-slate-200 rounded font-black text-slate-900 text-xs py-0.5 focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-bold text-indigo-700">%</span>
                      </div>

                      {/* Calculated Score Impact Badge */}
                      <div className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[10.5px] font-black shrink-0 min-w-[76px] text-center" title="Deduction from QA audit score">
                        -{qaImpactPoints.toFixed(1)} pts
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubReason(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Remove Sub-Reason"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add Sub-Reason Row Button */}
              <button
                type="button"
                onClick={handleAddSubReason}
                className="w-full py-2.5 bg-white hover:bg-indigo-50/70 border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Checklist Sub-Reason</span>
              </button>
            </div>
          </div>

          {/* QA Score Calculation Breakdown Guide */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>QA Scoring Integration Formula</span>
            </div>
            <p className="leading-relaxed">
              When an audit fails on this Root Cause, checking a sub-reason deducts its proportional percentage of the total <strong>{weight} pts</strong> Root Cause weight directly from the QA evaluation score.
            </p>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{preset?.id ? 'Update Preset Root Cause' : 'Save Preset Root Cause'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
