import React, { useState } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, ShieldAlert, RefreshCw, Save, Search, 
  FolderTree, SlidersHorizontal, Zap, CheckCircle2, AlertCircle, Settings, Eye, EyeOff
} from 'lucide-react';
import { RBACProvider, useRBAC } from './RBACContext';
import { useAuth } from '../../../context/AuthContext';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const RBACLayoutContent: React.FC = () => {
  const { 
    roleId, 
    moduleId, 
    role, 
    moduleMetadata, 
    hasChanges, 
    saving, 
    saveErrorMsg,
    setSaveErrorMsg,
    loading, 
    savePermissions,
    matrixSearch,
    setMatrixSearch,
    toggleTabVisibility,
    updateTabLevel,
    updateTabDataScope,
    canonModule,
    permissions
  } = useRBAC();

  const { previewRole, setPreviewRole } = useAuth();
  const navigate = useNavigate();
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const isPreviewingThisRole = previewRole?.id === Number(roleId);

  const handleTogglePreview = () => {
    if (isPreviewingThisRole) {
      setPreviewRole(null);
    } else {
      const lowMod = (moduleId || '').toLowerCase();
      const isHome = canonModule === 'Home' || lowMod === 'home' || lowMod.includes('home');
      const isHR = canonModule === 'HR' || lowMod === 'hr' || lowMod.includes('human');
      const isQA = moduleId === 'QA' || moduleId === 'Quality Assurance' || canonModule === 'QA' || lowMod === 'qa';
      const isProd = canonModule === 'Products/Services' || lowMod.includes('product') || lowMod.includes('catalog');
      const isKnowledge = canonModule === 'Knowledge Base' || lowMod.includes('knowledge') || lowMod === 'kb';

      setPreviewRole({
        id: Number(roleId),
        name: role?.name || `Role #${roleId}`,
        permissions: {
          ...(role?.permissions || {}),
          [canonModule]: permissions,
          ...(isHome ? {
            Home: permissions,
            home: permissions,
            'Home / Workspace': permissions
          } : {}),
          ...(isHR ? { 
            HR: permissions, 
            'HR Management': permissions, 
            hr: permissions, 
            hr_management: permissions 
          } : {}),
          ...(isQA ? { QA: permissions, 'Quality Assurance': permissions, qa: permissions } : {}),
          ...(isProd ? { 
            'Products/Services': permissions, 
            'Products & Services': permissions, 
            'Products%2FServices': permissions, 
            'Catalog': permissions, 
            'catalog': permissions, 
            'products': permissions 
          } : {}),
          ...(isKnowledge ? { 
            'Knowledge Base': permissions, 
            'Knowledge%20Base': permissions, 
            'kb': permissions, 
            'knowledge_base': permissions, 
            'knowledge': permissions 
          } : {})
        }
      });
      if (isHome) {
        navigate('/home');
      } else if (isHR) {
        navigate('/hr/directory');
      } else if (isQA) {
        navigate('/qa');
      } else if (isProd) {
        navigate('/catalog/dashboard');
      } else if (isKnowledge) {
        navigate('/kb/articles');
      }
    }
  };

  const handleSave = async () => {
    const success = await savePermissions();
    if (success) {
      setSaveSuccessMsg('Module permissions saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }
  };

  const allTabs = moduleMetadata?.tabs || [];

  const handleSelectAll = () => {
    if (role?.name === 'Admin') return;
    allTabs.forEach(t => {
      toggleTabVisibility(t.id, true);
      updateTabLevel(t.id, 0);
      updateTabDataScope(t.id, 'global');
    });
  };

  const handleResetAll = () => {
    if (role?.name === 'Admin') return;
    allTabs.forEach(t => {
      toggleTabVisibility(t.id, false);
      updateTabLevel(t.id, 3);
      updateTabDataScope(t.id, 'own');
    });
  };

  const encodedMod = encodeURIComponent(decodeURIComponent(moduleId));
  const basePath = `/admin/rbac/${roleId}/module/${encodedMod}`;

  const ModuleIcon = moduleMetadata?.icon || Shield;

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <h4 className="text-sm font-black text-slate-800">Loading RBAC Permissions Matrix...</h4>
        <p className="text-xs text-slate-400 mt-1">Fetching granular module RBAC metadata</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fade-in relative">
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 bg-slate-50/50 -mx-6 -mt-6 p-6 rounded-t-3xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/rbac')}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all text-slate-600 flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer"
            title="Back to Roles Matrix"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <ModuleIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  Target Role: {role?.name || `Role #${roleId}`}
                </span>
                {hasChanges && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Unsaved Changes
                  </span>
                )}
              </div>
              <h4 className="text-base font-black text-slate-800 mt-0.5 flex items-center gap-2">
                <span>{moduleMetadata?.nameEn || decodeURIComponent(moduleId)}</span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  ({moduleMetadata?.id || decodeURIComponent(moduleId)})
                </span>
              </h4>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {saveErrorMsg && (
            <div className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{saveErrorMsg}</span>
              <button 
                type="button" 
                onClick={() => setSaveErrorMsg(null)}
                className="ml-1 text-rose-400 hover:text-rose-700 font-bold leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
          {saveSuccessMsg && (
            <div className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {role?.name !== 'Admin' && (
            <button
              type="button"
              onClick={handleTogglePreview}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer border",
                isPreviewingThisRole
                  ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                  : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:scale-105 active:scale-95"
              )}
              title="Live preview role permissions in application"
            >
              {isPreviewingThisRole ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-700" />
                  <span>Exit Preview</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>Live Preview Role</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || role?.name === 'Admin'}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer",
              role?.name === 'Admin'
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : hasChanges
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:scale-105 active:scale-95"
                  : "bg-slate-800 hover:bg-slate-700 text-white shadow-sm"
            )}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Module Permissions'}</span>
          </button>
        </div>
      </div>

      {/* Top Mode Navigation Pills */}
      <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-2 border border-slate-200 overflow-x-auto">
        <NavLink
          to={`${basePath}/tree`}
          className={({ isActive }) => cn(
            "flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
            isActive ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          )}
        >
          <FolderTree className="w-4 h-4" />
          <span>1. Screen Tree (Tree)</span>
        </NavLink>

        <NavLink
          to={`${basePath}/actions-fields`}
          className={({ isActive }) => cn(
            "flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
            isActive ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>2. Actions & Fields Matrix</span>
        </NavLink>

        <NavLink
          to={`${basePath}/advanced-rules`}
          className={({ isActive }) => cn(
            "flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
            isActive ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          )}
        >
          <Settings className="w-4 h-4" />
          <span>3. Advanced Screen Rules</span>
        </NavLink>

        <NavLink
          to={`${basePath}/presets`}
          className={({ isActive }) => cn(
            "flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
            isActive ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          )}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>4. Role Presets</span>
        </NavLink>
      </div>

      {/* Render Sub Route */}
      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
};

export const RBACLayout: React.FC = () => {
  return (
    <RBACProvider>
      <RBACLayoutContent />
    </RBACProvider>
  );
};

export default RBACLayout;
