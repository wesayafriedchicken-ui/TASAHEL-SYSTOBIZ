import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  X, 
  Calendar, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Layers, 
  Check, 
  User, 
  Filter, 
  Search, 
  Sun, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AssignModalEmployee {
  id: string | number;
  name: string;
  department?: string;
  department_name?: string;
  team_name?: string;
  job_title?: string;
  avatar_url?: string;
  extension_number?: string | number;
}

export interface AssignModalShift {
  id: string | number;
  name: string;
  type?: string;
  start_time: string;
  end_time: string;
  color?: string;
}

export interface AssignShiftScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEmployeeIds?: (string | number)[];
  employees?: AssignModalEmployee[];
  shifts?: AssignModalShift[];
}

export const resolveEmpExtension = (emp: any): string => {
  if (!emp) return '';
  const ext = emp.extension_number ?? 
              emp.ext ?? 
              emp.extension ?? 
              emp.personal_info?.extension_number ?? 
              emp.personal_info?.extension ?? 
              emp.personal_info?.ext ?? 
              emp.phone_extension ??
              '';
  return String(ext).trim();
};

const EMPTY_IDS: (string | number)[] = [];

export const AssignShiftScheduleModal: React.FC<AssignShiftScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeIds = EMPTY_IDS,
  employees: passedEmployees,
  shifts: passedShifts
}) => {
  // Dates
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [scheduleEndDate, setScheduleEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  });
  const [scheduleRecurrence, setScheduleRecurrence] = useState<'none' | 'weekly' | 'monthly'>('weekly');
  const [notificationTiming, setNotificationTiming] = useState<'immediately' | '24h_before' | '1w_before'>('immediately');
  const [employeeVisibility, setEmployeeVisibility] = useState<'published_all' | 'published_weekly' | 'draft'>('published_all');

  // Selections
  const [selectedUserIds, setSelectedUserIds] = useState<(string | number)[]>([]);
  const [selectedShiftIds, setSelectedShiftIds] = useState<(string | number)[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4]); // Sun to Thu default
  const [clearExisting, setClearExisting] = useState<boolean>(true);

  // Filters & Search
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetched data if not passed
  const [fetchedEmployees, setFetchedEmployees] = useState<AssignModalEmployee[]>([]);
  const [fetchedShifts, setFetchedShifts] = useState<AssignModalShift[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: number | string; name: string }>>([]);
  const [extensionLookupMap, setExtensionLookupMap] = useState<Map<string, string>>(() => new Map());

  // Load extension numbers from HR roster if available
  useEffect(() => {
    fetch('/api/hr/employees?limit=1000')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        const list = Array.isArray(data) ? data : (data.data || data.employees || []);
        if (Array.isArray(list) && list.length > 0) {
          const map = new Map<string, string>();
          list.forEach((h: any) => {
            const ext = resolveEmpExtension(h);
            if (ext) {
              if (h.id != null) map.set(String(h.id), ext);
              if (h.user_id != null) map.set(String(h.user_id), ext);
              if (h.name) map.set(String(h.name).toLowerCase().trim(), ext);
            }
          });
          setExtensionLookupMap(map);
        }
      })
      .catch(() => null);
  }, []);

  // Reset and initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 6);
      
      setScheduleStartDate(today);
      setScheduleEndDate(nextWeek.toISOString().split('T')[0]);
      setScheduleRecurrence('weekly');
      setNotificationTiming('immediately');
      setEmployeeVisibility('published_all');
      setSelectedUserIds(initialEmployeeIds && initialEmployeeIds.length > 0 ? [...initialEmployeeIds] : []);
      setSelectedDays([0, 1, 2, 3, 4]);
      setClearExisting(true);
      setEmployeeSearchTerm('');
      setSelectedDeptFilter('all');
      setFeedbackMessage(null);
    }
  }, [isOpen]);

  const hasPassedEmployees = Boolean(passedEmployees && passedEmployees.length > 0);
  const hasPassedShifts = Boolean(passedShifts && passedShifts.length > 0);

  // Fetch employees, shifts & departments if not passed
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadRequiredData = async () => {
      try {
        const promises: Promise<any>[] = [];

        if (!hasPassedEmployees) {
          promises.push(
            fetch('/api/hr/employees?limit=1000')
              .then(res => res.ok ? res.json() : null)
              .catch(() => null)
          );
        } else {
          promises.push(Promise.resolve(null));
        }

        if (!hasPassedShifts) {
          promises.push(
            fetch('/api/hr/shifts')
              .then(res => res.ok ? res.json() : null)
              .catch(() => null)
          );
        } else {
          promises.push(Promise.resolve(null));
        }

        promises.push(
          fetch('/api/hr/departments')
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        );

        const [empData, shiftsData, deptsData] = await Promise.all(promises);

        if (!isMounted) return;

        if (empData) {
          const list = Array.isArray(empData) ? empData : (Array.isArray(empData.data) ? empData.data : (Array.isArray(empData.employees) ? empData.employees : []));
          setFetchedEmployees(list.map((h: any) => ({
            id: h.id,
            name: h.name || `Employee #${h.id}`,
            department: h.department_name || h.department || h.team_name || 'General Operations',
            job_title: h.job_title || 'Team Member',
            avatar_url: h.avatar_url,
            extension_number: h.extension_number || h.personal_info?.extension || h.personal_info?.ext || ''
          })));
        }

        if (shiftsData && Array.isArray(shiftsData)) {
          setFetchedShifts(shiftsData);
          if (shiftsData.length > 0 && selectedShiftIds.length === 0) {
            setSelectedShiftIds([shiftsData[0].id]);
          }
        }

        if (deptsData && Array.isArray(deptsData)) {
          setDepartments(deptsData);
        }
      } catch (err) {
        console.warn('AssignShiftScheduleModal failed to load dependencies:', err);
      }
    };

    loadRequiredData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, hasPassedEmployees, hasPassedShifts]);

  // Combined Roster with guaranteed extension numbers
  const allEmployees = useMemo(() => {
    const list = hasPassedEmployees ? (passedEmployees || []) : fetchedEmployees;
    return list.map(e => {
      const directExt = resolveEmpExtension(e);
      const mappedExt = directExt || 
                        extensionLookupMap.get(String(e.id)) || 
                        (e.name ? extensionLookupMap.get(String(e.name).toLowerCase().trim()) : '') || 
                        '';
      return {
        id: e.id,
        name: e.name || `Employee #${e.id}`,
        department: e.department || (e as any).department_name || (e as any).team_name || 'General Operations',
        job_title: e.job_title || 'Team Member',
        avatar_url: e.avatar_url,
        extension_number: mappedExt
      };
    });
  }, [hasPassedEmployees, passedEmployees, fetchedEmployees, extensionLookupMap]);

  // Combined Shifts
  const allShifts = useMemo(() => {
    return hasPassedShifts ? (passedShifts || []) : fetchedShifts;
  }, [hasPassedShifts, passedShifts, fetchedShifts]);

  // Auto-select first shift if none selected yet
  useEffect(() => {
    if (selectedShiftIds.length === 0 && allShifts.length > 0) {
      setSelectedShiftIds([allShifts[0].id]);
    }
  }, [allShifts, selectedShiftIds.length]);

  // Unique departments for filter dropdown
  const availableDepts = useMemo(() => {
    if (departments.length > 0) {
      return departments.map(d => d.name).filter(Boolean);
    }
    const depts = new Set<string>();
    allEmployees.forEach(e => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [departments, allEmployees]);

  // Filtered employees for search and selection (by Name and Extension Number)
  const searchMatches = useMemo(() => {
    if (!employeeSearchTerm.trim()) return [];
    const q = employeeSearchTerm.toLowerCase().trim();
    // Also clean '#' or 'ext:' or 'ext' prefix if user typed e.g. '#1092' or 'ext 1092'
    const cleanExt = q.replace(/^(#|ext:?|\s)+/i, '').trim();

    return allEmployees.filter(e => {
      if (selectedUserIds.includes(e.id)) return false;

      const empName = (e.name || '').toLowerCase();
      const empExt = String(e.extension_number || '').toLowerCase();
      const empDept = (e.department || '').toLowerCase();
      const empJob = (e.job_title || '').toLowerCase();
      const empIdStr = String(e.id);

      // 1. Search by Extension Number (direct or cleaned)
      const matchExt = empExt !== '' && (empExt.includes(q) || (cleanExt !== '' && empExt.includes(cleanExt)));

      // 2. Search by Employee Name
      const matchName = empName.includes(q);

      // 3. Fallback match by ID, Department or Job Title
      const matchId = empIdStr === q;
      const matchDept = empDept.includes(q);
      const matchJob = empJob.includes(q);

      return matchExt || matchName || matchId || matchDept || matchJob;
    }).slice(0, 25);
  }, [allEmployees, selectedUserIds, employeeSearchTerm]);

  if (!isOpen) return null;

  // Selection handlers
  const toggleUserSelection = (userId: string | number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUserIds.length === allEmployees.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(allEmployees.map(e => e.id));
    }
  };

  const addDepartmentEmployees = (deptName: string) => {
    if (!deptName) return;
    const matching = allEmployees.filter(e => e.department?.toLowerCase() === deptName.toLowerCase());
    const matchingIds = matching.map(e => e.id);
    setSelectedUserIds(prev => Array.from(new Set([...prev, ...matchingIds])));
  };

  const toggleShiftSelection = (shiftId: string | number) => {
    setSelectedShiftIds(prev => 
      prev.includes(shiftId) ? prev.filter(id => id !== shiftId) : [...prev, shiftId]
    );
  };

  const toggleAllShifts = () => {
    if (selectedShiftIds.length === allShifts.length) {
      setSelectedShiftIds([]);
    } else {
      setSelectedShiftIds(allShifts.map(s => s.id));
    }
  };

  const toggleDay = (dayIdx: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx]
    );
  };

  const setWeekdaysOnly = () => {
    setSelectedDays([0, 1, 2, 3, 4]); // Sun to Thu
  };

  const setAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  // Calculations
  const numEmps = selectedUserIds.length;
  const numShifts = selectedShiftIds.length;
  const numDays = selectedDays.length;
  const totalDistributedShifts = numEmps * numShifts * numDays;

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numEmps === 0) {
      setFeedbackMessage({ type: 'error', text: 'Please select at least one target employee.' });
      return;
    }
    if (numShifts === 0) {
      setFeedbackMessage({ type: 'error', text: 'Please select at least one shift.' });
      return;
    }
    if (numDays === 0) {
      setFeedbackMessage({ type: 'error', text: 'Please select at least one working day.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    const assignments: { user_id: number | string; shift_id: number | string; day_of_week: number }[] = [];
    for (const uid of selectedUserIds) {
      for (const sid of selectedShiftIds) {
        for (const day of selectedDays) {
          assignments.push({ user_id: uid, shift_id: sid, day_of_week: day });
        }
      }
    }

    try {
      const res = await fetch('/api/hr/shift-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify({
          assignments,
          clearExisting,
          user_ids: selectedUserIds,
          days_of_week: selectedDays,
          startDate: scheduleStartDate,
          endDate: scheduleEndDate,
          recurrence: scheduleRecurrence,
          notificationTiming,
          employee_visibility: employeeVisibility,
          is_published: employeeVisibility !== 'draft'
        })
      });

      if (res.ok) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hr-shift-assignments-updated', { detail: assignments }));
        }
        onSuccess?.();
        onClose();
      } else {
        const errJson = await res.json().catch(() => null);
        setFeedbackMessage({ type: 'error', text: errJson?.error || 'Failed to save shift assignments.' });
      }
    } catch (err: any) {
      console.error('Error publishing shift assignment:', err);
      setFeedbackMessage({ type: 'error', text: 'Network error occurred while saving assignments.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200/90 dark:border-slate-800 my-auto flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Assign Shift Schedule</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Configure period dates, target employees, repeat rules, and notification preferences.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            
            {/* Feedback Alert */}
            {feedbackMessage && (
              <div className={cn(
                "p-3 rounded-xl text-xs font-bold flex items-center gap-2",
                feedbackMessage.type === 'error' 
                  ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900" 
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900"
              )}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{feedbackMessage.text}</span>
              </div>
            )}

            {/* 1. SCHEDULE PERIOD & RECURRENCE */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <label className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    1. Schedule Period & Automation
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date"
                    value={scheduleStartDate}
                    onChange={e => setScheduleStartDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Date</label>
                  <input 
                    type="date"
                    value={scheduleEndDate}
                    onChange={e => setScheduleEndDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Schedule Recurrence</label>
                  <select
                    value={scheduleRecurrence}
                    onChange={e => setScheduleRecurrence(e.target.value as any)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  >
                    <option value="none">Does Not Repeat (One-time)</option>
                    <option value="weekly">Repeats Weekly</option>
                    <option value="monthly">Repeats Monthly</option>
                  </select>
                </div>
              </div>

              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notification Preference</label>
                  <select
                    value={notificationTiming}
                    onChange={e => setNotificationTiming(e.target.value as any)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  >
                    <option value="immediately">Send Immediately on Publish</option>
                    <option value="24h_before">Send 24 Hours Before Start</option>
                    <option value="1w_before">Send 1 Week Before Start</option>
                  </select>
                </div>
                <div className="flex items-center text-xs text-slate-500 pt-5">
                  <p className="text-[11px] leading-relaxed">
                    💡 Recurrence automatically duplicates this schedule for future cycles without manual HR re-entry.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. EMPLOYEE FILE VISIBILITY & PUBLISH CONTROL */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <label className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    2. Employee File Visibility & Publish Control (ظهور الشيفت في ملف الموظف)
                  </label>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full">
                  Employee Profile • Shift Schedule
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Control how shifts appear to the employee under the <strong>Shift Schedule</strong> section in their profile. You can plan for the entire month and choose whether to release all weeks at once, release week-by-week, or keep as an internal draft.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Option 1: Full Month */}
                <div
                  onClick={() => setEmployeeVisibility('published_all')}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none relative group",
                    employeeVisibility === 'published_all'
                      ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Full Month
                      </span>
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                        employeeVisibility === 'published_all' ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300"
                      )}>
                        {employeeVisibility === 'published_all' && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">Publish Entire Month / All Weeks</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Employee can immediately view all scheduled shifts for the whole month and across all future weeks in their file.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <span>✓ Immediate full schedule visibility</span>
                  </div>
                </div>

                {/* Option 2: Weekly Release */}
                <div
                  onClick={() => setEmployeeVisibility('published_weekly')}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none relative group",
                    employeeVisibility === 'published_weekly'
                      ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Weekly Release
                      </span>
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                        employeeVisibility === 'published_weekly' ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300"
                      )}>
                        {employeeVisibility === 'published_weekly' && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">Publish Week-by-Week (Release Weekly)</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Schedules the full month in the system, but employee only sees the current active week in their file. Future weeks unlock weekly.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <span>✓ Progressive weekly release</span>
                  </div>
                </div>

                {/* Option 3: Draft Mode */}
                <div
                  onClick={() => setEmployeeVisibility('draft')}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none relative group",
                    employeeVisibility === 'draft'
                      ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Draft Mode
                      </span>
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                        employeeVisibility === 'draft' ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300"
                      )}>
                        {employeeVisibility === 'draft' && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">Draft / Internal HR Only</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Schedules are recorded for HR management and calculations, but completely hidden from the employee file until published.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>✓ Hidden from employee view</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. TARGET EMPLOYEES */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <label className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    3. Target Employees
                  </label>
                  <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {numEmps} of {allEmployees.length} Selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAllUsers}
                    className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    {selectedUserIds.length === allEmployees.length ? 'Deselect All' : 'Select All Employees'}
                  </button>
                  {numEmps > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds([])}
                      className="text-[10px] font-bold uppercase text-rose-600 hover:text-rose-800 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Toolbar: Search + Add Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or extension (e.g. 1092)..."
                    value={employeeSearchTerm}
                    onChange={e => setEmployeeSearchTerm(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && searchMatches.length > 0) {
                        e.preventDefault();
                        toggleUserSelection(searchMatches[0].id);
                        setEmployeeSearchTerm('');
                      }
                    }}
                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  />
                  {employeeSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setEmployeeSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Matches Dropdown */}
                  {employeeSearchTerm.trim() !== '' && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                      {searchMatches.length > 0 ? (
                        searchMatches.map(emp => (
                          <div
                            key={emp.id}
                            onClick={() => {
                              toggleUserSelection(emp.id);
                              setEmployeeSearchTerm('');
                            }}
                            className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{emp.name}</p>
                                {emp.extension_number ? (
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                    Ext: {emp.extension_number}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                    Ext: --
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {emp.department || 'General Operations'} • {emp.job_title || 'Staff'}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-md shrink-0">
                              + Add
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-slate-400 text-center">
                          No unselected employees found matching "{employeeSearchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedDeptFilter}
                    onChange={e => {
                      setSelectedDeptFilter(e.target.value);
                      if (e.target.value !== 'all') {
                        addDepartmentEmployees(e.target.value);
                      }
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">+ Add Entire Department...</option>
                    {availableDepts.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Chips */}
              <div className="min-h-[85px] max-h-[140px] overflow-y-auto p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 items-start">
                {numEmps === 0 ? (
                  <div className="w-full h-14 flex items-center justify-center text-xs text-slate-400 font-medium">
                    No employees selected yet. Search above or select department.
                  </div>
                ) : (
                  selectedUserIds.map(uid => {
                    const emp = allEmployees.find(e => String(e.id) === String(uid));
                    if (!emp) return null;
                    return (
                      <div
                        key={emp.id}
                        className="bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 text-slate-800 dark:text-slate-100 rounded-xl px-2.5 py-1 flex items-center gap-2 text-xs border border-slate-200/80 dark:border-slate-600 transition-all shrink-0"
                      >
                        <div className="w-5 h-5 rounded-lg bg-indigo-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <span className="font-bold text-xs truncate max-w-[120px]">{emp.name}</span>
                        {emp.extension_number && (
                          <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                            #{emp.extension_number}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleUserSelection(emp.id)}
                          className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 4. SELECT SHIFT(S) */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <label className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    4. Select Shift(s) ({numShifts} Selected)
                  </label>
                </div>
                <button
                  type="button"
                  onClick={toggleAllShifts}
                  className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  {selectedShiftIds.length === allShifts.length ? 'Deselect All' : 'Select All Shifts'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {allShifts.map(s => {
                  const isSelected = selectedShiftIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleShiftSelection(s.id)}
                      className={cn(
                        "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none",
                        isSelected
                          ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 ring-1 ring-indigo-500/20"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      )}
                      style={{ borderLeftWidth: '4px', borderLeftColor: s.color || '#4f46e5' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-4 h-4 rounded flex items-center justify-center shrink-0 text-white transition-all",
                          isSelected ? "bg-indigo-600" : "border border-slate-300 dark:border-slate-600"
                        )}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-white">{s.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. WORKING DAYS */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <label className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    5. Working Days ({numDays} Days Selected)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={setWeekdaysOnly}
                    className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    Weekdays (Sun-Thu)
                  </button>
                  <button
                    type="button"
                    onClick={setAllDays}
                    className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    All 7 Days
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                {[
                  { nameEn: 'Sun', idx: 0 },
                  { nameEn: 'Mon', idx: 1 },
                  { nameEn: 'Tue', idx: 2 },
                  { nameEn: 'Wed', idx: 3 },
                  { nameEn: 'Thu', idx: 4 },
                  { nameEn: 'Fri', idx: 5 },
                  { nameEn: 'Sat', idx: 6 }
                ].map(day => {
                  const isSelected = selectedDays.includes(day.idx);
                  return (
                    <button
                      key={day.idx}
                      type="button"
                      onClick={() => toggleDay(day.idx)}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center select-none cursor-pointer",
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                      )}
                    >
                      <span className="text-xs font-black uppercase block">{day.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. OVERWRITE PREFERENCE */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/60 dark:border-amber-800/60">
              <input
                type="checkbox"
                id="clearExistingShifts"
                checked={clearExisting}
                onChange={e => setClearExisting(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-amber-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
              />
              <label htmlFor="clearExistingShifts" className="text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer select-none">
                Replace / Overwrite existing shift assignments for selected days & employees
              </label>
            </div>

          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Total Shifts Distributed: <strong>{totalDistributedShifts} Shifts</strong></span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({numEmps} Emps × {numShifts} Shifts × {numDays} Days)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> No Conflicts Detected
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={numEmps === 0 || numShifts === 0 || isSubmitting}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 cursor-pointer",
                  (numEmps === 0 || numShifts === 0 || isSubmitting) && "opacity-50 cursor-not-allowed hover:bg-indigo-600"
                )}
              >
                {isSubmitting ? (
                  <span>Publishing Schedule...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Publish & Assign Schedule</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AssignShiftScheduleModal;
