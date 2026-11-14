import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Lock,
  Eye,
  EyeOff,
  Table,
  Type,
  Shield,
  Save,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  Sliders,
  ChevronDown,
  Layers,
  Edit2,
  Trash2,
  Info
} from 'lucide-react';
import { useModuleSchema } from './useModuleSchema';
import {
  resolveTargetPageFromPath,
  SchemaFieldItem,
  SchemaActionItem,
  SchemaSectionItem
} from './hrModuleRegistry';
import { ConfigureActionModal } from './modals/ConfigureActionModal';
import { ConfigureFieldSecurityModal } from './modals/ConfigureFieldSecurityModal';
import { AddCustomFieldModal } from './modals/AddCustomFieldModal';
import { AddCustomTableModal } from './modals/AddCustomTableModal';
import { AddCustomSectionModal } from './modals/AddCustomSectionModal';
import { cn } from '../../../lib/utils';

export interface ManageModuleSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPage?: string;
  initialTabId?: string;
}

export const ManageModuleSchemaModal: React.FC<ManageModuleSchemaModalProps> = ({
  isOpen,
  onClose,
  targetPage: targetPageProp,
  initialTabId
}) => {
  const location = useLocation();
  const effectiveTargetPage = targetPageProp || resolveTargetPageFromPath(location.pathname);

  const {
    schema,
    isLoading,
    isSaving,
    saveSchema,
    resetSchema,
    addCustomField,
    addCustomTable,
    addCustomSection,
    addActionControl,
    updateActionControl,
    deleteActionControl,
    reorderFields,
    reorderActions,
    updateFieldSecurity,
    deleteFieldOrTable
  } = useModuleSchema(effectiveTargetPage);

  // Active Sub-Tab within the module
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sub-modals state
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [targetSectionForAdd, setTargetSectionForAdd] = useState<string>('');

  const [configuringAction, setConfiguringAction] = useState<{
    sectionName: string;
    action: SchemaActionItem;
  } | null>(null);

  const [configuringField, setConfiguringField] = useState<{
    sectionName: string;
    field: SchemaFieldItem;
  } | null>(null);

  // Synchronize initial tab
  React.useEffect(() => {
    if (schema.subTabs && schema.subTabs.length > 0) {
      if (initialTabId && schema.subTabs.some((t) => t.id === initialTabId)) {
        setActiveTabId(initialTabId);
      } else if (!activeTabId || !schema.subTabs.some((t) => t.id === activeTabId)) {
        setActiveTabId(schema.subTabs[0].id);
      }
    }
  }, [schema, initialTabId, activeTabId]);

  if (!isOpen) return null;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveAll = async () => {
    const success = await saveSchema(schema);
    if (success) {
      showToast('Schema customizations and security settings saved successfully!', 'success');
    } else {
      showToast('Failed to save schema customizations', 'error');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset this page to system default schema?')) {
      const success = await resetSchema();
      if (success) {
        showToast('Reset to default schema successfully', 'success');
      }
    }
  };

  const currentSubTab = schema.subTabs?.find((t) => t.id === activeTabId) || schema.subTabs?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden text-left">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={cn(
              "absolute top-4 left-1/2 -translate-x-1/2 z-60 px-4 py-2 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2",
              toastMessage.type === 'success'
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
            )}
          >
            <Check className="w-4 h-4" />
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Sliders className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Manage Fields, Tables & Actions For {schema.displayName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 ml-8">
              {schema.description || 'Customize layout fields, table structures, and button security controls.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Revert back to system default schema"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SubTabs Navigation Bar & Actions Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* SubTab Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {schema.subTabs?.map((tab) => {
              const isSelected = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search & + Add Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search fields & actions..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white w-44 sm:w-56"
              />
            </div>

            {/* + Add Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isAddMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsAddMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 space-y-1 animate-in fade-in slide-in-from-top-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        setTargetSectionForAdd(currentSubTab?.sections[0]?.name || '');
                        setIsAddFieldOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Type className="w-4 h-4 text-indigo-500" />
                      <span>Add Custom Field</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        setTargetSectionForAdd(currentSubTab?.sections[0]?.name || '');
                        setIsAddTableOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Table className="w-4 h-4 text-purple-500" />
                      <span>Add Custom Table</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        setIsAddSectionOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span>Add Custom Section</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        const firstSec = currentSubTab?.sections[0]?.name || 'General';
                        const newAction: SchemaActionItem = {
                          action_key: `act_${Date.now()}`,
                          tab_id: activeTabId,
                          section_name: firstSec,
                          label_en: 'New Action Button',
                          state: 'active',
                          permission_scope: 'everyone'
                        };
                        addActionControl(activeTabId, firstSec, newAction);
                        setConfiguringAction({ sectionName: firstSec, action: newAction });
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span>+ Add Action / Button Control</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Body: Sections, Fields, Tables, and Actions */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Loading layout schema...</p>
            </div>
          ) : !currentSubTab || currentSubTab.sections.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
              <Layers className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No sections defined in this tab</p>
              <button
                onClick={() => setIsAddSectionOpen(true)}
                className="mt-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                + Add Custom Section
              </button>
            </div>
          ) : (
            currentSubTab.sections.map((section, secIdx) => {
              // Filter items by search
              const filteredItems = section.items.filter((item) =>
                item.label.toLowerCase().includes(searchTerm.toLowerCase())
              );
              const filteredActions = (section.actions || []).filter(
                (act) =>
                  act.label_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (act.label_ar && act.label_ar.includes(searchTerm))
              );

              if (searchTerm && filteredItems.length === 0 && filteredActions.length === 0) {
                return null;
              }

              return (
                <div
                  key={section.name}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
                >
                  {/* Section Title Header */}
                  <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                        {section.name}
                      </h4>
                      <span className="text-[10px] bg-slate-200/80 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                        {filteredItems.length} elements
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetSectionForAdd(section.name);
                          setIsAddFieldOpen(true);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Field</span>
                      </button>

                      <span className="text-slate-300">|</span>

                      <button
                        type="button"
                        onClick={() => {
                          const newAction: SchemaActionItem = {
                            action_key: `act_${Date.now()}`,
                            tab_id: activeTabId,
                            section_name: section.name,
                            label_en: 'New Action Button',
                            state: 'active',
                            permission_scope: 'everyone'
                          };
                          addActionControl(activeTabId, section.name, newAction);
                          setConfiguringAction({ sectionName: section.name, action: newAction });
                        }}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Shield className="w-3 h-3" />
                        <span>+ Add Action</span>
                      </button>
                    </div>
                  </div>

                  {/* Section Content: Fields & Tables List */}
                  <div className="divide-y divide-slate-100">
                    {filteredItems.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No fields in this section
                      </div>
                    ) : (
                      filteredItems.map((item, itemIdx) => {
                        const isTable = item.type === 'table';
                        return (
                          <div
                            key={item.id}
                            className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              {/* Reorder Arrows */}
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  disabled={itemIdx === 0}
                                  onClick={() =>
                                    reorderFields(activeTabId, section.name, itemIdx, itemIdx - 1)
                                  }
                                  className="text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer p-0.5"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={itemIdx === filteredItems.length - 1}
                                  onClick={() =>
                                    reorderFields(activeTabId, section.name, itemIdx, itemIdx + 1)
                                  }
                                  className="text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer p-0.5"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Item Icon */}
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                  isTable
                                    ? "bg-purple-50 text-purple-600"
                                    : "bg-indigo-50 text-indigo-600"
                                )}
                              >
                                {isTable ? <Table className="w-3.5 h-3.5" /> : <Type className="w-3.5 h-3.5" />}
                              </div>

                              {/* Item Label & Badges */}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-800">{item.label}</span>
                                  {item.isCustom && (
                                    <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold">
                                      Custom
                                    </span>
                                  )}
                                  {isTable && (
                                    <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded-full font-bold">
                                      Table
                                    </span>
                                  )}
                                  {item.isRequired && (
                                    <span className="text-[9px] text-rose-500 font-bold">*Required</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  id: {item.id} {item.dataType ? `• ${item.dataType}` : ''}
                                </span>
                              </div>
                            </div>

                            {/* Badges & Actions */}
                            <div className="flex items-center gap-2">
                              {/* Security Level Badge */}
                              <span
                                className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-md font-bold",
                                  item.permLevel === 0 && "bg-slate-100 text-slate-600",
                                  item.permLevel === 1 && "bg-blue-50 text-blue-700 border border-blue-200",
                                  item.permLevel === 2 && "bg-amber-50 text-amber-700 border border-amber-200",
                                  item.permLevel === 3 && "bg-rose-50 text-rose-700 border border-rose-200",
                                  item.permLevel === 4 && "bg-purple-50 text-purple-700 border border-purple-200"
                                )}
                              >
                                L{item.permLevel ?? 0}
                              </span>

                              {/* Mask / Hidden / ReadOnly Badges */}
                              {item.maskValue && (
                                <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                                  Masked
                                </span>
                              )}
                              {item.hidden && (
                                <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                  <EyeOff className="w-2.5 h-2.5" /> Hidden
                                </span>
                              )}
                              {item.readOnly && !item.hidden && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> ReadOnly
                                </span>
                              )}

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setConfiguringField({ sectionName: section.name, field: item })
                                }
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Configure Field Security"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete if Custom */}
                              {item.isCustom && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteFieldOrTable(activeTabId, section.name, item.id)
                                  }
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Custom Field"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Section Action Buttons / Controls */}
                  {filteredActions.length > 0 && (
                    <div className="bg-slate-50/50 p-4 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Action Buttons & UI Controls ({filteredActions.length})</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredActions.map((act, actIdx) => (
                          <div
                            key={act.action_key}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              {/* Reorder */}
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  disabled={actIdx === 0}
                                  onClick={() =>
                                    reorderActions(activeTabId, section.name, actIdx, actIdx - 1)
                                  }
                                  className="text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer p-0.5"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={actIdx === filteredActions.length - 1}
                                  onClick={() =>
                                    reorderActions(activeTabId, section.name, actIdx, actIdx + 1)
                                  }
                                  className="text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer p-0.5"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-2.5 h-2.5" />
                                </button>
                              </div>

                              <div>
                                <span className="text-xs font-bold text-slate-800 block">
                                  {act.label_en}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {act.action_key}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* State Badge */}
                              <span
                                className={cn(
                                  "text-[9px] px-2 py-0.5 rounded-md font-bold",
                                  act.state === 'active' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                                  act.state === 'disabled' && "bg-amber-50 text-amber-700 border border-amber-200",
                                  act.state === 'hidden' && "bg-slate-100 text-slate-500 line-through"
                                )}
                              >
                                {act.state === 'active' ? 'Active' : act.state === 'disabled' ? 'Disabled' : 'Hidden'}
                              </span>

                              {/* Scope Badge */}
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                {act.permission_scope === 'super_admin'
                                  ? 'Admin Only'
                                  : act.permission_scope === 'direct_manager'
                                  ? 'Manager'
                                  : act.permission_scope === 'self'
                                  ? 'Self'
                                  : 'Everyone'}
                              </span>

                              {/* Edit Action Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setConfiguringAction({ sectionName: section.name, action: act })
                                }
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Configure Action Security"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete if custom action */}
                              {act.isCustom && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteActionControl(activeTabId, section.name, act.action_key)
                                  }
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Action"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Sub-Dialogs */}
        <ConfigureActionModal
          isOpen={!!configuringAction}
          onClose={() => setConfiguringAction(null)}
          action={configuringAction?.action || null}
          onSave={(patch) => {
            if (configuringAction) {
              updateActionControl(
                activeTabId,
                configuringAction.sectionName,
                configuringAction.action.action_key,
                patch
              );
            }
          }}
        />

        <ConfigureFieldSecurityModal
          isOpen={!!configuringField}
          onClose={() => setConfiguringField(null)}
          field={configuringField?.field || null}
          onSave={(patch) => {
            if (configuringField) {
              updateFieldSecurity(
                activeTabId,
                configuringField.sectionName,
                configuringField.field.id,
                patch
              );
            }
          }}
        />

        <AddCustomFieldModal
          isOpen={isAddFieldOpen}
          onClose={() => setIsAddFieldOpen(false)}
          sections={currentSubTab?.sections || []}
          defaultSectionName={targetSectionForAdd}
          onAdd={(secName, fieldData) => {
            addCustomField(activeTabId, secName, fieldData);
            showToast('Custom field added! Click Save Settings to persist.', 'success');
          }}
        />

        <AddCustomTableModal
          isOpen={isAddTableOpen}
          onClose={() => setIsAddTableOpen(false)}
          sections={currentSubTab?.sections || []}
          defaultSectionName={targetSectionForAdd}
          onAdd={(secName, tableData) => {
            addCustomTable(activeTabId, secName, tableData);
            showToast('Custom table added! Click Save Settings to persist.', 'success');
          }}
        />

        <AddCustomSectionModal
          isOpen={isAddSectionOpen}
          onClose={() => setIsAddSectionOpen(false)}
          onAdd={(secName) => {
            addCustomSection(activeTabId, secName);
            showToast('Custom section added! Click Save Settings to persist.', 'success');
          }}
        />
      </div>
    </div>
  );
};
