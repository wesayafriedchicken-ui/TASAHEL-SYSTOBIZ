import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, Play, ArrowRight, Eye, RefreshCw, Sparkles, Layout, SlidersHorizontal,
  ChevronRight, Calendar, Paperclip, Barcode, Shield, Star, Trash2, MapPin, 
  Code, Database, CheckCircle2, AlertTriangle, PenTool, Plus, X, ListCollapse
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomField {
  id: number;
  company_id: number;
  entity_type: string;
  field_name: string;
  field_label_ar: string;
  field_label_en: string;
  field_type: string;
  is_required: boolean;
  options: string | null;
  relation_target_table: string | null;
  relation_display_column: string | null;
  order_index: number;
  allow_search: boolean;
  add_to_filter: boolean;
}

interface SystemModule {
  id: string;
  name: string;
  is_active: boolean;
  order_index: number;
  metadata?: any;
}

interface FormPreviewProps {
  activeModule: SystemModule;
  modTabs: string[];
  fields: CustomField[];
  initialTab?: string;
}

export default function FormPreview({ activeModule, modTabs, fields, initialTab }: FormPreviewProps) {
  // Local active tab within the previewer
  const [selectedTab, setSelectedTab] = useState<string>(initialTab || modTabs[0] || 'Details');

  // Input state
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // Custom states for interactive elements
  const [activeBarcodeScanner, setActiveBarcodeScanner] = useState<string | null>(null);
  const [showLookupDropdown, setShowLookupDropdown] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Record<string, Array<Record<string, any>>>>({});
  const [signaturePaths, setSignaturePaths] = useState<Record<string, string[]>>({});
  const [isDrawing, setIsDrawing] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  
  // Submission validation and results
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitPayload, setSubmitPayload] = useState<any | null>(null);

  // Compute active fields for this tab
  const activeFields = useMemo(() => {
    const entityType = `${activeModule.id}:${selectedTab}`;
    return fields
      .filter(f => f.entity_type === entityType)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }, [fields, activeModule, selectedTab]);

  // Segment activeFields into tabs if there are any form_tab layout components
  const tabbedFields = useMemo(() => {
    let currentTabId = 'pre-tab';
    const grouped: Record<string, CustomField[]> = { 'pre-tab': [] };
    const labels: Record<string, { en: string, ar: string }> = { 'pre-tab': { en: 'General', ar: 'عام' } };

    activeFields.forEach(f => {
      const isFormTab = f.field_type === 'form_tab' || f.field_name.includes('form_tab_');
      if (isFormTab) {
        currentTabId = String(f.id);
        grouped[currentTabId] = [];
        labels[currentTabId] = { en: f.field_label_en, ar: f.field_label_ar };
      } else {
        grouped[currentTabId].push(f);
      }
    });

    if (grouped['pre-tab'].length === 0) {
      delete grouped['pre-tab'];
      delete labels['pre-tab'];
    }

    return { grouped, labels };
  }, [activeFields]);

  const formTabKeys = useMemo(() => Object.keys(tabbedFields.grouped), [tabbedFields]);

  const [selectedFormTabKey, setSelectedFormTabKey] = useState<string>('');

  useEffect(() => {
    if (formTabKeys.length > 0 && !formTabKeys.includes(selectedFormTabKey)) {
      setSelectedFormTabKey(formTabKeys[0]);
    }
  }, [formTabKeys, selectedFormTabKey]);

  const fieldsToRender = useMemo(() => {
    if (formTabKeys.length === 0) return activeFields;
    return tabbedFields.grouped[selectedFormTabKey] || [];
  }, [activeFields, tabbedFields, selectedFormTabKey, formTabKeys]);

  // Handle standard input change
  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
    }
  };

  // Autocomplete suggestions mock data
  const getMockSuggestions = (fieldName: string) => {
    return [
      `Sample Option 1 for ${fieldName}`,
      `Sample Option 2 for ${fieldName}`,
      `Reference Data Row A`,
      `Reference Data Row B`
    ];
  };

  // Simulated Barcode Scanning
  const triggerBarcodeScan = (fieldName: string) => {
    setActiveBarcodeScanner(fieldName);
    setTimeout(() => {
      const generatedBarcode = '978020137962' + Math.floor(Math.random() * 10);
      handleInputChange(fieldName, generatedBarcode);
      setActiveBarcodeScanner(null);
    }, 1200);
  };

  // Add row to Custom Interactive Table
  const handleAddTableRow = (fieldName: string) => {
    const newRow = {
      id: Math.random().toString(36).substr(2, 9),
      item_code: 'ITEM-' + Math.floor(1000 + Math.random() * 9000),
      quantity: Math.floor(1 + Math.random() * 10),
      unit_price: parseFloat((10 + Math.random() * 90).toFixed(2)),
      description: 'Test interactive table row description details.'
    };
    const currentRows = tableData[fieldName] || [];
    const updated = [...currentRows, newRow];
    setTableData(prev => ({ ...prev, [fieldName]: updated }));
    handleInputChange(fieldName, updated);
  };

  const handleRemoveTableRow = (fieldName: string, rowId: string) => {
    const currentRows = tableData[fieldName] || [];
    const updated = currentRows.filter(r => r.id !== rowId);
    setTableData(prev => ({ ...prev, [fieldName]: updated }));
    handleInputChange(fieldName, updated);
  };

  // Signature drawing handlers
  const handleSignatureStart = (e: React.MouseEvent<HTMLDivElement>, fieldName: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(fieldName);
    setCurrentPath(`M ${x} ${y}`);
  };

  const handleSignatureMove = (e: React.MouseEvent<HTMLDivElement>, fieldName: string) => {
    if (isDrawing !== fieldName) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath(prev => `${prev} L ${x} ${y}`);
  };

  const handleSignatureEnd = (fieldName: string) => {
    if (isDrawing !== fieldName) return;
    if (currentPath) {
      const currentPaths = signaturePaths[fieldName] || [];
      const updated = [...currentPaths, currentPath];
      setSignaturePaths(prev => ({ ...prev, [fieldName]: updated }));
      handleInputChange(fieldName, `signature-svg-points-count-${updated.length}`);
    }
    setIsDrawing(null);
    setCurrentPath('');
  };

  const clearSignature = (fieldName: string) => {
    setSignaturePaths(prev => ({ ...prev, [fieldName]: [] }));
    handleInputChange(fieldName, null);
  };

  // Form submission simulation
  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    activeFields.forEach(f => {
      if (f.is_required) {
        const val = formData[f.field_name];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          errors[f.field_name] = `Field "${f.field_label_en || f.field_name}" is required.`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSubmitPayload(null);
    } else {
      setValidationErrors({});
      // Build visual payload
      setSubmitPayload({
        module_id: activeModule.id,
        tab_name: selectedTab,
        timestamp: new Date().toISOString(),
        company_id: 1,
        payload_data: formData
      });
    }
  };

  const resetForm = () => {
    setFormData({});
    setTableData({});
    setSignaturePaths({});
    setValidationErrors({});
    setSubmitPayload(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab bar header within the previewer */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-black text-slate-800">Interactive Preview Console / لوحة المعاينة التفاعلية</h3>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Test the current layouts, tabs, and fields exactly as users will see them</p>
        </div>

        {/* Tab switcher inside previewer */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-xl">
          {modTabs.map(tab => (
            <button
              key={tab}
              onClick={() => {
                setSelectedTab(tab);
                setSubmitPayload(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedTab === tab 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: INTERACTIVE FORM CONTAINER */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs relative">
          
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Simulated Form Environment</span>
              <h4 className="text-md font-black text-slate-900">{activeModule.name} - Tab: {selectedTab}</h4>
            </div>
            <button 
              onClick={resetForm}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Form / تفريغ الحقول</span>
            </button>
          </div>

          {activeFields.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <ListCollapse className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h5 className="font-bold text-slate-500 text-sm">No custom fields added on this tab yet</h5>
              <p className="text-xs text-slate-400 mt-1">Go to "Form Customizer" tab to add input fields to this tab.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Form internal tab switcher */}
              {formTabKeys.length > 1 && (
                <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  {formTabKeys.map(key => {
                    const isSelected = selectedFormTabKey === key;
                    const label = tabbedFields.labels[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedFormTabKey(key)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex-1 md:flex-none text-center ${
                          isSelected
                            ? "bg-white text-violet-700 shadow-xs border border-slate-200/50"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <span>{label.en}</span>
                        {label.ar && label.ar !== label.en && <span className="text-[10px] opacity-70 block sm:inline sm:ml-1 font-normal font-sans">({label.ar})</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              <form onSubmit={handleTestSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fieldsToRender.map(f => {
                    const isSectionBreak = f.field_type === 'section_break' || f.field_name.includes('section_');
                    const isColumnBreak = f.field_type === 'column_break' || f.field_name.includes('column_');
                    const isEmptyColumn = f.field_type === 'empty_column' || f.field_name.includes('empty_');
                    const isFormTab = f.field_type === 'form_tab' || f.field_name.includes('form_tab_');
                    const hasError = validationErrors[f.field_name];

                    if (isFormTab) return null;

                    if (isSectionBreak) {
                    return (
                      <div key={f.id} className="col-span-1 md:col-span-2 pt-6 pb-2 border-b border-indigo-100 flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Layout className="w-4 h-4" />
                          {f.field_label_en} / {f.field_label_ar}
                        </span>
                        <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase bg-indigo-50 px-2 py-0.5 rounded-full">Section Divider</span>
                      </div>
                    );
                  }

                  if (isColumnBreak || isEmptyColumn) {
                    return (
                      <div key={f.id} className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          {isColumnBreak ? 'COLUMN REPOSITION' : 'LAYOUT SPACER'}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">Helper Node</span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={f.id} 
                      className={`space-y-1.5 ${
                        f.field_type === 'long_text' || f.field_type === 'text_editor' || f.field_type === 'Table' || f.field_type === 'Signature' || f.field_type === 'HTML' || f.field_type === 'HTML Editor' || f.field_type === 'Markdown Editor'
                          ? 'col-span-1 md:col-span-2' 
                          : ''
                      }`}
                    >
                      {/* Label block */}
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span>{f.field_label_en}</span>
                          <span className="text-slate-400 font-medium">({f.field_label_ar})</span>
                          {f.is_required && <span className="text-rose-500 ml-0.5">*</span>}
                        </label>
                        <span className="text-[8px] font-mono text-slate-400 uppercase font-black tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">{f.field_type}</span>
                      </div>

                      {/* Interactive Component Mapping based on exact 42 Field Types */}
                      <div>
                        {f.field_type === 'Select' ? (
                          <select
                            value={formData[f.field_name] || ''}
                            onChange={(e) => handleInputChange(f.field_name, e.target.value)}
                            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all ${
                              hasError ? 'border-rose-300 ring-2 ring-rose-500/5 focus:border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                            }`}
                          >
                            <option value="">Choose Option / اختر...</option>
                            {f.options?.split(/[,\n]/).map(opt => {
                              const trimmed = opt.trim();
                              return trimmed ? <option key={trimmed} value={trimmed}>{trimmed}</option> : null;
                            })}
                          </select>
                        ) : f.field_type === 'Autocomplete' || f.field_type === 'Link' || f.field_type === 'Dynamic Link' ? (
                          <div className="relative">
                            <input
                              type="text"
                              value={formData[f.field_name] || ''}
                              placeholder="Type to search mock relations..."
                              onFocus={() => setShowLookupDropdown(f.field_name)}
                              onBlur={() => setTimeout(() => setShowLookupDropdown(null), 200)}
                              onChange={(e) => handleInputChange(f.field_name, e.target.value)}
                              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all ${
                                hasError ? 'border-rose-300 ring-2 ring-rose-500/5 focus:border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                              }`}
                            />
                            {showLookupDropdown === f.field_name && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-slate-100">
                                {getMockSuggestions(f.field_name).map(s => (
                                  <button
                                    key={s}
                                    type="button"
                                    onMouseDown={() => handleInputChange(f.field_name, s)}
                                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : f.field_type === 'Check' ? (
                          <label className="flex items-center gap-2 cursor-pointer py-1.5">
                            <input
                              type="checkbox"
                              checked={!!formData[f.field_name]}
                              onChange={(e) => handleInputChange(f.field_name, e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs text-slate-600 font-bold select-none">Enable / تفعيل الحقل</span>
                          </label>
                        ) : f.field_type === 'Rating' ? (
                          <div className="flex items-center gap-1.5 py-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                type="button"
                                key={star}
                                onClick={() => handleInputChange(f.field_name, star)}
                                className="focus:outline-none transition-transform active:scale-125"
                              >
                                <Star 
                                  className={`w-6 h-6 ${
                                    (formData[f.field_name] || 0) >= star 
                                      ? 'text-amber-400 fill-amber-400' 
                                      : 'text-slate-200 hover:text-amber-200'
                                  }`} 
                                />
                              </button>
                            ))}
                            <span className="text-xs text-slate-400 font-bold ml-2">{(formData[f.field_name] || 0)} / 5 stars</span>
                          </div>
                        ) : f.field_type === 'Barcode' ? (
                          <div className="relative">
                            <input
                              type="text"
                              value={formData[f.field_name] || ''}
                              placeholder="Barcode data (Click Scan icon to test)"
                              onChange={(e) => handleInputChange(f.field_name, e.target.value)}
                              className={`w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all ${
                                hasError ? 'border-rose-300 ring-2 ring-rose-500/5' : 'border-slate-200'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => triggerBarcodeScan(f.field_name)}
                              disabled={activeBarcodeScanner === f.field_name}
                              className="absolute left-3 top-2.5 p-1 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Simulate Barcode Scanner"
                            >
                              <Barcode className={`w-4 h-4 ${activeBarcodeScanner === f.field_name ? 'animate-pulse text-rose-500' : ''}`} />
                            </button>
                          </div>
                        ) : f.field_type === 'Attach' || f.field_type === 'Attach Image' ? (
                          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <Paperclip className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                            <label className="cursor-pointer block">
                              <span className="text-xs text-indigo-600 font-black hover:underline">Click to Upload / اضغط للتحميل</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleInputChange(f.field_name, `${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
                                }}
                              />
                            </label>
                            <p className="text-[10px] text-slate-400 mt-1">Accepts {f.field_type === 'Attach Image' ? 'JPG, PNG, WebP' : 'PDF, DOCX, ZIP'} up to 25MB</p>
                            {formData[f.field_name] && (
                              <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 text-[10px] text-emerald-700 font-bold inline-flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" />
                                <span>Uploaded: {formData[f.field_name]}</span>
                              </div>
                            )}
                          </div>
                        ) : f.field_type === 'Signature' ? (
                          <div className="space-y-2">
                            <div 
                              className="border border-slate-200 rounded-xl h-36 bg-slate-50 relative cursor-crosshair overflow-hidden touch-none"
                              onMouseDown={(e) => handleSignatureStart(e, f.field_name)}
                              onMouseMove={(e) => handleSignatureMove(e, f.field_name)}
                              onMouseUp={() => handleSignatureEnd(f.field_name)}
                              onMouseLeave={() => handleSignatureEnd(f.field_name)}
                            >
                              {/* Vector Signature Line Rendering */}
                              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                {(signaturePaths[f.field_name] || []).map((path, idx) => (
                                  <path key={idx} d={path} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                ))}
                                {isDrawing === f.field_name && currentPath && (
                                  <path d={currentPath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                )}
                              </svg>

                              <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                                <button
                                  type="button"
                                  onClick={() => clearSignature(f.field_name)}
                                  className="px-2 py-1 text-[10px] font-black text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                                >
                                  Clear / مسح التوقيع
                                </button>
                              </div>

                              {(!signaturePaths[f.field_name] || signaturePaths[f.field_name].length === 0) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                                  <PenTool className="w-5 h-5 mb-1 opacity-60" />
                                  <span className="text-[10px] font-bold">Hold Click and Draw Signature here</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : f.field_type === 'Table' ? (
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                              <span className="text-[10px] font-mono font-black text-slate-500 uppercase">Interactive Child Grid</span>
                              <button
                                type="button"
                                onClick={() => handleAddTableRow(f.field_name)}
                                className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Row / إضافة سطر</span>
                              </button>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-[11px] divide-y divide-slate-200">
                                <thead className="bg-slate-100 text-slate-500 font-bold">
                                  <tr>
                                    <th className="px-3 py-2">Item Code</th>
                                    <th className="px-3 py-2">Quantity</th>
                                    <th className="px-3 py-2">Unit Price ($)</th>
                                    <th className="px-3 py-2">Total ($)</th>
                                    <th className="px-3 py-2 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {(tableData[f.field_name] || []).map(row => (
                                    <tr key={row.id} className="hover:bg-slate-50/50">
                                      <td className="px-3 py-2 font-mono text-indigo-600">{row.item_code}</td>
                                      <td className="px-3 py-2">{row.quantity}</td>
                                      <td className="px-3 py-2">${row.unit_price}</td>
                                      <td className="px-3 py-2 font-bold">${(row.quantity * row.unit_price).toFixed(2)}</td>
                                      <td className="px-3 py-2 text-right">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveTableRow(f.field_name, row.id)}
                                          className="text-rose-500 hover:text-rose-700 p-0.5 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                  {(!tableData[f.field_name] || tableData[f.field_name].length === 0) && (
                                    <tr>
                                      <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                                        No child records. Click "Add Row" to test dynamic child records.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : f.field_type === 'Color' ? (
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={formData[f.field_name] || '#4f46e5'}
                              onChange={(e) => handleInputChange(f.field_name, e.target.value)}
                              className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formData[f.field_name] || '#4f46e5'}
                              onChange={(e) => handleInputChange(f.field_name, e.target.value)}
                              className="text-xs px-3 py-2 rounded-lg border border-slate-200 w-32 focus:outline-none"
                            />
                          </div>
                        ) : f.field_type === 'HTML' || f.field_type === 'HTML Editor' ? (
                          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
                            <span className="text-[9px] font-mono font-bold text-slate-400 block">RENDERED STATIC HTML COMPONENT</span>
                            <div className="text-slate-700 font-bold leading-relaxed">
                              {f.options || '<strong>Testing custom inline HTML.</strong> Custom structural templates display instantly.'}
                            </div>
                          </div>
                        ) : f.field_type === 'Heading' ? (
                          <div className="col-span-1 md:col-span-2 py-2">
                            <h2 className="text-md font-black text-slate-800 tracking-tight border-l-4 border-indigo-500 pl-2">
                              {f.field_label_en} / {f.field_label_ar}
                            </h2>
                          </div>
                        ) : f.field_type === 'Long Text' || f.field_type === 'Small Text' || f.field_type === 'Text Editor' || f.field_type === 'Markdown Editor' ? (
                          <textarea
                            value={formData[f.field_name] || ''}
                            placeholder="Enter text paragraphs to test word wrapping..."
                            rows={3}
                            onChange={(e) => handleInputChange(f.field_name, e.target.value)}
                            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all ${
                              hasError ? 'border-rose-300 ring-2 ring-rose-500/5' : 'border-slate-200'
                            }`}
                          />
                        ) : f.field_type === 'Password' ? (
                          <input
                            type="password"
                            value={formData[f.field_name] || ''}
                            placeholder="Enter test password..."
                            onChange={(e) => handleInputChange(f.field_name, e.target.value)}
                            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all ${
                              hasError ? 'border-rose-300 ring-2 ring-rose-500/5' : 'border-slate-200'
                            }`}
                          />
                        ) : f.field_type === 'Date' || f.field_type === 'Datetime' || f.field_type === 'Time' ? (
                          <input
                            type={f.field_type === 'Date' ? 'date' : f.field_type === 'Time' ? 'time' : 'datetime-local'}
                            value={formData[f.field_name] || ''}
                            onChange={(e) => handleInputChange(f.field_name, e.target.value)}
                            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all ${
                              hasError ? 'border-rose-300 ring-2 ring-rose-500/5' : 'border-slate-200'
                            }`}
                          />
                        ) : f.field_type === 'Int' || f.field_type === 'Float' || f.field_type === 'Currency' || f.field_type === 'Percent' ? (
                          <div className="relative">
                            <input
                              type="number"
                              step={f.field_type === 'Int' ? '1' : '0.01'}
                              value={formData[f.field_name] || ''}
                              placeholder={f.field_type === 'Currency' ? '0.00' : '0'}
                              onChange={(e) => handleInputChange(f.field_name, e.target.value)}
                              className={`w-full text-xs pl-8 pr-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all ${
                                hasError ? 'border-rose-300 ring-2 ring-rose-500/5' : 'border-slate-200'
                              }`}
                            />
                            <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold select-none">
                              {f.field_type === 'Currency' ? '$' : f.field_type === 'Percent' ? '%' : '#'}
                            </span>
                          </div>
                        ) : f.field_type === 'Geolocation' ? (
                          <div className="space-y-1.5">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                readOnly
                                value={formData[f.field_name] || ''}
                                placeholder="30.0444° N, 31.2357° E (Simulated Location)"
                                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50 text-slate-500`}
                              />
                              <button
                                type="button"
                                onClick={() => handleInputChange(f.field_name, `${(24 + Math.random() * 10).toFixed(4)}° N, ${(28 + Math.random() * 10).toFixed(4)}° E`)}
                                className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3.5 py-2 rounded-xl text-xs font-black transition-all"
                              >
                                <MapPin className="w-4 h-4" />
                                <span>Get</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Default Text input fallback for other types
                          <input
                            type="text"
                            value={formData[f.field_name] || ''}
                            placeholder={`Enter mock value for ${f.field_label_en}...`}
                            onChange={(e) => handleInputChange(f.field_name, e.target.value)}
                            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all ${
                              hasError ? 'border-rose-300 ring-2 ring-rose-500/5' : 'border-slate-200'
                            }`}
                          />
                        )}
                      </div>

                      {/* Error message block */}
                      {hasError && (
                        <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{hasError}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit triggers validation and JSON results */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Test Submit Form / تجربة إرسال النموذج</span>
                </button>
              </div>
            </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: RAW STATE payload INSPECTOR */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-black uppercase tracking-wider">Payload Inspector</h4>
              </div>
              <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded">Live state</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              As you interact with fields on the left, see exactly how the database custom engine captures and structures the input values in real-time.
            </p>

            <div className="space-y-1.5 bg-black/40 rounded-xl p-4 font-mono text-[10px] text-slate-300 overflow-x-auto border border-white/5 min-h-64 max-h-[420px]">
              <pre className="whitespace-pre-wrap">{JSON.stringify(formData, null, 2)}</pre>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Validation Health</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Required fields filled:</span>
                <span>
                  {activeFields.filter(f => f.is_required && formData[f.field_name]).length} / {activeFields.filter(f => f.is_required).length}
                </span>
              </div>
              
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${
                      activeFields.filter(f => f.is_required).length === 0 
                        ? 100 
                        : (activeFields.filter(f => f.is_required && formData[f.field_name]).length / activeFields.filter(f => f.is_required).length) * 100
                    }%`
                  }}
                />
              </div>

              {Object.keys(validationErrors).length > 0 && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl space-y-1.5 text-[11px] text-rose-700 font-bold">
                  <div className="flex items-center gap-1 text-rose-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Submission Blocked:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    {Object.values(validationErrors).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FULL SCREEN POPUP MODAL SHOWING THE TEST RESULTS ON SUCCESS */}
      <AnimatePresence>
        {submitPayload && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-md font-black text-slate-900">Form Submission Success!</h4>
                    <p className="text-xs text-slate-500">The simulated payload schema matches constraints perfectly</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSubmitPayload(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">System Metadata & Response</h5>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Module ID</span>
                    <span className="font-bold text-slate-800">{submitPayload.module_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Tab</span>
                    <span className="font-bold text-slate-800">{submitPayload.tab_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Client Timestamp</span>
                    <span className="font-mono text-slate-600 text-[11px]">{submitPayload.timestamp}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Engine Match Status</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black text-[10px]">100% VALIDATED</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <Code className="w-4 h-4 text-indigo-500" />
                  <span>Simulated API Request Payload:</span>
                </div>
                <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[10px] text-slate-300 max-h-60 overflow-y-auto">
                  <pre>{JSON.stringify(submitPayload, null, 2)}</pre>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setSubmitPayload(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-6 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Dismiss / إغلاق المعاينة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
