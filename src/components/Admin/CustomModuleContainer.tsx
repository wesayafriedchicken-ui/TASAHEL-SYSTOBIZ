import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Database, Plus, Trash2, Edit2, Search, FileText, Sparkles, Filter, Layers, 
  Settings, X, Check, RefreshCw, Link2, Eye, Download, Upload, Calendar, 
  History, BarChart2, Kanban, Image as ImageIcon, Grid, FileSpreadsheet, 
  ChevronDown, ChevronUp, Printer, SlidersHorizontal, Info, ArrowRight, LayoutGrid
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CustomFieldsForm, saveCustomFieldValues } from '../HR/CustomFieldsManager';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, 
  PieChart, Pie, Cell 
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface CustomModuleContainerProps {
  moduleId: string;
  moduleName: string;
  metadata?: any;
}

export const CustomModuleContainer: React.FC<CustomModuleContainerProps> = ({ moduleId, moduleName, metadata }) => {
  // Determine tabs
  const tabs = useMemo(() => {
    let t = ['General Form'];
    if (metadata?.tabs && Array.isArray(metadata.tabs) && metadata.tabs.length > 0) {
      t = metadata.tabs;
    }
    const hidden = metadata?.hiddenTabs || [];
    return t.filter(tab => !hidden.includes(tab));
  }, [metadata]);

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]); // Grouped by entity_id
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<Record<number, string>>({});
  const [relationDisplays, setRelationDisplays] = useState<Record<string, Record<string, string>>>({});
  const [filters, setFilters] = useState<Record<number, string>>({});

  // View Mode: 'list' | 'kanban' | 'gallery' | 'dashboard' | 'report' | 'logs'
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'gallery' | 'dashboard' | 'report' | 'logs'>('list');

  // Detail Modal State
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);

  // Sorting State
  const [sortByFieldId, setSortByFieldId] = useState<number | 'id'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Log History State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // List View Column Visibility State
  const [visibleFieldIds, setVisibleFieldIds] = useState<Record<number, boolean>>({});
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Kanban grouping field selection
  const [kanbanGroupFieldId, setKanbanGroupFieldId] = useState<number | null>(null);

  // Reset active tab, clear filters, and fallback to list view if module changes
  useEffect(() => {
    setActiveTab(tabs[0]);
    setFilters({});
    setViewMode('list');
  }, [moduleId, tabs]);

  useEffect(() => {
    setFilters({});
  }, [activeTab]);

  const entityType = `${moduleId}:${activeTab}`;

  // Log auditing custom events
  const logCustomAction = async (action: string, recordId: number, details: any) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          module: moduleId,
          action: action,
          record_id: recordId,
          details: details
        })
      });
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  };

  // Fetch fields and values
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch custom fields for this entity type
      const fieldsRes = await fetch(`/api/hr/custom-fields?entity_type=${entityType}`);
      if (!fieldsRes.ok) return;
      const fieldsData = await fieldsRes.json();
      
      // Filter out hidden fields from metadata
      const hiddenFieldIds = metadata?.hiddenFieldIds || [];
      const filteredFields = fieldsData.filter((f: any) => !hiddenFieldIds.includes(f.id));
      setFields(filteredFields);

      // Initialize all fields as visible by default
      const visMap: Record<number, boolean> = {};
      filteredFields.forEach((f: any) => {
        visMap[f.id] = true;
      });
      setVisibleFieldIds(prev => ({ ...visMap, ...prev }));

      // Find default Kanban grouping field (Select or Autocomplete field if any)
      const kanbanField = filteredFields.find((f: any) => f.field_type === 'select' || f.field_type === 'checkbox' || f.options);
      if (kanbanField) {
        setKanbanGroupFieldId(kanbanField.id);
      }

      // 2. Fetch all values for these fields
      const valuesRes = await fetch(`/api/hr/custom-fields/values?entity_type=${entityType}`);
      if (!valuesRes.ok) return;
      const valuesData = await valuesRes.json();

      // Group values by entity_id
      const grouped: Record<number, Record<string, string>> = {};
      valuesData.forEach((v: any) => {
        if (!grouped[v.entity_id]) {
          grouped[v.entity_id] = {};
        }
        grouped[v.entity_id][v.field_id] = v.value || '';
      });

      // Transform into a flat array of records
      const recordsList = Object.entries(grouped).map(([entityIdStr, vals]) => {
        return {
          entity_id: parseInt(entityIdStr, 10),
          values: vals
        };
      });

      setRecords(recordsList);

      // 3. Pre-fetch relation display values
      const relationsToFetch = filteredFields.filter((f: any) => f.field_type === 'relation' && f.relation_target_table);
      for (const relField of relationsToFetch) {
        try {
          const relRes = await fetch(`/api/hr/custom-fields/relation-data/${relField.relation_target_table}?display_column=${relField.relation_display_column || 'name'}`);
          if (relRes.ok) {
            const list = await relRes.json();
            const lookup: Record<string, string> = {};
            list.forEach((item: any) => {
              lookup[String(item.id)] = item.display_value;
            });
            setRelationDisplays(prev => ({
              ...prev,
              [relField.id]: lookup
            }));
          }
        } catch (e) {
          console.error(e);
        }
      }

    } catch (err) {
      console.error("Failed to load custom module records:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch module specific audit logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/audit-logs?module=${moduleId}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [entityType]);

  useEffect(() => {
    if (viewMode === 'logs') {
      fetchLogs();
    }
  }, [viewMode, moduleId]);

  // Handle open modal for create
  const handleCreate = () => {
    setSelectedEntityId(null);
    setFormValues({});
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleEdit = (record: any) => {
    setSelectedEntityId(record.entity_id);
    
    // Set form initial values
    const initialVals: Record<number, string> = {};
    fields.forEach(f => {
      initialVals[f.id] = record.values[f.id] || '';
    });
    setFormValues(initialVals);
    setIsModalOpen(true);
  };

  // Save values
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let recordId = selectedEntityId;
      const isNew = !recordId;
      if (!recordId) {
        // Generate new entity ID using timestamp to ensure uniqueness
        recordId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
      }

      await saveCustomFieldValues(recordId, formValues);
      
      // Log custom activity audit trail
      await logCustomAction(
        isNew ? 'Create Record' : 'Update Record',
        recordId,
        { tab: activeTab, values: formValues }
      );

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to save dynamic record:", err);
    }
  };

  // Delete dynamic record securely calling our new physical DELETE endpoint
  const handleDelete = async (recordId: number) => {
    if (!confirm('Are you sure you want to delete this record permanently? / هل أنت متأكد من حذف هذا السجل نهائياً؟')) return;
    try {
      const res = await fetch(`/api/hr/custom-fields/values/${recordId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await logCustomAction('Delete Record', recordId, { tab: activeTab });
        fetchData();
      } else {
        alert('Failed to delete custom record / فشل حذف السجل');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to extract filterable fields
  const filterableFields = useMemo(() => {
    return fields.filter(f => f.add_to_filter);
  }, [fields]);

  // Compute unique values for filter fields based on loaded records
  const fieldUniqueValues = useMemo(() => {
    const map: Record<number, string[]> = {};
    filterableFields.forEach(f => {
      const vals = new Set<string>();
      records.forEach(rec => {
        const v = rec.values[f.id];
        if (v) {
          vals.add(String(v).trim());
        }
      });
      map[f.id] = Array.from(vals);
    });
    return map;
  }, [filterableFields, records]);

  // Sort and Filter records
  const processedRecords = useMemo(() => {
    let result = [...records];

    // 1. Apply active quick filters
    Object.entries(filters).forEach(([fieldId, filterVal]) => {
      if (filterVal) {
        result = result.filter(rec => String(rec.values[parseInt(fieldId, 10)] || '').trim() === filterVal.trim());
      }
    });

    // 2. Apply search term filter
    if (searchTerm) {
      const searchableFields = fields.filter(f => f.allow_search);
      result = result.filter(rec => {
        if (searchableFields.length > 0) {
          return searchableFields.some(f => {
            const val = rec.values[f.id] || '';
            return String(val).toLowerCase().includes(searchTerm.toLowerCase());
          });
        } else {
          return Object.values(rec.values).some((val: any) => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      });
    }

    // 3. Apply sorting options
    result.sort((a, b) => {
      if (sortByFieldId === 'id') {
        return sortOrder === 'asc' ? a.entity_id - b.entity_id : b.entity_id - a.entity_id;
      } else {
        const valA = String(a.values[sortByFieldId] || '').toLowerCase();
        const valB = String(b.values[sortByFieldId] || '').toLowerCase();
        
        // Handle numerical sorting if both are numbers
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
    });

    return result;
  }, [records, fields, searchTerm, filters, sortByFieldId, sortOrder]);

  // Export dynamically to CSV file cleanly escaping values
  const handleExportCSV = () => {
    if (processedRecords.length === 0) {
      alert('No data available to export / لا توجد بيانات للتصدير');
      return;
    }
    const escapeCSV = (val: any) => {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headers = ['Record ID', ...fields.map(f => f.field_label_en)];
    const rows = processedRecords.map(rec => {
      return [
        rec.entity_id,
        ...fields.map(f => {
          const raw = rec.values[f.id] || '';
          if (f.field_type === 'relation' && relationDisplays[f.id]) {
            return relationDisplays[f.id][String(raw)] || raw;
          }
          return raw;
        })
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${moduleId}_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Drag-and-drop & import parser
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          alert('CSV empty or invalid / ملف CSV فارغ أو غير صالح');
          return;
        }

        // Parse headers from row 0
        const csvHeaders = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
        
        // Match headers to field IDs
        const indexToFieldId: Record<number, number> = {};
        fields.forEach(f => {
          const idx = csvHeaders.findIndex(h => 
            h === f.field_name.toLowerCase() || 
            h === f.field_label_en.toLowerCase() ||
            h === f.field_label_ar.toLowerCase()
          );
          if (idx !== -1) {
            indexToFieldId[idx] = f.id;
          }
        });

        if (Object.keys(indexToFieldId).length === 0) {
          alert('Could not map any headers. Make sure CSV headers match field Names or English/Arabic Labels. / لم نتمكن من مطابقة الحقول.');
          return;
        }

        let importCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
          const tempEntityId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000) + i;
          const importVals: Record<number, string> = {};

          Object.entries(indexToFieldId).forEach(([colIdx, fieldId]) => {
            const val = cols[parseInt(colIdx, 10)];
            if (val !== undefined) {
              importVals[fieldId] = val;
            }
          });

          await saveCustomFieldValues(tempEntityId, importVals);
          await logCustomAction('Import Record', tempEntityId, { tab: activeTab, values: importVals });
          importCount++;
        }

        alert(`Successfully imported ${importCount} records / تم استيراد ${importCount} سجل بنجاح!`);
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Failed parsing CSV records / خطأ أثناء تحليل الملف');
      }
    };
    reader.readAsText(file);
  };

  // Download PDF Report using jsPDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(18);
    doc.text(`${moduleName} - ${activeTab} Report`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total entries: ${processedRecords.length}`, 14, 27);
    
    const headers = [['Record ID', ...fields.filter(f => visibleFieldIds[f.id] !== false).map(f => f.field_label_en)]];
    const data = processedRecords.map(rec => [
      `#${rec.entity_id}`,
      ...fields.filter(f => visibleFieldIds[f.id] !== false).map(f => {
        const raw = rec.values[f.id] || '';
        if (f.field_type === 'relation' && relationDisplays[f.id]) {
          return relationDisplays[f.id][String(raw)] || raw;
        }
        return raw;
      })
    ]);

    doc.autoTable({
      startY: 32,
      head: headers,
      body: data,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo primary color
    });

    doc.save(`${moduleId}_report_${Date.now()}.pdf`);
  };

  // Kanban View Data Structures
  const kanbanGroupField = useMemo(() => {
    return fields.find(f => f.id === kanbanGroupFieldId);
  }, [fields, kanbanGroupFieldId]);

  const kanbanColumns = useMemo(() => {
    if (!kanbanGroupField) return ['General'];
    if (kanbanGroupField.options) {
      return kanbanGroupField.options.split(/,|\n/).map((o: string) => o.trim()).filter(Boolean);
    }
    if (kanbanGroupField.field_type === 'checkbox') {
      return ['true', 'false'];
    }
    return ['No Value', 'Has Value'];
  }, [kanbanGroupField]);

  const kanbanRecordsByColumn = useMemo(() => {
    const map: Record<string, any[]> = {};
    kanbanColumns.forEach(c => {
      map[c] = [];
    });
    
    processedRecords.forEach(rec => {
      if (!kanbanGroupField) {
        map['General'] = map['General'] || [];
        map['General'].push(rec);
        return;
      }
      
      const val = String(rec.values[kanbanGroupField.id] || '').trim();
      let matchedCol = kanbanColumns.find(col => col.toLowerCase() === val.toLowerCase());
      
      if (!matchedCol) {
        if (kanbanGroupField.field_type === 'checkbox') {
          matchedCol = val === 'true' ? 'true' : 'false';
        } else {
          matchedCol = kanbanColumns[0]; // fallback
        }
      }
      if (matchedCol) {
        map[matchedCol].push(rec);
      }
    });
    return map;
  }, [kanbanColumns, processedRecords, kanbanGroupField]);

  // Update record stage from Kanban instantly
  const handleMoveKanbanStage = async (record: any, targetCol: string) => {
    if (!kanbanGroupField) return;
    try {
      const updatedVals = { ...record.values, [kanbanGroupField.id]: targetCol };
      await saveCustomFieldValues(record.entity_id, updatedVals);
      await logCustomAction('Update Record Stage', record.entity_id, { tab: activeTab, values: updatedVals });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Gallery view image fields finder
  const imageField = useMemo(() => {
    return fields.find(f => f.field_type === 'file' || f.field_name.toLowerCase().includes('image') || f.field_label_en.toLowerCase().includes('image'));
  }, [fields]);

  // Dashboard Aggregates
  const dashboardStats = useMemo(() => {
    if (processedRecords.length === 0) return { total: 0, chartData: [] };
    
    // Group by kanbanGroupField or first select field to show charts
    const groupF = kanbanGroupField || fields.find(f => f.field_type === 'select' || f.options);
    const chartData: any[] = [];
    
    if (groupF) {
      const cols = groupF.options ? groupF.options.split(/,|\n/).map((o: string) => o.trim()).filter(Boolean) : ['True', 'False'];
      const counts: Record<string, number> = {};
      cols.forEach((c: string) => { counts[c] = 0; });
      
      processedRecords.forEach(rec => {
        const v = String(rec.values[groupF.id] || '').trim();
        const matched = cols.find((co: string) => co.toLowerCase() === v.toLowerCase());
        if (matched) {
          counts[matched]++;
        } else {
          counts[cols[0]] = (counts[cols[0]] || 0) + 1;
        }
      });
      
      Object.entries(counts).forEach(([name, value]) => {
        chartData.push({ name, value });
      });
    } else {
      // Timeline default aggregation
      chartData.push({ name: 'Active Records', value: processedRecords.length });
    }

    return {
      total: processedRecords.length,
      chartData
    };
  }, [processedRecords, kanbanGroupField, fields]);

  return (
    <div className="space-y-6">
      {/* Upper control bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-3xs">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">{moduleName}</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tab: {activeTab} • Active workspace data controller</p>
            </div>
          </div>
        </div>

        {/* View Mode Selectors, Import/Export & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Modes */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {[
              { mode: 'list', icon: Grid, label: 'List' },
              { mode: 'kanban', icon: Kanban, label: 'Kanban' },
              { mode: 'gallery', icon: ImageIcon, label: 'Gallery' },
              { mode: 'dashboard', icon: BarChart2, label: 'Dashboard' },
              { mode: 'report', icon: FileText, label: 'Report' },
              { mode: 'logs', icon: History, label: 'Logs' },
            ].map(m => (
              <button
                key={m.mode}
                onClick={() => setViewMode(m.mode as any)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                  viewMode === m.mode 
                    ? "bg-white text-slate-800 shadow-2xs" 
                    : "text-slate-500 hover:text-slate-800"
                )}
                title={m.label}
              >
                <m.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Import CSV */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            accept=".csv" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            title="Import CSV"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Form Tabs Bar */}
      {tabs.length > 1 && (
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                activeTab === tab
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Main Datatable Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Sorting, Searching & List view settings bar */}
        {viewMode !== 'logs' && (
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search records / بحث السجلات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all font-bold text-slate-700"
                />
              </div>

              {/* Column Settings Toggle Button */}
              {viewMode === 'list' && (
                <div className="relative">
                  <button
                    onClick={() => setShowColumnSettings(!showColumnSettings)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="Column Visibility"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden md:inline">Columns</span>
                  </button>

                  {showColumnSettings && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Visible Columns</span>
                        <button onClick={() => setShowColumnSettings(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {fields.map(f => (
                          <label key={f.id} className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50 p-1 rounded-lg">
                            <input
                              type="checkbox"
                              checked={visibleFieldIds[f.id] !== false}
                              onChange={() => setVisibleFieldIds(prev => ({ ...prev, [f.id]: !prev[f.id] }))}
                              className="accent-indigo-600"
                            />
                            <span className="truncate">{f.field_label_en}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sorting controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">Sort By:</span>
                <select
                  value={sortByFieldId}
                  onChange={(e) => setSortByFieldId(e.target.value === 'id' ? 'id' : Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="id">Record ID</option>
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>{f.field_label_en}</option>
                  ))}
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer border border-slate-200"
                  title="Toggle Sort Order"
                >
                  {sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200" />

              <span className="text-xs font-bold text-slate-400">
                {processedRecords.length} entries
              </span>
              <button 
                onClick={fetchData} 
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors border border-slate-200"
                title="Refresh Data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Filters Panel */}
        {filterableFields.length > 0 && viewMode !== 'logs' && (
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-slate-50/70 border-b border-slate-100/80">
            <div className="flex items-center gap-1 text-xs font-black text-slate-500 mr-2">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>Filters / الفلاتر:</span>
            </div>
            {filterableFields.map(f => {
              const currentFilterVal = filters[f.id] || '';
              const uniqueVals = fieldUniqueValues[f.id] || [];
              
              return (
                <div key={f.id} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{f.field_label_en}:</span>
                  <select
                    value={currentFilterVal}
                    onChange={e => setFilters(prev => ({ ...prev, [f.id]: e.target.value }))}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-600 outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                  >
                    <option value="">All / الكل</option>
                    {uniqueVals.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              );
            })}
            {Object.values(filters).some(Boolean) && (
              <button
                onClick={() => setFilters({})}
                className="ml-auto text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-wider flex items-center gap-1 transition-all bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100/50"
              >
                <X className="w-2.5 h-2.5" /> Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Dynamic Rendering of Views */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-xs gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <span>Syncing database records...</span>
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-24 px-6 bg-slate-50/50">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-sm font-black text-slate-700 uppercase">No Fields Configured / لا توجد حقول</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 font-bold leading-relaxed">
              Use the <strong className="text-indigo-600 font-bold">Form Customizer / مخصص النموذج</strong> tab inside the Admin Build Module to design your inputs first.
            </p>
          </div>
        ) : processedRecords.length === 0 && viewMode !== 'logs' ? (
          <div className="text-center py-24 px-6 bg-slate-50/20">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-sm font-black text-slate-500 uppercase">No records found / لم يتم العثور على سجلات</h3>
            <p className="text-xs text-slate-400 mt-1 font-bold">Get started by creating your first entry in this module form!</p>
            <button
              onClick={handleCreate}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Record / إضافة سجل
            </button>
          </div>
        ) : (
          <div>
            {/* 1. LIST VIEW */}
            {viewMode === 'list' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Record ID</th>
                      {fields.filter(f => visibleFieldIds[f.id] !== false).map((f: any) => (
                        <th key={f.id} className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                          {f.field_label_en}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedRecords.map((rec) => (
                      <tr key={rec.entity_id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                          #{rec.entity_id}
                        </td>
                        {fields.filter(f => visibleFieldIds[f.id] !== false).map((f: any) => {
                          const rawVal = rec.values[f.id] || '';
                          let displayVal = rawVal;
                          
                          if (f.field_type === 'relation' && relationDisplays[f.id]) {
                            displayVal = relationDisplays[f.id][String(rawVal)] || `ID: ${rawVal}`;
                          }

                          return (
                            <td key={f.id} className="px-6 py-4 text-xs font-black text-slate-700">
                              {f.field_type === 'relation' ? (
                                <span className="text-indigo-600 inline-flex items-center gap-1 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100/50 font-bold">
                                  <Link2 className="w-3 h-3 text-indigo-400 shrink-0" />
                                  {displayVal}
                                </span>
                              ) : (
                                displayVal
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => setViewingRecord(rec)}
                              className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEdit(rec)}
                              className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(rec.entity_id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. KANBAN VIEW */}
            {viewMode === 'kanban' && (
              <div className="p-6 space-y-4">
                {/* Selector for grouping Kanban column */}
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 w-fit">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Group By Column / تصنيف الأعمدة:</span>
                  <select
                    value={kanbanGroupFieldId || ''}
                    onChange={(e) => setKanbanGroupFieldId(Number(e.target.value) || null)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-600 outline-none cursor-pointer focus:border-indigo-500"
                  >
                    {fields.filter(f => f.field_type === 'select' || f.options).map(f => (
                      <option key={f.id} value={f.id}>{f.field_label_en}</option>
                    ))}
                    {fields.filter(f => f.field_type !== 'select' && !f.options).map(f => (
                      <option key={f.id} value={f.id}>{f.field_label_en} (Virtual)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
                  {kanbanColumns.map(col => {
                    const colRecords = kanbanRecordsByColumn[col] || [];
                    return (
                      <div key={col} className="bg-slate-50 p-4 rounded-3xl border border-slate-200/60 flex flex-col min-w-[280px] max-h-[500px]">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{col}</span>
                          <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">{colRecords.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          {colRecords.map(rec => (
                            <div key={rec.entity_id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-2 hover:shadow-2xs transition-all relative group">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-slate-400">#{rec.entity_id}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => setViewingRecord(rec)} className="p-1 hover:bg-slate-50 text-slate-500 rounded-lg cursor-pointer">
                                    <Eye className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => handleEdit(rec)} className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer">
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1">
                                {fields.slice(0, 3).map(f => (
                                  <p key={f.id} className="text-xs text-slate-600 truncate font-bold">
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">{f.field_label_en}</span>
                                    {rec.values[f.id] || '—'}
                                  </p>
                                ))}
                              </div>

                              {/* Click-to-move quick selector */}
                              {kanbanGroupField && (
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                                  <span className="text-[9px] font-black text-slate-400 uppercase">Move To:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {kanbanColumns.filter(c => c !== col).map(targetCol => (
                                      <button
                                        key={targetCol}
                                        onClick={() => handleMoveKanbanStage(rec, targetCol)}
                                        className="text-[9px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md cursor-pointer transition-all uppercase"
                                      >
                                        {targetCol}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {colRecords.length === 0 && (
                            <div className="text-center py-12 text-slate-400 text-xs font-bold border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                              Empty column / فارغ
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. IMAGE VIEW / GALLERY */}
            {viewMode === 'gallery' && (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {processedRecords.map(rec => {
                  const imageSrc = imageField ? rec.values[imageField.id] : '';
                  return (
                    <div key={rec.entity_id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-3xs hover:shadow-2xs transition-all flex flex-col group">
                      <div className="bg-slate-100 aspect-video relative flex items-center justify-center overflow-hidden">
                        {imageSrc ? (
                          <img 
                            src={imageSrc} 
                            alt={`Record #${rec.entity_id}`} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-slate-400">
                            <ImageIcon className="w-8 h-8 opacity-55" />
                            <span className="text-[10px] font-black uppercase tracking-wider">No Image Attached</span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-slate-900/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                          #{rec.entity_id}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          {fields.slice(0, 3).map(f => (
                            <div key={f.id} className="text-xs">
                              <span className="text-[10px] text-slate-400 uppercase font-black block">{f.field_label_en}</span>
                              <span className="text-slate-700 font-bold truncate block">{rec.values[f.id] || '—'}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <button
                            onClick={() => setViewingRecord(rec)}
                            className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>View details</span> <ArrowRight className="w-3 h-3" />
                          </button>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEdit(rec)} className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(rec.entity_id)} className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. DASHBOARD VIEW */}
            {viewMode === 'dashboard' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-3xs">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Total Records</span>
                      <span className="text-3xl font-black text-slate-800">{dashboardStats.total}</span>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-3xs">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Tab Schema Fields</span>
                      <span className="text-3xl font-black text-slate-800">{fields.length}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-3xs">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Active Modules Count</span>
                      <span className="text-3xl font-black text-slate-800">14</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 space-y-4">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Records Distribution by Option Groups</h3>
                  <div className="h-72 w-full">
                    {dashboardStats.chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashboardStats.chartData}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                          <Legend />
                          <Bar dataKey="value" name="Records Count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                        Add a dropdown/select custom field in form customizer to view active analytics charts.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. REPORT VIEW */}
            {viewMode === 'report' && (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 bg-slate-50 p-4 rounded-2xl">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-slate-800 uppercase">Print & PDF Report Exporter</h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Generate clean tabular document files easily</p>
                  </div>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Printer className="w-4 h-4" /> Download PDF Report / تحميل ملف التقرير
                  </button>
                </div>

                {/* Printable styled Report View */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-6" id="printable-report-area">
                  <div className="text-center pb-6 border-b border-slate-100 space-y-1 mb-6">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">{moduleName} - Report</h2>
                    <p className="text-xs text-slate-400">Generated on: {new Date().toLocaleDateString()}</p>
                  </div>

                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-black uppercase">
                        <th className="py-2.5">Record ID</th>
                        {fields.map(f => (
                          <th key={f.id} className="py-2.5">{f.field_label_en}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {processedRecords.map(rec => (
                        <tr key={rec.entity_id}>
                          <td className="py-2.5 font-mono text-[11px] text-slate-400">#{rec.entity_id}</td>
                          {fields.map(f => {
                            const val = rec.values[f.id] || '';
                            const display = f.field_type === 'relation' && relationDisplays[f.id] ? (relationDisplays[f.id][String(val)] || val) : val;
                            return (
                              <td key={f.id} className="py-2.5">{display}</td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. LOG HISTORY VIEW */}
            {viewMode === 'logs' && (
              <div className="p-6">
                <div className="space-y-4 max-w-3xl mx-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                      <History className="w-4 h-4 text-indigo-500" />
                      <span>Audit Trail History Logs / سجل النشاط والعمليات</span>
                    </h3>
                    <button onClick={fetchLogs} className="p-1.5 hover:bg-slate-50 text-slate-500 rounded-lg transition-colors border border-slate-200">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {loadingLogs ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                      <span>Fetching audit trail logs...</span>
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs font-bold border-2 border-dashed border-slate-100 rounded-3xl">
                      No logs recorded for this module yet. / لا توجد سجلات عمليات حالياً
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {auditLogs.map((log: any) => {
                        let parsedDetails: any = null;
                        try {
                          parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                        } catch (e) {}

                        return (
                          <div key={log.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                                  log.action.includes('Create') ? "bg-emerald-100 text-emerald-800" :
                                  log.action.includes('Update') ? "bg-amber-100 text-amber-800" :
                                  log.action.includes('Delete') ? "bg-rose-100 text-rose-800" :
                                  "bg-indigo-100 text-indigo-800"
                                )}>
                                  {log.action}
                                </span>
                                <span className="text-slate-700 font-bold">By {log.user_name || 'System User'}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-bold font-mono">
                                Record Reference ID: #{log.entity_id || 'N/A'}
                              </p>
                              {parsedDetails && parsedDetails.values && (
                                <div className="mt-1 bg-white p-2 rounded-lg border border-slate-100 max-h-24 overflow-y-auto text-[10px] text-slate-500 font-bold">
                                  {Object.entries(parsedDetails.values).map(([fId, val]: any) => {
                                    const fieldObj = fields.find(f => f.id === Number(fId));
                                    return (
                                      <div key={fId}>
                                        <span className="text-slate-400 uppercase">{fieldObj?.field_label_en || fId}:</span> {String(val)}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reusable View Record Detail Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-800 uppercase">Record Details / تفاصيل السجل</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Record ID: #{viewingRecord.entity_id}</p>
              </div>
              <button 
                onClick={() => setViewingRecord(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              {fields.map(f => {
                const rawVal = viewingRecord.values[f.id] || '';
                let displayVal = rawVal;
                
                if (f.field_type === 'relation' && relationDisplays[f.id]) {
                  displayVal = relationDisplays[f.id][String(rawVal)] || `ID: ${rawVal}`;
                }

                return (
                  <div key={f.id} className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 last:border-b-0 text-xs">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide col-span-1">{f.field_label_en}:</span>
                    <div className="col-span-2 text-slate-700 font-bold break-words">
                      {f.field_type === 'relation' ? (
                        <span className="text-indigo-600 inline-flex items-center gap-1 bg-indigo-50/50 px-2.5 py-0.5 rounded border border-indigo-100/50">
                          <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                          {displayVal}
                        </span>
                      ) : f.field_type === 'file' || f.field_name.toLowerCase().includes('image') ? (
                        rawVal ? (
                          <div className="space-y-2">
                            <img src={rawVal} alt={f.field_label_en} className="rounded-xl border border-slate-200 max-h-36 object-contain" referrerPolicy="no-referrer" />
                            <a href={rawVal} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline block text-[10px]">Open file attachment</a>
                          </div>
                        ) : '—'
                      ) : (
                        displayVal || '—'
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all"
              >
                Close / إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Creation/Editing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{selectedEntityId ? 'Edit Record / تعديل السجل' : 'Create Record / إضافة سجل'}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Fill out custom form attributes for {activeTab}.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-6 max-h-[450px] overflow-y-auto">
                <CustomFieldsForm 
                  entityType={entityType} 
                  entityId={selectedEntityId} 
                  onChange={(vals) => setFormValues(vals)}
                />
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
