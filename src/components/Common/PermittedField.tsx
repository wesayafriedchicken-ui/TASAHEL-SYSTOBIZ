import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

// Global cache for standard field overrides from hr_custom_fields
let cachedOverrides: Record<string, any> = {};
let listeners: Array<() => void> = [];

export const refreshFieldOverridesCache = async () => {
  try {
    const res = await fetch('/api/hr/custom-fields');
    if (res.ok) {
      const data = await res.json();
      const map: Record<string, any> = {};
      data.forEach((item: any) => {
        if (item.field_name) {
          const fn = item.field_name.toLowerCase().trim();
          map[fn] = item;
          if (fn.startsWith('std_')) {
            map[fn.substring(4)] = item;
          } else {
            map[`std_${fn}`] = item;
          }
        }
        if (item.field_label_en) {
          map[item.field_label_en.toLowerCase().trim()] = item;
        }
        if (item.relation_target_table && item.field_name) {
          const tab = item.relation_target_table.toLowerCase().trim();
          const fn = item.field_name.toLowerCase().trim();
          map[`${tab}::${fn}`] = item;
          if (fn.startsWith('std_')) {
            map[`${tab}::${fn.substring(4)}`] = item;
          } else {
            map[`${tab}::std_${fn}`] = item;
          }
        }
        if (item.relation_target_table && item.field_label_en) {
          const tab = item.relation_target_table.toLowerCase().trim();
          map[`${tab}::${item.field_label_en.toLowerCase().trim()}`] = item;
        }
      });
      cachedOverrides = map;
      listeners.forEach(l => l());
    }
  } catch (err) {
    console.warn('Notice: Failed to load custom field overrides', err);
  }
};

// Initial fetch if in browser
if (typeof window !== 'undefined') {
  refreshFieldOverridesCache();
}

export interface PermittedFieldProps {
  moduleName?: string;
  tabName?: string;
  fieldKey: string;
  employeeId?: number | string;
  employeeUserId?: number | string;
  employeeEmail?: string;
  permLevel?: number;
  label?: string;
  hidden?: boolean;
  readOnly?: boolean;
  required?: boolean;
  allowOnSubmit?: boolean;
  className?: string;
  children: (props: { 
    status: 'editable' | 'readonly' | 'hidden'; 
    isReadOnly: boolean;
    isRequired: boolean;
    allowOnSubmit: boolean;
    effectiveLabel?: string;
    permLevel?: number;
    isOwnOnly?: boolean;
    isMasked?: boolean;
  }) => React.ReactNode;
}

export const PermittedField: React.FC<PermittedFieldProps> = ({
  moduleName = 'employee',
  tabName,
  fieldKey,
  employeeId,
  employeeUserId,
  employeeEmail,
  permLevel = 0,
  label,
  hidden,
  readOnly,
  required,
  allowOnSubmit = false,
  className,
  children
}) => {
  const { user, getFieldPermStatus } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  // Look up override from cache
  const normKey = (fieldKey || '').toLowerCase().trim();
  const labelNorm = (label || '').toLowerCase().trim();
  const tabNorm = (tabName || '').toLowerCase().trim();

  const override = 
    (tabNorm ? cachedOverrides[`${tabNorm}::${normKey}`] : undefined) ||
    (tabNorm ? cachedOverrides[`${tabNorm}::${labelNorm}`] : undefined) ||
    cachedOverrides[normKey] || 
    cachedOverrides[`std_${normKey}`] ||
    (normKey.startsWith('std_') ? cachedOverrides[normKey.substring(4)] : undefined) ||
    (labelNorm ? cachedOverrides[labelNorm] : undefined);

  const effectivePermLevel = override?.perm_level !== undefined ? Number(override.perm_level) : permLevel;
  const effectiveOwnOnly = !!(override?.own_only || effectivePermLevel === 4);
  const effectiveReadOnlySetting = !!(override?.read_only || readOnly);
  const effectiveHidden = !!(override?.hidden || hidden);
  const effectiveRequired = !!(override?.is_required || required);
  const effectiveAllowOnSubmit = !!(override?.allow_on_submit || allowOnSubmit);
  const effectiveLabel = override?.field_label_en || label;

  const status = getFieldPermStatus(moduleName, fieldKey, effectivePermLevel, tabName);

  // Check ownership
  const isOwner = Boolean(
    user && (
      (employeeId && (
        String(user.id) === String(employeeId) || 
        String((user as any).user_id) === String(employeeId) || 
        ((user as any).employee_id && String((user as any).employee_id).toLowerCase() === String(employeeId).toLowerCase())
      )) ||
      (employeeUserId && (
        String(user.id) === String(employeeUserId) || 
        String((user as any).user_id) === String(employeeUserId)
      )) ||
      (employeeEmail && user.email && String(user.email).toLowerCase().trim() === String(employeeEmail).toLowerCase().trim())
    )
  );

  const isHRAdmin = Boolean(
    user && (
      user.role === 'Admin' || 
      user.role_name === 'Admin' || 
      user.role === 'Super Admin' ||
      user.role_name === 'Super Admin' || 
      user.role_id === 1 || 
      Boolean((user as any).is_super_admin) ||
      user.email === 'admin@gmail.com' ||
      user.email === 'admin@opex.com'
    )
  );

  // 1. Explicit Hidden flag or Role hidden: completely remove from UI
  if (status === 'hidden' || effectiveHidden) {
    return null;
  }

  // 2. Own Only (Self-Access Only) or Perm Level 4:
  // Restricts visibility so that ONLY the employee themselves (or Super Admin) can view or modify.
  // Regular managers and peers CANNOT access it (hidden).
  if ((effectiveOwnOnly || effectivePermLevel === 4) && !isOwner && !isHRAdmin) {
    return null;
  }

  // 3. Perm Level 3: Super Admin & Confidential Level - only Super Admin can see it
  if (effectivePermLevel === 3 && !isHRAdmin) {
    return null;
  }

  // 4. Read Only determination
  let isReadOnly = status === 'readonly' || effectiveReadOnlySetting;

  if (!isHRAdmin && !isOwner) {
    if (effectivePermLevel === 2) {
      // Level 2 (Financial & Sensitive) is read-only for non-owner / non-admin
      isReadOnly = true;
    }
  }

  // 5. Mask Sensitive Data check (for users without Super Admin permission)
  const isMasked = Boolean(override?.mask_value && !isHRAdmin);

  if (isMasked) {
    return (
      <div className={cn("relative group", className)}>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-indigo-500" /> {effectiveLabel || label || fieldKey}
            </span>
            <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md font-extrabold flex items-center gap-0.5">
              *** Masked
            </span>
          </label>
          <div className="w-full text-xs font-mono py-2.5 px-3 rounded-xl border border-indigo-100 bg-indigo-50/40 text-indigo-900 font-black tracking-widest flex items-center justify-between select-none">
            <span>••••••••••</span>
            <span className="text-[10px] text-indigo-600 font-semibold tracking-normal">Confidential</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      {children({ 
        status: isReadOnly ? 'readonly' : 'editable', 
        isReadOnly, 
        isRequired: effectiveRequired,
        allowOnSubmit: effectiveAllowOnSubmit,
        effectiveLabel, 
        permLevel: effectivePermLevel, 
        isOwnOnly: effectiveOwnOnly,
        isMasked: false
      })}
    </div>
  );
};
