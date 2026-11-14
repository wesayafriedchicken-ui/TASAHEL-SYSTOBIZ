import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, User, Check, X, Phone, Hash, Building2, Briefcase, ChevronDown } from 'lucide-react';

export interface EmployeeOption {
  id: string | number;
  name: string;
  email?: string;
  department?: string;
  job_title?: string;
  id_number?: string;
  employee_code?: string;
  ext?: string;
  phone?: string;
  user_id?: any;
  avatar_url?: string;
}

interface EmployeeSearchSelectProps {
  value: string;
  onChange: (name: string, employee?: EmployeeOption) => void;
  employees: EmployeeOption[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  id?: string;
  badgeType?: 'agent' | 'qa' | 'manager' | 'default';
  allowCustom?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Helper to normalize Arabic and English text for fuzzy search
function normalizeSearchText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, ''); // Remove Arabic diacritics / tashkeel
}

export const EmployeeSearchSelect: React.FC<EmployeeSearchSelectProps> = ({
  value,
  onChange,
  employees,
  placeholder = 'Select employee...',
  label,
  className = '',
  id,
  badgeType = 'default',
  allowCustom = true,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isSm = size === 'sm';

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Find currently selected employee object if matches value
  const selectedEmployee = useMemo(() => {
    if (!value) return null;
    return employees.find(
      (emp) =>
        emp.name.toLowerCase() === value.toLowerCase() ||
        String(emp.id) === String(value) ||
        String(emp.user_id) === String(value) ||
        (emp.ext && String(emp.ext).trim().toLowerCase() === String(value).trim().toLowerCase())
    );
  }, [value, employees]);

  // Filtered employees list based strictly on Ext (from Personal tab) or Name/Dept/Job
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;

    const normalizedQuery = normalizeSearchText(searchTerm);
    const cleanNumbers = searchTerm.replace(/[^0-9]/g, '');
    const cleanExtQuery = normalizedQuery.replace(/^(ext|ext:|ext\.|تحويلة|تحويله)\s*/i, '').trim();

    const matches = employees.filter((emp) => {
      const normalizedName = normalizeSearchText(emp.name || '');
      const normalizedEmail = normalizeSearchText(emp.email || '');
      const normalizedDept = normalizeSearchText(emp.department || '');
      const normalizedJob = normalizeSearchText(emp.job_title || '');
      const empExt = String(emp.ext || '').trim().toLowerCase();

      // 1. Strict Ext match (from HR Personal Tab) - Highest Priority
      if (empExt) {
        if (
          empExt === normalizedQuery ||
          empExt === cleanExtQuery ||
          (cleanNumbers && empExt === cleanNumbers) ||
          empExt.includes(normalizedQuery) ||
          (cleanExtQuery && empExt.includes(cleanExtQuery)) ||
          (cleanNumbers && empExt.includes(cleanNumbers))
        ) {
          return true;
        }
      }

      // 2. Text matches by Name, Email, Department, Job Title (Do NOT match database ID or employee ID)
      if (
        normalizedName.includes(normalizedQuery) ||
        normalizedEmail.includes(normalizedQuery) ||
        normalizedDept.includes(normalizedQuery) ||
        normalizedJob.includes(normalizedQuery)
      ) {
        return true;
      }

      return false;
    });

    // Prioritize employees with matching Ext
    return matches.sort((a, b) => {
      const aExt = String(a.ext || '').trim().toLowerCase();
      const bExt = String(b.ext || '').trim().toLowerCase();
      const aExactExt = aExt && (aExt === normalizedQuery || aExt === cleanExtQuery || (cleanNumbers && aExt === cleanNumbers));
      const bExactExt = bExt && (bExt === normalizedQuery || bExt === cleanExtQuery || (cleanNumbers && bExt === cleanNumbers));

      if (aExactExt && !bExactExt) return -1;
      if (!aExactExt && bExactExt) return 1;

      const aHasExt = aExt && cleanNumbers && aExt.includes(cleanNumbers);
      const bHasExt = bExt && cleanNumbers && bExt.includes(cleanNumbers);
      if (aHasExt && !bHasExt) return -1;
      if (!aHasExt && bHasExt) return 1;

      return 0;
    });
  }, [employees, searchTerm]);

  const handleSelect = (emp: EmployeeOption) => {
    onChange(emp.name, emp);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      {label && <label className="block text-slate-600 font-bold mb-2 text-xs">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 border text-left flex items-center justify-between gap-1.5 transition-all cursor-pointer shadow-xs ${
          isSm ? 'rounded-lg px-2.5 py-1 text-xs font-semibold' : 'rounded-xl px-3.5 py-2.5 text-sm font-bold shadow-sm'
        } ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white'
            : value
            ? 'border-slate-300 bg-white hover:border-slate-400'
            : 'border-slate-200 text-slate-400 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedEmployee ? (
            <div className={`rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs ${
              isSm ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]'
            }`}>
              {getInitials(selectedEmployee.name)}
            </div>
          ) : (
            <User className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-400 shrink-0`} />
          )}

          <div className="truncate flex items-center gap-1.5 flex-1">
            <span className={`truncate ${isSm ? 'text-xs' : 'text-sm'} ${value ? 'text-slate-800 font-bold' : 'text-slate-400 font-normal'}`}>
              {value || placeholder}
            </span>

            {/* Quick badges if selected */}
            {selectedEmployee?.ext && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 ${
                isSm ? 'text-[9px]' : 'text-[10px]'
              }`}>
                <Phone className="w-2.5 h-2.5 text-emerald-600" />
                Ext: {selectedEmployee.ext}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 shrink-0">
          {value && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
            </div>
          )}
          <ChevronDown className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[280px] sm:min-w-[340px] max-w-[420px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs">
          {/* Search Header */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 space-y-1.5">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Ext (e.g. 2222) or Name..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span>Directory (HR) • {filteredEmployees.length} employees</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Search by Ext (Personal) or Name
              </span>
            </div>
          </div>

          {/* Employees List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredEmployees.length === 0 ? (
              <div className="py-6 px-4 text-center space-y-2">
                <p className="text-slate-500 font-medium">No employee matching search</p>
                {allowCustom && searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(searchTerm.trim());
                      setIsOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold transition-all"
                  >
                    <span>Use custom name:</span>
                    <span className="underline font-black">"{searchTerm.trim()}"</span>
                  </button>
                )}
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected =
                  value &&
                  (value.toLowerCase() === emp.name.toLowerCase() ||
                    String(value) === String(emp.id) ||
                    String(value) === String(emp.user_id));

                return (
                  <button
                    key={`${emp.id}-${emp.user_id || emp.name}`}
                    type="button"
                    onClick={() => handleSelect(emp)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-900 border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                        }`}
                      >
                        {getInitials(emp.name)}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs truncate">{emp.name}</span>

                          {/* Extension badge (Ext from HR Personal tab) */}
                          {emp.ext ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              searchTerm && emp.ext.toLowerCase().includes(searchTerm.trim().toLowerCase())
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}>
                              <Phone className={`w-2.5 h-2.5 ${searchTerm && emp.ext.toLowerCase().includes(searchTerm.trim().toLowerCase()) ? 'text-white' : 'text-emerald-600'}`} />
                              Ext: {emp.ext}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200">
                              No Ext
                            </span>
                          )}
                        </div>

                        {/* Job title & Department */}
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                          {emp.job_title && (
                            <span className="truncate flex items-center gap-1">
                              <Briefcase className="w-2.5 h-2.5 shrink-0" />
                              {emp.job_title}
                            </span>
                          )}
                          {emp.department && (
                            <span className="truncate flex items-center gap-1 text-slate-400">
                              <Building2 className="w-2.5 h-2.5 shrink-0" />
                              {emp.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
