import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, X, Plus, Upload, Check, AlertCircle } from 'lucide-react';
import { Employee, Department } from '../../../../types';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  employees: Employee[];
  departments: Department[];
  currentUser: any;
  onSuccess?: () => void;
  showCustomToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  employee,
  employees,
  departments,
  currentUser,
  onSuccess,
  showCustomToast,
}) => {
  const [leaveFilterDept, setLeaveFilterDept] = useState<number | 'all'>('all');
  const [leaveFilterTeam, setLeaveFilterTeam] = useState<string>('all');
  const [leaveFilterJobTitle, setLeaveFilterJobTitle] = useState<string>('all');

  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<string[]>([
    'Annual Leave',
    'Sick Leave',
    'Casual / Emergency Leave',
    'Maternity / Paternity Leave',
    'Unpaid Leave',
    'Bereavement Leave'
  ]);
  const [showAddLeaveTypeInput, setShowAddLeaveTypeInput] = useState(false);
  const [newLeaveTypeInput, setNewLeaveTypeInput] = useState('');

  const [leaveFormData, setLeaveFormData] = useState({
    user_id: employee?.id || employee?.user_id || currentUser?.id || 0,
    type: 'Annual Leave',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
    attachment_url: '',
    attachment_name: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync user_id if employee changes
  React.useEffect(() => {
    if (employee) {
      setLeaveFormData(prev => ({
        ...prev,
        user_id: employee.id || employee.user_id || currentUser?.id || 0
      }));
    }
  }, [employee, currentUser]);

  if (!isOpen) return null;

  const handleAddLeaveType = () => {
    const trimmed = newLeaveTypeInput.trim();
    if (!trimmed) return;
    if (!availableLeaveTypes.includes(trimmed)) {
      setAvailableLeaveTypes(prev => [...prev, trimmed]);
      setLeaveFormData(prev => ({ ...prev, type: trimmed }));
    }
    setNewLeaveTypeInput('');
    setShowAddLeaveTypeInput(false);
  };

  const getTeamsForDept = (deptId: number | 'all') => {
    if (deptId === 'all') {
      const allTeams = new Set<string>();
      departments.forEach(d => {
        let t = d.teams;
        if (typeof t === 'string') {
          try { t = JSON.parse(t); } catch { t = []; }
        }
        if (Array.isArray(t)) {
          t.forEach((item: any) => {
            const name = typeof item === 'string' ? item : item?.name;
            if (name) allTeams.add(name);
          });
        }
      });
      return Array.from(allTeams);
    }
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return [];
    let t = dept.teams;
    if (typeof t === 'string') {
      try { t = JSON.parse(t); } catch { t = []; }
    }
    if (Array.isArray(t)) {
      return t.map((item: any) => typeof item === 'string' ? item : item?.name).filter(Boolean);
    }
    return [];
  };

  const getJobTitlesForDeptAndTeam = (deptId: number | 'all', teamName: string) => {
    const filtered = employees.filter(e => {
      if (deptId !== 'all' && e.department_id !== deptId) return false;
      if (teamName !== 'all' && e.team_name !== teamName) return false;
      return true;
    });
    const titles = new Set<string>();
    filtered.forEach(e => {
      if (e.job_title) titles.add(e.job_title);
    });
    return Array.from(titles);
  };

  const getFilteredEmployeesCascading = (deptId: number | 'all', teamName: string, jobTitle: string) => {
    return employees.filter(e => {
      if (deptId !== 'all' && e.department_id !== deptId) return false;
      if (teamName !== 'all' && e.team_name !== teamName) return false;
      if (jobTitle !== 'all' && e.job_title !== jobTitle) return false;
      return true;
    });
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const typeLower = (leaveFormData.type || '').toLowerCase();
    const isSickLeave = typeLower.includes('sick') || leaveFormData.type.includes('مرضية') || leaveFormData.type.includes('مرضي');
    if (isSickLeave && !leaveFormData.attachment_url) {
      showCustomToast('Medical attachment/report is required for Sick Leave! / إرفاق التقرير الطبي إجباري للأجازة المرضية', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/hr/leave', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify(leaveFormData)
      });
      if (res.ok) {
        showCustomToast('Leave request submitted successfully!', 'success');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const err = await res.json().catch(() => ({}));
        showCustomToast(err.error || 'Failed to submit leave request', 'error');
      }
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      showCustomToast('Failed to submit leave request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeLower = (leaveFormData.type || '').toLowerCase();
  const isSickLeave = typeLower.includes('sick') || leaveFormData.type.includes('مرضية') || leaveFormData.type.includes('مرضي');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200"
      >
        <div className="p-8 bg-indigo-600 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-white/10 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black tracking-tight uppercase">Request Leave</h2>
            </div>
            <p className="text-white/70 text-sm">Submit leave request with two-stage approval workflow.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmitLeave} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Cascading Employee Selector */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Select Member (Cascading Order)
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Department */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">1. Department</label>
                  <select
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={leaveFilterDept}
                    onChange={e => {
                      const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                      setLeaveFilterDept(val);
                      setLeaveFilterTeam('all');
                      setLeaveFilterJobTitle('all');
                    }}
                  >
                    <option value="all">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                {/* 2. Team */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">2. Team</label>
                  <select
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={leaveFilterTeam}
                    onChange={e => {
                      setLeaveFilterTeam(e.target.value);
                      setLeaveFilterJobTitle('all');
                    }}
                  >
                    <option value="all">All Teams</option>
                    {getTeamsForDept(leaveFilterDept).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                {/* 3. Job Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">3. Job Title</label>
                  <select
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={leaveFilterJobTitle}
                    onChange={e => setLeaveFilterJobTitle(e.target.value)}
                  >
                    <option value="all">All Job Titles</option>
                    {getJobTitlesForDeptAndTeam(leaveFilterDept, leaveFilterTeam).map(jt => (
                      <option key={jt} value={jt}>{jt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Filtered Employee Select */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">4. Select Employee / Member *</label>
                <select 
                  className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={leaveFormData.user_id}
                  onChange={e => setLeaveFormData({ ...leaveFormData, user_id: parseInt(e.target.value) })}
                  required
                >
                  <option value="">-- Select Member --</option>
                  {getFilteredEmployeesCascading(leaveFilterDept, leaveFilterTeam, leaveFilterJobTitle).map((emp, idx) => (
                    <option key={`leave-${emp.id}-${idx}`} value={emp.id}>
                      {emp.name} ({emp.department_name || 'Dept'} - {emp.job_title || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leave Type Select with Add Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Leave Type
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddLeaveTypeInput(!showAddLeaveTypeInput)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddLeaveTypeInput ? 'Cancel' : 'Add Custom Type'}
                </button>
              </div>
              {showAddLeaveTypeInput && (
                <div className="flex items-center gap-2 p-2 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <input
                    type="text"
                    placeholder="New leave type name..."
                    className="flex-1 px-3 py-1.5 text-xs font-bold bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newLeaveTypeInput}
                    onChange={(e) => setNewLeaveTypeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLeaveType(); } }}
                  />
                  <button
                    type="button"
                    onClick={handleAddLeaveType}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              )}
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={leaveFormData.type}
                onChange={e => setLeaveFormData({ ...leaveFormData, type: e.target.value })}
                required
              >
                {availableLeaveTypes.map((t, idx) => (
                  <option key={`type-${idx}`} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Start Date
                </label>
                <input 
                  type="date"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={leaveFormData.start_date}
                  onChange={e => setLeaveFormData({ ...leaveFormData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  End Date
                </label>
                <input 
                  type="date"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={leaveFormData.end_date}
                  onChange={e => setLeaveFormData({ ...leaveFormData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Reason / Justification
              </label>
              <textarea 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none min-h-[90px] resize-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Reason for requesting this leave..."
                value={leaveFormData.reason}
                onChange={e => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
              />
            </div>

            {/* Sick Leave Attachment */}
            {isSickLeave && (
              <div className="space-y-2 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Medical Certificate / Report Required</span>
                </div>
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Document URL or attachment link..."
                    className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    value={leaveFormData.attachment_url}
                    onChange={e => setLeaveFormData({ ...leaveFormData, attachment_url: e.target.value, attachment_name: 'Medical_Report' })}
                    required={isSickLeave}
                  />
                  <p className="text-[10px] text-amber-700">Please provide a URL to the verified doctor note or hospital certificate.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
