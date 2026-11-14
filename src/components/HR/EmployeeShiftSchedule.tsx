import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Moon,
  Lock,
  Eye,
  ShieldCheck,
  Sparkles,
  Layers,
  EyeOff,
  CheckCircle2,
  Send,
  Loader2,
  Info,
  RefreshCw
} from 'lucide-react';
import { Employee, Shift, ShiftAssignment } from '../../types';
import { cn } from '../../lib/utils';

export interface EmployeeShiftScheduleProps {
  employee: Employee;
  shiftAssignments?: ShiftAssignment[];
  shifts?: Shift[];
  isHrAdmin?: boolean;
  currentUser?: any;
  onRefresh?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const DAYS_OF_WEEK = [
  { name: 'Sunday', short: 'SUN' },
  { name: 'Monday', short: 'MON' },
  { name: 'Tuesday', short: 'TUE' },
  { name: 'Wednesday', short: 'WED' },
  { name: 'Thursday', short: 'THU' },
  { name: 'Friday', short: 'FRI' },
  { name: 'Saturday', short: 'SAT' },
];

export const EmployeeShiftSchedule: React.FC<EmployeeShiftScheduleProps> = ({
  employee,
  shiftAssignments = [],
  shifts = [],
  isHrAdmin = false,
  currentUser,
  onRefresh,
  showToast
}) => {
  // Helper to get Sunday of week
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); // 0 is Sunday
    const diff = date.getDate() - day;
    const startOfWeek = new Date(date.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };

  const realCurrentWeekStart = getStartOfWeek(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));
  
  // View mode for HR admins: 'employee' (what employee actually sees) vs 'hr_admin' (all planned schedules + draft + upcoming releases)
  const [viewMode, setViewMode] = useState<'employee' | 'hr_admin'>('employee');
  const [isPublishingWeek, setIsPublishingWeek] = useState(false);
  const [internalAssignments, setInternalAssignments] = useState<ShiftAssignment[]>(shiftAssignments);
  const [internalShifts, setInternalShifts] = useState<Shift[]>(shifts);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with incoming props if provided
  useEffect(() => {
    if (shiftAssignments && shiftAssignments.length > 0) {
      setInternalAssignments(shiftAssignments);
    }
  }, [shiftAssignments]);

  useEffect(() => {
    if (shifts && shifts.length > 0) {
      setInternalShifts(shifts);
    }
  }, [shifts]);

  // Self-sufficient fetch to ensure shifts are ALWAYS loaded even on direct link or initial employee login
  const fetchScheduleData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resAss, resShifts] = await Promise.all([
        fetch('/api/hr/shift-assignments', {
          headers: { 'x-user-id': currentUser?.id?.toString() || '1' }
        }),
        fetch('/api/hr/shifts', {
          headers: { 'x-user-id': currentUser?.id?.toString() || '1' }
        })
      ]);
      if (resAss.ok) {
        const dataAss = await resAss.json();
        if (Array.isArray(dataAss)) {
          setInternalAssignments(dataAss);
        }
      }
      if (resShifts.ok) {
        const dataShifts = await resShifts.json();
        if (Array.isArray(dataShifts)) {
          setInternalShifts(dataShifts);
        }
      }
    } catch (err) {
      console.warn('Failed to load employee shift schedule data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchScheduleData();
  }, [employee.id, employee.user_id, fetchScheduleData]);

  // Calculate week end date (Saturday)
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const handleResetToCurrentWeek = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  const isCurrentWeek = currentWeekStart.toDateString() === realCurrentWeekStart.toDateString();
  const isFutureWeek = currentWeekStart.getTime() > realCurrentWeekStart.getTime();
  const isPastWeek = currentWeekStart.getTime() < realCurrentWeekStart.getTime();

  // Combine props & internal fetched data to guarantee we never miss assignments
  const allAssignments = useMemo(() => {
    if (internalAssignments && internalAssignments.length > 0) return internalAssignments;
    return shiftAssignments || [];
  }, [internalAssignments, shiftAssignments]);

  const allShifts = useMemo(() => {
    if (internalShifts && internalShifts.length > 0) return internalShifts;
    return shifts || [];
  }, [internalShifts, shifts]);

  // Filter assignments for this specific employee with robust multi-ID matching
  const empAssignments = useMemo(() => {
    const targetIds = new Set<string>();
    if (employee.id !== undefined && employee.id !== null) targetIds.add(String(employee.id));
    if (employee.user_id !== undefined && employee.user_id !== null) targetIds.add(String(employee.user_id));

    return allAssignments.filter(sa => {
      const saUid = String(sa.user_id);
      return targetIds.has(saUid) || Number(sa.user_id) === Number(employee.id) || (employee.user_id && Number(sa.user_id) === Number(employee.user_id));
    });
  }, [allAssignments, employee]);

  const formatDateIso = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayNum}`;
  };

  // Helper to determine if an assignment is published for the viewed date & week
  const isAssignmentVisible = (sa: ShiftAssignment, isEmployeeView: boolean): boolean => {
    const visibility = sa.employee_visibility || (sa.is_published === false ? 'draft' : 'published_all');
    const isPub = sa.is_published !== false && visibility !== 'draft';

    if (!isEmployeeView) {
      // In HR Admin view, show all assignments (including drafts and planned)
      return true;
    }

    // In Employee Live View:
    // Drafts and un-published assignments are hidden
    if (!isPub || visibility === 'draft') {
      return false;
    }

    // If weekly release mode on a future week, it is locked until that week arrives
    if (visibility === 'published_weekly' && isFutureWeek) {
      return false;
    }

    // Published shifts (published_all or active week published_weekly) are visible
    return true;
  };

  // Helper to get raw candidates and visibility status for a day
  const getAssignmentsForDay = (dayDate: Date, dayIdx: number, isEmployeeView: boolean) => {
    const dayDateStr = formatDateIso(dayDate);

    // 1. Specific date range matching
    const specific = empAssignments.filter(sa =>
      Number(sa.day_of_week) === dayIdx &&
      sa.start_date && sa.end_date &&
      dayDateStr >= sa.start_date && dayDateStr <= sa.end_date
    );

    // 2. Fallback to weekly recurrence or assignments without date constraints
    const candidates = specific.length > 0 
      ? specific 
      : empAssignments.filter(sa =>
          Number(sa.day_of_week) === dayIdx &&
          (!sa.start_date || sa.recurrence === 'weekly' || !sa.end_date)
        );

    return candidates.filter(sa => isAssignmentVisible(sa, isEmployeeView));
  };

  // Get raw assignments in this week regardless of view mode (to detect planned weekly/draft shifts)
  const getRawAssignmentsForDay = (dayDate: Date, dayIdx: number) => {
    const dayDateStr = formatDateIso(dayDate);
    const specific = empAssignments.filter(sa =>
      Number(sa.day_of_week) === dayIdx &&
      sa.start_date && sa.end_date &&
      dayDateStr >= sa.start_date && dayDateStr <= sa.end_date
    );

    return specific.length > 0 
      ? specific 
      : empAssignments.filter(sa =>
          Number(sa.day_of_week) === dayIdx &&
          (!sa.start_date || sa.recurrence === 'weekly' || !sa.end_date)
        );
  };

  // Check week characteristics
  const allWeekRawAssignments: { dayIdx: number; assignments: ShiftAssignment[] }[] = DAYS_OF_WEEK.map((_, dayIdx) => {
    const dayDate = new Date(currentWeekStart);
    dayDate.setDate(currentWeekStart.getDate() + dayIdx);
    return { dayIdx, assignments: getRawAssignmentsForDay(dayDate, dayIdx) };
  });

  const totalRawPlannedShifts = allWeekRawAssignments.reduce((acc, curr) => acc + curr.assignments.length, 0);
  
  // Robust check if this week has weekly release planned
  const hasWeeklyReleasePlanned = useMemo(() => {
    const startStr = formatDateIso(currentWeekStart);
    const endStr = formatDateIso(currentWeekEnd);

    // Check week raw assignments
    const foundInWeek = allWeekRawAssignments.some(item => 
      item.assignments.some(sa => sa.employee_visibility === 'published_weekly')
    );
    if (foundInWeek) return true;

    // Check general employee assignments spanning this week
    return empAssignments.some(sa => {
      if (sa.employee_visibility !== 'published_weekly') return false;
      if (sa.start_date && sa.end_date) {
        return sa.start_date <= endStr && sa.end_date >= startStr;
      }
      return true;
    });
  }, [allWeekRawAssignments, empAssignments, currentWeekStart, currentWeekEnd]);

  const hasDraftPlanned = allWeekRawAssignments.some(item => 
    item.assignments.some(sa => sa.employee_visibility === 'draft' || sa.is_published === false)
  );

  // Calculate visible scheduled hours for the week
  const effectiveViewMode = isHrAdmin ? viewMode : 'employee';
  const isWeekLockedByWeeklyRelease = effectiveViewMode === 'employee' && isFutureWeek && hasWeeklyReleasePlanned;

  let totalWeekHours = 0;
  let activeWorkingDays = 0;

  DAYS_OF_WEEK.forEach((_, dayIdx) => {
    const dayDate = new Date(currentWeekStart);
    dayDate.setDate(currentWeekStart.getDate() + dayIdx);
    const dayAss = getAssignmentsForDay(dayDate, dayIdx, effectiveViewMode === 'employee');
    if (dayAss.length > 0) {
      activeWorkingDays++;
      dayAss.forEach(sa => {
        const matchingShift = allShifts.find(s => Number(s.id) === Number(sa.shift_id));
        const startTime = sa.start_time || matchingShift?.start_time || '09:00';
        const endTime = sa.end_time || matchingShift?.end_time || '17:00';
        
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        let diffHours = (eh + em / 60) - (sh + sm / 60);
        if (diffHours <= 0) diffHours += 24;
        totalWeekHours += diffHours;
      });
    }
  });

  // Action for HR to publish this week immediately
  const handlePublishThisWeekNow = async () => {
    const startDateStr = formatDateIso(currentWeekStart);
    const endDateStr = formatDateIso(currentWeekEnd);
    setIsPublishingWeek(true);
    try {
      const res = await fetch('/api/hr/shift-assignments/update-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify({
          user_ids: [employee.id || employee.user_id],
          start_date: startDateStr,
          end_date: endDateStr,
          employee_visibility: 'published_all',
          is_published: true,
          send_notification: true
        })
      });

      if (res.ok) {
        if (showToast) {
          showToast(`Week (${startDateStr} to ${endDateStr}) shifts published to employee file!`, 'success');
        }
        await fetchScheduleData();
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast('Failed to publish week schedule', 'error');
      }
    } catch (e) {
      console.error('Error publishing week schedule:', e);
      if (showToast) showToast('An error occurred while publishing week schedule', 'error');
    } finally {
      setIsPublishingWeek(false);
    }
  };

  const formatDateShort = (d: Date) => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateRange = (start: Date, end: Date) => {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900">Shift Schedule</h3>
              
              {['inactive', 'terminated', 'archived', 'disabled', 'deleted', 'suspended'].includes((employee.status || '').toLowerCase()) && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  Offboarded / Historical Record
                </span>
              )}

              {effectiveViewMode === 'employee' && hasWeeklyReleasePlanned && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Weekly Release (Locked)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Weekly shift rotations and scheduled working hours for {employee.name}
            </p>
          </div>
        </div>

        {/* Top Controls: View Mode Switcher (Admin Only) + Week Navigator */}
        <div className="flex flex-wrap items-center gap-3">
          {/* HR Admin View Mode Switcher - STRICTLY for Admin */}
          {isHrAdmin && (
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('employee')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  viewMode === 'employee'
                    ? "bg-white text-indigo-700 shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                )}
                title="Preview what the employee sees in their profile"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Employee View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('hr_admin')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  viewMode === 'hr_admin'
                    ? "bg-white text-indigo-700 shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                )}
                title="View all planned shifts, drafts, and future weekly releases"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>HR Master View</span>
              </button>
            </div>
          )}

          {/* Week Navigator Controls */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-white text-slate-600 rounded-xl transition-all shadow-none hover:shadow-xs cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-slate-800 px-2.5 py-1 font-mono whitespace-nowrap">
              {formatDateRange(currentWeekStart, currentWeekEnd)}
            </span>

            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-white text-slate-600 rounded-xl transition-all shadow-none hover:shadow-xs cursor-pointer"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentWeek && (
              <button
                type="button"
                onClick={handleResetToCurrentWeek}
                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-xs cursor-pointer ml-1"
              >
                Current Week
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informative Banner when Weekly Release is active on a future week */}
      {effectiveViewMode === 'employee' && isFutureWeek && hasWeeklyReleasePlanned && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 to-orange-50/70 border border-amber-200/90 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-300">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-black text-amber-950 uppercase tracking-tight">
                  Weekly Release Control Active
                </p>
                <span className="text-[10px] font-black px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full border border-amber-300">
                  Week of {formatDateShort(currentWeekStart)}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed font-medium">
                This upcoming week's shift schedule is planned in the system and will automatically unlock in the employee's file on <strong>Sunday, {formatDateShort(currentWeekStart)}</strong>.
              </p>
            </div>
          </div>

          {isHrAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('hr_admin')}
                className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Switch to HR View
              </button>
              <button
                type="button"
                onClick={handlePublishThisWeekNow}
                disabled={isPublishingWeek}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPublishingWeek ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Publish Week Now</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Informative Banner when in HR Master View on a week with Weekly Release or Draft (Strictly Admin) */}
      {isHrAdmin && effectiveViewMode === 'hr_admin' && (hasWeeklyReleasePlanned || hasDraftPlanned) && (
        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-indigo-900 flex items-center gap-2">
                HR Master Preview Mode
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                  Admin Inspection
                </span>
              </p>
              <p className="text-xs text-indigo-700/80 mt-0.5 leading-relaxed font-medium">
                Showing all planned shifts (including upcoming weekly releases and drafts). The employee currently only sees published shifts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePublishThisWeekNow}
            disabled={isPublishingWeek}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            {isPublishingWeek ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Publish This Week to Employee</span>
          </button>
        </div>
      )}

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">Working Days</span>
          {isWeekLockedByWeeklyRelease ? (
            <span className="text-sm font-black text-amber-700 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Locked
            </span>
          ) : (
            <span className="text-sm font-black text-indigo-700">
              {activeWorkingDays} {activeWorkingDays === 1 ? 'Day' : 'Days'}
            </span>
          )}
        </div>

        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">Scheduled Hours</span>
          {isWeekLockedByWeeklyRelease ? (
            <span className="text-sm font-black text-amber-700 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Locked
            </span>
          ) : (
            <span className="text-sm font-black text-slate-900">{totalWeekHours} Hours</span>
          )}
        </div>

        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            {isHrAdmin ? 'Week Timeline & Visibility' : 'Week Timeline'}
          </span>
          <div className="text-right">
            <span className={`text-xs font-black uppercase block ${isCurrentWeek ? 'text-emerald-700' : isFutureWeek ? 'text-amber-700' : 'text-slate-600'}`}>
              {isCurrentWeek ? 'Current Week' : isFutureWeek ? 'Upcoming Week' : 'Past Week'}
            </span>
            {isHrAdmin && (
              <span className="text-[10px] font-bold text-slate-400">
                {effectiveViewMode === 'employee' ? 'Employee Live View' : 'HR Master View'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Grid (7 Days) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((day, dayIdx) => {
          const dayDate = new Date(currentWeekStart);
          dayDate.setDate(currentWeekStart.getDate() + dayIdx);

          const isToday = dayDate.toDateString() === new Date().toDateString();
          const dayAss = getAssignmentsForDay(dayDate, dayIdx, effectiveViewMode === 'employee');
          const rawDayAss = getRawAssignmentsForDay(dayDate, dayIdx);
          const hasLockedDraft = effectiveViewMode === 'employee' && rawDayAss.some(sa => sa.employee_visibility === 'draft' || sa.is_published === false);

          return (
            <div
              key={dayIdx}
              className={`flex flex-col justify-between rounded-2xl p-3 border transition-all ${
                isToday
                  ? 'bg-indigo-50/40 border-indigo-500 ring-1 ring-indigo-500/30 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
              }`}
            >
              {/* Day Header */}
              <div className="border-b border-slate-200/60 pb-2 mb-2 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                    {day.short}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    {day.name}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-black ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>
                    {formatDateShort(dayDate)}
                  </span>
                  {isToday && (
                    <span className="block text-[9px] font-black text-indigo-600 uppercase tracking-wider">
                      TODAY
                    </span>
                  )}
                </div>
              </div>

              {/* Day Assignments */}
              <div className="space-y-2 min-h-[95px] flex flex-col justify-center">
                {isWeekLockedByWeeklyRelease ? (
                  /* Weekly Release Locked - Uniform on ALL 7 days (shift days and off days alike) */
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-center space-y-1">
                    <Lock className="w-4 h-4 text-amber-600 mx-auto" />
                    <p className="text-[10px] font-black text-amber-900 leading-tight">
                      Weekly Release
                    </p>
                    <p className="text-[9px] text-amber-700/90 font-medium">
                      Unlocks on {formatDateShort(currentWeekStart)}
                    </p>
                  </div>
                ) : dayAss.length > 0 ? (
                  dayAss.map((sa, idx) => {
                    const matchingShift = allShifts.find(s => Number(s.id) === Number(sa.shift_id));
                    const shiftName = sa.shift_name || matchingShift?.name || 'Shift';
                    const startTime = sa.start_time || matchingShift?.start_time || '09:00';
                    const endTime = sa.end_time || matchingShift?.end_time || '17:00';
                    const color = sa.color || matchingShift?.color || '#4f46e5';
                    const visibility = sa.employee_visibility || (sa.is_published === false ? 'draft' : 'published_all');

                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1 relative group"
                        style={{ borderLeftWidth: '4px', borderLeftColor: color }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-black text-slate-900 truncate" title={shiftName}>
                            {shiftName}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{startTime.slice(0, 5)} - {endTime.slice(0, 5)}</span>
                        </div>

                        {/* Visibility Tag for HR Admin View */}
                        {isHrAdmin && effectiveViewMode === 'hr_admin' && (
                          <div className="pt-1 border-t border-slate-100 mt-1 flex items-center justify-between">
                            {visibility === 'published_weekly' ? (
                              <span className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1",
                                isFutureWeek 
                                  ? "bg-amber-50 text-amber-800 border border-amber-200" 
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              )}>
                                {isFutureWeek ? <Lock className="w-2.5 h-2.5" /> : <Layers className="w-2.5 h-2.5" />}
                                {isFutureWeek ? 'Weekly Release (Pending)' : 'Weekly (Active)'}
                              </span>
                            ) : visibility === 'draft' || sa.is_published === false ? (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                <EyeOff className="w-2.5 h-2.5" /> Draft Mode
                              </span>
                            ) : (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Published (Full)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : hasLockedDraft ? (
                  /* Draft Hidden */
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-center space-y-1">
                    <EyeOff className="w-4 h-4 text-slate-400 mx-auto" />
                    <p className="text-[10px] font-bold text-slate-500">
                      Draft (Hidden)
                    </p>
                  </div>
                ) : (
                  /* Regular Off Day */
                  <div className="text-center py-3 text-slate-400 space-y-1">
                    <Moon className="w-4 h-4 mx-auto opacity-30" />
                    <span className="text-[10px] font-bold block uppercase tracking-wider text-slate-400">
                      OFF DAY
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

