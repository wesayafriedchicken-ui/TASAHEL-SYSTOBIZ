import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  Maximize2,
  HelpCircle,
  Sliders,
  Database
} from 'lucide-react';
import { ColumnMappingItem } from './modals/GoogleSheetsMappingModal';
import { ALL_NEW_DEAL_FIELDS, autoMatchColumnToDealField } from './dealsFieldsRegistry';

interface SheetTabItem {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
}

interface GoogleSheetsSyncCardProps {
  spreadsheetId: string;
  onSpreadsheetIdChange: (id: string) => void;
  sheetTabName: string;
  onSheetTabNameChange: (tab: string) => void;
  authMethod: 'service_account' | 'oauth';
  onAuthMethodChange: (method: 'service_account' | 'oauth') => void;
  serviceAccountEmail: string;
  pollingInterval: 'every_5_mins' | 'hourly' | 'realtime_webhook';
  onPollingIntervalChange: (interval: 'every_5_mins' | 'hourly' | 'realtime_webhook') => void;
  columnMappings: ColumnMappingItem[];
  onColumnMappingsChange: (mappings: ColumnMappingItem[]) => void;
  discoveredColumns: string[];
  onDiscoveredColumnsChange: (cols: string[]) => void;
  lastSheetsSync: string;
  onTriggerSync: () => void;
  onOpenModal: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

// Helper: Extract clean Google Spreadsheet ID from any format (full URL, raw ID, edit link with gid, etc.)
export function extractCleanSpreadsheetId(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/(?:spreadsheets\/)?d\/([a-zA-Z0-9-_]{15,})/);
  if (urlMatch && urlMatch[1]) return urlMatch[1];
  const tokenMatch = trimmed.match(/([a-zA-Z0-9-_]{25,})/);
  if (tokenMatch && tokenMatch[1]) return tokenMatch[1];
  return trimmed.split('/')[0].split('?')[0].split('#')[0].trim();
}

export function extractSheetGid(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const match = input.match(/[#&?]gid=([0-9]+)/);
  return match ? match[1] : null;
}

export const GoogleSheetsSyncCard: React.FC<GoogleSheetsSyncCardProps> = ({
  spreadsheetId,
  onSpreadsheetIdChange,
  sheetTabName,
  onSheetTabNameChange,
  authMethod,
  onAuthMethodChange,
  serviceAccountEmail,
  pollingInterval,
  onPollingIntervalChange,
  columnMappings,
  onColumnMappingsChange,
  discoveredColumns,
  onDiscoveredColumnsChange,
  lastSheetsSync,
  onTriggerSync,
  onOpenModal,
  showToast
}) => {
  const [sheetTabs, setSheetTabs] = useState<SheetTabItem[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<'connected' | 'idle' | 'warning'>('idle');

  // Inline custom mapping input state
  const [inlineNewCol, setInlineNewCol] = useState('');
  const [inlineNewField, setInlineNewField] = useState('title');
  const [isAddingInline, setIsAddingInline] = useState(false);

  // Derive Clean Spreadsheet ID if a full URL or dirty string is pasted
  const cleanSpreadsheetId = useMemo(() => {
    return extractCleanSpreadsheetId(spreadsheetId);
  }, [spreadsheetId]);

  // Categories for /sales/pipeline/deals/new field groupings
  const categories = useMemo(() => {
    return Array.from(new Set(ALL_NEW_DEAL_FIELDS.map((f) => f.category)));
  }, []);

  // Inspect Spreadsheet API caller (Real live Google Sheets inspection)
  const inspectSpreadsheet = useCallback(
    async (rawId: string, targetTab?: string, silent: boolean = false) => {
      const cleanId = extractCleanSpreadsheetId(rawId);
      if (!cleanId || cleanId.length < 15) return;

      setIsInspecting(true);
      try {
        const res = await fetch('/api/crm/integrations/google-sheets/inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spreadsheetId: rawId.trim(),
            sheetTabName: targetTab || sheetTabName
          })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          if (data.sheetTabs && Array.isArray(data.sheetTabs)) {
            setSheetTabs(data.sheetTabs);
          }
          if (data.activeTab) {
            onSheetTabNameChange(data.activeTab);
          } else if (data.sheetTabs && data.sheetTabs.length > 0 && !sheetTabName) {
            onSheetTabNameChange(data.sheetTabs[0].name);
          }

          if (data.discoveredColumns && Array.isArray(data.discoveredColumns) && data.discoveredColumns.length > 0) {
            onDiscoveredColumnsChange(data.discoveredColumns);

            // Auto-generate high-precision mappings based on actual discovered headers
            const autoMapped: ColumnMappingItem[] = data.discoveredColumns.map((col: string) => {
              const matchedKey = autoMatchColumnToDealField(col);
              const fieldMeta = ALL_NEW_DEAL_FIELDS.find((f) => f.key === matchedKey);
              return {
                sheetColumn: col,
                crmField: matchedKey,
                isRequired: fieldMeta?.isRequired || false
              };
            });
            onColumnMappingsChange(autoMapped);
          }

          setConnStatus('connected');
          if (!silent) {
            showToast(
              `Synced! Discovered ${data.sheetTabs?.length || 1} sheet tab(s) & ${data.discoveredColumns?.length || 0} column(s) from "${data.activeTab || targetTab || 'Active Sheet'}".`,
              'success'
            );
          }
        } else {
          setConnStatus('warning');
          if (!silent) {
            showToast(data.error || 'Failed to inspect Google Sheet. Ensure sheet sharing is set to "Anyone with the link can view".', 'error');
          }
        }
      } catch (err: any) {
        setConnStatus('warning');
        if (!silent) {
          showToast(`Network error inspecting spreadsheet: ${err.message}`, 'error');
        }
      } finally {
        setIsInspecting(false);
      }
    },
    [sheetTabName, onSheetTabNameChange, onDiscoveredColumnsChange, onColumnMappingsChange, showToast]
  );

  // Auto-sync when Spreadsheet ID changes (with 600ms debounce)
  useEffect(() => {
    if (!cleanSpreadsheetId || cleanSpreadsheetId.length < 15) {
      setSheetTabs([]);
      setConnStatus('idle');
      return;
    }

    const timer = setTimeout(() => {
      inspectSpreadsheet(cleanSpreadsheetId, sheetTabName, false);
    }, 600);

    return () => clearTimeout(timer);
  }, [cleanSpreadsheetId]);

  // Handle Tab Switch by User - immediately reads columns for the newly chosen tab
  const handleTabChange = (newTab: string) => {
    onSheetTabNameChange(newTab);
    if (cleanSpreadsheetId) {
      inspectSpreadsheet(cleanSpreadsheetId, newTab, false);
    }
  };

  // Handle Manual Sync Click
  const handleManualSyncTabs = () => {
    if (!cleanSpreadsheetId || cleanSpreadsheetId.length < 15) {
      showToast('Please enter a valid Google Spreadsheet ID or URL first', 'error');
      return;
    }
    inspectSpreadsheet(cleanSpreadsheetId, sheetTabName, false);
  };

  // Test Connection (Real Live Google Sheets Reachability Check)
  const handleTestConnection = async () => {
    if (!cleanSpreadsheetId || cleanSpreadsheetId.length < 15) {
      showToast('Please enter a Google Spreadsheet ID or URL first to test connection.', 'error');
      return;
    }
    setIsTestingConn(true);
    try {
      const res = await fetch('/api/crm/integrations/google-sheets/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId: cleanSpreadsheetId })
      });
      const data = await res.json();
      if (res.ok && data.connected) {
        setConnStatus('connected');
        if (data.sheetTabs && Array.isArray(data.sheetTabs) && data.sheetTabs.length > 0) {
          setSheetTabs(data.sheetTabs);
        }
        // Also refresh inspect to load tabs and column headers
        inspectSpreadsheet(cleanSpreadsheetId, sheetTabName, true);
        showToast(data.message || 'Google Sheets API connection verified with 200 OK.', 'success');
      } else {
        setConnStatus('warning');
        showToast(data.error || 'Connection failed. Verify sheet link and ensure "Anyone with the link can view".', 'error');
      }
    } catch (err: any) {
      setConnStatus('warning');
      showToast(`Network error testing connection: ${err.message}`, 'error');
    } finally {
      setIsTestingConn(false);
    }
  };

  // Update a single row's target field
  const handleUpdateRowField = (index: number, newFieldKey: string) => {
    const meta = ALL_NEW_DEAL_FIELDS.find((f) => f.key === newFieldKey);
    const updated = columnMappings.map((item, i) =>
      i === index
        ? {
            ...item,
            crmField: newFieldKey,
            isRequired: meta?.isRequired ?? item.isRequired
          }
        : item
    );
    onColumnMappingsChange(updated);
  };

  // Toggle strict requirement on an inline mapping
  const handleToggleRowRequired = (index: number) => {
    const updated = columnMappings.map((item, i) =>
      i === index ? { ...item, isRequired: !item.isRequired } : item
    );
    onColumnMappingsChange(updated);
  };

  // Delete an inline mapping
  const handleDeleteRow = (index: number) => {
    const updated = columnMappings.filter((_, i) => i !== index);
    onColumnMappingsChange(updated);
  };

  // Add a new mapping inline
  const handleAddInlineMapping = () => {
    const trimmed = inlineNewCol.trim();
    if (!trimmed) {
      showToast('Please enter the spreadsheet column name', 'error');
      return;
    }
    if (columnMappings.some((m) => m.sheetColumn.toLowerCase() === trimmed.toLowerCase())) {
      showToast('This sheet column is already mapped', 'error');
      return;
    }

    const fieldMeta = ALL_NEW_DEAL_FIELDS.find((f) => f.key === inlineNewField);
    const updated = [
      ...columnMappings,
      {
        sheetColumn: trimmed,
        crmField: inlineNewField,
        isRequired: fieldMeta?.isRequired || false
      }
    ];
    onColumnMappingsChange(updated);
    setInlineNewCol('');
    setIsAddingInline(false);
    showToast(`Mapped "${trimmed}" to "${fieldMeta?.label || inlineNewField}"`, 'success');
  };

  // Auto-Match all discovered columns
  const handleAutoMatchAll = () => {
    const cols = discoveredColumns.length > 0
      ? discoveredColumns
      : columnMappings.map((m) => m.sheetColumn);

    const autoMapped: ColumnMappingItem[] = cols.map((col) => {
      const matchedKey = autoMatchColumnToDealField(col);
      const fieldMeta = ALL_NEW_DEAL_FIELDS.find((f) => f.key === matchedKey);
      return {
        sheetColumn: col,
        crmField: matchedKey,
        isRequired: fieldMeta?.isRequired || false
      };
    });

    onColumnMappingsChange(autoMapped);
    showToast(`Auto-matched ${autoMapped.length} columns to /sales/pipeline/deals/new fields!`, 'success');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
            <FileSpreadsheet className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span>Google Sheets Sync Provider</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                Live Engine
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sync spreadsheet rows and map directly to <strong>/sales/pipeline/deals/new</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {connStatus === 'connected' ? 'Connected' : 'Syncing'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-5 flex-1">
        {/* =========================================================================
            1. Spreadsheet ID / URL Key Input with Auto-Sync & Tab Discovery
        ========================================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Spreadsheet ID / URL Key
            </label>
            <span className="text-[11px] text-slate-400">
              Accepts raw ID or full Google Docs URL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => onSpreadsheetIdChange(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  const clean = extractCleanSpreadsheetId(pasted);
                  if (clean && clean.length >= 15) {
                    setTimeout(() => {
                      inspectSpreadsheet(clean, sheetTabName, false);
                    }, 50);
                  }
                }}
                onBlur={() => {
                  if (cleanSpreadsheetId && cleanSpreadsheetId.length >= 15) {
                    inspectSpreadsheet(cleanSpreadsheetId, sheetTabName, false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (cleanSpreadsheetId && cleanSpreadsheetId.length >= 15) {
                      inspectSpreadsheet(cleanSpreadsheetId, sheetTabName, false);
                    }
                  }
                }}
                placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or https://docs.google.com/spreadsheets/d/..."
                className="w-full font-mono text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleManualSyncTabs}
              disabled={isInspecting}
              title="Sync spreadsheet and discover all available sheet tabs & columns"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium shadow-xs transition-colors shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isInspecting ? 'animate-spin' : ''}`} />
              <span>{isInspecting ? 'Discovering...' : 'Sync Tabs'}</span>
            </button>
          </div>

          {/* Clean ID extraction badge */}
          {cleanSpreadsheetId && cleanSpreadsheetId !== spreadsheetId && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Extracted Spreadsheet ID: </span>
              <strong className="font-mono text-emerald-950">{cleanSpreadsheetId}</strong>
            </div>
          )}
        </div>

        {/* =========================================================================
            2. Discovered Sheet Tabs Selector & Authentication
        ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Discovered Sheet Tab Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Active Sheet Tab Name
              </label>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                sheetTabs.length > 0 
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60' 
                  : 'text-slate-500 bg-slate-100 border-slate-200'
              }`}>
                {sheetTabs.length} {sheetTabs.length === 1 ? 'Tab' : 'Tabs'} Found
              </span>
            </div>

            <div className="relative">
              <select
                value={sheetTabName}
                onChange={(e) => handleTabChange(e.target.value)}
                disabled={sheetTabs.length === 0}
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-semibold transition-all disabled:bg-slate-50 disabled:text-slate-400"
              >
                {sheetTabs.length === 0 ? (
                  <option value="">No tabs discovered yet — enter Sheet ID & click "Sync Tabs"</option>
                ) : (
                  sheetTabs.map((tab) => (
                    <option key={tab.id} value={tab.name}>
                      📄 {tab.name} {tab.rowCount ? `(${tab.rowCount} rows · ${tab.columnCount} columns)` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Auth Method */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Authentication Method
            </label>
            <select
              value={authMethod}
              onChange={(e) => onAuthMethodChange(e.target.value as any)}
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all"
            >
              <option value="service_account">Google Service Account (JSON Delegation)</option>
              <option value="oauth">OAuth 2.0 User Session Delegation</option>
            </select>
          </div>
        </div>

        {/* Service Account Principal Box */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="truncate pr-2">
            <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">
              Google Cloud Service Principal
            </span>
            <span className="font-mono text-slate-700 truncate block text-[11px] font-medium">
              {serviceAccountEmail}
            </span>
          </div>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTestingConn}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs shrink-0 transition-colors"
          >
            {isTestingConn ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* =========================================================================
            3. LIVE COLUMN-MAPPING MATRIX (Directly Inline & Exhaustive)
        ========================================================================= */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Live Column-Mapping Matrix
                </h4>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full">
                  All /sales/pipeline/deals/new Fields
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {columnMappings.length} sheet headers mapped to deals pipeline attributes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoMatchAll}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                title="Auto-match sheet columns to /sales/pipeline/deals/new fields using smart heuristics"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Match</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddingInline((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Map</span>
              </button>

              <button
                type="button"
                onClick={onOpenModal}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                title="Open full expanded modal"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Enlarge</span>
              </button>
            </div>
          </div>

          {/* Inline Add Mapping Row */}
          {isAddingInline && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-indigo-900 block">
                Bind Custom Spreadsheet Column
              </span>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={inlineNewCol}
                  onChange={(e) => setInlineNewCol(e.target.value)}
                  placeholder="Sheet Column Header (e.g., Deliverable Notes)"
                  className="w-full sm:flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-mono outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
                <select
                  value={inlineNewField}
                  onChange={(e) => setInlineNewField(e.target.value)}
                  className="w-full sm:flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold outline-hidden focus:ring-1 focus:ring-indigo-500"
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
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAddInlineMapping}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                  >
                    Save Binding
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingInline(false)}
                    className="px-2.5 py-1.5 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Mappings Table / List */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 max-h-72 overflow-y-auto divide-y divide-slate-100">
            {columnMappings.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No column bindings active. Click "Sync Tabs" or "Auto-Match" to populate mappings.
              </div>
            ) : (
              columnMappings.map((item, idx) => {
                const fieldMeta = ALL_NEW_DEAL_FIELDS.find((f) => f.key === item.crmField);

                return (
                  <div
                    key={`${item.sheetColumn}-${idx}`}
                    className="p-2.5 sm:px-3 sm:py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white hover:bg-slate-50 transition-colors"
                  >
                    {/* Left: Sheet Column -> Target Deal Field */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 truncate max-w-[150px] shrink-0">
                        {item.sheetColumn}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <select
                        value={item.crmField}
                        onChange={(e) => handleUpdateRowField(idx, e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500 flex-1 min-w-[200px]"
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

                    {/* Right: Validation & Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {fieldMeta?.isRequired ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
                          Required
                        </span>
                      ) : (
                        <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isRequired}
                            onChange={() => handleToggleRowRequired(idx)}
                            className="w-3.5 h-3.5 rounded-sm text-emerald-600 border-slate-300 focus:ring-emerald-500"
                          />
                          <span>Strict</span>
                        </label>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                        title="Remove column mapping"
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

        {/* =========================================================================
            4. Polling Interval Selection
        ========================================================================= */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Automated Ingestion Frequency
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onPollingIntervalChange('every_5_mins')}
              className={`p-2.5 rounded-xl border text-center transition-all text-xs ${
                pollingInterval === 'every_5_mins'
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
              <span>Every 5 Mins</span>
            </button>
            <button
              type="button"
              onClick={() => onPollingIntervalChange('hourly')}
              className={`p-2.5 rounded-xl border text-center transition-all text-xs ${
                pollingInterval === 'hourly'
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-slate-500" />
              <span>Hourly</span>
            </button>
            <button
              type="button"
              onClick={() => onPollingIntervalChange('realtime_webhook')}
              className={`p-2.5 rounded-xl border text-center transition-all text-xs ${
                pollingInterval === 'realtime_webhook'
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-500" />
              <span>Real-time Trigger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Last polled: <strong className="text-slate-700 font-medium">{lastSheetsSync}</strong>
        </span>
        <button
          type="button"
          onClick={onTriggerSync}
          className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-all"
        >
          Execute Immediate Sync
        </button>
      </div>
    </div>
  );
};
