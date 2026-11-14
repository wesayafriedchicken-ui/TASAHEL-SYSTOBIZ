import React, { useState, useMemo, useEffect } from 'react';
import { 
  SlidersHorizontal, Users, Lock, Eye, Edit2, Check, Search, 
  ChevronDown, ChevronRight, ShieldAlert, Sparkles, LayoutGrid,
  Shield, CheckCircle2, ListFilter, Plus, Settings, Settings2, Save, RefreshCw
} from 'lucide-react';
import { useRBAC } from './RBACContext';
import { ModuleCustomizeLayoutDropdown } from '../../../components/HR/ModuleSchema/ModuleCustomizeLayoutDropdown';

function resolveHRTargetPage(tabIdOrLabel: string): string | null {
  const t = (tabIdOrLabel || '').toLowerCase();
  if (t.includes('complaint') || t.includes('grievance')) return 'complaints';
  if (t.includes('attendance') || t.includes('clock') || t.includes('shift') || t.includes('leave')) return 'attendance';
  if (t.includes('department')) return 'departments';
  if (t.includes('hiring') || t.includes('recruit') || t.includes('candidate')) return 'recruitment';
  if (t.includes('payroll') || t.includes('salar')) return 'payroll';
  return null;
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export const RBACActionsFieldsPage: React.FC = () => {
  const { 
    role, 
    moduleId,
    canonModule,
    moduleMetadata, 
    permissions, 
    toggleCustomAction, 
    isCustomActionActive, 
    setSeePermission, 
    bulkSetSeePermissions, 
    setSelfAccess, 
    toggleHomeWidget,
    getSeePermission,
    savePermissions,
    saving,
    hasChanges
  } = useRBAC();

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const tabs = useMemo(() => {
    return moduleMetadata?.tabs || [];
  }, [moduleMetadata]);

  const [accessViewTab, setAccessViewTab] = useState<'do' | 'see'>('do');
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    return moduleMetadata?.tabs?.[0]?.id || '';
  });
  const [seePerspective, setSeePerspective] = useState<'others' | 'self' | 'home'>('others');
  const [fieldsSearch, setFieldsSearch] = useState<string>('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSectionCollapse = (secKey: string) => {
    setCollapsedSections(prev => ({ ...prev, [secKey]: !prev[secKey] }));
  };

  const effectiveActiveTabId = useMemo(() => {
    if (tabs.length > 0) {
      const match = tabs.find(t => t.id === activeTabId);
      return match ? match.id : tabs[0].id;
    }
    return activeTabId;
  }, [tabs, activeTabId]);

  const activeTabObj = useMemo(() => {
    return tabs.find(t => t.id === effectiveActiveTabId) || tabs[0];
  }, [tabs, effectiveActiveTabId]);

  const isHRModule = useMemo(() => {
    const m = (moduleId || canonModule || '').toLowerCase();
    return m === 'hr' || m.includes('human') || m === 'hr management';
  }, [moduleId, canonModule]);

  const isQAModule = useMemo(() => {
    const m = (moduleId || canonModule || '').toLowerCase();
    return m === 'qa' || m.includes('quality') || m === 'quality assurance';
  }, [moduleId, canonModule]);

  // 5 QA Critical Actions requested by user
  const qaCriticalActions = useMemo(() => [
    {
      id: 'qa_manage_options',
      labelEn: 'Manage Options',
      labelAr: 'زر Manage Options',
      category: 'workflow',
      icon: Settings2,
      badge: 'Dropdown Choices & Lists',
      description: 'Permission to add, edit, or delete custom options and migrate old records in audit selects'
    },
    {
      id: 'qa_add_new_action',
      labelEn: 'Add New Action',
      labelAr: 'زر Add New Action',
      category: 'workflow',
      icon: Plus,
      badge: 'Incident Stepper Remediation',
      description: 'Permission to add and configure new operational actions directly inside the required actions multi-select'
    },
    {
      id: 'qa_reason_error_mgmt',
      labelEn: 'Reason & Error Management',
      labelAr: 'زر Reason & Error Management',
      category: 'sensitive',
      icon: Settings,
      badge: 'RCA & Error Classifications',
      description: 'Permission to open the Reason & Error Management studio to add, edit, or delete main reasons and error buckets'
    },
    {
      id: 'qa_settings_button',
      labelEn: 'Settings',
      labelAr: 'زر Settings',
      category: 'crud',
      icon: Settings,
      badge: 'QA Layout Header Link',
      description: 'Permission to view and access the QA Integration Settings button in the top navigation bar (/qa/settings)'
    },
    {
      id: 'qa_quick_sync_config',
      labelEn: 'Quick Sync Configuration',
      labelAr: 'أيقونة Quick Sync Configuration',
      category: 'workflow',
      icon: SlidersHorizontal,
      badge: 'Header Sliders Icon Modal',
      description: 'Permission to view and trigger the quick sync configuration slider icon in the header for Google Sheets sync'
    }
  ], []);

  const activeHRTargetPage = useMemo(() => {
    if (!isHRModule) return null;
    return resolveHRTargetPage(activeTabObj?.id || activeTabObj?.labelEn || '');
  }, [isHRModule, activeTabObj]);

  // Home widgets list
  const homeWidgetCards = useMemo(() => [
    { id: 'celebrations', labelEn: 'Celebrations', desc: 'Birthdays & work anniversaries' },
    { id: 'announcements', labelEn: 'Announcements', desc: 'Company-wide broadcasts & news' },
    { id: 'company_links', labelEn: 'Company Links', desc: 'Quick links to internal corporate portals' },
    { id: 'whos_out', labelEn: "Who's Out Today", desc: 'Staff on leave or working remotely today' },
    { id: 'time_off_balance', labelEn: 'Time Off Balance', desc: 'Personal annual & sick leave quotas' },
    { id: 'new_hires', labelEn: 'Welcome New Hires', desc: 'Newly onboarded team members this month' }
  ], []);

  const selfAccessState = permissions?.self_access || { allow: true, level: 'Employees' };
  const allowSelf = selfAccessState.allow !== false;
  const selfLevel = selfAccessState.level || 'Employees';

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    tabs.forEach(t => t.sections?.forEach(s => { next[s.key] = true; }));
    setCollapsedSections(next);
  };

  const expandAll = () => {
    setCollapsedSections({});
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-700" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Granular Action & Field Visibility Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure permitted operational actions and field-level security for role: <strong className="text-slate-800">{role?.name || 'Selected Role'}</strong>
          </p>
        </div>

        {/* Step Switcher Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Customize Layout Dropdown in RBAC Header */}
          {isHRModule && (
            <ModuleCustomizeLayoutDropdown
              targetPage={activeHRTargetPage || 'departments'}
              allowPageSwitch={true}
              variant="outline-green"
              buttonLabel="Customize Layout"
            />
          )}

          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1 shrink-0 border border-slate-200">
            <button
            type="button"
            onClick={() => setAccessViewTab('do')}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
              accessViewTab === 'do' 
                ? "bg-indigo-700 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            )}
          >
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0",
              accessViewTab === 'do' ? "bg-white text-indigo-900" : "bg-slate-200 text-slate-700"
            )}>
              1
            </span>
            <span>1. What Can Do (Actions)</span>
          </button>

          <button
            type="button"
            onClick={() => setAccessViewTab('see')}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
              accessViewTab === 'see' 
                ? "bg-indigo-700 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            )}
          >
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0",
              accessViewTab === 'see' ? "bg-white text-indigo-900" : "bg-slate-200 text-slate-700"
            )}>
              2
            </span>
            <span>2. What Can See (Fields & Visibility)</span>
          </button>
        </div>

        {role?.name !== 'Admin' && (
          <button
            type="button"
            onClick={async () => {
              const ok = await savePermissions();
              if (ok) {
                setSaveSuccessMsg('All permissions successfully saved to database!');
                setTimeout(() => setSaveSuccessMsg(null), 3500);
              }
            }}
            disabled={saving}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer",
              hasChanges
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:scale-105 active:scale-95"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            )}
            title="Save current module permissions to database"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
          </button>
        )}
      </div>
    </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: WHAT CAN DO */}
      {accessViewTab === 'do' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              What Can People with this Role Do?
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select a screen from the left sidebar to configure permitted buttons, exports, dialogs, and workflows.
            </p>
          </div>

          {/* QA Critical Operational & Header Actions Matrix */}
          {isQAModule && (
            <div className="bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-slate-50 border border-indigo-200/80 rounded-2xl p-5 space-y-3.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>Quality Assurance (QA) Critical Operational & Header Actions</span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                        5 Key Actions
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Control visibility and access for: Manage Options, Add New Action, Reason & Error Management, Settings, and Quick Sync Configuration.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={role?.name === 'Admin'}
                    onClick={() => {
                      if (role?.name === 'Admin') return;
                      const allOn = qaCriticalActions.every(a => isCustomActionActive(a.id));
                      qaCriticalActions.forEach(a => toggleCustomAction(a.id, !allOn));
                    }}
                    className="text-xs font-black text-indigo-700 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {qaCriticalActions.every(a => isCustomActionActive(a.id)) ? 'Deselect All 5' : 'Select All 5'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {qaCriticalActions.map((act) => {
                  const Icon = act.icon;
                  const isChecked = isCustomActionActive(act.id);

                  return (
                    <label
                      key={act.id}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer relative",
                        isChecked
                          ? "bg-white border-indigo-500 text-slate-900 ring-2 ring-indigo-500/20 shadow-xs"
                          : "bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={role?.name === 'Admin'}
                        onChange={(e) => {
                          if (role?.name !== 'Admin') {
                            toggleCustomAction(act.id, e.target.checked);
                          }
                        }}
                        className="mt-1 rounded text-indigo-600 focus:ring-indigo-600 cursor-pointer w-4 h-4 shrink-0"
                      />

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="text-xs font-black text-slate-900 truncate">{act.labelEn}</span>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            {act.labelAr}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          {act.description}
                        </p>

                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {act.id}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {act.badge}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row gap-6">
            {/* Left Tabs List */}
            <div className="w-full md:w-64 space-y-1 shrink-0 border-r border-slate-100 pr-4">
              {tabs.map(tab => {
                const Icon = tab.icon || LayoutGrid;
                const isSelected = effectiveActiveTabId === tab.id;
                const actionsCount = tab.actions?.length || 0;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    className={cn(
                      "w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-3 cursor-pointer",
                      isSelected 
                        ? "bg-indigo-100/80 text-indigo-950 font-black shadow-2xs" 
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-indigo-800" : "text-slate-400")} />
                      <span className="truncate">{tab.labelEn || tab.id}</span>
                    </div>
                    {actionsCount > 0 && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-black shrink-0",
                        isSelected ? "bg-indigo-200 text-indigo-950" : "bg-slate-100 text-slate-500"
                      )}>
                        {actionsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Actions Grid */}
            <div className="flex-1 space-y-6">
              {(() => {
                const tabActions = activeTabObj?.actions || [];
                const allChecked = tabActions.length > 0 && tabActions.every(a => isCustomActionActive(a.id));

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          {activeTabObj?.labelEn || activeTabObj?.id} Actions
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {tabActions.length} operational capabilities registered
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Screen-specific Customize Layout Dropdown */}
                        {isHRModule && activeHRTargetPage && (
                          <ModuleCustomizeLayoutDropdown
                            targetPage={activeHRTargetPage}
                            variant="outline-green"
                          />
                        )}

                        {tabActions.length > 0 && (
                          <button
                            type="button"
                            disabled={role?.name === 'Admin'}
                            onClick={() => {
                              if (role?.name === 'Admin') return;
                              tabActions.forEach(a => {
                                toggleCustomAction(a.id, !allChecked);
                              });
                            }}
                            className="text-xs text-indigo-700 font-black hover:underline cursor-pointer disabled:opacity-50"
                          >
                            {allChecked ? 'Deselect All in Screen' : 'Select All in Screen'}
                          </button>
                        )}
                      </div>
                    </div>

                    {tabActions.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500 font-semibold">
                          No custom actions are registered for this screen; standard CRUD access applies.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {tabActions.map(act => {
                          const isChecked = isCustomActionActive(act.id);
                          return (
                            <label
                              key={act.id}
                              className={cn(
                                "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                                isChecked 
                                  ? "bg-indigo-50/60 border-indigo-300 text-indigo-950 font-bold shadow-2xs" 
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={role?.name === 'Admin'}
                                onChange={(e) => {
                                  if (role?.name !== 'Admin') {
                                    toggleCustomAction(act.id, e.target.checked);
                                  }
                                }}
                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-600 cursor-pointer w-4 h-4 shrink-0"
                              />
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black leading-snug">{act.labelEn}</span>
                                  {act.category === 'sensitive' && (
                                    <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded flex items-center gap-1">
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
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WHAT CAN SEE */}
      {accessViewTab === 'see' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              What Can People with this Role See?
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Control field-level sensitivity, self-access to personal profiles, and home screen widget visibility.
            </p>
          </div>

          {/* Top 3 Perspective Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setSeePerspective('others')}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                seePerspective === 'others' 
                  ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20" 
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              )}
            >
              <Users className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-slate-900">Other Employees' Data & Fields</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Protect sensitive fields (salaries, banking, credentials, notes) with Full Access, Read Only, or Hidden.
                </p>
              </div>
            </div>

            <div
              onClick={() => setSeePerspective('self')}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                seePerspective === 'self' 
                  ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20" 
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              )}
            >
              <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-slate-900">Self-Access (My Profile)</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Determine whether employees can view and edit their own profile and attendance records.
                </p>
              </div>
            </div>

            <div
              onClick={() => setSeePerspective('home')}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                seePerspective === 'home' 
                  ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20" 
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              )}
            >
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-slate-900">Home Screen Widgets</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Toggle interactive widgets and information cards shown on the user's dashboard home.
                </p>
              </div>
            </div>
          </div>

          {/* PERSPECTIVE 1: OTHERS */}
          {seePerspective === 'others' && (
            <div className="space-y-4 pt-2">
              {/* Search & Collapse Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search fields and sections..."
                    value={fieldsSearch}
                    onChange={(e) => setFieldsSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isHRModule && (
                    <ModuleCustomizeLayoutDropdown
                      targetPage={activeHRTargetPage || 'departments'}
                      allowPageSwitch={true}
                      variant="outline-green"
                    />
                  )}
                  <button
                    type="button"
                    onClick={expandAll}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* Sections & Fields List */}
              <div className="space-y-6">
                {tabs.map(tab => {
                  if (!tab.sections || tab.sections.length === 0) return null;

                  return (
                    <div key={tab.id} className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                          {tab.labelEn || tab.id}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">
                          ({tab.sections.length} sections)
                        </span>
                      </div>

                      <div className="space-y-3">
                        {tab.sections.map(sec => {
                          const isCollapsed = !!collapsedSections[sec.key];
                          const sectionVal = getSeePermission(sec.key, 'full');

                          const filteredFields = sec.fields.filter(f => 
                            !fieldsSearch || 
                            f.labelEn.toLowerCase().includes(fieldsSearch.toLowerCase()) ||
                            (f.labelAr && f.labelAr.toLowerCase().includes(fieldsSearch.toLowerCase())) ||
                            f.key.toLowerCase().includes(fieldsSearch.toLowerCase())
                          );

                          if (fieldsSearch && filteredFields.length === 0) return null;

                          return (
                            <div key={sec.key} className="bg-slate-50/70 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                              {/* Section Header */}
                              <div className="p-4 bg-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleSectionCollapse(sec.key)}
                                  className="flex items-center gap-2.5 text-left cursor-pointer group"
                                >
                                  {isCollapsed ? (
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {sec.labelEn}
                                      </h4>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        • {sec.fields.length} fields
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">key: {sec.key}</span>
                                  </div>
                                </button>

                                {/* Bulk Pill Controls for Section */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-bold">Apply to Section:</span>
                                  <div className="flex items-center bg-slate-900 text-white p-0.5 rounded-full shadow-xs gap-0.5">
                                    <button
                                      type="button"
                                      title="Hide all fields in section"
                                      disabled={role?.name === 'Admin'}
                                      onClick={() => {
                                        const keys = [sec.key, ...sec.fields.map(f => `${sec.key}_${f.key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`)];
                                        bulkSetSeePermissions(keys, 'no');
                                      }}
                                      className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer flex items-center gap-1",
                                        sectionVal === 'no' ? "bg-rose-600 text-white shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-800"
                                      )}
                                    >
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>Hidden</span>
                                    </button>

                                    <button
                                      type="button"
                                      title="Read only for all fields in section"
                                      disabled={role?.name === 'Admin'}
                                      onClick={() => {
                                        const keys = [sec.key, ...sec.fields.map(f => `${sec.key}_${f.key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`)];
                                        bulkSetSeePermissions(keys, 'view');
                                      }}
                                      className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer flex items-center gap-1",
                                        sectionVal === 'view' ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-800"
                                      )}
                                    >
                                      <Eye className="w-2.5 h-2.5" />
                                      <span>Read Only</span>
                                    </button>

                                    <button
                                      type="button"
                                      title="Full access for all fields in section"
                                      disabled={role?.name === 'Admin'}
                                      onClick={() => {
                                        const keys = [sec.key, ...sec.fields.map(f => `${sec.key}_${f.key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`)];
                                        bulkSetSeePermissions(keys, 'full');
                                      }}
                                      className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer flex items-center gap-1",
                                        sectionVal === 'full' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-800"
                                      )}
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                      <span>Full Access</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Section Fields */}
                              {!isCollapsed && (
                                <div className="divide-y divide-slate-100 bg-white">
                                  {filteredFields.map(f => {
                                    const safeF = f.key.toLowerCase().replace(/[^a-z0-9]/g, '_');
                                    const fieldKey = `${sec.key}_${safeF}`;
                                    const fieldVal = getSeePermission(fieldKey, sectionVal);

                                    return (
                                      <div 
                                        key={f.key} 
                                        className={cn(
                                          "flex items-center justify-between py-2.5 px-4 pl-9 transition-colors group hover:bg-amber-50/20",
                                          fieldVal === 'no' && "bg-slate-50/50",
                                          fieldVal === 'view' && "bg-blue-50/20",
                                          fieldVal === 'full' && "bg-emerald-50/20"
                                        )}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-slate-800">
                                            {f.labelEn}
                                          </span>
                                          {f.isSensitive && (
                                            <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                                              <Shield className="w-2.5 h-2.5 text-amber-600" />
                                              Sensitive
                                            </span>
                                          )}
                                          <span className="text-[9px] text-slate-400 font-mono">
                                            ({f.key})
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          {/* Badge Indicator */}
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

                                          {/* Mini Action Toggles */}
                                          <div className="flex items-center bg-slate-800 text-white p-0.5 rounded-full shadow-xs gap-0.5">
                                            <button
                                              type="button"
                                              disabled={role?.name === 'Admin'}
                                              onClick={() => setSeePermission(fieldKey, 'no')}
                                              className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                                fieldVal === 'no' ? "bg-rose-600 text-white shadow-sm scale-105" : "text-slate-400 hover:text-white"
                                              )}
                                              title="Hide field"
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
                                              title="Read only"
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
                                              title="Full access"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PERSPECTIVE 2: SELF */}
          {seePerspective === 'self' && (
            <div className="space-y-6 pt-2">
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900">
                  Should Employees be able to see and edit their own information?
                </h3>
                <p className="text-xs text-slate-500">
                  Configure self-service portal permissions for users assigned to this role.
                </p>

                <div className="space-y-4 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="allowSelfAccess"
                      checked={allowSelf}
                      disabled={role?.name === 'Admin'}
                      onChange={() => setSelfAccess(true, selfLevel)}
                      className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                      Yes, Allow Access to My Info (Self Profile & Time-Off)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="allowSelfAccess"
                      checked={!allowSelf}
                      disabled={role?.name === 'Admin'}
                      onChange={() => setSelfAccess(false, selfLevel)}
                      className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                      No, Hide the My Info Section (Disable Self Access)
                    </span>
                  </label>
                </div>

                {allowSelf && (
                  <div className="space-y-2 pt-4 border-t border-slate-100 max-w-sm">
                    <label className="block text-xs font-black text-slate-700">
                      Self-Access Scope Level:
                    </label>
                    <select
                      value={selfLevel}
                      disabled={role?.name === 'Admin'}
                      onChange={(e) => setSelfAccess(true, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
                    >
                      <option value="Employees">Employees (Standard Employee View)</option>
                      <option value="Managers">Managers (Managerial Self View)</option>
                      <option value="Full Admin">Full Admin (Self-Administration)</option>
                      <option value="Self Access Level">Custom Self Access Level</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PERSPECTIVE 3: HOME */}
          {seePerspective === 'home' && (
            <div className="space-y-6 pt-2">
              <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-900">
                  Home Screen Dashboard Widgets
                </h3>
                <p className="text-xs text-slate-500">
                  Enable or hide the quick widgets shown on the portal homepage for this role.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {homeWidgetCards.map(card => {
                  const isChecked = permissions?.home_widgets?.[card.id]?.enabled !== false;
                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        if (role?.name !== 'Admin') {
                          toggleHomeWidget(card.id, !isChecked);
                        }
                      }}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between bg-white shadow-2xs hover:shadow-md",
                        isChecked 
                          ? "border-indigo-600 ring-2 ring-indigo-500/10" 
                          : "border-slate-200 opacity-50 hover:opacity-100 bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={cn(
                          "p-2 rounded-xl shrink-0 transition-colors",
                          isChecked ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-400"
                        )}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center transition-colors border shrink-0",
                          isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                        )}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs font-black text-slate-900 leading-tight">{card.labelEn}</div>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">{card.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RBACActionsFieldsPage;
