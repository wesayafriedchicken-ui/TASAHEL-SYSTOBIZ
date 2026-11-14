import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronDown,
  User,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

const NCRManager = () => {
  const [ncrs, setNcrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newNcr, setNewNcr] = useState({
    description: '',
    severity: 'medium',
    reported_by: 1, // Mocked
    assigned_to: '',
    risk_id: null
  });
  const [users, setUsers] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);

  useEffect(() => {
    fetchNcrs();
    fetchUsers();
    fetchRisks();
  }, []);

  const fetchNcrs = async () => {
    const res = await fetch('/api/qa/ncr');
    setNcrs(await res.json());
    setLoading(false);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    setUsers(await res.json());
  };

  const fetchRisks = async () => {
    const res = await fetch('/api/risks');
    setRisks(await res.json());
  };

  const handleCreate = async () => {
    if (!newNcr.description || !newNcr.assigned_to) {
      alert("Please fill in all required fields.");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
      const res = await fetch('/api/qa/ncr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNcr)
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      setIsCreating(false);
      setNewNcr({
        description: '',
        severity: 'medium',
        reported_by: currentUser.id || 1,
        assigned_to: '',
        risk_id: null
      });
      fetchNcrs(); 
    } catch (err) {
      console.error("Failed to save NCR", err);
      alert(err instanceof Error ? err.message : "Failed to save NCR");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'closed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'investigating': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
          Non-Conformance Reports (NCR)
        </h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-rose-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Report Issue
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Description of Non-Conformance</label>
              <textarea
                value={newNcr.description}
                onChange={(e) => setNewNcr({ ...newNcr, description: e.target.value })}
                placeholder="Describe the error, deviation, or quality issue..."
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 min-h-[100px] focus:ring-2 focus:ring-rose-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Severity</label>
              <select
                value={newNcr.severity}
                onChange={(e) => setNewNcr({ ...newNcr, severity: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Assign To</label>
              <select
                value={newNcr.assigned_to}
                onChange={(e) => setNewNcr({ ...newNcr, assigned_to: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 transition-all"
              >
                <option value="">Select owner...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Link to Risk Register</label>
              <select
                value={newNcr.risk_id || ''}
                onChange={(e) => setNewNcr({ ...newNcr, risk_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 transition-all"
              >
                <option value="">No linked risk</option>
                {risks.map(r => <option key={r.id} value={r.id}>{r.description}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              onClick={() => setIsCreating(false)}
              className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="bg-rose-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-sm flex items-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              Submit NCR
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {ncrs.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">All Clear!</h3>
              <p className="text-slate-500">No active non-conformance reports found.</p>
            </div>
          ) : (
            ncrs.map(ncr => (
              <div key={ncr.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getSeverityColor(ncr.severity)}`}>
                        {ncr.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">NCR-{ncr.id.toString().padStart(4, '0')}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{ncr.description}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Reported by: {ncr.reported_by_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Assigned to: {ncr.assigned_to_name || 'Unassigned'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ncr.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                      ncr.status === 'closed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                      ncr.status === 'investigating' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                      'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                      {getStatusIcon(ncr.status)}
                      <span className="text-xs font-bold uppercase tracking-wider">{ncr.status}</span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NCRManager;
