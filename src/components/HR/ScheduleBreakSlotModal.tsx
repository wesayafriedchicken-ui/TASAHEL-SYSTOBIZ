import React, { useState, useMemo, useEffect } from 'react';
import { 
  Coffee, 
  Utensils, 
  X, 
  Users, 
  Search, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

export interface BreakSlotModalEmployee {
  id: number | string;
  name: string;
  email?: string;
  department?: string;
  department_name?: string;
  team_name?: string;
  job_title?: string;
  avatar_url?: string;
  extension_number?: string | number;
  personal_info?: any;
}

export interface BreakSlotRecord {
  id: string;
  employee_id: number | string;
  employee_name?: string;
  break_title: string;
  break_type: 'lunch' | 'coffee_prayer' | 'other';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  notes?: string;
}

export interface ScheduleBreakSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newSlots: BreakSlotRecord[]) => void;
  initialEmployeeIds?: string[];
  employees?: BreakSlotModalEmployee[];
}

function parseTimeToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }
  return 0;
}

const EMPTY_INITIAL_IDS: string[] = [];

export const ScheduleBreakSlotModal: React.FC<ScheduleBreakSlotModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeIds = EMPTY_INITIAL_IDS,
  employees: passedEmployees
}) => {
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [empSearchQuery, setEmpSearchQuery] = useState<string>('');
  const [newBreakType, setNewBreakType] = useState<'lunch' | 'coffee_prayer' | 'other'>('lunch');
  const [newBreakTitle, setNewBreakTitle] = useState<string>('Lunch Break');
  const [newBreakStart, setNewBreakStart] = useState<string>('12:00');
  const [newBreakEnd, setNewBreakEnd] = useState<string>('12:45');
  const [newBreakNotes, setNewBreakNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fetchedEmployees, setFetchedEmployees] = useState<BreakSlotModalEmployee[]>([]);

  // Reset or initialize only when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedEmpIds(initialEmployeeIds && initialEmployeeIds.length > 0 ? [...initialEmployeeIds] : []);
      setEmpSearchQuery('');
      setNewBreakType('lunch');
      setNewBreakTitle('Lunch Break');
      setNewBreakStart('12:00');
      setNewBreakEnd('12:45');
      setNewBreakNotes('');
    }
  }, [isOpen]);

  const hasPassedEmployees = Boolean(passedEmployees && passedEmployees.length > 0);

  // Fetch employees if passed list is empty
  useEffect(() => {
    if (!isOpen || hasPassedEmployees) return;

    let isMounted = true;
    const loadEmps = async () => {
      try {
        const [hrRes, usersRes] = await Promise.all([
          fetch('/api/hr/employees?limit=1000').catch(() => null),
          fetch('/api/users').catch(() => null)
        ]);

        if (!isMounted) return;

        if (hrRes && hrRes.ok) {
          const hrData = await hrRes.json();
          const list = Array.isArray(hrData) ? hrData : (Array.isArray(hrData.data) ? hrData.data : (Array.isArray(hrData.employees) ? hrData.employees : []));
          if (list.length > 0) {
            setFetchedEmployees(list.map((h: any) => ({
              id: h.id,
              name: h.name || `Employee #${h.id}`,
              email: h.email || h.work_email,
              department: h.department_name || h.department || h.team_name || 'General Operations',
              job_title: h.job_title || 'Team Member',
              avatar_url: h.avatar_url,
              extension_number: h.extension_number || h.personal_info?.extension || h.personal_info?.ext || ''
            })));
            return;
          }
        }

        if (usersRes && usersRes.ok) {
          const rawUsers = await usersRes.json();
          setFetchedEmployees(rawUsers.map((u: any) => ({
            id: u.id,
            name: u.name || `Employee #${u.id}`,
            email: u.email,
            department: u.department_name || u.department || u.team_name || 'General Operations',
            job_title: u.job_title || 'Team Member',
            avatar_url: u.avatar_url,
            extension_number: u.extension_number || ''
          })));
        }
      } catch (e) {
        console.warn('Failed to load employees for ScheduleBreakSlotModal:', e);
      }
    };

    loadEmps();
    return () => {
      isMounted = false;
    };
  }, [isOpen, hasPassedEmployees]);

  // Effective employee roster normalized
  const allEmployees = useMemo(() => {
    const source = (passedEmployees && passedEmployees.length > 0) ? passedEmployees : fetchedEmployees;
    return source.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      department: emp.department || emp.department_name || emp.team_name || 'General Operations',
      job_title: emp.job_title || 'Team Member',
      avatar_url: emp.avatar_url,
      extension_number: emp.extension_number || emp.personal_info?.extension || emp.personal_info?.ext || ''
    }));
  }, [passedEmployees, fetchedEmployees]);

  // Filtered employees for the modal search
  const filteredEmployees = useMemo(() => {
    if (!empSearchQuery.trim()) return allEmployees;
    const q = empSearchQuery.toLowerCase().trim();
    return allEmployees.filter(e => 
      e.name?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q) ||
      String(e.extension_number || '').toLowerCase().includes(q) ||
      String(e.id).includes(q)
    );
  }, [allEmployees, empSearchQuery]);

  if (!isOpen) return null;

  const handleCreateBreak = async () => {
    if (selectedEmpIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const startMins = parseTimeToMinutes(newBreakStart);
      const endMins = parseTimeToMinutes(newBreakEnd);
      const duration = Math.max(15, endMins - startMins);

      const newSlots: BreakSlotRecord[] = selectedEmpIds.map(empId => {
        const emp = allEmployees.find(e => String(e.id) === String(empId));
        return {
          id: `brk-${Date.now()}-${empId}-${Math.random().toString(36).substring(2, 6)}`,
          employee_id: empId,
          employee_name: emp?.name || `Employee #${empId}`,
          break_title: newBreakTitle,
          break_type: newBreakType,
          start_time: newBreakStart,
          end_time: newBreakEnd,
          duration_minutes: duration,
          notes: newBreakNotes
        };
      });

      // 1. Persist to localStorage
      try {
        const existingStored = localStorage.getItem('hr_break_schedules');
        const parsed = existingStored ? JSON.parse(existingStored) : [];
        const merged = Array.isArray(parsed) ? [...parsed, ...newSlots] : newSlots;
        localStorage.setItem('hr_break_schedules', JSON.stringify(merged));
      } catch (e) {}

      // 2. Try inserting to Supabase hr_break_assignments
      try {
        await supabase.from('hr_break_assignments').insert(
          newSlots.map(s => ({
            employee_id: s.employee_id,
            employee_name: s.employee_name,
            break_title: s.break_title,
            break_type: s.break_type,
            start_time: s.start_time,
            end_time: s.end_time,
            duration_minutes: s.duration_minutes,
            notes: s.notes
          }))
        );
      } catch (err) {
        // Fallback silently if table does not exist
      }

      // 3. Dispatch window event for live sync across components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hr-break-schedules-updated', { detail: newSlots }));
      }

      onSuccess?.(newSlots);
      onClose();
    } catch (e) {
      console.error('Error creating break slot:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-300 flex items-center justify-center border border-violet-200 dark:border-violet-800/60 shrink-0 shadow-2xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Schedule Break Slot
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Staggered meal or coffee/prayer interval
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="space-y-4 overflow-y-auto py-3 pr-1 flex-1">
          
          {/* Employee Selection with Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-violet-600" />
                  <span>Select Employees</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-bold">
                  {selectedEmpIds.length} of {allEmployees.length} selected
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const visibleIds = filteredEmployees.map(e => String(e.id));
                  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedEmpIds.includes(id));
                  if (allVisibleSelected) {
                    setSelectedEmpIds(prev => prev.filter(id => !visibleIds.includes(id)));
                  } else {
                    setSelectedEmpIds(prev => Array.from(new Set([...prev, ...visibleIds])));
                  }
                }}
                className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
              >
                {filteredEmployees.length > 0 && filteredEmployees.every(e => selectedEmpIds.includes(String(e.id)))
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            {/* Quick Search inside modal */}
            {allEmployees.length > 3 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={empSearchQuery}
                  onChange={(e) => setEmpSearchQuery(e.target.value)}
                  placeholder="Search employees by name, extension or department..."
                  className="w-full text-xs font-medium pl-8 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-violet-500"
                />
                {empSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setEmpSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Checkbox List */}
            <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-1">
              {filteredEmployees.map(emp => {
                const isChecked = selectedEmpIds.includes(String(emp.id));
                return (
                  <label
                    key={emp.id}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors text-xs select-none",
                      isChecked
                        ? "bg-violet-50/90 dark:bg-violet-950/50 text-violet-950 dark:text-violet-100 font-bold"
                        : "hover:bg-white dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-medium"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const empIdStr = String(emp.id);
                        if (e.target.checked) {
                          setSelectedEmpIds(prev => [...prev, empIdStr]);
                        } else {
                          setSelectedEmpIds(prev => prev.filter(id => id !== empIdStr));
                        }
                      }}
                      className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer accent-violet-600 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{emp.name}</span>
                        <span className="text-[10px] text-violet-700 dark:text-violet-300 font-mono font-bold shrink-0">
                          Ext: {emp.extension_number || '--'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal truncate">
                        {emp.department || 'Operations'} • {emp.job_title || 'Staff'}
                      </p>
                    </div>
                  </label>
                );
              })}

              {filteredEmployees.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  No employees match "{empSearchQuery}"
                </div>
              )}
            </div>

            {selectedEmpIds.length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Please select at least one employee using the checkboxes above.</span>
              </p>
            )}
          </div>

          {/* Break Type */}
          <div>
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Break Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewBreakType('lunch');
                  setNewBreakTitle('Lunch Break');
                  setNewBreakStart('12:00');
                  setNewBreakEnd('12:45');
                }}
                className={cn(
                  "p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  newBreakType === 'lunch'
                    ? "bg-amber-50 text-amber-800 border-amber-300 font-black shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                )}
              >
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                <span>Lunch Break (45m)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewBreakType('coffee_prayer');
                  setNewBreakTitle('Coffee / Prayer Break');
                  setNewBreakStart('15:30');
                  setNewBreakEnd('15:45');
                }}
                className={cn(
                  "p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  newBreakType === 'coffee_prayer'
                    ? "bg-violet-50 text-violet-800 border-violet-300 font-black shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                )}
              >
                <Coffee className="w-3.5 h-3.5 text-violet-600" />
                <span>Prayer / Coffee (15m)</span>
              </button>
            </div>
          </div>

          {/* Break Title */}
          <div>
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Break Title Label
            </label>
            <input
              type="text"
              value={newBreakTitle}
              onChange={(e) => setNewBreakTitle(e.target.value)}
              placeholder="e.g. Staggered Lunch Wave 1"
              className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-violet-500"
            />
          </div>

          {/* Start & End Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={newBreakStart}
                onChange={(e) => setNewBreakStart(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                End Time
              </label>
              <input
                type="time"
                value={newBreakEnd}
                onChange={(e) => setNewBreakEnd(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={newBreakNotes}
              onChange={(e) => setNewBreakNotes(e.target.value)}
              placeholder="e.g. Floor handover required"
              className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            {selectedEmpIds.length > 0 ? (
              <span className="text-violet-600 dark:text-violet-400 font-bold">
                {selectedEmpIds.length} employee{selectedEmpIds.length > 1 ? 's' : ''} selected
              </span>
            ) : (
              'No employees selected'
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateBreak}
              disabled={selectedEmpIds.length === 0 || isSubmitting}
              className={cn(
                "px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5",
                (selectedEmpIds.length === 0 || isSubmitting) && "opacity-50 cursor-not-allowed hover:bg-violet-600"
              )}
            >
              {isSubmitting ? (
                <span>Syncing...</span>
              ) : (
                <span>Confirm & Sync Slot{selectedEmpIds.length > 1 ? ` (${selectedEmpIds.length})` : ''}</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ScheduleBreakSlotModal;
