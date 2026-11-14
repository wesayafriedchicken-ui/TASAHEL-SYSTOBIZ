import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Repeat, X, AlertCircle } from 'lucide-react';
import { Employee, Shift } from '../../../../types';

interface ShiftSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  employees: Employee[];
  shifts: Shift[];
  currentUser: any;
  onSuccess?: () => void;
  showCustomToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ShiftSwapModal: React.FC<ShiftSwapModalProps> = ({
  isOpen,
  onClose,
  employee,
  employees,
  shifts,
  currentUser,
  onSuccess,
  showCustomToast,
}) => {
  const [swapFormData, setSwapFormData] = useState({
    requester_id: employee?.user_id || employee?.id || currentUser?.id || 1,
    counterpart_id: 0,
    swap_date: new Date().toISOString().split('T')[0],
    requester_shift_id: 0,
    counterpart_shift_id: 0,
    reason: ''
  });
  const [shiftAssignments, setShiftAssignments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync requester_id
  useEffect(() => {
    if (employee) {
      setSwapFormData(prev => ({
        ...prev,
        requester_id: employee.user_id || employee.id || currentUser?.id || 1
      }));
    }
  }, [employee, currentUser]);

  // Fetch shift assignments for schedule auto-detection
  useEffect(() => {
    if (isOpen) {
      fetch('/api/hr/shift-assignments')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setShiftAssignments(data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeEmployees = employees.filter(e => e.status !== 'archived' && e.status !== 'deleted');
  const selectedRequester = activeEmployees.find(
    e => e.id === Number(swapFormData.requester_id) || e.user_id === Number(swapFormData.requester_id)
  ) || employee;

  // Strict Team Filtering: Only active employees from the same team or department as the requester
  const requesterTeam = selectedRequester?.team_name;
  const requesterDept = selectedRequester?.department_id;
  const teamColleagues = activeEmployees.filter(emp => {
    const empId = emp.id || emp.user_id;
    const reqId = selectedRequester?.id || selectedRequester?.user_id;
    if (empId === reqId) return false; // exclude self
    if (requesterTeam && emp.team_name) {
      return emp.team_name === requesterTeam;
    }
    return emp.department_id === requesterDept;
  });

  const selectedSwapDateObj = swapFormData.swap_date ? new Date(swapFormData.swap_date + 'T00:00:00') : new Date();
  const dayOfWeekForSwap = selectedSwapDateObj.getDay();

  const getEmployeeShiftForSwapDate = (empId: number, empUserId?: number) => {
    const swapDateStr = swapFormData.swap_date || new Date().toISOString().split('T')[0];
    const specific = shiftAssignments.filter(a =>
      (a.user_id === empId || (empUserId && a.user_id === empUserId)) &&
      a.day_of_week === dayOfWeekForSwap &&
      a.start_date && a.end_date &&
      swapDateStr >= a.start_date && swapDateStr <= a.end_date
    );
    const sa = specific.length > 0 ? specific[0] : shiftAssignments.find(a => 
      (a.user_id === empId || (empUserId && a.user_id === empUserId)) && 
      a.day_of_week === dayOfWeekForSwap &&
      (!a.start_date || a.recurrence === 'weekly')
    );
    if (!sa) return null;
    return shifts.find(s => s.id === sa.shift_id) || null;
  };

  const requesterAssignedShift = selectedRequester ? getEmployeeShiftForSwapDate(selectedRequester.id, selectedRequester.user_id) : null;
  const selectedCounterpart = teamColleagues.find(e => (e.id === Number(swapFormData.counterpart_id) || e.user_id === Number(swapFormData.counterpart_id)));
  const counterpartAssignedShift = selectedCounterpart ? getEmployeeShiftForSwapDate(selectedCounterpart.id, selectedCounterpart.user_id) : null;

  const handleCreateSwapRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapFormData.requester_id || !swapFormData.counterpart_id || !swapFormData.swap_date) {
      showCustomToast('Please fill in all required fields (Requester, Counterpart, and Swap Date).', 'error');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (swapFormData.swap_date < todayStr) {
      showCustomToast('Swap Date must be today or a future date. Past dates are not allowed.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/hr/shift-swaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify(swapFormData)
      });
      if (res.ok) {
        showCustomToast('Shift swap request submitted successfully', 'success');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const err = await res.json().catch(() => ({}));
        showCustomToast(err.error || 'Failed to submit shift swap request', 'error');
      }
    } catch (error) {
      console.error('Error creating swap request:', error);
      showCustomToast('An error occurred while submitting the request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200"
      >
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Repeat className="w-5 h-5 text-amber-300" />
              Request Shift Swap
            </h2>
            <p className="text-xs text-indigo-100 font-medium mt-1">
              Select a colleague from your team to exchange shift duties on a specific date.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleCreateSwapRequest} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Swap Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Date for Shift Swap *
            </label>
            <input 
              type="date"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={swapFormData.swap_date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setSwapFormData({ ...swapFormData, swap_date: e.target.value })}
              required
            />
          </div>

          {/* Colleague Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Exchange With (Colleague from same Team/Dept) *
            </label>
            <select
              value={swapFormData.counterpart_id}
              onChange={e => setSwapFormData({ ...swapFormData, counterpart_id: Number(e.target.value) })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            >
              <option value={0}>-- Select Team Colleague --</option>
              {teamColleagues.map(emp => (
                <option key={emp.id} value={emp.user_id || emp.id}>
                  {emp.name} ({emp.team_name || emp.department_name || 'Team Member'} - {emp.job_title})
                </option>
              ))}
            </select>
            {teamColleagues.length === 0 && (
              <p className="text-[10px] text-rose-600 font-bold pl-1 pt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                No other colleagues found in the same team/department for this employee.
              </p>
            )}
          </div>

          {/* Live Shift Preview Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Scheduled Shifts on {swapFormData.swap_date || 'Selected Date'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-0.5 shadow-2xs">
                <p className="text-[9px] font-black text-indigo-600 uppercase">Requester's Shift</p>
                <p className="font-black text-slate-800 text-xs">
                  {requesterAssignedShift ? requesterAssignedShift.name : 'Standard Shift'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono font-bold">
                  {requesterAssignedShift ? `${requesterAssignedShift.start_time?.slice(0,5)} - ${requesterAssignedShift.end_time?.slice(0,5)}` : '09:00 - 17:00'}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-0.5 shadow-2xs">
                <p className="text-[9px] font-black text-amber-600 uppercase">Counterpart's Shift</p>
                <p className="font-black text-slate-800 text-xs">
                  {counterpartAssignedShift ? counterpartAssignedShift.name : (selectedCounterpart ? 'Standard Shift' : 'Select Colleague')}
                </p>
                <p className="text-[10px] text-slate-500 font-mono font-bold">
                  {counterpartAssignedShift ? `${counterpartAssignedShift.start_time?.slice(0,5)} - ${counterpartAssignedShift.end_time?.slice(0,5)}` : (selectedCounterpart ? '09:00 - 17:00' : '—')}
                </p>
              </div>
            </div>
          </div>

          {/* Shift Override Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Requester Shift Override
              </label>
              <select
                value={swapFormData.requester_shift_id || 0}
                onChange={e => setSwapFormData({ ...swapFormData, requester_shift_id: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
              >
                <option value={0}>Auto-Detect Scheduled Shift</option>
                {shifts.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Counterpart Shift Override
              </label>
              <select
                value={swapFormData.counterpart_shift_id || 0}
                onChange={e => setSwapFormData({ ...swapFormData, counterpart_shift_id: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
              >
                <option value={0}>Auto-Detect Scheduled Shift</option>
                {shifts.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Reason for Swap
            </label>
            <textarea
              rows={3}
              value={swapFormData.reason}
              onChange={e => setSwapFormData({ ...swapFormData, reason: e.target.value })}
              placeholder="Explain why you are requesting to swap shifts..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || teamColleagues.length === 0 || !swapFormData.counterpart_id}
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
