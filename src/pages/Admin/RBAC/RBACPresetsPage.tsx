import React, { useState } from 'react';
import { Zap, Check, AlertCircle, Shield, Eye, Edit3, UserCheck, Sparkles } from 'lucide-react';
import { useRBAC } from './RBACContext';
import { SYSTEM_ROLE_PRESETS, SystemRolePreset } from '../../../components/Admin/rbacPresets';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export const RBACPresetsPage: React.FC = () => {
  const { role, moduleMetadata, applyPreset } = useRBAC();
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);
  const [previewPreset, setPreviewPreset] = useState<SystemRolePreset | null>(null);

  const handleApply = (preset: SystemRolePreset) => {
    if (role?.name === 'Admin') return;
    applyPreset(preset.id);
    setAppliedPresetId(preset.id);
    setTimeout(() => setAppliedPresetId(null), 4000);
    setPreviewPreset(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-amber-300">
              Pre-Configured System Role Presets
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Applying a preset automatically configures all screens, custom actions, and field-level permissions for ({moduleMetadata?.nameEn || 'Selected Module'}) to match standard industry best practices.
            </p>
          </div>
        </div>

        {appliedPresetId && (
          <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-black p-3 rounded-2xl flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Preset applied successfully! Click "Save Module Permissions" at the top to persist changes.</span>
          </div>
        )}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SYSTEM_ROLE_PRESETS.map((preset) => {
          const isJustApplied = appliedPresetId === preset.id;

          return (
            <div
              key={preset.id}
              className={cn(
                "bg-white rounded-3xl border p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md",
                isJustApplied 
                  ? "border-emerald-500 ring-2 ring-emerald-500/20" 
                  : "border-slate-200 hover:border-indigo-300"
              )}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-2xs">
                    {preset.icon}
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider",
                    preset.badgeBg,
                    preset.badgeText
                  )}>
                    {preset.nameEn}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {preset.nameEn}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">
                    {preset.descriptionEn || preset.descriptionAr}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-[11px] font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Data Scope:</span>
                    <span className="font-bold text-slate-800 uppercase">{preset.dataScope}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Screen Level:</span>
                    <span className="font-bold text-slate-800">
                      {preset.level === 0 ? 'Inherit' : preset.level === 1 ? 'Editable' : preset.level === 2 ? 'Read Only' : 'Hidden'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sensitive Fields:</span>
                    <span className="font-bold text-slate-800 capitalize">{preset.seePermissions}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewPreset(preset)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  Inspect
                </button>
                <button
                  type="button"
                  disabled={role?.name === 'Admin'}
                  onClick={() => handleApply(preset)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50",
                    isJustApplied
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:scale-102 active:scale-98"
                  )}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Apply Preset</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preset Details Modal */}
      {previewPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-slate-50 rounded-2xl border border-slate-100">
                  {previewPreset.icon}
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {previewPreset.nameEn}
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">Standard Role Template</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPreset(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {previewPreset.descriptionEn || previewPreset.descriptionAr}
            </p>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800">Standard CRUD Operations in this Preset:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(previewPreset.permissions).map(([action, enabled]) => (
                  <div 
                    key={action} 
                    className={cn(
                      "p-2 rounded-xl border flex items-center justify-between",
                      enabled ? "bg-emerald-50/60 border-emerald-200 text-emerald-900 font-bold" : "bg-slate-50 border-slate-200 text-slate-400"
                    )}
                  >
                    <span className="capitalize">{action}</span>
                    <span>{enabled ? '✓ Allowed' : '✗ Blocked'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewPreset(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={role?.name === 'Admin'}
                onClick={() => handleApply(previewPreset)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Confirm & Apply Preset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RBACPresetsPage;
