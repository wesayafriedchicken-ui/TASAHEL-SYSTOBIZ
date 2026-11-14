import React, { useState } from 'react';
import {
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Shield,
  EyeOff,
  Lock,
  Edit3,
  Table,
  Type,
  DollarSign,
  Calendar,
  ListFilter,
  Trash2,
  RotateCcw,
  Save,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  Package,
  Tag,
  Percent,
  Clock,
  Boxes
} from 'lucide-react';
import { useCatalogSchema } from './useCatalogSchema';
import {
  SchemaFieldItem,
  SchemaSectionItem
} from './catalogModuleRegistry';
import { AddCatalogCustomFieldModal } from './modals/AddCatalogCustomFieldModal';
import { AddCatalogCustomTableModal } from './modals/AddCatalogCustomTableModal';
import { AddCatalogCustomSectionModal } from './modals/AddCatalogCustomSectionModal';
import { AddCatalogActionModal } from './modals/AddCatalogActionModal';
import { CatalogFieldSecurityModal } from './modals/CatalogFieldSecurityModal';

export const CatalogManageFieldsPage: React.FC = () => {
  // Selected Scope
  const [activeScopeKey, setActiveScopeKey] = useState<string>('items');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Hook for the chosen scope
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
    updateFieldSecurity,
    reorderItem,
    deleteItem,
    deleteAction,
    deleteSection
  } = useCatalogSchema(activeScopeKey);

  // Modal states
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isAddActionOpen, setIsAddActionOpen] = useState(false);
  const [targetSectionForAdd, setTargetSectionForAdd] = useState<{ id: string; name: string }>({ id: '', name: '' });

  // Field Inspector Modal State
  const [configuringField, setConfiguringField] = useState<{
    sectionId: string;
    sectionName: string;
    field: SchemaFieldItem;
  } | null>(null);

  // Helper toast
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Scopes List (Products & Services Catalog Tabs)
  const scopesList = [
    {
      key: 'items',
      label: 'Products & Services Directory',
      icon: Package,
      badge: 'Core Catalog',
      color: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    {
      key: 'price_lists',
      label: 'Multi-Tier Price Lists',
      icon: Tag,
      badge: 'Tier Management',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      key: 'promo_codes',
      label: 'Promo Codes & Vouchers',
      icon: Percent,
      badge: 'Coupons & Discounts',
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    },
    {
      key: 'service_specs',
      label: 'Service Solutions & SLAs',
      icon: Clock,
      badge: 'Duration & Protocols',
      color: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      key: 'inventory_control',
      label: 'Physical Stock & Warehouse',
      icon: Boxes,
      badge: 'Inventory & Reorder',
      color: 'text-purple-700 bg-purple-50 border-purple-200'
    }
  ];

  // Helper: Open add field for a section
  const openAddField = (sec: SchemaSectionItem) => {
    setTargetSectionForAdd({ id: sec.id, name: sec.name });
    setIsAddFieldOpen(true);
  };

  // Helper: Open add table for a section
  const openAddTable = (sec: SchemaSectionItem) => {
    setTargetSectionForAdd({ id: sec.id, name: sec.name });
    setIsAddTableOpen(true);
  };

  // Helper: Open add action for a section
  const openAddAction = (sec: SchemaSectionItem) => {
    setTargetSectionForAdd({ id: sec.id, name: sec.name });
    setIsAddActionOpen(true);
  };

  // Handle Save
  const handleSaveAll = async () => {
    const res = await saveSchema();
    if (res.success) {
      showToast('Schema customizations successfully published across Products & Services module.', 'success');
    } else {
      showToast(res.message || 'Saved to local workspace storage.', 'info');
    }
  };

  // Handle Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm(`Reset all customizations for "${schema.displayName}" back to system defaults?`)) {
      const res = await resetSchema();
      if (res.success) {
        showToast('Restored default catalog schema definitions.', 'success');
      }
    }
  };

  // Render Data Type Icon
  const renderTypeIcon = (item: SchemaFieldItem) => {
    if (item.type === 'table') return <Table className="w-4 h-4 text-indigo-600" />;
    switch (item.dataType) {
      case 'currency':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'date':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'select':
        return <ListFilter className="w-4 h-4 text-blue-600" />;
      default:
        return <Type className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Products & Services Metadata & Schema Builder
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
              Live Inspector
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Introspect, configure, and customize fields, repeating tables, security levels, and button actions for all Catalog entities
          </p>
        </div>

        {/* Global Save & Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Publishing...' : 'Save Schema Changes'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          1. SCOPE SELECTOR (Catalog Entity Tabs)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Target Catalog Entity Scope
          </span>
          <span className="text-[11px] text-slate-400">
            Select an offering domain to customize its data structure
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {scopesList.map((scope) => {
            const Icon = scope.icon;
            const isSelected = activeScopeKey === scope.key;
            return (
              <button
                key={scope.key}
                type="button"
                onClick={() => setActiveScopeKey(scope.key)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-1 ring-amber-500'
                    : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-700' : 'text-slate-500'}`} />
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${scope.color}`}>
                    {scope.badge}
                  </span>
                </div>
                <span className="text-xs font-semibold block">{scope.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Entity Info & Section Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{schema.displayName}</h3>
            <span className="text-xs font-mono text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md">
              key: {schema.pageKey}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{schema.description}</p>
        </div>

        {/* Global Add Menu Dropdown */}
        <div className="relative flex items-center gap-2 self-start sm:self-auto">
          {/* Search within active scope */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search fields, tables & keys..."
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 w-48 sm:w-60"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddSectionOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Add Section</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SECTION, FIELD & TABLE MANAGER
      ========================================================================= */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RotateCcw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-600" />
          <span>Loading catalog schema definitions...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {schema.sections.map((section) => {
            // Filter items by search query if any
            const filteredItems = section.items.filter((item) => {
              if (!searchTerm.trim()) return true;
              const q = searchTerm.toLowerCase();
              return (
                item.label.toLowerCase().includes(q) ||
                item.id.toLowerCase().includes(q) ||
                (item.dataType && item.dataType.toLowerCase().includes(q))
              );
            });

            return (
              <div
                key={section.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                {/* Section Card Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-700" />
                      <h4 className="text-sm font-bold text-slate-900">{section.name}</h4>
                      {section.isCustom && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          Custom Section
                        </span>
                      )}
                    </div>
                    {section.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                    )}
                  </div>

                  {/* Section Top Actions: Add Field, Add Table, Add Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openAddField(section)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-600" />
                      <span>Add Field</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openAddTable(section)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                    >
                      <Table className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Add Table</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openAddAction(section)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ Action</span>
                    </button>

                    {section.isCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete custom section "${section.name}"?`)) {
                            deleteSection(section.id);
                            showToast(`Section "${section.name}" deleted.`, 'info');
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section Items (Fields and Tables) */}
                <div className="p-6 space-y-2.5">
                  {filteredItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      {searchTerm ? 'No fields match your search term in this section.' : 'No fields defined in this section yet. Click "+ Add Field" above.'}
                    </div>
                  ) : (
                    filteredItems.map((item, itemIdx) => {
                      const isMasked = !!item.maskValue;
                      const isReadOnly = !!item.readOnly;
                      const isHidden = !!item.hidden;
                      const perm = item.permLevel ?? 0;

                      return (
                        <div
                          key={item.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                            isHidden
                              ? 'bg-slate-50/60 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          {/* Item Identity */}
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                              {renderTypeIcon(item)}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-900 truncate">
                                  {item.label}
                                </span>
                                {item.isRequired && (
                                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                                    Required
                                  </span>
                                )}
                                {item.isCustom && (
                                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[11px] text-slate-400">
                                  {item.id}
                                </span>
                                {item.type === 'table' ? (
                                  <span className="text-[10px] text-indigo-700 font-medium bg-indigo-50 px-1.5 py-0.2 rounded">
                                    repeater table
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 uppercase font-medium">
                                    {item.dataType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Security & Behavior Badges + Inspector Controls */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                            {/* Sensitivity Badge */}
                            {isMasked && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>Masked (***)</span>
                              </span>
                            )}

                            {/* Behavior Badge */}
                            {isHidden ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                <EyeOff className="w-3 h-3" />
                                <span>Hidden</span>
                              </span>
                            ) : isReadOnly ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                <Lock className="w-3 h-3" />
                                <span>Read-Only</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                                <Edit3 className="w-3 h-3" />
                                <span>Editable</span>
                              </span>
                            )}

                            {/* Permission Level Badge */}
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              L{perm}
                            </span>

                            {/* Re-order Arrows (Up / Down) */}
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                              <button
                                type="button"
                                onClick={() => reorderItem(section.id, itemIdx, 'up')}
                                disabled={itemIdx === 0}
                                className="p-1 hover:bg-slate-200 text-slate-500 disabled:opacity-30 transition-colors cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <div className="w-px h-3.5 bg-slate-200" />
                              <button
                                type="button"
                                onClick={() => reorderItem(section.id, itemIdx, 'down')}
                                disabled={itemIdx === section.items.length - 1}
                                className="p-1 hover:bg-slate-200 text-slate-500 disabled:opacity-30 transition-colors cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Edit / Security Inspector Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setConfiguringField({
                                  sectionId: section.id,
                                  sectionName: section.name,
                                  field: item
                                })
                              }
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Shield className="w-3.5 h-3.5 text-amber-600" />
                              <span>Inspect</span>
                            </button>

                            {/* Delete custom item */}
                            {item.isCustom && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Remove custom field "${item.label}"?`)) {
                                    deleteItem(section.id, item.id);
                                    showToast(`Field "${item.label}" removed.`, 'info');
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Field"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Section Action Buttons & Controls Preview */}
                  {section.actions && section.actions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                        Registered Button & Action Controls ({section.actions.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {section.actions.map((act) => (
                          <div
                            key={act.action_key}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800"
                          >
                            <Play className="w-3 h-3 text-amber-600" />
                            <span>{act.label_en}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({act.permission_scope})
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded ${
                                act.state === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : act.state === 'disabled'
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {act.state}
                            </span>
                            {act.isCustom && (
                              <button
                                type="button"
                                onClick={() => {
                                  deleteAction(section.id, act.action_key);
                                  showToast(`Action "${act.label_en}" removed.`, 'info');
                                }}
                                className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-Modals */}
      <AddCatalogCustomFieldModal
        isOpen={isAddFieldOpen}
        onClose={() => setIsAddFieldOpen(false)}
        sectionName={targetSectionForAdd.name}
        onAdd={(fieldData) => {
          addCustomField(targetSectionForAdd.id, fieldData);
          showToast(`Field "${fieldData.label}" added to ${targetSectionForAdd.name}.`, 'success');
        }}
      />

      <AddCatalogCustomTableModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        sectionName={targetSectionForAdd.name}
        onAdd={(tableData) => {
          addCustomTable(targetSectionForAdd.id, tableData);
          showToast(`Table "${tableData.label}" added to ${targetSectionForAdd.name}.`, 'success');
        }}
      />

      <AddCatalogCustomSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
        onAdd={(sectionData) => {
          addCustomSection(sectionData);
          showToast(`Section "${sectionData.name}" created.`, 'success');
        }}
      />

      <AddCatalogActionModal
        isOpen={isAddActionOpen}
        onClose={() => setIsAddActionOpen(false)}
        sectionName={targetSectionForAdd.name}
        onAdd={(actionData) => {
          addActionControl(targetSectionForAdd.id, {
            ...actionData,
            section_name: targetSectionForAdd.name
          });
          showToast(`Action button "${actionData.label_en}" registered.`, 'success');
        }}
      />

      {/* Field Security & Behavior Inspector Modal */}
      {configuringField && (
        <CatalogFieldSecurityModal
          isOpen={true}
          onClose={() => setConfiguringField(null)}
          sectionName={configuringField.sectionName}
          field={configuringField.field}
          onSave={(updates) => {
            updateFieldSecurity(
              configuringField.sectionId,
              configuringField.field.id,
              updates
            );
            showToast(`Security settings updated for "${configuringField.field.label}".`, 'success');
          }}
        />
      )}
    </div>
  );
};

export default CatalogManageFieldsPage;
