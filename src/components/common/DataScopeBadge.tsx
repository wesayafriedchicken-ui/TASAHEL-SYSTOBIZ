import React from 'react';
import { useRBAC } from '../../context/RBACContext';
import { Building2, User, Users, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DataScopeBadgeProps {
  screenKey: string;
  module?: string;
  className?: string;
  showGlobal?: boolean;
}

export const DataScopeBadge: React.FC<DataScopeBadgeProps> = ({
  screenKey,
  module,
  className,
  showGlobal = false
}) => {
  const { getDataScope, isSuperAdmin } = useRBAC();
  
  if (isSuperAdmin && !showGlobal) return null;

  const scope = getDataScope(screenKey, module);

  if (scope === 'global') {
    if (!showGlobal) return null;
    return (
      <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs", className)}>
        <Globe className="w-3 h-3 text-slate-500" />
        <span>Company-Wide Scope</span>
      </span>
    );
  }

  if (scope === 'department') {
    return (
      <span 
        title="Your view is restricted to records within your department"
        className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs", className)}
      >
        <Building2 className="w-3 h-3 text-amber-600" />
        <span>Filtered by Department Scope</span>
      </span>
    );
  }

  if (scope === 'own') {
    return (
      <span 
        title="Your view is restricted to records assigned to or created by you"
        className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-2xs", className)}
      >
        <User className="w-3 h-3 text-indigo-600" />
        <span>Filtered by Own Scope</span>
      </span>
    );
  }

  if (scope === 'team') {
    return (
      <span 
        title="Your view is restricted to your direct team members"
        className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200/80 shadow-2xs", className)}
      >
        <Users className="w-3 h-3 text-purple-600" />
        <span>Filtered by Team Scope</span>
      </span>
    );
  }

  return null;
};

export default DataScopeBadge;
