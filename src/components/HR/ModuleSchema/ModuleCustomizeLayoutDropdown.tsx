import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  ChevronDown,
  ArrowUpDown,
  PlusCircle,
  Table,
  Settings,
  Shield
} from 'lucide-react';
import { ManageModuleSchemaModal } from './ManageModuleSchemaModal';
import { resolveTargetPageFromPath, getModuleDefaultSchema } from './hrModuleRegistry';
import { AddCustomFieldModal } from './modals/AddCustomFieldModal';
import { AddCustomTableModal } from './modals/AddCustomTableModal';
import { useModuleSchema } from './useModuleSchema';
import { cn } from '../../../lib/utils';
import { useRBAC } from '../../../context/RBACContext';
import { useAuth } from '../../../context/AuthContext';

export interface ModuleCustomizeLayoutDropdownProps {
  targetPage?: string;
  activeTabId?: string;
  className?: string;
  buttonLabel?: string;
  variant?: 'outline-green' | 'default' | 'compact' | 'indigo';
  allowPageSwitch?: boolean;
  iconOnly?: boolean;
}

const HR_PAGE_OPTIONS = [
  { id: 'departments', labelEn: 'Departments & Structure', labelAr: 'الأقسام والهيكل' },
  { id: 'recruitment', labelEn: 'Hiring & Recruitment', labelAr: 'التوظيف والاستقطاب' },
  { id: 'payroll', labelEn: 'Payroll & Salaries', labelAr: 'الرواتب والمستحقات' },
  { id: 'attendance', labelEn: 'Attendance & Clock In', labelAr: 'الحضور والإنصراف' },
  { id: 'complaints', labelEn: 'Complaints & Grievances', labelAr: 'الشكاوى والتظلمات' }
];

export const ModuleCustomizeLayoutDropdown: React.FC<ModuleCustomizeLayoutDropdownProps> = ({
  targetPage: targetPageProp,
  activeTabId,
  className,
  buttonLabel = 'Customize Layout',
  variant = 'outline-green',
  allowPageSwitch = false,
  iconOnly = false
}) => {
  const location = useLocation();
  const [selectedPage, setSelectedPage] = useState<string>(() => {
    return targetPageProp || resolveTargetPageFromPath(location.pathname);
  });

  useEffect(() => {
    if (targetPageProp) {
      setSelectedPage(targetPageProp);
    }
  }, [targetPageProp]);

  const effectiveTargetPage = selectedPage;

  const { isActionPermitted, isSuperAdmin, user: rbacUser } = useRBAC();
  const { user: authUser, checkPermission } = useAuth();
  const currentUser = rbacUser || authUser;

  // Strict Permission Check for "Customize Layout":
  // Only visible if explicitly granted to the active role, or if user is owner / super admin
  const canCustomizeLayout = useMemo(() => {
    // If previewing another non-admin role, strictly test against that role
    if ((currentUser as any)?.isPreviewActive) {
      const page = effectiveTargetPage || 'departments';
      const actionKey = `hr:${page}:customize_layout`;
      const altActionKey = page === 'recruitment' ? 'hr:hiring:customize_layout' : null;
      if (isActionPermitted(actionKey, 'HR', page)) return true;
      if (altActionKey && isActionPermitted(altActionKey, 'HR', 'recruitment')) return true;
      if (isActionPermitted(`${page}:customize_layout`, 'HR', page)) return true;
      if (isActionPermitted('customize_layout', 'HR', page)) return true;
      return false;
    }

    const email = currentUser?.email?.toLowerCase().trim();
    // 1. Owner / Super Admin always has full layout customization authority
    if (email === 'esraaessoo19@gmail.com') return true;
    if (isSuperAdmin) return true;

    // 2. For any other user / role, they MUST be explicitly granted the action in RBAC
    const page = effectiveTargetPage || 'departments';
    const actionKey = `hr:${page}:customize_layout`;
    const altActionKey = page === 'recruitment' ? 'hr:hiring:customize_layout' : null;

    if (isActionPermitted(actionKey, 'HR', page)) return true;
    if (altActionKey && isActionPermitted(altActionKey, 'HR', 'recruitment')) return true;
    if (isActionPermitted(`${page}:customize_layout`, 'HR', page)) return true;
    if (isActionPermitted('customize_layout', 'HR', page)) return true;

    if (checkPermission) {
      if (checkPermission('HR', actionKey)) return true;
      if (altActionKey && checkPermission('HR', altActionKey)) return true;
      if (checkPermission('HR', `custom:${actionKey}`)) return true;
      if (altActionKey && checkPermission('HR', `custom:${altActionKey}`)) return true;
      if (checkPermission('HR', 'custom:customize_layout')) return true;
    }

    return false;
  }, [currentUser, isSuperAdmin, effectiveTargetPage, isActionPermitted, checkPermission]);

  const [isOpen, setIsOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { schema, addCustomField, addCustomTable, saveSchema } = useModuleSchema(effectiveTargetPage);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentTab = schema.subTabs?.find((t) => t.id === activeTabId) || schema.subTabs?.[0];
  const sections = currentTab?.sections || [];

  if (!canCustomizeLayout) {
    return null;
  }

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          iconOnly
            ? "flex items-center justify-center p-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            : "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap",
          variant === 'outline-green' &&
            "border border-[#1b5e20]/30 text-[#1b5e20] bg-emerald-50/40 hover:bg-emerald-50 hover:border-[#1b5e20]/60",
          variant === 'indigo' &&
            "border border-indigo-200 text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 hover:border-indigo-300",
          variant === 'default' &&
            "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-slate-900",
          variant === 'compact' &&
            (iconOnly 
              ? "p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200" 
              : "px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg border border-slate-200")
        )}
        title={buttonLabel || "Customize Layout"}
      >
        <LayoutGrid className={cn(
          "w-4 h-4",
          variant === 'outline-green' && "text-[#1b5e20]",
          variant === 'indigo' && "text-indigo-700",
          (variant === 'default' || variant === 'compact') && "text-slate-600"
        )} />
        {!iconOnly && <span>{buttonLabel}</span>}
        {!iconOnly && <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180")} />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Layout Settings</h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Customize layout, fields, and tables for: <strong className="text-slate-800">{schema.displayName}</strong>
            </p>
          </div>

          {/* Module Screen Selector if allowPageSwitch */}
          {allowPageSwitch && (
            <div className="px-3 py-2.5 bg-slate-50/60 border-b border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Target HR Screen:
              </label>
              <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
                {HR_PAGE_OPTIONS.map((opt) => {
                  const isActive = opt.id === effectiveTargetPage;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPage(opt.id)}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer",
                        isActive 
                          ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200" 
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="truncate">{opt.labelEn}</span>
                      {isActive && (
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded shrink-0">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* List Items */}
          <div className="p-2 space-y-1">
            {/* Reorder Fields */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsSchemaModalOpen(true);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <ArrowUpDown className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  Reorder Fields
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Arrange, show/hide, or reorganize layout fields
                </div>
              </div>
            </button>

            {/* Add Custom Field */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsAddFieldOpen(true);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  Add Custom Field
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Create custom text, select, or date attributes
                </div>
              </div>
            </button>

            {/* Add Custom Table */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsAddTableOpen(true);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Table className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                  Add Custom Table
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Create structured multi-row tabular record lists
                </div>
              </div>
            </button>
          </div>

          {/* Footer Quick Action */}
          <div className="px-3 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">Module: {schema.displayName}</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsSchemaModalOpen(true);
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>Full Schema Builder</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Schema Builder Modal */}
      <ManageModuleSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        targetPage={effectiveTargetPage}
        initialTabId={activeTabId}
      />

      {/* Direct Add Custom Field Modal */}
      <AddCustomFieldModal
        isOpen={isAddFieldOpen}
        onClose={() => setIsAddFieldOpen(false)}
        sections={sections}
        onAdd={async (secName, fieldData) => {
          const tabId = currentTab?.id || schema.subTabs?.[0]?.id || 'default';
          addCustomField(tabId, secName, fieldData);
          setIsSchemaModalOpen(true);
        }}
      />

      {/* Direct Add Custom Table Modal */}
      <AddCustomTableModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        sections={sections}
        onAdd={async (secName, tableData) => {
          const tabId = currentTab?.id || schema.subTabs?.[0]?.id || 'default';
          addCustomTable(tabId, secName, tableData);
          setIsSchemaModalOpen(true);
        }}
      />
    </div>
  );
};

export default ModuleCustomizeLayoutDropdown;
