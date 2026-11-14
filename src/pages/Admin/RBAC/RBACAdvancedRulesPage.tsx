import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Zap, Eye, Lock, Edit2, 
  Check, Save, RefreshCw, AlertCircle, Shield, ShieldAlert,
  Search, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useRBAC } from './RBACContext';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export const RBACAdvancedRulesPage: React.FC = () => {
  const { tabId = '' } = useParams<{ tabId: string }>();
  const navigate = useNavigate();

  const {
    roleId,
    moduleId,
    role,
    moduleMetadata,
    toggleCustomAction,
    isCustomActionActive,
    setSeePermission,
    getSeePermission,
    hasChanges,
    saving,
    savePermissions
  } = useRBAC();

  const [activeSubTab, setActiveSubTab] = useState<'actions' | 'fields'>('actions');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const allTabs = useMemo(() => {
    return moduleMetadata?.tabs || [];
  }, [moduleMetadata]);

  const decodedTabId = decodeURIComponent(tabId).trim();

  // Find tab metadata in moduleMetadata; default to first tab if empty
  const currentTab = useMemo(() => {
    if (!allTabs || allTabs.length === 0) return null;
    if (!decodedTabId) {
      return allTabs[0];
    }
    const low = decodedTabId.toLowerCase();
    const matched = allTabs.find(t => 
      t.id.toLowerCase() === low ||
      t.labelEn.toLowerCase() === low ||
      (t.labelAr && t.labelAr.toLowerCase() === low)
    );
    return matched || allTabs[0];
  }, [allTabs, decodedTabId]);

  const actions = useMemo(() => {
    return currentTab?.actions || [];
  }, [currentTab]);

  const sections = useMemo(() => {
    return currentTab?.sections || [];
  }, [currentTab]);

  // Filter actions based on search
  const filteredActions = useMemo(() => {
    if (!searchTerm.trim()) return actions;
    const term = searchTerm.toLowerCase();
    return actions.filter(a => 
      a.id.toLowerCase().includes(term) ||
      a.labelEn.toLowerCase().includes(term) ||
      (a.labelAr && a.labelAr.toLowerCase().includes(term)) ||
      (a.description && a.description.toLowerCase().includes(term))
    );
  }, [actions, searchTerm]);

  // Filter sections and their fields based on search
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const term = searchTerm.toLowerCase();
    return sections
      .map(sec => {
        const secMatches = sec.labelEn.toLowerCase().includes(term) || (sec.labelAr && sec.labelAr.toLowerCase().includes(term));
        const matchedFields = sec.fields.filter(f => 
          f.key.toLowerCase().includes(term) ||
          f.labelEn.toLowerCase().includes(term) ||
          (f.labelAr && f.labelAr.toLowerCase().includes(term))
        );
        if (secMatches) return sec;
        if (matchedFields.length > 0) return { ...sec, fields: matchedFields };
        return null;
      })
      .filter(Boolean) as typeof sections;
  }, [sections, searchTerm]);

  const totalFieldsCount = useMemo(() => {
    return sections.reduce((acc, s) => acc + s.fields.length, 0);
  }, [sections]);

  const allActionsChecked = actions.length > 0 && actions.every(a => isCustomActionActive(a.id));

  const handleToggleAllActions = () => {
    if (role?.name === 'Admin') return;
    actions.forEach(a => {
      toggleCustomAction(a.id, !allActionsChecked);
    });
  };

  const handleSetAllFields = (val: 'full' | 'view' | 'no') => {
    if (role?.name === 'Admin') return;
    sections.forEach(sec => {
      setSeePermission(sec.key, val);
      sec.fields.forEach(f => {
        const safeF = f.key.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const fieldKey = `${sec.key}_${safeF}`;
        setSeePermission(fieldKey, val);
      });
    });
  };

  const encodedMod = encodeURIComponent(decodeURIComponent(moduleId));
  const backToTree = () => {
    navigate(`/admin/rbac/${roleId}/module/${encodedMod}/tree`);
  };

  const selectTab = (tId: string) => {
    navigate(`/admin/rbac/${roleId}/module/${encodedMod}/advanced-rules/${encodeURIComponent(tId)}`);
  };

  return (
    <div className="space-y-6">
      {/* Back & Tab Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={backToTree}
            className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all text-slate-600 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
            title="Back to Module Tree"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-indigo-600 font-black uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                Advanced Tab Security & Field Rules
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                Target Role: {role?.name || `Role #${roleId}`}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <span>{currentTab?.labelEn || decodedTabId || (allTabs.length > 0 ? allTabs[0].labelEn : 'Screen Rules')}</span>
              <span className="text-xs text-slate-400 font-medium">({actions.length} Actions • {totalFieldsCount} Fields)</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={backToTree}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Tree</span>
          </button>
        </div>
      </div>

      {/* Quick Tab Selector Switcher */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-wider shrink-0">
            Switch Screen:
          </span>
          {allTabs.map(t => {
            const isSelected = currentTab?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer",
                  isSelected 
                    ? "bg-indigo-600 text-white shadow-xs font-black" 
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100/60"
                )}
              >
                <span>{t.labelEn}</span>
                {t.sections && t.sections.length > 0 && (
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.2 rounded-full font-black",
                    isSelected ? "bg-indigo-700/80 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {t.sections.reduce((a, s) => a + s.fields.length, 0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200 flex-1 max-w-md">
          <button
            type="button"
            onClick={() => setActiveSubTab('actions')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2",
              activeSubTab === 'actions' ? "bg-white text-indigo-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>1. Permitted Actions ({actions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('fields')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2",
              activeSubTab === 'fields' ? "bg-white text-indigo-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>2. Field Security & Visibility ({totalFieldsCount})</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={`Search ${activeSubTab === 'actions' ? 'actions & operations' : 'fields & sections'}...`}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* SUBTAB 1: ACTIONS */}
      {activeSubTab === 'actions' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Operational Actions for {currentTab?.labelEn}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable or restrict operational buttons, export tools, modals, and workflow actions for this role.
              </p>
            </div>

            {actions.length > 0 && (
              <button
                type="button"
                disabled={role?.name === 'Admin'}
                onClick={handleToggleAllActions}
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 underline cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                {allActionsChecked ? 'Deselect All Actions' : 'Select All Actions'}
              </button>
            )}
          </div>

          {filteredActions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 font-semibold">
              {searchTerm ? 'No actions match your search query.' : 'No custom actions are registered for this screen yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredActions.map(act => {
                const isChecked = isCustomActionActive(act.id);
                return (
                  <label
                    key={act.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                      isChecked ? "bg-indigo-50/60 border-indigo-300 shadow-2xs" : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 block">{act.labelEn}</span>
                        {act.category === 'sensitive' && (
                          <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5 text-amber-600" />
                            Sensitive
                          </span>
                        )}
                      </div>
                      {act.description && (
                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">{act.description}</p>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono block">{act.id}</span>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={role?.name === 'Admin'}
                      onChange={(e) => {
                        if (role?.name !== 'Admin') {
                          toggleCustomAction(act.id, e.target.checked);
                        }
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: FIELDS */}
      {activeSubTab === 'fields' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Field Visibility & Security Rules for {currentTab?.labelEn}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define whether each section and field is fully editable, read-only, or completely hidden from users with this role.
              </p>
            </div>

            {sections.length > 0 && role?.name !== 'Admin' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Bulk Apply:</span>
                <button
                  type="button"
                  onClick={() => handleSetAllFields('full')}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold rounded-lg border border-emerald-200 transition-all cursor-pointer"
                >
                  All Full Access
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllFields('view')}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold rounded-lg border border-blue-200 transition-all cursor-pointer"
                >
                  All Read Only
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllFields('no')}
                  className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
                >
                  All Hidden
                </button>
              </div>
            )}
          </div>

          {filteredSections.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 font-semibold">
              {searchTerm ? 'No sections or fields match your search query.' : 'No fields or sections are registered under this screen.'}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSections.map(sec => {
                const sectionVal = getSeePermission(sec.key, 'full');

                return (
                  <div key={sec.key} className="bg-slate-50/60 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900">{sec.labelEn}</h4>
                          <span className="text-[10px] text-slate-400 font-bold">({sec.fields.length} fields)</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">key: {sec.key}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">Section Default:</span>
                        <select
                          value={sectionVal}
                          disabled={role?.name === 'Admin'}
                          onChange={(e) => setSeePermission(sec.key, e.target.value as any)}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                          <option value="full">Full Access (Edit & View)</option>
                          <option value="view">Read Only (View Only)</option>
                          <option value="no">Hidden (Blocked)</option>
                        </select>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 bg-white">
                      {sec.fields.map(f => {
                        const safeF = f.key.toLowerCase().replace(/[^a-z0-9]/g, '_');
                        const fieldKey = `${sec.key}_${safeF}`;
                        const fieldVal = getSeePermission(fieldKey, sectionVal);

                        return (
                          <div key={f.key} className="p-3 px-4 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 block">{f.labelEn}</span>
                                {f.isSensitive && (
                                  <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                                    <Shield className="w-2.5 h-2.5 text-amber-600" />
                                    Sensitive
                                  </span>
                                )}
                                <span className="text-[9px] text-slate-400 uppercase font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                                  {f.type || 'text'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block">field: {f.key}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1",
                                fieldVal === 'no' && "text-rose-700 bg-rose-50 border border-rose-200",
                                fieldVal === 'view' && "text-blue-700 bg-blue-50 border border-blue-200",
                                fieldVal === 'full' && "text-emerald-800 bg-emerald-50 border border-emerald-200"
                              )}>
                                {fieldVal === 'no' && <Lock className="w-2.5 h-2.5" />}
                                {fieldVal === 'view' && <Eye className="w-2.5 h-2.5" />}
                                {fieldVal === 'full' && <Edit2 className="w-2.5 h-2.5" />}
                                {fieldVal === 'no' ? 'Hidden' : fieldVal === 'view' ? 'Read Only' : 'Full Access'}
                              </span>

                              <div className="flex items-center bg-slate-800 text-white p-0.5 rounded-full shadow-xs gap-0.5">
                                <button
                                  type="button"
                                  disabled={role?.name === 'Admin'}
                                  onClick={() => setSeePermission(fieldKey, 'no')}
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                    fieldVal === 'no' ? "bg-rose-600 text-white shadow-sm scale-105" : "text-slate-400 hover:text-white"
                                  )}
                                  title="Hide Field"
                                >
                                  <Lock className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={role?.name === 'Admin'}
                                  onClick={() => setSeePermission(fieldKey, 'view')}
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                    fieldVal === 'view' ? "bg-blue-600 text-white shadow-sm scale-105" : "text-slate-400 hover:text-white"
                                  )}
                                  title="Read Only"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={role?.name === 'Admin'}
                                  onClick={() => setSeePermission(fieldKey, 'full')}
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                    fieldVal === 'full' ? "bg-emerald-600 text-white shadow-sm scale-105" : "text-slate-400 hover:text-white"
                                  )}
                                  title="Full Access"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RBACAdvancedRulesPage;
