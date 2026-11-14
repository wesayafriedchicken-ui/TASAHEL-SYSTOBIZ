import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Calendar,
  Palmtree,
  CalendarCheck,
  Coffee,
  Check,
  Plus,
  Building2,
  User,
  Briefcase,
  AlertCircle,
  Tag,
  ChevronDown,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Employee, Shift } from '../../types';
import { CompanyHoliday } from './CompanyHolidays';

export interface MatrixCellActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  dayInfo: {
    dayIdx: number;
    nameEn: string;
    dateStr: string;
    displayDate: string;
    isToday: boolean;
  } | null;
  shifts: Shift[];
  companyHolidays: CompanyHoliday[];
  onSaveShift: (data: {
    employeeId: number;
    shiftId: number;
    dayIdx: number;
    dateStr: string;
    scope: 'date_only' | 'week' | 'recurring';
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
  }) => Promise<void | boolean>;
  onSaveHoliday: (data: {
    employeeId: number;
    holidayName: string;
    holidayType: 'National' | 'Religious' | 'Company' | 'Observance';
    isPaid: boolean;
    dateStr: string;
    scope: 'all' | 'department' | 'employee_only';
    color: string;
  }) => Promise<void | boolean>;
  onSaveLeave: (data: {
    employeeId: number;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'Approved' | 'Pending';
  }) => Promise<void | boolean>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  matrixWeekRange: { startDate: string; endDate: string };
}

const PALETTE_OPTIONS = [
  { label: 'Emerald', value: '#059669', bg: 'bg-emerald-600' },
  { label: 'Indigo', value: '#6366f1', bg: 'bg-indigo-600' },
  { label: 'Rose', value: '#e11d48', bg: 'bg-rose-600' },
  { label: 'Amber', value: '#d97706', bg: 'bg-amber-600' },
  { label: 'Sky', value: '#0284c7', bg: 'bg-sky-600' },
  { label: 'Violet', value: '#7c3aed', bg: 'bg-violet-600' },
  { label: 'Teal', value: '#0d9488', bg: 'bg-teal-600' }
];

export const MatrixCellActionModal: React.FC<MatrixCellActionModalProps> = ({
  isOpen,
  onClose,
  employee,
  dayInfo,
  shifts,
  companyHolidays,
  onSaveShift,
  onSaveHoliday,
  onSaveLeave,
  showToast,
  matrixWeekRange
}) => {
  const [activeTab, setActiveTab] = useState<'shift' | 'holiday' | 'leave'>('shift');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Shift Form State ---
  const [selectedShiftId, setSelectedShiftId] = useState<number | ''>('');
  const [shiftScope, setShiftScope] = useState<'date_only' | 'week' | 'recurring'>('date_only');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');

  // --- Holiday Form State ---
  const [holidayMode, setHolidayMode] = useState<'existing' | 'new'>('existing');
  const [selectedExistingHolidayId, setSelectedExistingHolidayId] = useState<string>('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayType, setNewHolidayType] = useState<'National' | 'Religious' | 'Company' | 'Observance'>('Company');
  const [newHolidayPaid, setNewHolidayPaid] = useState(true);
  const [holidayScope, setHolidayScope] = useState<'all' | 'department' | 'employee_only'>('all');
  const [newHolidayColor, setNewHolidayColor] = useState('#059669');

  // --- Leave Form State ---
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Reset & Prefill whenever opened
  useEffect(() => {
    if (isOpen && dayInfo) {
      setIsSubmitting(false);
      // Prefill shift
      if (shifts.length > 0) {
        setSelectedShiftId(shifts[0].id);
        setCustomStartTime(shifts[0].start_time?.slice(0, 5) || '09:00');
        setCustomEndTime(shifts[0].end_time?.slice(0, 5) || '17:00');
      } else {
        setSelectedShiftId('');
        setCustomStartTime('09:00');
        setCustomEndTime('17:00');
      }
      setShiftScope('date_only');

      // Prefill holiday
      if (companyHolidays.length > 0) {
        // Find if any holiday matches this date
        const match = companyHolidays.find(h => {
          const s = h.startDate;
          const e = h.endDate || h.startDate;
          return dayInfo.dateStr >= s && dayInfo.dateStr <= e;
        });
        if (match) {
          setSelectedExistingHolidayId(match.id);
          setHolidayMode('existing');
        } else {
          setSelectedExistingHolidayId(companyHolidays[0].id);
          setHolidayMode('existing');
        }
      } else {
        setHolidayMode('new');
      }
      setNewHolidayName('');
      setNewHolidayType('Company');
      setNewHolidayPaid(true);
      setHolidayScope('all');
      setNewHolidayColor('#059669');

      // Prefill leave
      setLeaveType('Annual Leave');
      setLeaveStartDate(dayInfo.dateStr);
      setLeaveEndDate(dayInfo.dateStr);
      setLeaveReason('');
    }
  }, [isOpen, dayInfo, shifts, companyHolidays]);

  // When shift selection changes, prefill times
  const handleShiftSelect = (id: number) => {
    setSelectedShiftId(id);
    const found = shifts.find(s => s.id === id);
    if (found) {
      if (found.start_time) setCustomStartTime(found.start_time.slice(0, 5));
      if (found.end_time) setCustomEndTime(found.end_time.slice(0, 5));
    }
  };

  if (!isOpen || !employee || !dayInfo) return null;

  const currentSelectedShift = shifts.find(s => s.id === selectedShiftId);
  const selectedExistingHoliday = companyHolidays.find(h => h.id === selectedExistingHolidayId);

  // Submit Shift
  const handleSubmitShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId) {
      showToast('Please select a shift', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSaveShift({
        employeeId: employee.id,
        shiftId: Number(selectedShiftId),
        dayIdx: dayInfo.dayIdx,
        dateStr: dayInfo.dateStr,
        scope: shiftScope,
        startDate: shiftScope === 'date_only' ? dayInfo.dateStr : matrixWeekRange.startDate,
        endDate: shiftScope === 'date_only' ? dayInfo.dateStr : matrixWeekRange.endDate,
        startTime: customStartTime,
        endTime: customEndTime
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Holiday
  const handleSubmitHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    let name = '';
    let type: 'National' | 'Religious' | 'Company' | 'Observance' = 'Company';
    let isPaid = true;
    let color = '#059669';

    if (holidayMode === 'existing') {
      if (!selectedExistingHoliday) {
        showToast('Please select a company holiday', 'error');
        return;
      }
      name = selectedExistingHoliday.name;
      type = selectedExistingHoliday.type;
      isPaid = selectedExistingHoliday.isPaid;
      color = selectedExistingHoliday.color || '#059669';
    } else {
      if (!newHolidayName.trim()) {
        showToast('Please enter holiday name', 'error');
        return;
      }
      name = newHolidayName.trim();
      type = newHolidayType;
      isPaid = newHolidayPaid;
      color = newHolidayColor;
    }

    setIsSubmitting(true);
    try {
      await onSaveHoliday({
        employeeId: employee.id,
        holidayName: name,
        holidayType: type,
        isPaid,
        dateStr: dayInfo.dateStr,
        scope: holidayScope,
        color
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Leave / Time Off
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) {
      showToast('Please specify valid start and end dates', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSaveLeave({
        employeeId: employee.id,
        leaveType,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason.trim() || `Assigned via Rotation Matrix for ${dayInfo.displayDate}`,
        status: 'Approved'
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-white flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Schedule Assignment</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Choose an action to add for this empty rotation matrix slot.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee & Date Context Strip */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200 shadow-2xs overflow-hidden shrink-0">
              {employee.avatar_url ? (
                <img src={employee.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                employee.name?.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-extrabold text-slate-800 leading-tight">{employee.name}</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {employee.job_title || 'Staff'} {employee.department_name ? `• ${employee.department_name}` : ''}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200/80 rounded-xl font-bold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{dayInfo.nameEn}, {dayInfo.displayDate}</span>
            <span className="text-[10px] text-slate-400 font-mono">({dayInfo.dateStr})</span>
          </div>
        </div>

        {/* 3-Way Tabs Selector */}
        <div className="p-5 sm:p-6 pb-2">
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60">
            {/* Tab 1: Shift */}
            <button
              type="button"
              onClick={() => setActiveTab('shift')}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs",
                activeTab === 'shift'
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <Clock className={cn("w-4 h-4", activeTab === 'shift' ? "text-indigo-600" : "text-slate-400")} />
              <span>Shift</span>
            </button>

            {/* Tab 2: Company Holiday */}
            <button
              type="button"
              onClick={() => setActiveTab('holiday')}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs",
                activeTab === 'holiday'
                  ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <Palmtree className={cn("w-4 h-4", activeTab === 'holiday' ? "text-emerald-600" : "text-slate-400")} />
              <span>Holiday</span>
            </button>

            {/* Tab 3: Time Off / Leave */}
            <button
              type="button"
              onClick={() => setActiveTab('leave')}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs",
                activeTab === 'leave'
                  ? "bg-white text-amber-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <Coffee className={cn("w-4 h-4", activeTab === 'leave' ? "text-amber-600" : "text-slate-400")} />
              <span>Time Off</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-5 sm:px-6 pb-6">
          {/* TAB 1: ASSIGN SHIFT */}
          {activeTab === 'shift' && (
            <form onSubmit={handleSubmitShift} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Shift Architecture
                </label>
                {shifts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {shifts.map(shift => {
                      const isSelected = selectedShiftId === shift.id;
                      return (
                        <div
                          key={shift.id}
                          onClick={() => handleShiftSelect(shift.id)}
                          className={cn(
                            "p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left",
                            isSelected
                              ? "bg-indigo-50/50 border-indigo-500 shadow-xs ring-1 ring-indigo-500"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-extrabold text-xs text-slate-800 truncate">
                              {shift.name}
                            </span>
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: shift.color || '#4f46e5' }} 
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>
                              {shift.type === 'Flexible' ? `${shift.required_hours || 8}h Flexible` : `${shift.start_time?.slice(0, 5)} - ${shift.end_time?.slice(0, 5)}`}
                            </span>
                            <span className="font-semibold text-indigo-600">{shift.type}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                    No shifts created yet. Please create a shift architecture first.
                  </div>
                )}
              </div>

              {/* Scope Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Schedule Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setShiftScope('date_only')}
                    className={cn(
                      "p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer",
                      shiftScope === 'date_only'
                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <p className="font-extrabold">This Day Only</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">{dayInfo.displayDate}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftScope('week')}
                    className={cn(
                      "p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer",
                      shiftScope === 'week'
                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <p className="font-extrabold">Current Week</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">Week View Period</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftScope('recurring')}
                    className={cn(
                      "p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer",
                      shiftScope === 'recurring'
                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <p className="font-extrabold">Every {dayInfo.nameEn}</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">Weekly Recurring</p>
                  </button>
                </div>
              </div>

              {/* Working Hours Info */}
              {currentSelectedShift && currentSelectedShift.type !== 'Flexible' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={customStartTime}
                      onChange={e => setCustomStartTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={customEndTime}
                      onChange={e => setCustomEndTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedShiftId}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Assigning...' : 'Assign Shift'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: COMPANY HOLIDAY */}
          {activeTab === 'holiday' && (
            <form onSubmit={handleSubmitHoliday} className="space-y-4 pt-1">
              {/* Existing vs New Toggle */}
              <div className="flex items-center gap-2 p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl text-xs font-bold w-fit">
                <button
                  type="button"
                  onClick={() => setHolidayMode('existing')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                    holidayMode === 'existing'
                      ? "bg-white text-emerald-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-800"
                  )}
                >
                  Pick Company Holiday
                </button>
                <button
                  type="button"
                  onClick={() => setHolidayMode('new')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                    holidayMode === 'new'
                      ? "bg-white text-emerald-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-800"
                  )}
                >
                  Create New for this Date
                </button>
              </div>

              {holidayMode === 'existing' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Select Official Company Holiday
                  </label>
                  {companyHolidays.length > 0 ? (
                    <div className="relative">
                      <select
                        value={selectedExistingHolidayId}
                        onChange={e => setSelectedExistingHolidayId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs appearance-none cursor-pointer"
                      >
                        {companyHolidays.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.type} • {h.startDate})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No company holidays found.</p>
                  )}

                  {selectedExistingHoliday && (
                    <div className="mt-3 p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                          <Palmtree className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{selectedExistingHoliday.name}</span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {selectedExistingHoliday.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800/80 font-medium">
                        {selectedExistingHoliday.description || 'Statutory company holiday'}
                      </p>
                      <div className="text-[10px] text-emerald-700 font-semibold pt-1 flex items-center gap-3">
                        <span>📅 Period: {selectedExistingHoliday.startDate} {selectedExistingHoliday.endDate && selectedExistingHoliday.endDate !== selectedExistingHoliday.startDate ? `to ${selectedExistingHoliday.endDate}` : ''}</span>
                        <span>💰 {selectedExistingHoliday.isPaid ? 'Fully Paid' : 'Unpaid'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Holiday Name
                    </label>
                    <input
                      type="text"
                      value={newHolidayName}
                      onChange={e => setNewHolidayName(e.target.value)}
                      placeholder="e.g. Corporate Foundation Day or Official Holiday"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Holiday Type
                      </label>
                      <select
                        value={newHolidayType}
                        onChange={e => setNewHolidayType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="National">National Holiday</option>
                        <option value="Religious">Religious Observance</option>
                        <option value="Company">Company Holiday</option>
                        <option value="Observance">Corporate Observance</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Color Theme
                      </label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {PALETTE_OPTIONS.map(c => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setNewHolidayColor(c.value)}
                            className={cn(
                              "w-6 h-6 rounded-full transition-transform cursor-pointer border border-white shadow-2xs flex items-center justify-center",
                              c.bg,
                              newHolidayColor === c.value ? "scale-115 ring-2 ring-emerald-500" : "opacity-80 hover:opacity-100"
                            )}
                          >
                            {newHolidayColor === c.value && <Check className="w-3 h-3 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={newHolidayPaid}
                      onChange={e => setNewHolidayPaid(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span>Paid Company Holiday (Employees receive regular compensation)</span>
                  </label>
                </div>
              )}

              {/* Holiday Application Scope */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Application Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setHolidayScope('all')}
                    className={cn(
                      "p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer",
                      holidayScope === 'all'
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <p className="font-extrabold">All Company</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">All staff matrix</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHolidayScope('department')}
                    className={cn(
                      "p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer",
                      holidayScope === 'department'
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <p className="font-extrabold">Department</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">{employee.department_name || 'Department'}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHolidayScope('employee_only')}
                    className={cn(
                      "p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer",
                      holidayScope === 'employee_only'
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <p className="font-extrabold">{employee.name.split(' ')[0]} Only</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">Individual slot</p>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Apply Company Holiday'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: TIME OFF / LEAVE REQUEST */}
          {activeTab === 'leave' && (
            <form onSubmit={handleSubmitLeave} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Leave / Time Off Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'Annual Leave',
                    'Sick Leave',
                    'Casual Leave',
                    'Compensation Off',
                    'Unpaid Leave',
                    'Emergency Leave'
                  ].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLeaveType(t)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer",
                        leaveType === t
                          ? "bg-amber-50 border-amber-400 text-amber-950 shadow-2xs ring-1 ring-amber-400"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="truncate block">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={e => setLeaveStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={e => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  placeholder="e.g. Vacation request, Personal appointment, Doctor advice..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-medium">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  This time off will be approved automatically and directly reflect on the Weekly Rotation Matrix.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Recording...' : 'Submit Time Off'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatrixCellActionModal;
