import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, Check, X, Calendar, DollarSign, List, Table
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { PermittedField } from '../common/PermittedField';

interface DynamicLayoutSectionProps {
  tab: string; // e.g. personal, job, benefits, training
  section: string; // e.g. Basic Information, Benefits Overview
  employeeId: number;
  onRefresh?: () => void;
  isViewOnly?: boolean;
  onMarkDirty?: () => void;
}

export const DynamicLayoutSection: React.FC<DynamicLayoutSectionProps> = ({
  tab,
  section,
  employeeId,
  onRefresh,
  isViewOnly = false,
  onMarkDirty
}) => {
  const [fields, setFields] = useState<any[]>([]);
  const [values, setValues] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  
  // Custom Table Row editing state
  const [editingTableRowId, setEditingTableRowId] = useState<number | null>(null); // custom field ID of the active table
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null); // Index of row being edited

  const fetchDynamicData = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const fRes = await fetch(`/api/hr/custom-fields?entity_type=employee`);
      if (fRes.ok) {
        const allFields = await fRes.json();
        // filter by tab and section - only genuine custom fields, not standard profile field overrides
        const sectionFields = allFields.filter(
          (f: any) => 
            f.relation_target_table === tab && 
            f.relation_display_column === section &&
            !f.field_name.startsWith('std_')
        );
        setFields(sectionFields);
      }

      const vRes = await fetch(`/api/hr/custom-fields/values?entity_type=employee&entity_id=${employeeId}`);
      if (vRes.ok) {
        const vals = await vRes.json();
        const map: Record<number, string> = {};
        vals.forEach((v: any) => {
          map[v.field_id] = v.value;
        });
        setValues(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicData();
  }, [tab, section, employeeId]);

  // Handle saving a regular custom field value
  const handleSaveFieldVal = async (fieldId: number, val: string) => {
    try {
      if (onMarkDirty) onMarkDirty();
      const res = await fetch('/api/hr/custom-fields/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: employeeId,
          values: { [fieldId]: val }
        })
      });
      if (res.ok) {
        setValues(prev => ({ ...prev, [fieldId]: val }));
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Custom Table row additions/saves
  const handleSaveTableRow = async (fieldId: number, columns: any[]) => {
    try {
      if (onMarkDirty) onMarkDirty();
      const currentValStr = values[fieldId] || '[]';
      let currentRows = [];
      try {
        currentRows = JSON.parse(currentValStr);
        if (!Array.isArray(currentRows)) currentRows = [];
      } catch {
        currentRows = [];
      }

      if (editingRowIdx !== null) {
        // Edit existing
        currentRows[editingRowIdx] = newRowData;
      } else {
        // Add new
        currentRows.push(newRowData);
      }

      const updatedValStr = JSON.stringify(currentRows);
      
      const res = await fetch('/api/hr/custom-fields/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: employeeId,
          values: { [fieldId]: updatedValStr }
        })
      });

      if (res.ok) {
        setValues(prev => ({ ...prev, [fieldId]: updatedValStr }));
        setEditingTableRowId(null);
        setEditingRowIdx(null);
        setNewRowData({});
        if (onRefresh) onRefresh();
      } else {
        alert('Failed to save table row');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTableRow = async (fieldId: number, rowIdx: number) => {
    if (!confirm('Are you sure you want to delete this row?')) return;
    try {
      if (onMarkDirty) onMarkDirty();
      const currentValStr = values[fieldId] || '[]';
      let currentRows = [];
      try {
        currentRows = JSON.parse(currentValStr);
        if (!Array.isArray(currentRows)) currentRows = [];
      } catch {
        currentRows = [];
      }

      currentRows.splice(rowIdx, 1);
      const updatedValStr = JSON.stringify(currentRows);

      const res = await fetch('/api/hr/custom-fields/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: employeeId,
          values: { [fieldId]: updatedValStr }
        })
      });

      if (res.ok) {
        setValues(prev => ({ ...prev, [fieldId]: updatedValStr }));
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (fields.length === 0) return null;

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Custom Layout Components ({section})</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {fields.map((f) => {
          const isTable = f.field_type === 'custom_table';
          
          if (isTable) {
            let cols: any[] = [];
            try {
              cols = JSON.parse(f.options || '[]');
            } catch {
              cols = [];
            }

            let rows: any[] = [];
            try {
              rows = JSON.parse(values[f.id] || '[]');
              if (!Array.isArray(rows)) rows = [];
            } catch {
              rows = [];
            }

            return (
              <div key={f.id} className="col-span-12 space-y-3 bg-slate-50/50 p-6 rounded-3xl border border-slate-150 shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-serif font-black text-[#1b5e20] flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-[#1b5e20]" />
                    {f.field_label_en}
                  </h4>
                  {!isViewOnly && (
                    <button
                      onClick={() => {
                        setEditingTableRowId(f.id);
                        setEditingRowIdx(null);
                        setNewRowData({});
                      }}
                      className="px-3 py-1.5 bg-[#1b5e20] hover:bg-[#123e15] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Entry
                    </button>
                  )}
                </div>

                {/* Inline Add/Edit Form */}
                {editingTableRowId === f.id && (
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-fadeIn shadow-sm">
                    {cols.map((col: any) => (
                      <div key={col.id} className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">{col.name}</label>
                        
                        {col.type === 'Checkbox' ? (
                          <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                            <input 
                              type="checkbox"
                              checked={!!newRowData[col.name]}
                              onChange={(e) => setNewRowData({ ...newRowData, [col.name]: e.target.checked })}
                              className="rounded text-[#1b5e20]"
                            />
                            <span>Yes / No</span>
                          </label>
                        ) : col.type === 'Date' ? (
                          <input 
                            type="date"
                            value={newRowData[col.name] || ''}
                            onChange={(e) => setNewRowData({ ...newRowData, [col.name]: e.target.value })}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
                          />
                        ) : col.type === 'Currency' ? (
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                            <input 
                              type="text"
                              value={newRowData[col.name] || ''}
                              onChange={(e) => setNewRowData({ ...newRowData, [col.name]: e.target.value })}
                              placeholder="0.00"
                              className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg pl-5 pr-2 py-1.5 outline-none"
                            />
                          </div>
                        ) : (
                          <input 
                            type="text"
                            value={newRowData[col.name] || ''}
                            onChange={(e) => setNewRowData({ ...newRowData, [col.name]: e.target.value })}
                            placeholder={`Enter ${col.name}`}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
                          />
                        )}
                      </div>
                    ))}
                    <div className="col-span-1 md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={() => {
                          setEditingTableRowId(null);
                          setEditingRowIdx(null);
                          setNewRowData({});
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleSaveTableRow(f.id, cols)}
                        className="px-4 py-1.5 bg-[#1b5e20] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Table display */}
                {rows.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-bold text-xs bg-white rounded-2xl border border-dashed border-slate-200 leading-relaxed">
                    No rows recorded. Click "Add Entry" to input data.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-150 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {cols.map((col: any) => (
                            <th key={col.id} className="px-4 py-3 font-black">{col.name}</th>
                          ))}
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/30">
                            {cols.map((col: any) => (
                              <td key={col.id} className="px-4 py-3.5 text-slate-600 font-bold">
                                {col.type === 'Checkbox' ? (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                    row[col.name] ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                  )}>
                                    {row[col.name] ? 'Yes' : 'No'}
                                  </span>
                                ) : col.type === 'Currency' ? (
                                  `$${row[col.name] || '0.00'}`
                                ) : (
                                  row[col.name] || '—'
                                )}
                              </td>
                            ))}
                            {!isViewOnly && (
                              <td className="px-4 py-3.5 text-right flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingTableRowId(f.id);
                                    setEditingRowIdx(idx);
                                    setNewRowData(row);
                                  }}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTableRow(f.id, idx)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          }

          // Regular custom field rendering
          return (
            <PermittedField
              key={f.id}
              moduleName="employee"
              tabName={tab}
              fieldKey={f.field_name}
              permLevel={f.perm_level || 0}
              hidden={f.hidden}
              readOnly={f.read_only}
              className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1.5 w-full"
            >
              {({ isReadOnly }) => (
                <div className="w-full space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wide">
                    {f.field_label_en} {f.is_required && <span className="text-rose-500">*</span>}
                  </label>

                  {f.field_type === 'select' ? (
                    <select
                      disabled={isReadOnly}
                      value={values[f.id] || ''}
                      onChange={(e) => handleSaveFieldVal(f.id, e.target.value)}
                      className={cn(
                        "w-full h-11 text-xs font-bold border rounded-xl px-3.5 py-2.5 outline-none transition-all shadow-2xs",
                        isReadOnly 
                          ? "bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed" 
                          : "bg-white border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                      )}
                    >
                      <option value="">-Select-</option>
                      {(f.options || '').split(',').map((o: string, idx: number) => (
                        <option key={idx} value={o.trim()}>{o.trim()}</option>
                      ))}
                    </select>
                  ) : f.field_type === 'checkbox' ? (
                    <label className={cn(
                      "flex items-center gap-2.5 h-11 px-3.5 border rounded-xl transition-all shadow-2xs w-full",
                      isReadOnly ? "bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 cursor-pointer hover:bg-slate-50"
                    )}>
                      <input 
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={values[f.id] === 'true'}
                        onChange={(e) => handleSaveFieldVal(f.id, String(e.target.checked))}
                        className="rounded text-[#1b5e20] w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Active</span>
                    </label>
                  ) : f.field_type === 'longtext' ? (
                    <textarea
                      rows={3}
                      disabled={isReadOnly}
                      value={values[f.id] || ''}
                      onChange={(e) => handleSaveFieldVal(f.id, e.target.value)}
                      className={cn(
                        "w-full text-xs font-bold border rounded-xl p-3.5 outline-none transition-all shadow-2xs min-h-[80px]",
                        isReadOnly 
                          ? "bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed" 
                          : "bg-white border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                      )}
                    />
                  ) : f.field_type === 'date' ? (
                    <input 
                      type="date"
                      disabled={isReadOnly}
                      value={values[f.id] || ''}
                      onChange={(e) => handleSaveFieldVal(f.id, e.target.value)}
                      className={cn(
                        "w-full h-11 text-xs font-bold border rounded-xl px-3.5 py-2.5 outline-none transition-all shadow-2xs",
                        isReadOnly 
                          ? "bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed" 
                          : "bg-white border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                      )}
                    />
                  ) : f.field_type === 'number' ? (
                    <input 
                      type="number"
                      disabled={isReadOnly}
                      value={values[f.id] || ''}
                      onChange={(e) => handleSaveFieldVal(f.id, e.target.value)}
                      className={cn(
                        "w-full h-11 text-xs font-bold border rounded-xl px-3.5 py-2.5 outline-none transition-all shadow-2xs",
                        isReadOnly 
                          ? "bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed" 
                          : "bg-white border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                      )}
                    />
                  ) : f.field_type === 'currency' ? (
                    <div className="relative w-full">
                      <span className="absolute left-3.5 top-3 text-xs text-slate-400 font-bold">$</span>
                      <input 
                        type="text"
                        disabled={isReadOnly}
                        value={values[f.id] || ''}
                        onChange={(e) => handleSaveFieldVal(f.id, e.target.value)}
                        placeholder="0.00"
                        className={cn(
                          "w-full h-11 text-xs font-bold border rounded-xl pl-8 pr-3.5 py-2.5 outline-none transition-all shadow-2xs",
                          isReadOnly 
                            ? "bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed" 
                            : "bg-white border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                        )}
                      />
                    </div>
                  ) : (
                    <input 
                      type="text"
                      disabled={isReadOnly}
                      value={values[f.id] || ''}
                      onChange={(e) => handleSaveFieldVal(f.id, e.target.value)}
                      className={cn(
                        "w-full h-11 text-xs font-bold border rounded-xl px-3.5 py-2.5 outline-none transition-all shadow-2xs",
                        isReadOnly 
                          ? "bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed" 
                          : "bg-white border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                      )}
                    />
                  )}
                </div>
              )}
            </PermittedField>
          );
        })}
      </div>
    </div>
  );
};
