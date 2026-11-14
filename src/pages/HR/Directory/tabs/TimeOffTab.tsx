import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Calendar, Sun, ShieldCheck, Briefcase, Settings, ChevronDown, 
  ChevronRight, Activity, PlusCircle, Plus, Clock, Coffee, Edit2, 
  Trash2, Check, X, Paperclip, Loader2 
} from 'lucide-react';
import { EmployeeProfileOutletContext } from './types';
import { EmployeeShiftSchedule } from '../../../../components/HR/EmployeeShiftSchedule';
import { cn } from '../../../../lib/utils';

export const TimeOffTab: React.FC = () => {
  const { 
    employee, 
    currentUser, 
    isViewOnly, 
    onRefreshEmployee, 
    showCustomToast 
  } = useOutletContext<EmployeeProfileOutletContext>();

  const [loading, setLoading] = useState<boolean>(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [timeOffHistoryMode, setTimeOffHistoryMode] = useState<'balance' | 'leave_requests' | 'attendance'>('balance');

  // Break schedules
  const [breakSchedules, setBreakSchedules] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hr_break_schedules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'brk-101',
        employee_id: employee?.id || 1,
        employee_name: employee?.name || 'Employee',
        shift_name: 'Morning Shift (09:00 - 17:00)',
        break_title: 'Lunch Break',
        start_time: '12:00',
        end_time: '12:45',
        duration_minutes: 45,
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        notes: 'Main company lunch break slot'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('hr_break_schedules', JSON.stringify(breakSchedules));
    } catch (e) {}
  }, [breakSchedules]);

  // Modals state
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [showAdjustLeaveModal, setShowAdjustLeaveModal] = useState<boolean>(false);
  const [showBreakModal, setShowBreakModal] = useState<boolean>(false);

  // Form states
  const [leaveFormData, setLeaveFormData] = useState({
    user_id: employee?.id || employee?.user_id || 1,
    type: 'Annual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
    attachment_url: '',
    attachment_name: ''
  });

  const [leaveBalanceForm, setLeaveBalanceForm] = useState({
    vacation_balance: employee?.vacation_balance ?? 21,
    sick_leave_balance: employee?.sick_leave_balance ?? 14,
    bereavement_used: employee?.bereavement_used ?? 0
  });

  const [editingBreak, setEditingBreak] = useState<any>({
    id: '',
    employee_id: employee?.id || employee?.user_id || 1,
    employee_name: employee?.name || '',
    shift_name: 'Morning Shift (09:00 - 17:00)',
    break_title: 'Lunch Break',
    start_time: '12:00',
    end_time: '12:45',
    duration_minutes: 45,
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    notes: ''
  });

  const leaveFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all time-off related datasets
  const fetchTimeOffData = async () => {
    if (!employee?.id) return;
    setLoading(true);
    try {
      const [shiftsRes, assignmentsRes, leavesRes, attRes] = await Promise.all([
        fetch('/api/hr/shifts').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/hr/shift-assignments').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/hr/leave').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/hr/attendance').then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      if (Array.isArray(shiftsRes)) setShifts(shiftsRes);
      if (Array.isArray(assignmentsRes)) setShiftAssignments(assignmentsRes);
      if (Array.isArray(leavesRes)) setLeaves(leavesRes);
      if (Array.isArray(attRes)) setAttendance(attRes);
    } catch (err) {
      console.warn('Error fetching time-off data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeOffData();
  }, [employee?.id]);

  useEffect(() => {
    if (employee) {
      setLeaveBalanceForm({
        vacation_balance: employee.vacation_balance ?? 21,
        sick_leave_balance: employee.sick_leave_balance ?? 14,
        bereavement_used: employee.bereavement_used ?? 0
      });
    }
  }, [employee]);

  const handleOpenAdjustLeaveModal = () => {
    setLeaveBalanceForm({
      vacation_balance: employee?.vacation_balance ?? 21,
      sick_leave_balance: employee?.sick_leave_balance ?? 14,
      bereavement_used: employee?.bereavement_used ?? 0
    });
    setShowAdjustLeaveModal(true);
  };

  const handleSaveLeaveBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee?.id) return;
    try {
      const res = await fetch(`/api/hr/employees/${employee.id}/leave-balances`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify(leaveBalanceForm)
      });

      if (res.ok) {
        setShowAdjustLeaveModal(false);
        await onRefreshEmployee();
        await fetchTimeOffData();
        showCustomToast('Leave balances updated successfully!', 'success');
      } else {
        // Fallback update on employee endpoint directly
        const fallbackRes = await fetch(`/api/hr/employees/${employee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leaveBalanceForm)
        });
        if (fallbackRes.ok) {
          setShowAdjustLeaveModal(false);
          await onRefreshEmployee();
          showCustomToast('Leave balances updated successfully!', 'success');
        } else {
          showCustomToast('Could not save leave balances', 'error');
        }
      }
    } catch (err) {
      console.error('Failed to save leave balances:', err);
      showCustomToast('Error saving leave balances', 'error');
    }
  };

  const updateLeaveStatus = async (id: number | string, status: string) => {
    try {
      const res = await fetch(`/api/hr/leave/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify({ 
          status, 
          approver_id: currentUser?.id,
          comments: `Leave ${(status || '').toLowerCase()} by HR/Manager.`
        })
      });
      if (res.ok) {
        showCustomToast(`Leave request ${status.toLowerCase()} successfully`, 'success');
        fetchTimeOffData();
      }
    } catch (err) {
      console.error('Failed to update leave request:', err);
      showCustomToast('Failed to update leave request', 'error');
    }
  };

  const handleSubmitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leaveFormData,
          user_id: employee?.id || employee?.user_id || 1,
          status: 'Pending'
        })
      });

      if (res.ok) {
        setShowLeaveModal(false);
        setLeaveFormData({
          user_id: employee?.id || employee?.user_id || 1,
          type: 'Annual',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          reason: '',
          attachment_url: '',
          attachment_name: ''
        });
        showCustomToast('Leave request submitted successfully!', 'success');
        fetchTimeOffData();
      } else {
        showCustomToast('Failed to submit leave request', 'error');
      }
    } catch (err) {
      console.error('Error submitting leave:', err);
      showCustomToast('Error submitting leave', 'error');
    }
  };

  const formatExactTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    try {
      if (timeStr.includes('T') || timeStr.includes('-')) {
        return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return timeStr.slice(0, 5);
    } catch {
      return timeStr;
    }
  };

  const emp = employee || ({} as any);
  const empLeaves = leaves.filter(l => Number(l.user_id) === Number(emp.id) || Number(l.user_id) === Number(emp.user_id));
  const empBreaks = breakSchedules.filter(b => Number(b.employee_id) === Number(emp.id) || Number(b.employee_id) === Number(emp.user_id));

  return (
    <div className="space-y-6">
      {/* Time Off Section Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1b5e20]/10 text-[#1b5e20] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Time Off</h3>
            <p className="text-xs text-slate-400 font-medium">Leave balances and accrual schedules</p>
          </div>
        </div>
        {!isViewOnly && (
          <button 
            type="button"
            onClick={handleOpenAdjustLeaveModal} 
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 flex items-center gap-1 transition-colors cursor-pointer"
            title="Adjust Leave Balances (Admin)"
          >
            <Settings className="w-4 h-4 text-[#1b5e20]" />
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 3 cards row */}
      <div className="relative flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Card 1: Holiday */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3 hover:border-[#1b5e20]/30 transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Holiday</span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{emp.vacation_balance ?? 0} Days</p>
              <p className="text-xs font-bold text-slate-800 mt-1">Annual Leave/Holiday Available</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">(Available Balance)</p>
              <p className="text-[10px] font-black text-[#1b5e20] uppercase tracking-wider mt-3 bg-[#1b5e20]/5 px-2.5 py-1 rounded-full w-max">Vacation Full-Time</p>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 justify-between">
              <button 
                type="button"
                onClick={() => { 
                  setLeaveFormData({ user_id: emp.id, type: 'Annual', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], reason: '', attachment_url: '', attachment_name: '' }); 
                  setShowLeaveModal(true); 
                }} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="Request Holiday"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => { 
                  const el = document.getElementById('time-off-history'); 
                  if (el) { el.scrollIntoView({ behavior: 'smooth' }); } 
                  else { showCustomToast('Accrual history shown below', 'info'); } 
                }} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="View History"
              >
                <Activity className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => { 
                  setLeaveFormData({ user_id: emp.id, type: 'Annual', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], reason: '', attachment_url: '', attachment_name: '' }); 
                  setShowLeaveModal(true); 
                }} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="Quick Request"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={handleOpenAdjustLeaveModal} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="Policy Settings (Admin)"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Medical */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3 hover:border-[#1b5e20]/30 transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical</span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{emp.sick_leave_balance ?? 0} Days</p>
              <p className="text-xs font-bold text-slate-800 mt-1">Sick Leave Available</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">(Medical Policy)</p>
              <p className="text-[10px] font-black text-[#1b5e20] uppercase tracking-wider mt-3 bg-[#1b5e20]/5 px-2.5 py-1 rounded-full w-max">Sick Leave Policy</p>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 justify-between">
              <button 
                type="button"
                onClick={() => { 
                  setLeaveFormData({ user_id: emp.id, type: 'Sick', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], reason: '', attachment_url: '', attachment_name: '' }); 
                  setShowLeaveModal(true); 
                }} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="Request Sick Leave"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => { 
                  const el = document.getElementById('time-off-history'); 
                  if (el) { el.scrollIntoView({ behavior: 'smooth' }); } 
                  else { showCustomToast('Accrual history shown below', 'info'); } 
                }} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="View History"
              >
                <Activity className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => { 
                  setLeaveFormData({ user_id: emp.id, type: 'Sick', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], reason: '', attachment_url: '', attachment_name: '' }); 
                  setShowLeaveModal(true); 
                }} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="Quick Request"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={handleOpenAdjustLeaveModal} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="Policy Settings (Admin)"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3: Special */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3 hover:border-[#1b5e20]/30 transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Special</span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{emp.bereavement_used ?? 0} Days</p>
              <p className="text-xs font-bold text-slate-800 mt-1">Bereavement Used (YTD)</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">(Special Leave Policy)</p>
              <p className="text-[10px] font-black text-[#1b5e20] uppercase tracking-wider mt-3 bg-[#1b5e20]/5 px-2.5 py-1 rounded-full w-max">Flexible Policy</p>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 justify-between">
              <button 
                type="button"
                onClick={() => { 
                  setLeaveFormData({ user_id: emp.id, type: 'Unpaid', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], reason: '', attachment_url: '', attachment_name: '' }); 
                  setShowLeaveModal(true); 
                }} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="Request Unpaid Leave"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => { 
                  const el = document.getElementById('time-off-history'); 
                  if (el) { el.scrollIntoView({ behavior: 'smooth' }); } 
                  else { showCustomToast('Accrual history shown below', 'info'); } 
                }} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="View History"
              >
                <Activity className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => { 
                  setLeaveFormData({ user_id: emp.id, type: 'Unpaid', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], reason: '', attachment_url: '', attachment_name: '' }); 
                  setShowLeaveModal(true); 
                }} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="Quick Request"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={handleOpenAdjustLeaveModal} 
                className="p-1.5 text-slate-400 hover:text-[#1b5e20] hover:bg-slate-50 rounded-lg cursor-pointer" 
                title="Policy Settings (Admin)"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <button 
          type="button"
          onClick={() => showCustomToast('Additional leave categories are subject to management approvals.', 'info')} 
          className="absolute -right-4 p-2 bg-white rounded-full border border-slate-200 shadow-md text-slate-500 hover:text-[#1b5e20] cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* SHIFT SCHEDULE CALENDAR */}
      <EmployeeShiftSchedule 
        employee={emp} 
        shiftAssignments={shiftAssignments} 
        shifts={shifts} 
        onRefresh={fetchTimeOffData}
      />

      {/* BREAK SCHEDULE SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                Break Schedule & Slot Assignments
              </h3>
              <p className="text-xs text-slate-500 font-medium">Configured daily rest, lunch, and prayer breaks for {emp.name}</p>
            </div>
          </div>
          {!isViewOnly && (
            <button
              type="button"
              onClick={() => {
                setEditingBreak({
                  id: '',
                  employee_id: emp.id || emp.user_id,
                  employee_name: emp.name,
                  shift_name: 'Morning Shift (09:00 - 17:00)',
                  break_title: 'Lunch Break',
                  start_time: '12:00',
                  end_time: '12:45',
                  duration_minutes: 45,
                  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                  notes: ''
                });
                setShowBreakModal(true);
              }}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" /> Add Break Slot
            </button>
          )}
        </div>

        {empBreaks.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl">
            <Coffee className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500">No break slots configured for {emp.name} yet.</p>
            {!isViewOnly && (
              <button
                type="button"
                onClick={() => {
                  setEditingBreak({
                    id: '',
                    employee_id: emp.id || emp.user_id,
                    employee_name: emp.name,
                    shift_name: 'Morning Shift (09:00 - 17:00)',
                    break_title: 'Lunch Break',
                    start_time: '12:00',
                    end_time: '12:45',
                    duration_minutes: 45,
                    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                    notes: ''
                  });
                  setShowBreakModal(true);
                }}
                className="mt-3 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Configure First Break Slot
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {empBreaks.map((b: any) => (
              <div key={b.id} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                      {b.break_title}
                    </span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {b.start_time} - {b.end_time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Duration: <span className="font-bold text-slate-800">{b.duration_minutes} Mins</span>
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(b.days || []).map((d: string) => (
                      <span key={d} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-semibold text-slate-600">
                        {d.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                  {b.notes && (
                    <p className="text-[10px] text-slate-400 italic mt-1">{b.notes}</p>
                  )}
                </div>
                {!isViewOnly && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBreak({ ...b });
                        setShowBreakModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Break Slot"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this break slot?')) {
                          setBreakSchedules(prev => prev.filter(item => item.id !== b.id));
                          showCustomToast('Break slot deleted', 'info');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Delete Break Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Time Off */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#1b5e20]" /> Upcoming Time Off & Leave Requests
          </h3>
          {!isViewOnly && (
            <button
              type="button"
              onClick={() => {
                setLeaveFormData({
                  user_id: emp.id || emp.user_id || 1,
                  type: 'Annual',
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: new Date().toISOString().split('T')[0],
                  reason: '',
                  attachment_url: '',
                  attachment_name: ''
                });
                setShowLeaveModal(true);
              }}
              className="px-3 py-1.5 bg-[#1b5e20] text-white rounded-xl text-xs font-bold hover:bg-[#1b5e20]/90 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Request Leave
            </button>
          )}
        </div>

        <div className="space-y-3">
          {empLeaves.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No leave requests logged for {emp.name} yet.</p>
            </div>
          ) : (
            empLeaves.map((item: any) => {
              const startDateStr = item.start_date ? new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
              const endDateStr = item.end_date ? new Date(item.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
              const dateRangeText = startDateStr === endDateStr ? startDateStr : `${startDateStr} – ${endDateStr}`;
              
              let calcDays = 1;
              if (item.start_date && item.end_date) {
                const s = new Date(item.start_date).getTime();
                const e = new Date(item.end_date).getTime();
                calcDays = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
              }

              const currentStatus = item.status || 'Pending';

              return (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-[#1b5e20]/20 transition-all hover:bg-white gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1b5e20]/10 text-[#1b5e20] flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{dateRangeText}</p>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1",
                          (currentStatus || '').toLowerCase() === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          (currentStatus || '').toLowerCase() === 'rejected' ? "bg-rose-50 text-rose-700 border-rose-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {(currentStatus || '').toLowerCase() === 'approved' && <Check className="w-3 h-3 text-emerald-600" />}
                          {(currentStatus || '').toLowerCase() === 'rejected' && <X className="w-3 h-3 text-rose-600" />}
                          {(currentStatus || '').toLowerCase() === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                          <span>Decision: {currentStatus}</span>
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#1b5e20]">
                        {calcDays} {calcDays === 1 ? 'day' : 'days'} of {item.type} Leave
                      </p>
                      {item.reason && <p className="text-xs text-slate-500 italic font-medium">"{item.reason}"</p>}
                      {item.approver_name && (
                        <p className="text-[10px] text-slate-400 font-bold">Decision by: {item.approver_name}</p>
                      )}
                    </div>
                  </div>

                  {!isViewOnly && (
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button 
                        type="button"
                        onClick={() => updateLeaveStatus(item.id, 'Approved')} 
                        className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-xl text-emerald-700 transition-colors cursor-pointer" 
                        title="Approve Decision"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => updateLeaveStatus(item.id, 'Rejected')} 
                        className="p-2 bg-rose-100 hover:bg-rose-200 rounded-xl text-rose-700 transition-colors cursor-pointer" 
                        title="Reject Decision"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm('Are you sure you want to cancel this leave request?')) {
                            try {
                              const res = await fetch(`/api/hr/leave/${item.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                fetchTimeOffData();
                                showCustomToast('Leave request deleted', 'info');
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }
                        }}
                        className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* History */}
      <div id="time-off-history" className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#1b5e20]" /> History
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {timeOffHistoryMode === 'balance' && (
              <>
                <select className="text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-600 outline-none">
                  <option>Annual Leave/Holiday</option>
                  <option>Sick Leave</option>
                  <option>Unpaid Leave</option>
                </select>
                <select className="text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-600 outline-none">
                  <option>All</option>
                </select>
              </>
            )}

            {/* Mode Switcher Dropdown */}
            <select 
              value={timeOffHistoryMode}
              onChange={(e) => setTimeOffHistoryMode(e.target.value as any)}
              className="text-xs p-2.5 rounded-xl border border-slate-300 bg-emerald-50/50 font-black text-[#1b5e20] hover:bg-emerald-50 outline-none cursor-pointer shadow-xs transition-all"
            >
              <option value="balance">Balance History</option>
              <option value="leave_requests">Leave Requests History</option>
              <option value="attendance">Attendance History</option>
            </select>
          </div>
        </div>

        {/* MODE 1: BALANCE HISTORY */}
        {timeOffHistoryMode === 'balance' && (() => {
          const initialAllocation = Number(emp.vacation_balance ?? 0);
          const hireDateStr = emp.contract_start_date ? new Date(emp.contract_start_date).toLocaleDateString() : (emp.joined_at ? new Date(emp.joined_at).toLocaleDateString() : '2025-01-01');

          const approvedLeaves = leaves
            .filter(l => (Number(l.user_id) === Number(emp.id) || Number(l.user_id) === Number(emp.user_id)) && l.status === 'Approved')
            .sort((a, b) => new Date(a.start_date || a.created_at || 0).getTime() - new Date(b.start_date || b.created_at || 0).getTime());

          let runningBalance = initialAllocation;

          const historyRows: Array<{ date: string; description: string; used: number; earned: number; balance: number }> = [
            {
              date: hireDateStr,
              description: 'Annual Leave Accrual (Initial Allocation)',
              used: 0,
              earned: initialAllocation,
              balance: initialAllocation
            }
          ];

          approvedLeaves.forEach(l => {
            let days = 1;
            if (l.start_date && l.end_date) {
              const s = new Date(l.start_date).getTime();
              const e = new Date(l.end_date).getTime();
              days = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
            }
            runningBalance -= days;
            historyRows.push({
              date: l.start_date ? new Date(l.start_date).toLocaleDateString() : new Date().toLocaleDateString(),
              description: `${l.type || 'Annual'} Leave Approved (${days} day${days > 1 ? 's' : ''})`,
              used: days,
              earned: 0,
              balance: runningBalance
            });
          });

          const displayRows = [...historyRows].reverse();

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pt-1 font-bold">Date</th>
                    <th className="pb-3 pt-1 font-bold">Description</th>
                    <th className="pb-3 pt-1 font-bold text-center">Used Days (-)</th>
                    <th className="pb-3 pt-1 font-bold text-center">Earned Days (+)</th>
                    <th className="pb-3 pt-1 font-bold text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-semibold text-slate-500">{row.date}</td>
                      <td className="py-3 font-bold text-slate-800">{row.description}</td>
                      <td className="py-3 text-center font-bold text-rose-600">{row.used ? `-${row.used}` : '—'}</td>
                      <td className="py-3 text-center font-bold text-emerald-600">{row.earned ? `+${row.earned}` : '—'}</td>
                      <td className="py-3 text-right font-black text-[#1b5e20]">{row.balance} Days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* MODE 2: LEAVE REQUESTS HISTORY */}
        {timeOffHistoryMode === 'leave_requests' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pt-1 font-bold">Date</th>
                  <th className="pb-3 pt-1 font-bold">Description</th>
                  <th className="pb-3 pt-1 font-bold">Submitted</th>
                  <th className="pb-3 pt-1 font-bold text-center">Status</th>
                  <th className="pb-3 pt-1 font-bold text-center">Used Days (-)</th>
                  <th className="pb-3 pt-1 font-bold text-center">Earned Days (+)</th>
                  <th className="pb-3 pt-1 font-bold text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {empLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold italic">
                      No leave requests history recorded for this employee.
                    </td>
                  </tr>
                ) : (
                  empLeaves
                    .sort((a, b) => new Date(b.start_date || b.created_at || 0).getTime() - new Date(a.start_date || a.created_at || 0).getTime())
                    .map((item: any) => {
                      const sDate = item.start_date ? new Date(item.start_date).toLocaleDateString('en-GB') : '';
                      const eDate = item.end_date ? new Date(item.end_date).toLocaleDateString('en-GB') : '';
                      const dateRangeText = sDate === eDate || !eDate ? sDate : `${sDate} – ${eDate}`;

                      let numDays = 1;
                      if (item.start_date && item.end_date) {
                        const s = new Date(item.start_date).getTime();
                        const e = new Date(item.end_date).getTime();
                        numDays = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
                      }

                      const submittedDate = item.created_at 
                        ? new Date(item.created_at).toLocaleDateString('en-GB') 
                        : (sDate || 'N/A');

                      const currentStatus = item.status || 'Pending';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 font-semibold text-slate-700">
                            <span className="font-bold text-slate-800">{dateRangeText}</span>
                            <span className="block text-[10px] font-mono text-indigo-600 font-bold">#LR-{item.id}</span>
                          </td>
                          <td className="py-3 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{item.type || 'Annual'} Leave</span>
                              {item.status === 'Approved' && (
                                item.with_deduction ? (
                                  <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-black rounded-md">
                                    Deducted {item.deduction_days || numDays}d ({item.deduction_type || 'Annual Balance'})
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black rounded-md">
                                    Approved (No Deduction)
                                  </span>
                                )
                              )}
                            </div>
                            {item.reason && <span className="block text-[11px] font-normal text-slate-500 italic mt-0.5">"{item.reason}"</span>}
                          </td>
                          <td className="py-3 text-slate-500 font-medium">{submittedDate}</td>
                          <td className="py-3 text-center">
                            <span className={cn(
                              "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              (currentStatus || '').toLowerCase() === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              (currentStatus || '').toLowerCase() === 'rejected' ? "bg-rose-50 text-rose-700 border-rose-200" :
                              "bg-amber-50 text-amber-700 border-amber-200"
                            )}>
                              {currentStatus}
                            </span>
                          </td>
                          <td className="py-3 text-center font-bold text-rose-600">
                            {item.status === 'Approved' && item.with_deduction ? `-${item.deduction_days || numDays}` : '0'}
                          </td>
                          <td className="py-3 text-center text-slate-400 font-medium">-</td>
                          <td className="py-3 text-right font-black text-[#1b5e20]">{emp.vacation_balance ?? 0} Days</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE 3: ATTENDANCE HISTORY */}
        {timeOffHistoryMode === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pt-1 font-bold">Date</th>
                  <th className="pb-3 pt-1 font-bold">Shift</th>
                  <th className="pb-3 pt-1 font-bold text-center">Status</th>
                  <th className="pb-3 pt-1 font-bold">Log Details</th>
                  <th className="pb-3 pt-1 font-bold text-right">Deduction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(() => {
                  const empAttendanceList = attendance.filter(a => Number(a.user_id) === Number(emp.id) || Number(a.user_id) === Number(emp.user_id))
                    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

                  if (empAttendanceList.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold italic">
                          No attendance history recorded for this employee.
                        </td>
                      </tr>
                    );
                  }

                  const dailySalaryRate = (emp.salary_base || 3000) / 30;

                  return empAttendanceList.map((att: any) => {
                    const dateStr = att.date ? new Date(att.date).toLocaleDateString('en-GB') : 'N/A';
                    const shiftName = att.shift_name || 'Standard Morning Shift (09:00 - 17:00)';
                    const statusVal = att.status || 'Present';

                    const clockInTime = att.clock_in ? formatExactTime(att.clock_in) : '-';
                    const clockOutTime = att.clock_out ? formatExactTime(att.clock_out) : '-';
                    const logDetails = att.clock_in || att.clock_out 
                      ? `Clock In: ${clockInTime} | Clock Out: ${clockOutTime}`
                      : 'No Punch Logged';

                    let deductionDisplay = '0.00 EGP';
                    let deductionColor = 'text-slate-400';

                    if (statusVal === 'Late') {
                      const dedVal = (dailySalaryRate * 0.25).toFixed(2);
                      deductionDisplay = `-${dedVal} EGP (25% Late)`;
                      deductionColor = 'text-amber-600 font-bold';
                    } else if (statusVal === 'Absent') {
                      const dedVal = (dailySalaryRate * 1.0).toFixed(2);
                      deductionDisplay = `-${dedVal} EGP (100% Absent)`;
                      deductionColor = 'text-rose-600 font-bold';
                    } else if (statusVal === 'Half-Day') {
                      const dedVal = (dailySalaryRate * 0.5).toFixed(2);
                      deductionDisplay = `-${dedVal} EGP (50% Half-Day)`;
                      deductionColor = 'text-purple-600 font-bold';
                    } else {
                      deductionDisplay = '0.00 EGP (No Deduction)';
                      deductionColor = 'text-emerald-600 font-medium';
                    }

                    return (
                      <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-semibold text-slate-700">{dateStr}</td>
                        <td className="py-3 font-bold text-slate-800">{shiftName}</td>
                        <td className="py-3 text-center">
                          <span className={cn(
                            "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                            statusVal === 'Present' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            statusVal === 'Late' ? "bg-amber-50 text-amber-700 border-amber-200" :
                            statusVal === 'Absent' ? "bg-rose-50 text-rose-700 border-rose-200" :
                            statusVal === 'Half-Day' ? "bg-purple-50 text-purple-700 border-purple-200" :
                            "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {statusVal}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 font-mono text-[11px]">{logDetails}</td>
                        <td className={cn("py-3 text-right font-mono", deductionColor)}>{deductionDisplay}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADJUST LEAVE BALANCES MODAL */}
      {showAdjustLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1b5e20]/10 text-[#1b5e20] flex items-center justify-center font-bold">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Adjust Leave Balances</h3>
                  <p className="text-xs font-semibold text-slate-400">Adjust Leave Balances - {emp.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustLeaveModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeaveBalances} className="space-y-4 text-left">
              <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-center gap-2 text-amber-800 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Admin Authorization Verified</span>
              </div>

              {/* Annual Leave / Holiday Available */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Annual Leave / Holiday Available (Days) 
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={leaveBalanceForm.vacation_balance}
                  onChange={e => setLeaveBalanceForm({ ...leaveBalanceForm, vacation_balance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/20 focus:border-[#1b5e20]"
                />
              </div>

              {/* Sick Leave Available */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Sick Leave Available (Days) 
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={leaveBalanceForm.sick_leave_balance}
                  onChange={e => setLeaveBalanceForm({ ...leaveBalanceForm, sick_leave_balance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/20 focus:border-[#1b5e20]"
                />
              </div>

              {/* Bereavement Used */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Bereavement Used YTD (Days) 
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={leaveBalanceForm.bereavement_used}
                  onChange={e => setLeaveBalanceForm({ ...leaveBalanceForm, bereavement_used: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/20 focus:border-[#1b5e20]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustLeaveModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1b5e20] text-white rounded-xl text-xs font-black hover:bg-[#1b5e20]/90 transition-colors shadow-lg shadow-[#1b5e20]/20 cursor-pointer"
                >
                  Save Balances 
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST LEAVE MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-[#1b5e20] rounded-2xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Request Leave</h3>
                  <p className="text-xs text-slate-500 font-medium">Submit time off for manager approval</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeaveRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Leave Type</label>
                <select
                  value={leaveFormData.type}
                  onChange={e => setLeaveFormData({ ...leaveFormData, type: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveFormData.start_date}
                    onChange={e => setLeaveFormData({ ...leaveFormData, start_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveFormData.end_date}
                    onChange={e => setLeaveFormData({ ...leaveFormData, end_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason / Comments</label>
                <textarea
                  rows={3}
                  placeholder="Explain the reason for your leave request..."
                  value={leaveFormData.reason}
                  onChange={e => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1b5e20] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-green-800 transition-colors shadow-sm cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT BREAK MODAL */}
      {showBreakModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Coffee className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingBreak.id ? 'Edit Break Slot' : 'Add New Break Slot'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Configure break slot timings and assign to employee shift</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBreakModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Break Title Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Break Title</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Lunch Break', 'Coffee / Tea Break', 'Prayer Break', 'Rest Break'].map(title => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setEditingBreak({ ...editingBreak, break_title: title })}
                      className={cn(
                        "px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                        editingBreak.break_title === title ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom break title..."
                  value={editingBreak.break_title || ''}
                  onChange={e => setEditingBreak({ ...editingBreak, break_title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>

              {/* Timing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={editingBreak.start_time || '12:00'}
                    onChange={e => setEditingBreak({ ...editingBreak, start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={editingBreak.end_time || '12:45'}
                    onChange={e => setEditingBreak({ ...editingBreak, end_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Days of Week Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Active Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    const isSelected = (editingBreak.days || []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const currentDays = editingBreak.days || [];
                          const updated = isSelected ? currentDays.filter((d: string) => d !== day) : [...currentDays, day];
                          setEditingBreak({ ...editingBreak, days: updated });
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer",
                          isSelected ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Optional break notes or special instructions..."
                  value={editingBreak.notes || ''}
                  onChange={e => setEditingBreak({ ...editingBreak, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBreakModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingBreak.break_title) {
                    showCustomToast('Please enter a break title', 'error');
                    return;
                  }
                  const [sH, sM] = (editingBreak.start_time || '12:00').split(':').map(Number);
                  const [eH, eM] = (editingBreak.end_time || '12:45').split(':').map(Number);
                  let durationMins = (eH * 60 + eM) - (sH * 60 + sM);
                  if (durationMins <= 0) durationMins += 24 * 60;

                  const newSlot = {
                    ...editingBreak,
                    id: editingBreak.id || `brk-${Date.now()}`,
                    employee_id: Number(emp.id || 1),
                    employee_name: emp.name || 'Employee',
                    duration_minutes: durationMins,
                    days: editingBreak.days?.length > 0 ? editingBreak.days : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
                  };

                  setBreakSchedules(prev => {
                    if (editingBreak.id) {
                      return prev.map(b => b.id === editingBreak.id ? newSlot : b);
                    }
                    return [...prev, newSlot];
                  });

                  setShowBreakModal(false);
                  showCustomToast('Break slot saved successfully!', 'success');
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Save Break Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeOffTab;
