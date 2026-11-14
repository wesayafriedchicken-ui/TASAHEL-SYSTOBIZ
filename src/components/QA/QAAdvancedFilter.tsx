import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Plus, Trash2, X, ChevronDown, Check, Sliders, RefreshCw, Calendar, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export type FilterOperator = 
  | 'contains' 
  | 'equals' 
  | 'not_equals' 
  | 'starts_with' 
  | 'ends_with' 
  | 'gt' 
  | 'gte'
  | 'lt' 
  | 'lte'
  | 'between' 
  | 'is_empty' 
  | 'is_not_empty'
  | 'is_true'
  | 'is_false';

export interface FilterCondition {
  id: string;
  fieldId: string;
  operator: FilterOperator;
  value: string;
  secondValue?: string;
}

export interface FieldDefinition {
  id: string;
  labelEn: string;
  type: 'string' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
  isCustom?: boolean;
}

export interface QAAdvancedFilterProps {
  items: any[];
  onFilter: (filteredItems: any[] | null, activeCount: number) => void;
  customFields?: FieldDefinition[];
  title?: string;
  compact?: boolean;
  buttonLabel?: string;
  buttonClassName?: string;
  initialConditions?: FilterCondition[];
}

// Built-in Comprehensive Quality Assurance Field Registry
const KNOWN_QA_FIELDS: FieldDefinition[] = [
  // Transaction Incident Fields
  { id: 'qa_reference_number', labelEn: 'QA Reference Number', type: 'string' },
  { id: 'transaction_id', labelEn: 'Transaction ID / Source ID', type: 'string' },
  { id: 'handled_by', labelEn: 'Handled By', type: 'string' },
  { id: 'order_number', labelEn: 'Order Number', type: 'string' },
  { id: 'customer_name', labelEn: 'Customer Name', type: 'string' },
  { id: 'phone', labelEn: 'Phone / Contact', type: 'string' },
  { id: 'country', labelEn: 'Country', type: 'string' },
  { 
    id: 'department', 
    labelEn: 'Department', 
    type: 'select', 
    options: ['Operations', 'Sales', 'Customer Service', 'System', 'Finance', 'Logistics', 'Quality Assurance', 'Supplier Management', 'Maintenance'] 
  },
  { id: 'agent_name', labelEn: 'Agent Name', type: 'string' },
  { id: 'team_leader', labelEn: 'Team Leader', type: 'string' },
  { id: 'qa_auditor', labelEn: 'QA Auditor', type: 'string' },
  { id: 'auditor_name', labelEn: 'QA Auditor', type: 'string' },
  { id: 'operations_owner', labelEn: 'Operations Owner', type: 'string' },
  { 
    id: 'type', 
    labelEn: 'Incident Type', 
    type: 'select', 
    options: ['complaint', 'delay', 'refund', 'cancellation', 'nps'] 
  },
  { 
    id: 'qa_status', 
    labelEn: 'QA Validation Status', 
    type: 'select', 
    options: ['Pass', 'Fail', 'Pending', 'Pending Review', 'Conditional Pass', 'Escalated'] 
  },
  { 
    id: 'sla_status', 
    labelEn: 'SLA Status', 
    type: 'select', 
    options: ['Met SLA', 'Breached SLA', 'Near Breach', 'Pending', 'Within SLA', 'Breached'] 
  },
  { 
    id: 'manager_approval', 
    labelEn: 'Manager Review Status', 
    type: 'select', 
    options: ['Pending', 'Approved', 'Rejected', 'Reviewed', 'Escalated', 'Resolved', 'Closed'] 
  },
  { 
    id: 'status', 
    labelEn: 'Overall Status', 
    type: 'select', 
    options: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed', 'Completed', 'Approved', 'Rejected', 'Under Review'] 
  },
  { 
    id: 'root_cause', 
    labelEn: 'Root Cause', 
    type: 'select',
    options: [
      'Late Dispatch from Warehouse',
      'Courier In-Transit Delay',
      'System Sync Failure',
      'Defective Item Delivered',
      'Agent Communication Error',
      'Pricing Mismatch',
      'Out of Stock',
      'Damaged Packaging',
      'Wrong Address Entered',
      'Customer Request Change',
      'Bank Payment Failure'
    ]
  },
  { 
    id: 'classification', 
    labelEn: 'Error Classification', 
    type: 'select', 
    options: ['Avoidable', 'Unavoidable', 'System Error', 'Human Error', 'Process Gap', 'Third Party Vendor', 'Customer Fault'] 
  },
  { id: 'reason', labelEn: 'Reason', type: 'string' },
  { id: 'sub_reason', labelEn: 'Sub Reason', type: 'string' },
  { id: 'issue_description', labelEn: 'Issue Description', type: 'string' },
  { id: 'feedback_text', labelEn: 'Customer Feedback', type: 'string' },
  { id: 'action_required', labelEn: 'Action Required', type: 'string' },
  { id: 'refund_amount', labelEn: 'Refund Amount ($)', type: 'number' },
  { id: 'order_amount', labelEn: 'Order Amount ($)', type: 'number' },
  { id: 'amount', labelEn: 'Amount ($)', type: 'number' },
  { id: 'delay_hours', labelEn: 'Delay Duration (Hours)', type: 'number' },
  { id: 'sla_breach_time', labelEn: 'SLA Breach Time', type: 'number' },
  { id: 'nps_score', labelEn: 'NPS Score', type: 'number' },
  { id: 'rating', labelEn: 'Survey Rating', type: 'number' },
  { 
    id: 'nps_category', 
    labelEn: 'NPS Category', 
    type: 'select', 
    options: ['Promoter', 'Passive', 'Detractor'] 
  },
  { id: 'score', labelEn: 'Quality Score (%)', type: 'number' },
  { 
    id: 'status_on_system', 
    labelEn: 'Status On System', 
    type: 'select', 
    options: ['Yes', 'No'] 
  },
  { 
    id: 'priority', 
    labelEn: 'Priority', 
    type: 'select', 
    options: ['Low', 'Medium', 'High', 'Critical'] 
  },
  { id: 'incident_date', labelEn: 'Incident Date', type: 'date' },
  { id: 'order_date', labelEn: 'Order Date', type: 'date' },
  { id: 'created_at', labelEn: 'Created Date', type: 'date' },
  { id: 'updated_at', labelEn: 'Updated Date', type: 'date' },
  { id: 'due_date', labelEn: 'Due Date', type: 'date' },
  { id: 'date', labelEn: 'Date', type: 'date' },

  // Action Plans & Templates
  { id: 'plan_code', labelEn: 'Action Plan Code', type: 'string' },
  { id: 'title', labelEn: 'Title / Plan Name', type: 'string' },
  { id: 'assignee', labelEn: 'Assignee / Owner', type: 'string' },
  { id: 'assigned_to', labelEn: 'Assigned To', type: 'string' },
  { id: 'root_cause_name', labelEn: 'Root Cause Name', type: 'string' },
  { id: 'target_completion_date', labelEn: 'Target Completion Date', type: 'date' },
  { id: 'progress', labelEn: 'Progress (%)', type: 'number' },
  { id: 'category', labelEn: 'Category', type: 'string' },

  // Non-Conformance (NCR) & CAPA
  { id: 'ncr_number', labelEn: 'NCR Number', type: 'string' },
  { id: 'capa_number', labelEn: 'CAPA Number', type: 'string' },
  { 
    id: 'severity', 
    labelEn: 'Severity Level', 
    type: 'select', 
    options: ['Minor', 'Major', 'Critical'] 
  },
  { 
    id: 'source', 
    labelEn: 'Incident Source', 
    type: 'select', 
    options: ['Internal Audit', 'Customer Complaint', 'Process Failure', 'Management Review', 'Supplier Non-Conformance'] 
  },
  { id: 'reported_by', labelEn: 'Reported By', type: 'string' },
  { 
    id: 'effectiveness_status', 
    labelEn: 'Effectiveness Status', 
    type: 'select', 
    options: ['Pending', 'Effective', 'Ineffective', 'Under Evaluation'] 
  },

  // Employee Quality Tracking
  { id: 'employee_name', labelEn: 'Employee Name', type: 'string' },
  { id: 'name', labelEn: 'Name', type: 'string' },
  { id: 'job_title', labelEn: 'Job Title / Role', type: 'string' },
  { id: 'role', labelEn: 'Role', type: 'string' },
  { id: 'total_audits', labelEn: 'Total Audits', type: 'number' },
  { id: 'totalCases', labelEn: 'Total Cases', type: 'number' },
  { id: 'casesCount', labelEn: 'Cases Count', type: 'number' },
  { id: 'openCases', labelEn: 'Open Cases', type: 'number' },
  { id: 'closedCases', labelEn: 'Closed Cases', type: 'number' },
  { id: 'totalErrors', labelEn: 'Total Errors', type: 'number' },
  { id: 'performanceScore', labelEn: 'Performance Score', type: 'number' },
  { id: 'avg_score', labelEn: 'Average Score', type: 'number' },
  { id: 'pass_rate', labelEn: 'Pass Rate (%)', type: 'number' },
  { id: 'fail_rate', labelEn: 'Fail Rate (%)', type: 'number' },
  { id: 'critical_errors', labelEn: 'Critical Errors', type: 'number' },
  { id: 'sla_compliance', labelEn: 'SLA Compliance (%)', type: 'number' },
  { 
    id: 'performanceLevel', 
    labelEn: 'Performance Level', 
    type: 'select', 
    options: ['High', 'Good', 'Needs Improvement', 'Critical'] 
  },
];

// Helper: Format raw keys to readable English labels
function formatFieldLabel(key: string): string {
  const parts = key.split(/[-_]/);
  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ')
    .replace(/\bId\b/g, 'ID')
    .replace(/\bQa\b/g, 'QA')
    .replace(/\bSla\b/g, 'SLA')
    .replace(/\bNps\b/g, 'NPS')
    .replace(/\bNcr\b/g, 'NCR')
    .replace(/\bCapa\b/g, 'CAPA');
}

// Helper: Detect type of a value
function inferFieldType(sampleValues: any[]): 'string' | 'number' | 'date' | 'select' | 'boolean' {
  const nonNull = sampleValues.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'string';

  let isAllNumbers = true;
  let isAllDates = true;
  let isAllBooleans = true;
  const distinct = new Set<string>();

  for (const v of nonNull) {
    const s = String(v).trim();
    distinct.add(s);

    if (typeof v === 'boolean' || s.toLowerCase() === 'true' || s.toLowerCase() === 'false') {
      // boolean check
    } else {
      isAllBooleans = false;
    }

    if (typeof v === 'number' || (!isNaN(Number(s)) && !isNaN(parseFloat(s)) && !s.includes('-') && !s.includes('/'))) {
      // number check
    } else {
      isAllNumbers = false;
    }

    const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/;
    if (v instanceof Date || datePattern.test(s) || (s.length >= 10 && !isNaN(Date.parse(s)) && isNaN(Number(s)))) {
      // date check
    } else {
      isAllDates = false;
    }
  }

  if (isAllBooleans) return 'boolean';
  if (isAllNumbers) return 'number';
  if (isAllDates) return 'date';
  if (distinct.size <= 20 && distinct.size > 0) return 'select';
  return 'string';
}

// Helper: Execute filtering on dataset
export function filterItemsByConditions(items: any[], conditions: FilterCondition[]): any[] {
  if (!conditions || conditions.length === 0) return items;

  return items.filter(item => {
    return conditions.every(cond => {
      // Resolve value from item
      let rawVal = item[cond.fieldId];
      if (rawVal === undefined || rawVal === null) {
        if (item.data && typeof item.data === 'object') {
          rawVal = item.data[cond.fieldId];
        }
        if ((rawVal === undefined || rawVal === null) && item.details && typeof item.details === 'object') {
          rawVal = item.details[cond.fieldId];
        }
      }
      // Field aliases for QA
      if (rawVal === undefined || rawVal === null) {
        if (cond.fieldId === 'qa_reference_number') {
          rawVal = item.qa_reference_number || (item.details && item.details.qa_reference_number);
        } else if (cond.fieldId === 'handled_by') {
          rawVal = item.handled_by || (item.details && item.details.handled_by);
        } else if (cond.fieldId === 'auditor_name' || cond.fieldId === 'qa_auditor') {
          rawVal = item.auditor_name || item.qa_auditor || (item.details && item.details.auditor_name);
        } else if (cond.fieldId === 'updated_at') {
          rawVal = item.updated_at || (item.details && item.details.updated_at);
        } else if (cond.fieldId === 'created_at') {
          rawVal = item.created_at || (item.details && item.details.created_at);
        }
      }

      // Check empty / not empty
      if (cond.operator === 'is_empty') {
        return rawVal === undefined || rawVal === null || String(rawVal).trim() === '';
      }
      if (cond.operator === 'is_not_empty') {
        return rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '';
      }

      // Check boolean
      if (cond.operator === 'is_true') {
        return rawVal === true || String(rawVal).toLowerCase() === 'true' || rawVal === 1 || String(rawVal) === '1' || String(rawVal).toLowerCase() === 'yes';
      }
      if (cond.operator === 'is_false') {
        return rawVal === false || String(rawVal).toLowerCase() === 'false' || rawVal === 0 || String(rawVal) === '0' || String(rawVal).toLowerCase() === 'no';
      }

      // If value is missing and operator needs value
      if (rawVal === undefined || rawVal === null) {
        return false;
      }

      // Date comparisons
      const isDateValue = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(String(rawVal)) || rawVal instanceof Date;
      if (isDateValue || cond.operator === 'between') {
        const itemTime = new Date(rawVal).getTime();
        if (isNaN(itemTime)) {
          // Fall back to string comparison
        } else {
          if (cond.operator === 'between') {
            const startT = cond.value ? new Date(cond.value + 'T00:00:00').getTime() : null;
            const endT = cond.secondValue ? new Date(cond.secondValue + 'T23:59:59').getTime() : null;
            if (startT && itemTime < startT) return false;
            if (endT && itemTime > endT) return false;
            return true;
          }
          if (cond.operator === 'equals') {
            const target = new Date(cond.value).toDateString();
            return new Date(itemTime).toDateString() === target;
          }
          if (cond.operator === 'gt') {
            const targetT = new Date(cond.value + 'T23:59:59').getTime();
            return itemTime > targetT;
          }
          if (cond.operator === 'lt') {
            const targetT = new Date(cond.value + 'T00:00:00').getTime();
            return itemTime < targetT;
          }
          if (cond.operator === 'not_equals') {
            const target = new Date(cond.value).toDateString();
            return new Date(itemTime).toDateString() !== target;
          }
        }
      }

      // Number comparisons
      const isNumeric = typeof rawVal === 'number' || (!isNaN(Number(rawVal)) && !isNaN(parseFloat(String(rawVal))));
      if (isNumeric && ['gt', 'gte', 'lt', 'lte', 'between'].includes(cond.operator)) {
        const numVal = Number(rawVal);
        const targetNum = Number(cond.value);
        if (cond.operator === 'between') {
          const min = cond.value !== '' ? Number(cond.value) : -Infinity;
          const max = cond.secondValue !== '' && cond.secondValue !== undefined ? Number(cond.secondValue) : Infinity;
          return numVal >= min && numVal <= max;
        }
        if (cond.operator === 'gt') return numVal > targetNum;
        if (cond.operator === 'gte') return numVal >= targetNum;
        if (cond.operator === 'lt') return numVal < targetNum;
        if (cond.operator === 'lte') return numVal <= targetNum;
      }

      // Text / String / Select comparisons
      const itemStr = String(rawVal).trim().toLowerCase();
      const targetStr = String(cond.value || '').trim().toLowerCase();

      switch (cond.operator) {
        case 'contains':
          return itemStr.includes(targetStr);
        case 'equals':
          return itemStr === targetStr;
        case 'not_equals':
          return itemStr !== targetStr;
        case 'starts_with':
          return itemStr.startsWith(targetStr);
        case 'ends_with':
          return itemStr.endsWith(targetStr);
        default:
          return itemStr.includes(targetStr);
      }
    });
  });
}

export const QAAdvancedFilter: React.FC<QAAdvancedFilterProps> = ({
  items,
  onFilter,
  customFields = [],
  title = 'Filter Records',
  compact = true,
  buttonLabel = 'Filters',
  buttonClassName,
  initialConditions = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conditions, setConditions] = useState<FilterCondition[]>(initialConditions);
  const [activeCount, setActiveCount] = useState<number>(initialConditions.length);
  const filterRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<'left' | 'right'>('left');
  const [opensAbove, setOpensAbove] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // Auto-Placement & Viewport boundary detection
  const updatePositioning = useCallback(() => {
    if (!filterRef.current || !compact) return;
    const rect = filterRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const MARGIN = 16;
    const targetWidth = Math.min(740, viewportWidth - (MARGIN * 2));

    // Calculate space to the right (when aligning to left edge of trigger, opening rightward)
    const spaceToRight = viewportWidth - rect.left - MARGIN;
    // Calculate space to the left (when aligning to right edge of trigger, opening leftward)
    const spaceToLeft = rect.right - MARGIN;

    let align: 'left' | 'right' = 'left';
    const dynamicStyle: React.CSSProperties = {
      maxWidth: `${targetWidth}px`,
    };

    // Auto-placement: Choose the direction with sufficient or greater available viewport space.
    // If opening to the right fits comfortably, default to left alignment (left-0 right-auto)
    // so it opens away from the left sidebar into the spacious main table area.
    if (spaceToRight >= targetWidth) {
      align = 'left';
    } else if (spaceToLeft >= targetWidth && spaceToLeft > spaceToRight) {
      align = 'right';
    } else if (spaceToRight >= spaceToLeft) {
      align = 'left';
      dynamicStyle.maxWidth = `${Math.max(300, spaceToRight)}px`;
    } else {
      align = 'right';
      dynamicStyle.maxWidth = `${Math.max(300, spaceToLeft)}px`;
    }

    // Vertical auto-placement: detect if we need to open above or below
    const spaceBelow = viewportHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;
    const shouldOpenAbove = spaceBelow < 420 && spaceAbove > spaceBelow;

    setPlacement(align);
    setOpensAbove(shouldOpenAbove);
    setPopoverStyle(dynamicStyle);
  }, [compact]);

  useEffect(() => {
    if (isOpen && compact) {
      updatePositioning();
      window.addEventListener('resize', updatePositioning);
      window.addEventListener('scroll', updatePositioning, true);
      return () => {
        window.removeEventListener('resize', updatePositioning);
        window.removeEventListener('scroll', updatePositioning, true);
      };
    }
  }, [isOpen, compact, updatePositioning]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!compact) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [compact]);

  // Combine Known Fields + Discovered Fields from dataset
  const allAvailableFields = useMemo<FieldDefinition[]>(() => {
    const map = new Map<string, FieldDefinition>();

    // 1. Add custom fields first if provided
    customFields.forEach(f => map.set(f.id, f));

    // 2. Discover all keys across dataset items
    const sampleKeys = new Set<string>();
    const sampleValuesMap = new Map<string, any[]>();

    const checkItem = (item: any) => {
      if (!item || typeof item !== 'object') return;
      Object.keys(item).forEach(k => {
        if (typeof item[k] !== 'function' && k !== 'switches' && k !== 'meta' && k !== 'custom_fields') {
          sampleKeys.add(k);
          if (!sampleValuesMap.has(k)) sampleValuesMap.set(k, []);
          const arr = sampleValuesMap.get(k)!;
          if (arr.length < 50 && item[k] !== undefined && item[k] !== null) {
            arr.push(item[k]);
          }
        }
      });
    };

    items.slice(0, 100).forEach(checkItem);

    // 3. Populate matching known fields
    KNOWN_QA_FIELDS.forEach(known => {
      if (sampleKeys.has(known.id) || !compact) {
        // Collect actual unique values from dataset to enrich options
        const actualValues = Array.from(new Set((sampleValuesMap.get(known.id) || []).map(v => String(v).trim()))).filter(Boolean);
        const combinedOptions = Array.from(new Set([...(known.options || []), ...actualValues]));

        map.set(known.id, {
          ...known,
          options: combinedOptions.length > 0 ? combinedOptions : undefined
        });
      }
    });

    // 4. Any undiscovered keys in dataset -> dynamically add with inferred types
    sampleKeys.forEach(key => {
      if (!map.has(key)) {
        const samples = sampleValuesMap.get(key) || [];
        const detectedType = inferFieldType(samples);
        const actualValues = Array.from(new Set(samples.map(v => String(v).trim()))).filter(Boolean);

        map.set(key, {
          id: key,
          labelEn: formatFieldLabel(key),
          type: detectedType,
          options: (detectedType === 'select' || actualValues.length <= 25) ? actualValues : undefined,
          isCustom: true
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.labelEn.localeCompare(b.labelEn));
  }, [items, customFields, compact]);

  // Extract unique values for a given field across current items
  const getUniqueFieldValues = (fieldId: string): string[] => {
    const fieldDef = allAvailableFields.find(f => f.id === fieldId);
    const set = new Set<string>();

    if (fieldDef?.options) {
      fieldDef.options.forEach(opt => set.add(opt));
    }

    items.forEach(item => {
      const val = item[fieldId];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        set.add(String(val).trim());
      }
    });

    return Array.from(set).sort();
  };

  const addCondition = () => {
    const defaultField = allAvailableFields[0]?.id || 'department';
    const fieldDef = allAvailableFields.find(f => f.id === defaultField);
    const defaultOp: FilterOperator = fieldDef?.type === 'date' 
      ? 'between' 
      : fieldDef?.type === 'number' 
      ? 'equals' 
      : fieldDef?.type === 'select' 
      ? 'equals' 
      : 'contains';

    const newCond: FilterCondition = {
      id: 'cond_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      fieldId: defaultField,
      operator: defaultOp,
      value: '',
      secondValue: ''
    };

    setConditions(prev => [...prev, newCond]);
  };

  const removeCondition = (id: string) => {
    setConditions(prev => prev.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...updates };

      // If field changed, adapt operator to match new type
      if (updates.fieldId && updates.fieldId !== c.fieldId) {
        const newField = allAvailableFields.find(f => f.id === updates.fieldId);
        if (newField?.type === 'date') {
          updated.operator = 'between';
        } else if (newField?.type === 'number') {
          updated.operator = 'equals';
        } else if (newField?.type === 'select') {
          updated.operator = 'equals';
        } else if (newField?.type === 'boolean') {
          updated.operator = 'is_true';
        } else {
          updated.operator = 'contains';
        }
        updated.value = '';
        updated.secondValue = '';
      }

      return updated;
    }));
  };

  const clearFilters = () => {
    setConditions([]);
    setActiveCount(0);
    onFilter(null, 0);
  };

  const applyFilters = () => {
    const validConditions = conditions.filter(c => {
      if (['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(c.operator)) return true;
      if (c.operator === 'between') return Boolean(c.value || c.secondValue);
      return Boolean(c.value && c.value.trim() !== '');
    });

    setActiveCount(validConditions.length);
    if (validConditions.length === 0) {
      onFilter(null, 0);
    } else {
      const filtered = filterItemsByConditions(items, validConditions);
      onFilter(filtered, validConditions.length);
    }

    if (compact) {
      setIsOpen(false);
    }
  };

  const activeFiltersSummary = useMemo(() => {
    if (allAvailableFields.length === 0) return 'Date Range (Between), Department, QA Status, SLA Status, or Employee Name';
    return allAvailableFields.slice(0, 7).map(f => f.labelEn).join(', ') + '...';
  }, [allAvailableFields]);

  return (
    <div className={cn("relative", compact ? "inline-block" : "w-full")} ref={filterRef}>
      {/* Trigger Button */}
      {compact && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "px-3.5 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs text-xs",
            activeCount > 0
              ? "bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-sm"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
            buttonClassName
          )}
          id="qa-advanced-filter-trigger"
        >
          <Filter className={cn("w-3.5 h-3.5", activeCount > 0 ? "text-indigo-600" : "text-slate-500")} />
          <span className="font-bold">{buttonLabel}</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {activeCount}
            </span>
          )}
          <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>
      )}

      {/* Filter Panel Content */}
      <AnimatePresence>
        {(isOpen || !compact) && (
          <motion.div
            initial={compact ? { opacity: 0, y: opensAbove ? -10 : 10, scale: 0.98 } : { opacity: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={compact ? { opacity: 0, y: opensAbove ? -10 : 10, scale: 0.98 } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]",
              compact
                ? cn(
                    "absolute z-[100] animate-fadeIn w-[92vw] sm:w-[740px]",
                    opensAbove ? "bottom-full mb-2" : "top-full mt-2",
                    placement === 'left' ? "left-0 right-auto" : "right-0 left-auto"
                  )
                : "w-full my-4 shadow-sm"
            )}
            style={compact ? popoverStyle : undefined}
            id="qa-advanced-filter-panel"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Filter {items.length} records dynamically across all fields and operators
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg border border-rose-100 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
                {compact && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Conditions Container */}
            <div className="p-5 sm:p-6 bg-slate-50/40 space-y-4">
              {conditions.length === 0 ? (
                /* Empty state matching Image 1 exactly */
                <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center justify-center gap-2 px-4">
                  <Sliders className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">
                    No active filters. Click &quot;+ Add Condition&quot; to create filters.
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-lg leading-relaxed">
                    Filter records by {activeFiltersSummary}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {conditions.map((cond) => {
                    const selectedField = allAvailableFields.find(f => f.id === cond.fieldId);
                    const isDateField = selectedField?.type === 'date';
                    const isNumberField = selectedField?.type === 'number';
                    const isSelectField = selectedField?.type === 'select' || (selectedField?.options && selectedField.options.length > 0);
                    const isBooleanField = selectedField?.type === 'boolean';
                    const uniqueOptions = getUniqueFieldValues(cond.fieldId);

                    return (
                      <motion.div
                        key={cond.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs"
                      >
                        {/* 1. Field Selection */}
                        <div className="w-full md:w-[190px] shrink-0">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                            Select Field
                          </label>
                          <select
                            value={cond.fieldId}
                            onChange={(e) => updateCondition(cond.id, { fieldId: e.target.value })}
                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer transition-all"
                          >
                            {allAvailableFields.map((f, fIdx) => (
                              <option key={`field-${f.id}-${fIdx}`} value={f.id}>
                                {f.labelEn} {f.isCustom ? '(Dynamic)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Operator Selection */}
                        <div className="w-full md:w-[170px] shrink-0">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                            Operator
                          </label>
                          <select
                            value={cond.operator}
                            onChange={(e) => updateCondition(cond.id, { operator: e.target.value as FilterOperator })}
                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer transition-all"
                          >
                            {isDateField ? (
                              <>
                                <option value="between">Between (Range)</option>
                                <option value="equals">Equals (=)</option>
                                <option value="gt">After / Greater Than (&gt;)</option>
                                <option value="lt">Before / Less Than (&lt;)</option>
                                <option value="not_equals">Does Not Equal (≠)</option>
                                <option value="is_empty">Is Empty</option>
                                <option value="is_not_empty">Is Not Empty</option>
                              </>
                            ) : isNumberField ? (
                              <>
                                <option value="equals">Equals (=)</option>
                                <option value="between">Between (Range)</option>
                                <option value="gt">Greater Than (&gt;)</option>
                                <option value="gte">Greater or Equal (≥)</option>
                                <option value="lt">Less Than (&lt;)</option>
                                <option value="lte">Less or Equal (≤)</option>
                                <option value="not_equals">Not Equals (≠)</option>
                                <option value="is_empty">Is Empty</option>
                                <option value="is_not_empty">Is Not Empty</option>
                              </>
                            ) : isBooleanField ? (
                              <>
                                <option value="is_true">Is True / Yes</option>
                                <option value="is_false">Is False / No</option>
                              </>
                            ) : isSelectField ? (
                              <>
                                <option value="equals">Equals (=)</option>
                                <option value="not_equals">Does Not Equal (≠)</option>
                                <option value="contains">Contains</option>
                                <option value="is_empty">Is Empty</option>
                                <option value="is_not_empty">Is Not Empty</option>
                              </>
                            ) : (
                              <>
                                <option value="contains">Contains</option>
                                <option value="equals">Equals (=)</option>
                                <option value="not_equals">Does Not Equal (≠)</option>
                                <option value="starts_with">Starts With</option>
                                <option value="ends_with">Ends With</option>
                                <option value="is_empty">Is Empty</option>
                                <option value="is_not_empty">Is Not Empty</option>
                              </>
                            )}
                          </select>
                        </div>

                        {/* 3. Value Input */}
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
                                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-11 pr-2 py-1.5 outline-none focus:border-indigo-500 font-mono shadow-2xs"
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
                                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 outline-none focus:border-indigo-500 font-mono shadow-2xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : ['is_empty', 'is_not_empty'].includes(cond.operator) ? (
                              <div className="h-full flex items-center pt-4">
                                <span className="text-xs text-slate-400 italic">No value needed</span>
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
                                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 font-mono shadow-2xs"
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
                                    className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 shadow-2xs"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Max"
                                    value={cond.secondValue || ''}
                                    onChange={(e) => updateCondition(cond.id, { secondValue: e.target.value })}
                                    className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 shadow-2xs"
                                  />
                                </div>
                              </div>
                            ) : ['is_empty', 'is_not_empty'].includes(cond.operator) ? (
                              <div className="h-full flex items-center pt-4">
                                <span className="text-xs text-slate-400 italic">No value needed</span>
                              </div>
                            ) : (
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                  Enter Number
                                </label>
                                <input
                                  type="number"
                                  placeholder="Value..."
                                  value={cond.value || ''}
                                  onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 shadow-2xs"
                                />
                              </div>
                            )
                          ) : isBooleanField ? (
                            <div className="h-full flex items-center pt-4">
                              <span className="text-xs text-slate-500 font-bold">
                                Evaluates to {cond.operator === 'is_true' ? 'True / Yes' : 'False / No'}
                              </span>
                            </div>
                          ) : isSelectField && !['is_empty', 'is_not_empty'].includes(cond.operator) ? (
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                Select Value
                              </label>
                              <div className="relative">
                                <select
                                  value={cond.value || ''}
                                  onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                                >
                                  <option value="">Select an option...</option>
                                  {uniqueOptions.map((opt, optIdx) => (
                                    <option key={`opt-${opt}-${optIdx}`} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ) : ['is_empty', 'is_not_empty'].includes(cond.operator) ? (
                            <div className="h-full flex items-center pt-4">
                              <span className="text-xs text-slate-400 italic">No value needed</span>
                            </div>
                          ) : (
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                Type or Select Value
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  list={`qa-datalist-${cond.id}`}
                                  placeholder="Type or select value..."
                                  value={cond.value || ''}
                                  onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 shadow-2xs"
                                />
                                {uniqueOptions.length > 0 && (
                                  <datalist id={`qa-datalist-${cond.id}`}>
                                    {uniqueOptions.map((val, valIdx) => (
                                      <option key={`val-${val}-${valIdx}`} value={val} />
                                    ))}
                                  </datalist>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 4. Delete Condition Button */}
                        <button
                          type="button"
                          onClick={() => removeCondition(cond.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl transition-all self-end md:self-auto cursor-pointer shrink-0 mt-2 md:mt-0"
                          title="Remove Condition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Buttons Bar Matching Image 1 Exactly */}
              <div className="pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3 bg-white -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-5 sm:p-6">
                <button
                  type="button"
                  onClick={addCondition}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-200 shadow-sm cursor-pointer"
                  id="qa-add-condition-btn"
                >
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>+ Add Condition</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200 cursor-pointer"
                    id="qa-clear-all-btn"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/15 flex items-center gap-2 cursor-pointer"
                    id="qa-apply-filters-btn"
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
