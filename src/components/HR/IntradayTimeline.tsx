import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Clock8,
  Calendar, 
  Users, 
  Search, 
  Filter, 
  Coffee, 
  Utensils, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  Sliders, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  X,
  Layers,
  Eye,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import AssignShiftScheduleModal from './AssignShiftScheduleModal';

export interface EmployeeInfo {
  id: number | string;
  name: string;
  email?: string;
  department?: string;
  job_title?: string;
  avatar_url?: string;
  extension_number?: string | number;
}

export interface ShiftInfo {
  id: number | string;
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  color?: string;
  required_hours?: number | string;
}

export interface BreakSlot {
  id: string;
  employee_id: number | string;
  employee_name?: string;
  break_title: string;
  break_type: 'lunch' | 'coffee_prayer' | 'other';
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  duration_minutes: number;
  notes?: string;
}

interface IntradayTimelineProps {
  onBack?: () => void;
}

// Convert "HH:MM:SS" or "HH:MM" to total minutes from 00:00
function parseTimeToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim();
  const parts = cleaned.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }
  return 0;
}

// Convert minutes from 00:00 to 12-hour formatted time (e.g. "09:30 AM")
function formatMinutesTo12h(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.floor(totalMinutes)));
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Convert minutes to "HH:MM" 24h
function formatMinutesTo24h(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.floor(totalMinutes)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export const IntradayTimeline: React.FC<IntradayTimelineProps> = ({ onBack }) => {
  const navigate = useNavigate();

  // 1. Filter States
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'none' | 'shift' | 'break'>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [timeRangeMode, setTimeRangeMode] = useState<'shift' | 'full'>('shift'); // 'shift': 08:00 - 20:00 (12h), 'full': 00:00 - 24:00
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Toggle Sort by Shift or Break
  const handleToggleSort = (type: 'shift' | 'break') => {
    if (sortBy === type) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortBy('none');
        setSortOrder('asc');
      }
    } else {
      setSortBy(type);
      setSortOrder('asc');
    }
  };
  const [activeTooltip, setActiveTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    subtitle: string;
    details: string[];
    colorClass: string;
  } | null>(null);

  // Modal State for assigning shifts and adding break slots
  const [showAssignShiftModal, setShowAssignShiftModal] = useState<boolean>(false);
  const [showAddBreakModal, setShowAddBreakModal] = useState<boolean>(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [empSearchQuery, setEmpSearchQuery] = useState<string>('');
  const [newBreakType, setNewBreakType] = useState<'lunch' | 'coffee_prayer' | 'other'>('lunch');
  const [newBreakTitle, setNewBreakTitle] = useState<string>('Lunch Break');
  const [newBreakStart, setNewBreakStart] = useState<string>('12:00');
  const [newBreakEnd, setNewBreakEnd] = useState<string>('12:45');
  const [newBreakNotes, setNewBreakNotes] = useState<string>('');

  // 2. Data States
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [shifts, setShifts] = useState<ShiftInfo[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<any[]>([]);
  const [breaks, setBreaks] = useState<BreakSlot[]>(() => {
    try {
      const stored = localStorage.getItem('hr_break_schedules');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((b: any, idx: number) => ({
            id: b.id || `brk-${idx}-${Date.now()}`,
            employee_id: b.employee_id,
            employee_name: b.employee_name,
            break_title: b.break_title || 'Break Slot',
            break_type: (b.break_title && b.break_title.toLowerCase().includes('lunch')) ? 'lunch' : 'coffee_prayer',
            start_time: b.start_time || '12:00',
            end_time: b.end_time || '12:45',
            duration_minutes: b.duration_minutes || 45,
            notes: b.notes || ''
          }));
        }
      }
    } catch (e) {}
    return [];
  });

  // Live Current Time
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30000);

    const handleSync = () => {
      try {
        const stored = localStorage.getItem('hr_break_schedules');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBreaks(prev => {
              if (prev.length === parsed.length && prev.length > 0 && prev[0].id === parsed[0].id) {
                return prev;
              }
              return parsed;
            });
          }
        }
      } catch (e) {}
    };

    window.addEventListener('hr-break-schedules-updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      clearInterval(timer);
      window.removeEventListener('hr-break-schedules-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // 3. Fetch Data from API & Supabase
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Employees / Users & HR Profiles for accurate extension numbers
      const [usersRes, hrEmpRes] = await Promise.all([
        fetch('/api/users').catch(() => null),
        fetch('/api/hr/employees?limit=1000').catch(() => null)
      ]);

      const hrExtMap = new Map<string, string>();
      let loadedFromHr: EmployeeInfo[] = [];

      if (hrEmpRes && hrEmpRes.ok) {
        try {
          const hrData = await hrEmpRes.json();
          const list = Array.isArray(hrData) ? hrData : (Array.isArray(hrData.employees) ? hrData.employees : (Array.isArray(hrData.data) ? hrData.data : []));
          
          list.forEach((h: any) => {
            const ext = h.extension_number || h.personal_info?.extension || h.personal_info?.ext;
            if (ext) {
              const extClean = String(ext).trim();
              if (h.user_id) hrExtMap.set(String(h.user_id), extClean);
              if (h.id) hrExtMap.set(String(h.id), extClean);
              if (h.employee_id) hrExtMap.set(String(h.employee_id), extClean);
              if (h.name) hrExtMap.set(String(h.name).toLowerCase().trim(), extClean);
            }
          });

          if (list.length > 0) {
            loadedFromHr = list.map((h: any) => {
              const resolvedExt = h.extension_number || 
                h.personal_info?.extension || 
                h.personal_info?.ext || 
                hrExtMap.get(String(h.id)) || 
                hrExtMap.get(String(h.name).toLowerCase().trim()) || 
                '';

              return {
                id: h.id,
                name: h.name || `Employee #${h.id}`,
                email: h.email || h.work_email,
                department: h.department_name || h.team_name || 'General Operations',
                job_title: h.job_title || 'Team Member',
                avatar_url: h.avatar_url,
                extension_number: resolvedExt ? String(resolvedExt).trim() : ''
              };
            });
          }
        } catch (e) {}
      }

      if (loadedFromHr.length > 0) {
        setEmployees(loadedFromHr);
      } else if (usersRes && usersRes.ok) {
        const rawUsers = await usersRes.json();
        const loadedUsers: EmployeeInfo[] = rawUsers.map((u: any) => {
          const resolvedExt = u.extension_number || 
            hrExtMap.get(String(u.id)) || 
            (u.employee_id ? hrExtMap.get(String(u.employee_id)) : '') || 
            (u.name ? hrExtMap.get(String(u.name).toLowerCase().trim()) : '') || 
            '';

          return {
            id: u.id,
            name: u.name || `Employee #${u.id}`,
            email: u.email,
            department: u.department || u.department_name || u.team_name || 'General Operations',
            job_title: u.job_title || 'Team Member',
            avatar_url: u.avatar_url,
            extension_number: resolvedExt ? String(resolvedExt).trim() : ''
          };
        });
        setEmployees(loadedUsers);
      }

      // 2. Fetch Shifts
      const shiftsRes = await fetch('/api/hr/shifts').catch(() => null);
      let loadedShifts: ShiftInfo[] = [];
      if (shiftsRes && shiftsRes.ok) {
        loadedShifts = await shiftsRes.json();
        setShifts(loadedShifts);
      }

      // 3. Fetch Shift Assignments
      const assignRes = await fetch('/api/hr/shift-assignments').catch(() => null);
      if (assignRes && assignRes.ok) {
        const loadedAssign = await assignRes.json();
        setShiftAssignments(loadedAssign);
      }

      // 4. Try Syncing with Supabase hr_break_assignments
      try {
        const { data: supaBreaks } = await supabase.from('hr_break_assignments').select('*');
        if (supaBreaks && Array.isArray(supaBreaks) && supaBreaks.length > 0) {
          const formatted: BreakSlot[] = supaBreaks.map(sb => ({
            id: String(sb.id),
            employee_id: sb.user_id || sb.employee_id,
            employee_name: sb.employee_name,
            break_title: sb.break_title || sb.name || 'Scheduled Break',
            break_type: sb.break_type || ((sb.break_title && sb.break_title.toLowerCase().includes('lunch')) ? 'lunch' : 'coffee_prayer'),
            start_time: sb.start_time ? sb.start_time.substring(0, 5) : '12:00',
            end_time: sb.end_time ? sb.end_time.substring(0, 5) : '12:45',
            duration_minutes: sb.duration_minutes || 45,
            notes: sb.notes
          }));
          setBreaks(formatted);
          localStorage.setItem('hr_break_schedules', JSON.stringify(formatted));
        }
      } catch (err) {
        // Supabase select silent fallback to local/defaults
      }
    } catch (e) {
      console.warn('Intraday Timeline sync notice:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Ensure default breaks exist if none are found in storage or DB
  const defaultBreaksInitializedRef = useRef(false);
  useEffect(() => {
    if (defaultBreaksInitializedRef.current) return;
    if (breaks.length === 0 && employees.length > 0) {
      defaultBreaksInitializedRef.current = true;
      const defaultBreakTemplates: BreakSlot[] = [];
      employees.slice(0, 8).forEach((emp, idx) => {
        // Lunch Break: staggered 12:00, 12:30, 13:00, 13:30
        const lunchHours = [12, 12, 13, 13][idx % 4];
        const lunchMins = [0, 30, 0, 30][idx % 4];
        const lunchStartStr = `${lunchHours.toString().padStart(2, '0')}:${lunchMins.toString().padStart(2, '0')}`;
        const lunchEndMinutes = lunchHours * 60 + lunchMins + 45;
        const lunchEndStr = formatMinutesTo24h(lunchEndMinutes);

        defaultBreakTemplates.push({
          id: `default-lunch-${emp.id}`,
          employee_id: emp.id,
          employee_name: emp.name,
          break_title: 'Lunch Break',
          break_type: 'lunch',
          start_time: lunchStartStr,
          end_time: lunchEndStr,
          duration_minutes: 45,
          notes: 'Standard meal break'
        });

        // Coffee / Prayer Break: staggered 15:15, 15:30, 15:45, 16:00
        const prayerHours = 15;
        const prayerMins = [15, 30, 45, 0][idx % 4];
        const prayerH = idx % 4 === 3 ? 16 : prayerHours;
        const prayerStartStr = `${prayerH.toString().padStart(2, '0')}:${prayerMins.toString().padStart(2, '0')}`;
        const prayerEndStr = formatMinutesTo24h(prayerH * 60 + prayerMins + 15);

        defaultBreakTemplates.push({
          id: `default-prayer-${emp.id}`,
          employee_id: emp.id,
          employee_name: emp.name,
          break_title: 'Coffee / Prayer Break',
          break_type: 'coffee_prayer',
          start_time: prayerStartStr,
          end_time: prayerEndStr,
          duration_minutes: 15,
          notes: 'Afternoon refreshment & prayer'
        });
      });

      setBreaks(defaultBreakTemplates);
      try {
        localStorage.setItem('hr_break_schedules', JSON.stringify(defaultBreakTemplates));
      } catch (e) {}
    }
  }, [employees.length, breaks.length]);

  // Save breaks when changed
  const saveBreaks = (updated: BreakSlot[]) => {
    setBreaks(updated);
    try {
      localStorage.setItem('hr_break_schedules', JSON.stringify(updated));
    } catch (e) {}
  };

  // Filtered employees for the modal search
  const filteredModalEmployees = useMemo(() => {
    if (!empSearchQuery.trim()) return employees;
    const q = empSearchQuery.toLowerCase().trim();
    return employees.filter(e => 
      e.name?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q) ||
      String(e.extension_number || '').toLowerCase().includes(q) ||
      String(e.id).includes(q)
    );
  }, [employees, empSearchQuery]);

  // Add Break Handler (Multi-Employee support with checkboxes)
  const handleCreateBreak = () => {
    if (selectedEmpIds.length === 0) return;
    const startMins = parseTimeToMinutes(newBreakStart);
    const endMins = parseTimeToMinutes(newBreakEnd);
    const duration = Math.max(15, endMins - startMins);

    const newSlots: BreakSlot[] = selectedEmpIds.map(empId => {
      const emp = employees.find(e => String(e.id) === String(empId));
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

    const updated = [...breaks, ...newSlots];
    saveBreaks(updated);
    setShowAddBreakModal(false);
    setSelectedEmpIds([]);
    setEmpSearchQuery('');
    setNewBreakNotes('');
  };

  const handleDeleteBreak = (slotId: string) => {
    const filtered = breaks.filter(b => b.id !== slotId);
    saveBreaks(filtered);
  };

  // 4. Timeline Range Definitions
  const timelineStartHour = timeRangeMode === 'shift' ? 8 : 0;
  const timelineEndHour = timeRangeMode === 'shift' ? 20 : 24;
  const timelineStartMinutes = timelineStartHour * 60;
  const timelineEndMinutes = timelineEndHour * 60;
  const timelineTotalMinutes = timelineEndMinutes - timelineStartMinutes; // e.g. 720 mins (12h)

  // Hours array for grid headers: 8, 9, 10, ... 20
  const hoursArray = useMemo(() => {
    const arr: number[] = [];
    for (let h = timelineStartHour; h <= timelineEndHour; h++) {
      arr.push(h);
    }
    return arr;
  }, [timelineStartHour, timelineEndHour]);

  // Departments List
  const departmentsList = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(e => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [employees]);

  // Selected Day of Week for shift assignment matching (0=Sun, 1=Mon, ..., 6=Sat)
  const selectedDayOfWeek = useMemo(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? 0 : d.getDay();
  }, [selectedDate]);

  // Filtered Employees with their resolved shift & break slots
  const rosterRows = useMemo(() => {
    const rows = employees
      .filter(emp => {
        // Department filter
        if (departmentFilter !== 'all' && emp.department !== departmentFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = emp.name.toLowerCase().includes(q);
          const matchExt = String(emp.extension_number || '').toLowerCase().includes(q);
          const matchDept = (emp.department || '').toLowerCase().includes(q);
          if (!matchName && !matchExt && !matchDept) return false;
        }

        return true;
      })
      .map(emp => {
        // Find assigned shift for this employee on selected date/day
        const userAssigns = shiftAssignments.filter(sa => Number(sa.user_id) === Number(emp.id));
        const dayAssign = userAssigns.find(sa => sa.day_of_week === selectedDayOfWeek) || userAssigns[0];

        let assignedShift: ShiftInfo | null = null;
        if (dayAssign) {
          assignedShift = {
            id: dayAssign.shift_id,
            name: dayAssign.shift_name || 'Assigned Shift',
            type: dayAssign.type || 'Fixed',
            start_time: dayAssign.start_time || '09:00:00',
            end_time: dayAssign.end_time || '17:00:00',
            color: dayAssign.color || '#6366f1'
          };
        } else if (shifts.length > 0) {
          // Fallback to default shift pattern based on employee index
          const s = shifts[Math.abs(Number(emp.id)) % shifts.length];
          assignedShift = s;
        } else {
          // Standard business shift
          assignedShift = {
            id: 'default',
            name: 'Standard Morning Shift',
            type: 'Fixed',
            start_time: '09:00:00',
            end_time: '17:00:00',
            color: '#10b981'
          };
        }

        // Apply shift type filter
        if (shiftTypeFilter !== 'all' && assignedShift && assignedShift.type !== shiftTypeFilter && assignedShift.name !== shiftTypeFilter) {
          return null;
        }

        // Find breaks for this employee
        const empBreaks = breaks.filter(b => String(b.employee_id) === String(emp.id));

        return {
          employee: emp,
          shift: assignedShift,
          breaks: empBreaks
        };
      })
      .filter(Boolean) as {
        employee: EmployeeInfo;
        shift: ShiftInfo;
        breaks: BreakSlot[];
      }[];

    if (sortBy === 'shift') {
      rows.sort((a, b) => {
        const aStart = a.shift ? parseTimeToMinutes(a.shift.start_time) : 99999;
        const bStart = b.shift ? parseTimeToMinutes(b.shift.start_time) : 99999;
        if (aStart === bStart) {
          return a.employee.name.localeCompare(b.employee.name);
        }
        return sortOrder === 'asc' ? aStart - bStart : bStart - aStart;
      });
    } else if (sortBy === 'break') {
      rows.sort((a, b) => {
        const aHasBreaks = a.breaks && a.breaks.length > 0;
        const bHasBreaks = b.breaks && b.breaks.length > 0;
        if (!aHasBreaks && !bHasBreaks) return a.employee.name.localeCompare(b.employee.name);
        if (!aHasBreaks) return 1;
        if (!bHasBreaks) return -1;
        const aEarliest = Math.min(...a.breaks.map(bk => parseTimeToMinutes(bk.start_time)));
        const bEarliest = Math.min(...b.breaks.map(bk => parseTimeToMinutes(bk.start_time)));
        if (aEarliest === bEarliest) {
          return a.employee.name.localeCompare(b.employee.name);
        }
        return sortOrder === 'asc' ? aEarliest - bEarliest : bEarliest - aEarliest;
      });
    }

    return rows;
  }, [employees, shiftAssignments, shifts, breaks, selectedDayOfWeek, departmentFilter, shiftTypeFilter, searchQuery, sortBy, sortOrder]);

  // 5. Hourly Headcount & Floor Coverage Calculations
  const hourlyCoverageData = useMemo(() => {
    return hoursArray.map(hour => {
      const hourStartMin = hour * 60;
      const hourEndMin = (hour + 1) * 60;

      let onShiftCount = 0;
      let onBreakCount = 0;

      rosterRows.forEach(row => {
        if (!row.shift) return;
        const shiftStart = parseTimeToMinutes(row.shift.start_time);
        const shiftEnd = parseTimeToMinutes(row.shift.end_time);

        // Check if shift overlaps with this hour
        const isWorkingInHour = shiftStart < hourEndMin && shiftEnd > hourStartMin;
        if (isWorkingInHour) {
          onShiftCount++;

          // Check if any break overlaps this hour
          const hasBreakInHour = row.breaks.some(b => {
            const bStart = parseTimeToMinutes(b.start_time);
            const bEnd = parseTimeToMinutes(b.end_time);
            return bStart < hourEndMin && bEnd > hourStartMin;
          });

          if (hasBreakInHour) {
            onBreakCount++;
          }
        }
      });

      const netActive = Math.max(0, onShiftCount - onBreakCount);

      return {
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        onShift: onShiftCount,
        onBreak: onBreakCount,
        active: netActive
      };
    });
  }, [hoursArray, rosterRows]);

  // Overall Coverage Stats
  const coverageStats = useMemo(() => {
    const totalStaff = rosterRows.length;
    let currentlyActive = 0;
    let currentlyOnBreak = 0;

    rosterRows.forEach(row => {
      if (!row.shift) return;
      const shiftStart = parseTimeToMinutes(row.shift.start_time);
      const shiftEnd = parseTimeToMinutes(row.shift.end_time);

      if (currentTimeMinutes >= shiftStart && currentTimeMinutes <= shiftEnd) {
        const inBreak = row.breaks.some(b => {
          const bStart = parseTimeToMinutes(b.start_time);
          const bEnd = parseTimeToMinutes(b.end_time);
          return currentTimeMinutes >= bStart && currentTimeMinutes <= bEnd;
        });

        if (inBreak) {
          currentlyOnBreak++;
        } else {
          currentlyActive++;
        }
      }
    });

    const maxActive = Math.max(1, ...hourlyCoverageData.map(d => d.active));
    const peakHourObj = hourlyCoverageData.reduce((prev, curr) => (curr.active > prev.active ? curr : prev), hourlyCoverageData[0]);

    return {
      totalStaff,
      currentlyActive,
      currentlyOnBreak,
      maxActive,
      peakHour: peakHourObj?.label || '11:00'
    };
  }, [rosterRows, currentTimeMinutes, hourlyCoverageData]);

  // Date Navigation Helpers
  const handleDateShift = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100" id="wfm-intraday-timeline">
      
      {/* 1. Executive Top Header & Controls Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Back Button */}
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              type="button"
              onClick={onBack || (() => navigate('/hr/attendance/shifts'))}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs group shrink-0"
              title="Return to Shift Schedule Hub"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-200 dark:border-violet-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                  WFM Intraday Matrix
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  Floor Attendance & Staggered Breaks
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Intraday Shift & Break Timeline
              </h1>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowAssignShiftModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Assign Shift Schedule"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Shift</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedEmpIds([]);
                setEmpSearchQuery('');
                setShowAddBreakModal(true);
              }}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Break Slot</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={isRefreshing}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Refresh and sync data"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-violet-600")} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>
          </div>
        </div>

        {/* 2. Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          
          {/* Date Selector with Next / Prev */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
            <button
              type="button"
              onClick={() => handleDateShift(-1)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-100 px-2 py-1 outline-none cursor-pointer"
            />

            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className="px-2 py-1 text-[11px] font-bold text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/60 rounded-lg transition cursor-pointer"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => handleDateShift(1)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Department, Shift Type & Search Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Shift Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={shiftTypeFilter}
                onChange={(e) => setShiftTypeFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="all">All Shift Types</option>
                <option value="Fixed">Fixed Shifts</option>
                <option value="Variable">Variable Shifts</option>
                <option value="Flexible">Flexible Shifts</option>
                <option value="Holiday">Holiday Off</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff or Ext..."
                className="pl-8 pr-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-violet-500 w-44 sm:w-52 transition-all"
              />
            </div>

            {/* Sort by Shift & Break Controls (Icon Only) */}
            <div className="flex items-center p-0.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl gap-0.5" title="Sort by Shift or Break">
              <button
                type="button"
                onClick={() => handleToggleSort('shift')}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1",
                  sortBy === 'shift'
                    ? "bg-violet-600 text-white shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                title={`Sort by Shift ${sortBy === 'shift' ? (sortOrder === 'asc' ? '(Earliest Shift First)' : '(Latest Shift First)') : '(Click to sort)'}`}
              >
                <Clock className="w-3.5 h-3.5" />
                {sortBy === 'shift' && (
                  <span className="text-[10px] leading-none font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleToggleSort('break')}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1",
                  sortBy === 'break'
                    ? "bg-violet-600 text-white shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                title={`Sort by Break ${sortBy === 'break' ? (sortOrder === 'asc' ? '(Earliest Break First)' : '(Latest Break First)') : '(Click to sort)'}`}
              >
                <Coffee className="w-3.5 h-3.5" />
                {sortBy === 'break' && (
                  <span className="text-[10px] leading-none font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>

            {/* View Mode Toggle: Floor (08:00 - 20:00) vs Full 24 Hours */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTimeRangeMode('shift')}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                  timeRangeMode === 'shift' ? "bg-white dark:bg-slate-900 text-violet-600 shadow-2xs font-black" : "text-slate-500 hover:text-slate-800"
                )}
              >
                08:00 - 20:00
              </button>
              <button
                type="button"
                onClick={() => setTimeRangeMode('full')}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                  timeRangeMode === 'full' ? "bg-white dark:bg-slate-900 text-violet-600 shadow-2xs font-black" : "text-slate-500 hover:text-slate-800"
                )}
              >
                24 Hours
              </button>
            </div>
          </div>
        </div>

        {/* 3. Legend Pills */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold flex-wrap">
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-600" />
              <span className="text-slate-600 dark:text-slate-300">🟢 Working Hours</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 border border-amber-500" />
              <span className="text-slate-600 dark:text-slate-300">🟡 Lunch Break</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-violet-400 border border-violet-500" />
              <span className="text-slate-600 dark:text-slate-300">🟣 Coffee / Prayer Break</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span className="text-slate-600 dark:text-slate-300">🔴 Current Time Indicator</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sortBy !== 'none' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                <span>Sorted by {sortBy === 'shift' ? 'Shift' : 'Break'} ({sortOrder === 'asc' ? 'Earliest first' : 'Latest first'})</span>
                <button 
                  type="button" 
                  onClick={() => setSortBy('none')}
                  className="hover:text-violet-900 dark:hover:text-white font-black cursor-pointer"
                  title="Clear sort"
                >
                  ×
                </button>
              </span>
            )}
            <div className="text-[11px] font-mono text-slate-400">
              Total Staff Displayed: <strong className="text-slate-700 dark:text-slate-200">{rosterRows.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hourly Coverage Chart (Top Widget) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Workforce Density & Hourly Floor Coverage Curve
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Aggregated real-time agent presence accounting for staggered meal and prayer intervals.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300">
              Active Now: <strong className="text-sm">{coverageStats.currentlyActive}</strong>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300">
              On Break: <strong className="text-sm">{coverageStats.currentlyOnBreak}</strong>
            </div>
            <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 hidden md:block">
              Peak Hour: <strong className="text-sm">{coverageStats.peakHour}</strong>
            </div>
          </div>
        </div>

        {/* Coverage Bars Chart - Responsive, zero inner scrollbars, full width layout */}
        <div className="w-full pt-8 pb-1 overflow-visible">
          <div className={cn(
            "w-full flex items-end justify-between h-36 sm:h-40",
            timeRangeMode === 'full' ? "gap-1 sm:gap-1.5" : "gap-1.5 sm:gap-2.5"
          )}>
            {hourlyCoverageData.map((d, index) => {
              const max = Math.max(1, coverageStats.maxActive);
              const heightPct = Math.round((d.active / max) * 100);
              const isPeak = d.active === max && max > 0;
              const isShortage = d.active < 2 && d.hour >= 9 && d.hour <= 18;
              const isFirst = index === 0;
              const isLast = index === hourlyCoverageData.length - 1;

              return (
                <div key={d.hour} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative">
                  
                  {/* Tooltip on bar hover: z-50, -top-10, safely above bar without clipping */}
                  <div className={cn(
                    "opacity-0 group-hover:opacity-100 transition-all duration-150 absolute -top-10 bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg pointer-events-none whitespace-nowrap shadow-xl border border-slate-700/60 dark:border-slate-600/60 z-50",
                    isFirst ? "left-0 translate-x-0" : isLast ? "right-0 translate-x-0" : "left-1/2 -translate-x-1/2"
                  )}>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-violet-300 font-bold">{d.label}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-emerald-400 font-semibold">{d.active} active</span>
                      {d.onBreak > 0 && (
                        <>
                          <span className="text-slate-400">·</span>
                          <span className="text-amber-300 font-normal">{d.onBreak} break</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Active Count Badge */}
                  <span className={cn(
                    "text-[11px] font-bold mb-1.5 transition-transform group-hover:scale-110 select-none",
                    d.active === 0 
                      ? "text-slate-400 dark:text-slate-500 font-medium" 
                      : isPeak 
                        ? "text-emerald-600 dark:text-emerald-400 font-black" 
                        : isShortage 
                          ? "text-amber-600 dark:text-amber-400 font-black" 
                          : "text-slate-700 dark:text-slate-200"
                  )}>
                    {d.active}
                  </span>

                  {/* Visual Bar: Track and Fill */}
                  <div className="w-full flex-1 max-h-24 sm:max-h-28 bg-slate-100 dark:bg-slate-800/50 rounded-t-lg flex items-end overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-800/80 transition-colors group-hover:border-violet-300 dark:group-hover:border-violet-700/60">
                    <div 
                      style={{ height: d.active === 0 ? '0%' : `${Math.max(6, Math.min(100, heightPct))}%` }}
                      className={cn(
                        "w-full rounded-t-lg transition-all duration-300",
                        d.active === 0 
                          ? "h-0" 
                          : isPeak 
                            ? "bg-gradient-to-t from-emerald-500 to-teal-400 shadow-xs" 
                            : isShortage 
                              ? "bg-gradient-to-t from-amber-400 to-orange-300 shadow-xs" 
                              : "bg-gradient-to-t from-violet-600 via-indigo-500 to-sky-400 shadow-xs"
                      )}
                    />
                  </div>

                  {/* Explicit Hour Label Below Bars */}
                  <span className={cn(
                    "text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2 text-center font-mono whitespace-nowrap block select-none",
                    timeRangeMode === 'full' && "text-[9px] sm:text-[11px]"
                  )}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. The Gantt Schedule Matrix (Employee Rows) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        
        {/* Table / Timeline Container */}
        <div className="overflow-x-auto relative">
          <div className="min-w-[1000px]">
            
            {/* Timeline Header Row */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 text-xs font-black text-slate-500 dark:text-slate-400">
              
              {/* Left Column Header (Sticky) */}
              <div className="w-72 p-3.5 sm:p-4 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="uppercase tracking-wider font-black text-slate-700 dark:text-slate-200 block text-xs">
                    Employee / Assigned Shift
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Ext. Number</span>
                </div>
                
                {/* Sort Icons inside Table Header */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shrink-0" title="Sort Timeline">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('shift')}
                    className={cn(
                      "p-1 rounded-md transition-all cursor-pointer flex items-center gap-0.5",
                      sortBy === 'shift'
                        ? "bg-violet-600 text-white font-bold shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                    title={`Sort by Shift ${sortBy === 'shift' ? (sortOrder === 'asc' ? '(Earliest First)' : '(Latest First)') : '(Click to sort)'}`}
                    aria-label="Sort by Shift"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {sortBy === 'shift' && (
                      <span className="text-[9px] leading-none font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleSort('break')}
                    className={cn(
                      "p-1 rounded-md transition-all cursor-pointer flex items-center gap-0.5",
                      sortBy === 'break'
                        ? "bg-violet-600 text-white font-bold shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                    title={`Sort by Break ${sortBy === 'break' ? (sortOrder === 'asc' ? '(Earliest First)' : '(Latest First)') : '(Click to sort)'}`}
                    aria-label="Sort by Break"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    {sortBy === 'break' && (
                      <span className="text-[9px] leading-none font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Timeline Hours Grid Header */}
              <div className="flex-1 flex relative">
                {hoursArray.map((hour, idx) => {
                  if (idx === hoursArray.length - 1) return null; // Avoid trailing label overflow
                  return (
                    <div 
                      key={hour} 
                      className="flex-1 text-center py-3 border-r border-slate-200/60 dark:border-slate-700/60 font-mono text-[11px]"
                    >
                      <span>{hour.toString().padStart(2, '0')}:00</span>
                    </div>
                  );
                })}

                {/* Current Time Marker in Header */}
                {currentTimeMinutes >= timelineStartMinutes && currentTimeMinutes <= timelineEndMinutes && (
                  <div
                    style={{
                      left: `${((currentTimeMinutes - timelineStartMinutes) / timelineTotalMinutes) * 100}%`
                    }}
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none"
                  >
                    <div className="absolute -top-1 -left-7 px-1.5 py-0.5 bg-rose-600 text-white rounded text-[9px] font-black uppercase font-mono tracking-tighter shadow-sm animate-pulse whitespace-nowrap">
                      {formatMinutesTo24h(currentTimeMinutes)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Employee Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 relative">
              
              {/* Full Grid Vertical Guideline Overlay */}
              <div className="absolute top-0 bottom-0 left-72 right-0 flex pointer-events-none z-0">
                {hoursArray.map((hour, idx) => {
                  if (idx === hoursArray.length - 1) return null;
                  return (
                    <div 
                      key={hour} 
                      className="flex-1 border-r border-dashed border-slate-200/40 dark:border-slate-700/30 h-full relative"
                    >
                      {/* 30-min Sub-tick mark */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px border-r border-dotted border-slate-200/25 dark:border-slate-800/50" />
                    </div>
                  );
                })}

                {/* Real-time Vertical Line through all rows */}
                {currentTimeMinutes >= timelineStartMinutes && currentTimeMinutes <= timelineEndMinutes && (
                  <div
                    style={{
                      left: `${((currentTimeMinutes - timelineStartMinutes) / timelineTotalMinutes) * 100}%`
                    }}
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.6)] z-20 pointer-events-none"
                  />
                )}
              </div>

              {/* Render Rows */}
              {rosterRows.map(({ employee, shift, breaks: empBreaks }) => {
                const shiftStartMin = shift ? parseTimeToMinutes(shift.start_time) : 0;
                const shiftEndMin = shift ? parseTimeToMinutes(shift.end_time) : 0;

                // Shift bounds relative to timeline range
                const visibleShiftStart = Math.max(timelineStartMinutes, shiftStartMin);
                const visibleShiftEnd = Math.min(timelineEndMinutes, shiftEndMin);
                const isShiftVisible = visibleShiftEnd > visibleShiftStart;

                const shiftLeftPct = isShiftVisible 
                  ? ((visibleShiftStart - timelineStartMinutes) / timelineTotalMinutes) * 100 
                  : 0;
                const shiftWidthPct = isShiftVisible 
                  ? ((visibleShiftEnd - visibleShiftStart) / timelineTotalMinutes) * 100 
                  : 0;

                return (
                  <div key={employee.id} className="flex items-center hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group relative z-1">
                    
                    {/* Left Sticky Column: Employee Identity & Shift Card */}
                    <div className="w-72 p-3 sm:p-4 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group-hover:bg-slate-50/70 dark:group-hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {employee.avatar_url ? (
                            <img 
                              src={employee.avatar_url} 
                              alt={employee.name} 
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700" 
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 font-black text-xs flex items-center justify-center border border-violet-200 dark:border-violet-800">
                              {employee.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                        </div>

                        {/* Name & Job Title */}
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {employee.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                            {employee.job_title || employee.department || 'Operations Staff'}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span 
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white font-mono"
                              style={{ backgroundColor: shift?.color || '#6366f1' }}
                            >
                              {shift ? `${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)}` : 'Off'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Extension Number Badge & Quick Break Button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {employee.extension_number ? (
                          <span 
                            className="text-[10px] font-mono font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/80 px-2 py-1 rounded-md"
                            title={`Extension Number: ${employee.extension_number}`}
                          >
                            Ext: {employee.extension_number}
                          </span>
                        ) : (
                          <span 
                            className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"
                            title="No extension registered"
                          >
                            Ext: --
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmpIds([String(employee.id)]);
                            setEmpSearchQuery('');
                            setShowAddBreakModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/60 rounded-lg transition cursor-pointer"
                          title={`Schedule break slot for ${employee.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Right Timeline Area: Continuous Shift Bar & Embedded Breaks */}
                    <div className="flex-1 h-14 relative flex items-center px-0">
                      
                      {isShiftVisible ? (
                        <div
                          style={{
                            left: `${shiftLeftPct}%`,
                            width: `${shiftWidthPct}%`
                          }}
                          className="absolute h-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border border-emerald-600/40 shadow-xs flex items-center justify-between px-2.5 text-white transition-all overflow-hidden group/bar"
                          title={`${shift.name}: ${shift.start_time.substring(0, 5)} to ${shift.end_time.substring(0, 5)}`}
                        >
                          {/* Shift Label inside bar */}
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider drop-shadow-xs z-2 truncate">
                            <span>{shift.name}</span>
                          </div>

                          <span className="text-[9px] font-mono opacity-80 z-2 hidden sm:inline">
                            {formatMinutesTo24h(visibleShiftStart)} - {formatMinutesTo24h(visibleShiftEnd)}
                          </span>

                          {/* Embedded Break Slots inside Shift Bar */}
                          {empBreaks.map((b) => {
                            const bStartMin = parseTimeToMinutes(b.start_time);
                            const bEndMin = parseTimeToMinutes(b.end_time);

                            // Skip if break is completely outside shift or timeline
                            if (bEndMin <= visibleShiftStart || bStartMin >= visibleShiftEnd) return null;

                            const visibleBStart = Math.max(visibleShiftStart, bStartMin);
                            const visibleBEnd = Math.min(visibleShiftEnd, bEndMin);
                            const breakDurationMins = visibleBEnd - visibleBStart;

                            // Calculate position relative to the parent shift bar
                            const shiftDurationMins = visibleShiftEnd - visibleShiftStart;
                            const breakLeftInShiftPct = ((visibleBStart - visibleShiftStart) / shiftDurationMins) * 100;
                            const breakWidthInShiftPct = (breakDurationMins / shiftDurationMins) * 100;

                            const isLunch = b.break_type === 'lunch';

                            return (
                              <div
                                key={b.id}
                                style={{
                                  left: `${breakLeftInShiftPct}%`,
                                  width: `${breakWidthInShiftPct}%`
                                }}
                                className={cn(
                                  "absolute top-0.5 bottom-0.5 rounded-lg border flex items-center justify-center px-1 transition-all z-5 cursor-pointer shadow-xs hover:brightness-105",
                                  isLunch 
                                    ? "bg-amber-400 border-amber-500 text-amber-950" 
                                    : "bg-violet-400 border-violet-500 text-violet-950"
                                )}
                                title={`${b.break_title} (${b.start_time} - ${b.end_time}, ${b.duration_minutes}m)`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Remove break "${b.break_title}" (${b.start_time} - ${b.end_time})?`)) {
                                    handleDeleteBreak(b.id);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-1 text-[9px] font-black truncate">
                                  {isLunch ? (
                                    <Utensils className="w-2.5 h-2.5 shrink-0" />
                                  ) : (
                                    <Coffee className="w-2.5 h-2.5 shrink-0" />
                                  )}
                                  <span className="truncate hidden sm:inline">{b.break_title}</span>
                                  <span className="text-[8px] font-mono opacity-80">({b.duration_minutes}m)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="w-full text-center text-slate-300 dark:text-slate-600 text-xs italic font-medium">
                          No active shift assigned within this window
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}

              {rosterRows.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold">
                  No staff match the selected filters or department criteria.
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Modal: Schedule Break Slot */}
      {showAddBreakModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Schedule Break Slot
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Staggered meal or coffee/prayer interval
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBreakModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                      {selectedEmpIds.length} of {employees.length} selected
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const visibleIds = filteredModalEmployees.map(e => String(e.id));
                      const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedEmpIds.includes(id));
                      if (allVisibleSelected) {
                        setSelectedEmpIds(prev => prev.filter(id => !visibleIds.includes(id)));
                      } else {
                        setSelectedEmpIds(prev => Array.from(new Set([...prev, ...visibleIds])));
                      }
                    }}
                    className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                  >
                    {filteredModalEmployees.length > 0 && filteredModalEmployees.every(e => selectedEmpIds.includes(String(e.id)))
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                {/* Quick Search inside modal */}
                {employees.length > 4 && (
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
                        className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Checkbox List */}
                <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-1">
                  {filteredModalEmployees.map(emp => {
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

                  {filteredModalEmployees.length === 0 && (
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
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700"
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
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700"
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
                  onClick={() => setShowAddBreakModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateBreak}
                  disabled={selectedEmpIds.length === 0}
                  className={cn(
                    "px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5",
                    selectedEmpIds.length === 0 && "opacity-50 cursor-not-allowed hover:bg-violet-600"
                  )}
                >
                  Confirm & Sync Slot{selectedEmpIds.length > 1 ? ` (${selectedEmpIds.length})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign Shift Schedule */}
      {showAssignShiftModal && (
        <AssignShiftScheduleModal
          isOpen={showAssignShiftModal}
          onClose={() => setShowAssignShiftModal(false)}
          employees={employees}
          shifts={shifts}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

    </div>
  );
};

export default IntradayTimeline;
