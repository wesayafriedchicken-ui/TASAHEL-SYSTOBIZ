import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Users, 
  HelpCircle, 
  Info,
  AlertCircle
} from 'lucide-react';

interface RACIAssignmentManagerProps {
  sopId?: number;
  sopStepId?: number;
  onUpdate?: () => void;
}

const RACIAssignmentManager: React.FC<RACIAssignmentManagerProps> = ({ sopId, sopStepId, onUpdate }) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [newAssignment, setNewAssignment] = useState({
    role_type: 'R',
    user_id: '',
    role_id: ''
  });

  useEffect(() => {
    fetchData();
  }, [sopId, sopStepId]);

  const fetchData = async () => {
    if (!sopId && !sopStepId) return;
    setLoading(true);
    try {
      const query = sopId ? `sop_id=${sopId}` : `sop_step_id=${sopStepId}`;
      const [assignmentsRes, rolesRes, usersRes] = await Promise.all([
        fetch(`/api/raci?${query}`),
        fetch('/api/roles'),
        fetch('/api/users')
      ]);
      
      const assignmentsData = await assignmentsRes.json();
      const rolesData = await rolesRes.json();
      const usersData = await usersRes.json();

      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Failed to fetch RACI data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newAssignment.user_id && !newAssignment.role_id) {
      alert("Please select a user or a role");
      return;
    }

    try {
      const res = await fetch('/api/raci', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sop_id: sopId,
          sop_step_id: sopStepId,
          role_type: newAssignment.role_type,
          user_id: newAssignment.user_id ? parseInt(newAssignment.user_id) : null,
          role_id: newAssignment.role_id ? parseInt(newAssignment.role_id) : null
        })
      });

      if (res.ok) {
        fetchData();
        onUpdate?.();
        setNewAssignment({ role_type: 'R', user_id: '', role_id: '' });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add assignment");
      }
    } catch (err) {
      console.error("Failed to add assignment", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/raci/${id}`, { method: 'DELETE' });
      fetchData();
      onUpdate?.();
    } catch (err) {
      console.error("Failed to delete assignment", err);
    }
  };

  const getRoleIcon = (type: string) => {
    switch (type) {
      case 'R': return <Users className="w-3 h-3" />;
      case 'A': return <ShieldCheck className="w-3 h-3" />;
      case 'C': return <HelpCircle className="w-3 h-3" />;
      case 'I': return <Info className="w-3 h-3" />;
      default: return null;
    }
  };

  const getRoleColor = (type: string) => {
    switch (type) {
      case 'R': return 'bg-blue-500';
      case 'A': return 'bg-emerald-500';
      case 'C': return 'bg-amber-500';
      case 'I': return 'bg-slate-500';
      default: return 'bg-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">RACI Assignments</h4>
        {assignments.filter(a => a.role_type === 'A').length === 0 && (
          <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold animate-pulse">
            <AlertCircle className="w-3 h-3" /> Missing Accountable (A)
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {assignments.map(a => (
          <div key={a.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 pl-1 pr-2 py-1 rounded-lg group">
            <div className={`${getRoleColor(a.role_type)} text-white w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold`}>
              {a.role_type}
            </div>
            <span className="text-xs font-medium text-slate-700">
              {a.user_name || a.role_name}
            </span>
            <button 
              onClick={() => handleDelete(a.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-rose-500 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-50">
        <select 
          value={newAssignment.role_type}
          onChange={(e) => setNewAssignment({ ...newAssignment, role_type: e.target.value as any })}
          className="text-xs bg-slate-50 border-slate-200 rounded-lg"
        >
          <option value="R">Responsible (R)</option>
          <option value="A">Accountable (A)</option>
          <option value="C">Consulted (C)</option>
          <option value="I">Informed (I)</option>
        </select>
        
        <select 
          value={newAssignment.user_id}
          onChange={(e) => setNewAssignment({ ...newAssignment, user_id: e.target.value, role_id: '' })}
          className="text-xs bg-slate-50 border-slate-200 rounded-lg"
        >
          <option value="">Select User...</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <select 
          value={newAssignment.role_id}
          onChange={(e) => setNewAssignment({ ...newAssignment, role_id: e.target.value, user_id: '' })}
          className="text-xs bg-slate-50 border-slate-200 rounded-lg"
        >
          <option value="">OR Select Role...</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        <button 
          onClick={handleAdd}
          className="bg-slate-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="w-3 h-3" /> Assign
        </button>
      </div>
    </div>
  );
};

export default RACIAssignmentManager;
