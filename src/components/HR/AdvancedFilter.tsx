import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Plus, Trash2, X, ChevronDown, Check, Sliders, RefreshCw, Calendar, ArrowRight } from 'lucide-react';
import { cn, safeJsonResponse } from '../../lib/utils';

// Filter operators
export type FilterOperator = 'contains' | 'equals' | 'not_equals' | 'starts_with' | 'ends_with' | 'gt' | 'lt' | 'between';

export interface FilterCondition {
  id: string;
  fieldId: string; // e.g. 'name', 'salary_base', 'date', 'cf_123'
  operator: FilterOperator;
  value: string;
  secondValue?: string; // For 'between' ranges (e.g. End Date / Max Value)
}

export interface AdvancedFilterProps {
  items: any[];
  entityType: 'employee' | 'job_opening' | 'candidate' | 'payroll' | 'attendance' | 'performance' | 'leave_request';
  departments?: any[];
  employees?: any[];
  onFilter: (filteredItems: any[] | null) => void;
  title?: string;
  compact?: boolean;
  iconOnly?: boolean;
}

interface CustomField {
  id: number;
  field_name: string;
  entity_type: string;
  label_en?: string;
  label_ar?: string;
  field_type: string;
}

interface CustomFieldValue {
  id: number;
  field_id: number;
  entity_id: number;
  field_value: string;
  field_name: string;
  entity_type: string;
}

// Map entity fields to clean English labels and types
const FIELD_DEFINITIONS: Record<string, Array<{ id: string; labelEn: string; type: 'string' | 'number' | 'date' }>> = {
  employee: [
    { id: 'name', labelEn: 'Employee Name', type: 'string' },
    { id: 'job_title', labelEn: 'Job Title', type: 'string' },
    { id: 'department_name', labelEn: 'Department', type: 'string' },
    { id: 'team', labelEn: 'Team', type: 'string' },
    { id: 'status', labelEn: 'Status', type: 'string' },
    { id: 'contract_type', labelEn: 'Contract Type', type: 'string' },
    { id: 'salary_base', labelEn: 'Base Salary', type: 'number' },
    { id: 'allowances', labelEn: 'Allowances', type: 'number' },
    { id: 'email', labelEn: 'Email', type: 'string' },
    { id: 'phone', labelEn: 'Mobile Phone', type: 'string' },
    { id: 'id_number', labelEn: 'ID Number', type: 'string' },
    { id: 'joined_at', labelEn: 'Joined Date', type: 'date' },
  ],
  payroll: [
    { id: 'employee_name', labelEn: 'Employee Name', type: 'string' },
    { id: 'department_name', labelEn: 'Department', type: 'string' },
    { id: 'team', labelEn: 'Team', type: 'string' },
    { id: 'job_title', labelEn: 'Job Title', type: 'string' },
    { id: 'base_salary', labelEn: 'Base Salary', type: 'number' },
    { id: 'allowances', labelEn: 'Allowances', type: 'number' },
    { id: 'bonuses', labelEn: 'Bonuses', type: 'number' },
    { id: 'commissions', labelEn: 'Commissions', type: 'number' },
    { id: 'deductions', labelEn: 'Deductions', type: 'number' },
    { id: 'total_net', labelEn: 'Total Net Salary', type: 'number' },
    { id: 'month', labelEn: 'Month', type: 'number' },
    { id: 'year', labelEn: 'Year', type: 'number' },
    { id: 'status', labelEn: 'Status', type: 'string' },
  ],
  attendance: [
    { id: 'employee_name', labelEn: 'Employee Name', type: 'string' },
    { id: 'department_name', labelEn: 'Department', type: 'string' },
    { id: 'team', labelEn: 'Team', type: 'string' },
    { id: 'job_title', labelEn: 'Job Title', type: 'string' },
    { id: 'status', labelEn: 'Status', type: 'string' },
    { id: 'date', labelEn: 'Date', type: 'date' },
    { id: 'shift_name', labelEn: 'Shift Name', type: 'string' },
    { id: 'time_in', labelEn: 'Time In', type: 'string' },
    { id: 'time_out', labelEn: 'Time Out', type: 'string' },
  ],
  performance: [
    { id: 'employee_name', labelEn: 'Employee Name', type: 'string' },
    { id: 'department_name', labelEn: 'Department', type: 'string' },
    { id: 'team', labelEn: 'Team', type: 'string' },
    { id: 'job_title', labelEn: 'Job Title', type: 'string' },
    { id: 'period', labelEn: 'Period', type: 'string' },
    { id: 'score', labelEn: 'Score', type: 'number' },
    { id: 'productivity_rate', labelEn: 'Productivity Rate', type: 'number' },
    { id: 'strengths', labelEn: 'Strengths', type: 'string' },
    { id: 'areas_for_improvement', labelEn: 'Areas for Improvement', type: 'string' },
    { id: 'created_at', labelEn: 'Date', type: 'date' },
  ],
  job_opening: [
    { id: 'title', labelEn: 'Job Title', type: 'string' },
    { id: 'department_name', labelEn: 'Department', type: 'string' },
    { id: 'status', labelEn: 'Status', type: 'string' },
    { id: 'type', labelEn: 'Type', type: 'string' },
    { id: 'experience_years', labelEn: 'Experience Years', type: 'number' },
    { id: 'salary_range', labelEn: 'Salary Range', type: 'string' },
  ],
  candidate: [
    { id: 'name', labelEn: 'Candidate Name', type: 'string' },
    { id: 'email', labelEn: 'Email', type: 'string' },
    { id: 'phone', labelEn: 'Phone', type: 'string' },
    { id: 'job_title', labelEn: 'Job Applied For', type: 'string' },
    { id: 'status', labelEn: 'Status', type: 'string' },
    { id: 'rating', labelEn: 'Rating', type: 'number' },
    { id: 'source', labelEn: 'Source', type: 'string' },
  ],
  leave_request: [
    { id: 'employee_name', labelEn: 'Employee Name', type: 'string' },
    { id: 'department_name', labelEn: 'Department', type: 'string' },
    { id: 'type', labelEn: 'Leave Type', type: 'string' },
    { id: 'status', labelEn: 'Overall Status', type: 'string' },
    { id: 'manager_status', labelEn: 'Manager Status', type: 'string' },
    { id: 'attendance_status', labelEn: 'Attendance Status', type: 'string' },
    { id: 'created_at', labelEn: 'Created On', type: 'date' },
    { id: 'start_date', labelEn: 'Start Date', type: 'date' },
    { id: 'end_date', labelEn: 'End Date', type: 'date' },
    { id: 'days', labelEn: 'Duration (Days)', type: 'number' },
    { id: 'reason', labelEn: 'Reason', type: 'string' },
  ],
};

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  items,
  entityType,
  departments = [],
  employees = [],
  onFilter,
  title = 'Advanced Filter',
  compact = false,
  iconOnly = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValue[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Fetch custom fields metadata and all values
  useEffect(() => {
    const fetchMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${localStorage.getItem('systo_token') || ''}`,
          'x-user-id': '1'
        };
        const [fieldsRes, valuesRes] = await Promise.all([
          fetch(`/api/hr/custom-fields?entity_type=${entityType}`, { headers }).catch(() => null),
          fetch(`/api/hr/custom-fields/values?entity_type=${entityType}`, { headers }).catch(() => null),
        ]);

        const fieldsData = fieldsRes ? await safeJsonResponse(fieldsRes, []) : [];
        const valuesData = valuesRes ? await safeJsonResponse(valuesRes, []) : [];
        if (Array.isArray(fieldsData)) setCustomFields(fieldsData);
        if (Array.isArray(valuesData)) setCustomFieldValues(valuesData);
      } catch (err: any) {
        console.warn('Notice: Failed to load filter metadata:', err?.message || err);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [entityType]);

  // Combine standard fields and custom fields (Strictly English)
  const standardFields = FIELD_DEFINITIONS[entityType] || [];
  const allAvailableFields = [
    ...standardFields.map((f) => ({
      id: f.id,
      labelEn: f.labelEn,
      isCustom: false,
      type: f.type,
    })),
    ...customFields.map((f) => ({
      id: `cf_${f.id}`,
      labelEn: f.label_en || f.field_name,
      isCustom: true,
      type: (['number', 'currency', 'int', 'float'].includes(f.field_type)
        ? 'number'
        : ['date', 'datetime'].includes(f.field_type)
        ? 'date'
        : 'string') as 'string' | 'number' | 'date',
    })),
  ];

  // Helper to resolve associated Employee record for items (attendance, payroll, performance, etc.)
  const getItemEmployee = (item: any) => {
    if (!employees || employees.length === 0) return null;
    const aUserId = item.user_id ? Number(item.user_id) : null;
    return employees.find((e) => {
      const empId = Number(e.id);
      const empUserId = e.user_id ? Number(e.user_id) : null;
      const isMatchUser =
        (aUserId !== null && (aUserId === empId || (empUserId !== null && aUserId === empUserId))) ||
        (item.employee_id && (
          String(item.employee_id).toLowerCase() === String(e.employee_id || '').toLowerCase() ||
          String(item.employee_id).toLowerCase() === String(e.id_number || '').toLowerCase() ||
          String(item.employee_id).toLowerCase() === String(e.id).toLowerCase() ||
          String(item.employee_id).toLowerCase() === String(e.name || '').toLowerCase()
        )) ||
        (item.employee_code && (
          String(item.employee_code).toLowerCase() === String(e.employee_id || '').toLowerCase() ||
          String(item.employee_code).toLowerCase() === String(e.id_number || '').toLowerCase() ||
          String(item.employee_code).toLowerCase() === String(e.id).toLowerCase()
        )) ||
        (item.employee_name && e.name && String(item.employee_name).trim().toLowerCase() === String(e.name).trim().toLowerCase()) ||
        (item.name && e.name && String(item.name).trim().toLowerCase() === String(e.name).trim().toLowerCase());
      return isMatchUser;
    }) || null;
  };

  // Extract field value from item, falling back to linked employee data (for department, team, job title, etc.)
  const getFieldValue = (item: any, fieldId: string): string => {
    const isCustom = fieldId.startsWith('cf_');
    if (isCustom) {
      const fieldDbId = parseInt(fieldId.replace('cf_', ''));
      const recordId = item.id || item.user_id;
      const match = customFieldValues.find(
        (v) => v.field_id === fieldDbId && v.entity_id === recordId
      );
      return match ? match.field_value : '';
    }

    if (fieldId === 'employee_name' || fieldId === 'name') {
      if (item.employee_name) return String(item.employee_name);
      if (item.name) return String(item.name);
      const emp = getItemEmployee(item);
      if (emp && emp.name) return String(emp.name);
    }

    if (fieldId === 'department_name' || fieldId === 'department') {
      if (item.department_name) return String(item.department_name);
      if (item.department) return String(item.department);
      if (item.department_id) {
        const dept = departments.find((d) => d.id === item.department_id);
        if (dept) return dept.name;
      }
      const emp = getItemEmployee(item);
      if (emp) {
        if (emp.department_name) return String(emp.department_name);
        if (emp.department_id) {
          const dept = departments.find((d) => d.id === emp.department_id);
          if (dept) return dept.name;
        }
      }
    }

    if (fieldId === 'team' || fieldId === 'team_name') {
      if (item.team) return String(item.team);
      if (item.team_name) return String(item.team_name);
      const emp = getItemEmployee(item);
      if (emp && (emp.team_name || emp.team)) return String(emp.team_name || emp.team);
    }

    if (fieldId === 'job_title') {
      if (item.job_title) return String(item.job_title);
      const emp = getItemEmployee(item);
      if (emp && emp.job_title) return String(emp.job_title);
    }

    if (fieldId === 'date' || fieldId === 'joined_at' || fieldId === 'created_at' || fieldId === 'start_date' || fieldId === 'end_date') {
      const rawDate = item[fieldId] || (fieldId === 'date' ? (item.date || item.created_at || item.joined_at) : item[fieldId]);
      if (rawDate) {
        return String(rawDate).split('T')[0];
      }
    }

    if (fieldId === 'days') {
      if (item.approved_days !== undefined && item.approved_days !== null) return String(item.approved_days);
      if (item.start_date && item.end_date) {
        const s = new Date(item.start_date).getTime();
        const e = new Date(item.end_date).getTime();
        if (!isNaN(s) && !isNaN(e)) {
          const d = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
          return String(d);
        }
      }
    }

    if (fieldId === 'time_in' || fieldId === 'clock_in') {
      if (item.time_in) return String(item.time_in);
      if (item.clock_in) return String(item.clock_in);
    }

    if (fieldId === 'time_out' || fieldId === 'clock_out') {
      if (item.time_out) return String(item.time_out);
      if (item.clock_out) return String(item.clock_out);
    }

    if (fieldId === 'shift_name') {
      if (item.shift_name) return String(item.shift_name);
      if (item.shift_title) return String(item.shift_title);
    }

    if (fieldId === 'status') {
      if (item.status) return String(item.status);
    }

    if (item[fieldId] !== undefined && item[fieldId] !== null) {
      return String(item[fieldId]);
    }

    return '';
  };

  // Aggregate all unique values currently in the dataset for a given field
  const getUniqueFieldValues = (fieldId: string) => {
    const isCustom = fieldId.startsWith('cf_');
    const valuesSet = new Set<string>();

    if (isCustom) {
      const fieldDbId = parseInt(fieldId.replace('cf_', ''));
      customFieldValues
        .filter((v) => v.field_id === fieldDbId && v.field_value)
        .forEach((v) => valuesSet.add(v.field_value.trim()));
    } else {
      // 1. Department names from departments array
      if ((fieldId === 'department_name' || fieldId === 'department') && Array.isArray(departments)) {
        departments.forEach((d) => {
          if (d.name) valuesSet.add(d.name.trim());
        });
      }

      // 2. Employee values from employees array (employee_name, department, team, job title)
      if (Array.isArray(employees)) {
        employees.forEach((emp) => {
          if (fieldId === 'employee_name' || fieldId === 'name') {
            if (emp.name) valuesSet.add(emp.name.trim());
          } else if (fieldId === 'department_name' || fieldId === 'department') {
            if (emp.department_name) valuesSet.add(emp.department_name.trim());
            else if (emp.department_id) {
              const d = departments.find((dept) => dept.id === emp.department_id);
              if (d && d.name) valuesSet.add(d.name.trim());
            }
          } else if (fieldId === 'team' || fieldId === 'team_name') {
            if (emp.team_name) valuesSet.add(emp.team_name.trim());
            else if (emp.team) valuesSet.add(emp.team.trim());
          } else if (fieldId === 'job_title') {
            if (emp.job_title) valuesSet.add(emp.job_title.trim());
          }
        });
      }

      // 3. Values from current dataset items using getFieldValue
      items.forEach((item) => {
        const val = getFieldValue(item, fieldId);
        if (val) {
          valuesSet.add(val.trim());
        }
      });
    }

    return Array.from(valuesSet).sort();
  };

  // Add a new condition row
  const addCondition = () => {
    const defaultField = allAvailableFields[0]?.id || '';
    const fieldMeta = allAvailableFields.find((f) => f.id === defaultField);
    const newCondition: FilterCondition = {
      id: Math.random().toString(36).substring(2, 9),
      fieldId: defaultField,
      operator: fieldMeta?.type === 'date' ? 'between' : fieldMeta?.type === 'number' ? 'equals' : 'contains',
      value: '',
      secondValue: '',
    };
    setConditions([...conditions, newCondition]);
  };

  // Remove a condition row
  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  // Update condition row fields
  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(
      conditions.map((c) => {
        if (c.id === id) {
          const nextCondition = { ...c, ...updates };
          // If fieldId changed, reset values and set smart default operator
          if (updates.fieldId && updates.fieldId !== c.fieldId) {
            nextCondition.value = '';
            nextCondition.secondValue = '';
            const fieldMeta = allAvailableFields.find((f) => f.id === updates.fieldId);
            if (fieldMeta?.type === 'date') {
              nextCondition.operator = 'between';
            } else if (fieldMeta?.type === 'number') {
              nextCondition.operator = 'equals';
            } else {
              nextCondition.operator = 'contains';
            }
          }
          return nextCondition;
        }
        return c;
      })
    );
  };

  // Reset/Clear all filters
  const clearFilters = () => {
    setConditions([]);
    onFilter(null);
    if (compact) {
      setIsOpen(false);
    }
  };

  // Apply filters to items
  const applyFilters = () => {
    if (conditions.length === 0) {
      onFilter(null);
      if (compact) {
        setIsOpen(false);
      }
      return;
    }

    const filtered = items.filter((item) => {
      // Every condition must be satisfied (AND logic)
      return conditions.every((cond) => {
        const itemValue = getFieldValue(item, cond.fieldId);
        const queryVal = (cond.value || '').trim().toLowerCase();
        const valueStr = (itemValue || '').trim().toLowerCase();
        const fieldMeta = allAvailableFields.find((f) => f.id === cond.fieldId);

        // Date field evaluation
        if (fieldMeta?.type === 'date') {
          const itemDateStr = (itemValue || '').split('T')[0].trim();
          const startDate = (cond.value || '').trim();
          const endDate = (cond.secondValue || '').trim();

          switch (cond.operator) {
            case 'between': {
              if (startDate && endDate) {
                return itemDateStr >= startDate && itemDateStr <= endDate;
              } else if (startDate) {
                return itemDateStr >= startDate;
              } else if (endDate) {
                return itemDateStr <= endDate;
              }
              return true;
            }
            case 'equals':
              return startDate ? itemDateStr === startDate : true;
            case 'not_equals':
              return startDate ? itemDateStr !== startDate : true;
            case 'gt':
              return startDate ? itemDateStr > startDate : true;
            case 'lt':
              return startDate ? itemDateStr < startDate : true;
            default:
              return (itemValue || '').toLowerCase().includes(queryVal);
          }
        }

        // Numeric field evaluation
        if (fieldMeta?.type === 'number') {
          const itemNum = parseFloat(itemValue) || 0;
          const minNum = parseFloat(cond.value);
          const maxNum = parseFloat(cond.secondValue || '');

          switch (cond.operator) {
            case 'between': {
              const hasMin = !isNaN(minNum);
              const hasMax = !isNaN(maxNum);
              if (hasMin && hasMax) {
                return itemNum >= minNum && itemNum <= maxNum;
              } else if (hasMin) {
                return itemNum >= minNum;
              } else if (hasMax) {
                return itemNum <= maxNum;
              }
              return true;
            }
            case 'equals':
              return !isNaN(minNum) ? itemNum === minNum : true;
            case 'not_equals':
              return !isNaN(minNum) ? itemNum !== minNum : true;
            case 'gt':
              return !isNaN(minNum) ? itemNum > minNum : true;
            case 'lt':
              return !isNaN(minNum) ? itemNum < minNum : true;
            default:
              return (itemValue || '').toLowerCase().includes(queryVal);
          }
        }

        // String operators
        switch (cond.operator) {
          case 'equals':
            return valueStr === queryVal;
          case 'not_equals':
            return valueStr !== queryVal;
          case 'starts_with':
            return valueStr.startsWith(queryVal);
          case 'ends_with':
            return valueStr.endsWith(queryVal);
          case 'contains':
          default:
            return valueStr.includes(queryVal);
        }
      });
    });

    onFilter(filtered);
    if (compact) {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn(compact ? "relative inline-block" : "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6")}>
      {compact ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            iconOnly
              ? "p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center border cursor-pointer shadow-2xs relative"
              : "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer shadow-2xs whitespace-nowrap",
            conditions.length > 0
              ? "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 shadow-indigo-600/20"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          )}
          title={title || "Toggle Advanced Filter"}
        >
          <Filter className={cn("w-4 h-4 shrink-0", conditions.length > 0 ? "text-white" : "text-indigo-600")} />
          {!iconOnly && title ? <span>{title}</span> : null}
          {conditions.length > 0 && (
            iconOnly ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] bg-rose-500 text-white rounded-full font-black flex items-center justify-center shadow-xs">
                {conditions.length}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] bg-white/20 text-white rounded font-black">
                {conditions.length} Active
              </span>
            )
          )}
          {!iconOnly && <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />}
        </button>
      ) : (
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              conditions.length > 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
            )}>
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                {title}
                {conditions.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-700 rounded-md font-extrabold">
                    {conditions.length} Active
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Multi-conditional filtering across standard fields, dates, and custom parameters
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {loadingMetadata && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
            <div className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
              <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isOpen && "rotate-180")} />
            </div>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={cn(compact && "absolute right-0 top-full mt-2 w-screen max-w-2xl sm:w-[680px] md:w-[740px] bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden")}
          >
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
              {/* Conditions List */}
              {conditions.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center justify-center gap-2">
                  <Sliders className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">No active filters. Click "+ Add Condition" to create filters.</p>
                  <p className="text-[11px] text-slate-400">Filter logs by Date Range (Between), Employee Name, Department, Team, Status, or Shifts.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {conditions.map((cond) => {
                    const uniqueValues = getUniqueFieldValues(cond.fieldId);
                    const selectedField = allAvailableFields.find((f) => f.id === cond.fieldId);
                    const isDateField = selectedField?.type === 'date';
                    const isNumberField = selectedField?.type === 'number';

                    return (
                      <motion.div
                        key={cond.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs"
                      >
                        {/* Field Selection */}
                        <div className="w-full md:w-[190px] shrink-0">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Select Field</label>
                          <select
                            value={cond.fieldId}
                            onChange={(e) => updateCondition(cond.id, { fieldId: e.target.value })}
                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            {allAvailableFields.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.labelEn} {f.isCustom ? '(Custom)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Operator Selection */}
                        <div className="w-full md:w-[160px] shrink-0">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Operator</label>
                          <select
                            value={cond.operator}
                            onChange={(e) => updateCondition(cond.id, { operator: e.target.value as FilterOperator })}
                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            {isDateField ? (
                              <>
                                <option value="between">Between (Range)</option>
                                <option value="equals">Equals (=)</option>
                                <option value="gt">After / Greater Than (&gt;)</option>
                                <option value="lt">Before / Less Than (&lt;)</option>
                                <option value="not_equals">Does Not Equal (≠)</option>
                              </>
                            ) : isNumberField ? (
                              <>
                                <option value="equals">Equals (=)</option>
                                <option value="between">Between (Range)</option>
                                <option value="not_equals">Not Equals (≠)</option>
                                <option value="gt">Greater Than (&gt;)</option>
                                <option value="lt">Less Than (&lt;)</option>
                              </>
                            ) : (
                              <>
                                <option value="contains">Contains</option>
                                <option value="equals">Equals</option>
                                <option value="not_equals">Does Not Equal</option>
                                <option value="starts_with">Starts With</option>
                                <option value="ends_with">Ends With</option>
                              </>
                            )}
                          </select>
                        </div>

                        {/* Type or Select Value: Supports Dual Date/Number Inputs for Between */}
                        <div className="flex-1 min-w-[210px]">
                          {isDateField ? (
                            cond.operator === 'between' ? (
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                  Date Range (From - To)
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider pointer-events-none">
                                      From
                                    </span>
                                    <input
                                      type="date"
                                      value={cond.value || ''}
                                      onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-11 pr-2 py-2 outline-none focus:border-indigo-500 font-mono shadow-2xs"
                                    />
                                  </div>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider pointer-events-none">
                                      To
                                    </span>
                                    <input
                                      type="date"
                                      value={cond.secondValue || ''}
                                      onChange={(e) => updateCondition(cond.id, { secondValue: e.target.value })}
                                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-2 py-2 outline-none focus:border-indigo-500 font-mono shadow-2xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                  Select Date
                                </label>
                                <input
                                  type="date"
                                  value={cond.value || ''}
                                  onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-mono shadow-2xs"
                                />
                              </div>
                            )
                          ) : isNumberField ? (
                            cond.operator === 'between' ? (
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                  Range (Min - Max)
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="number"
                                    placeholder="Min"
                                    value={cond.value || ''}
                                    onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                                    className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 shadow-2xs"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Max"
                                    value={cond.secondValue || ''}
                                    onChange={(e) => updateCondition(cond.id, { secondValue: e.target.value })}
                                    className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 shadow-2xs"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                  Type Value
                                </label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={cond.value || ''}
                                  onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 shadow-2xs"
                                />
                              </div>
                            )
                          ) : (
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                Type or Select Value
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  list={`datalist-${cond.id}`}
                                  placeholder="Type or select value..."
                                  value={cond.value || ''}
                                  onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 pr-8 shadow-2xs"
                                />
                                {uniqueValues.length > 0 && (
                                  <datalist id={`datalist-${cond.id}`}>
                                    {uniqueValues.map((val) => (
                                      <option key={val} value={val} />
                                    ))}
                                  </datalist>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => removeCondition(cond.id)}
                          className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl transition-all self-end md:self-auto cursor-pointer shrink-0 mt-3 md:mt-0"
                          title="Remove Condition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Actions & Buttons Row */}
              <div className="pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 bg-white -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-5 sm:p-6">
                <button
                  type="button"
                  onClick={addCondition}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-200 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Add Condition</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200 cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/15 flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply Filters</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

