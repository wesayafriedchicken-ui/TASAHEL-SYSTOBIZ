import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Plus } from 'lucide-react';
import { useSOP } from './SOPContext';

export const SOPBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { newSop, setNewSop, departments, globalStatuses, handleCreate } = useSOP();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await handleCreate(e);
      if (created && created.id) {
        navigate(`/sops/${created.id}`);
      } else {
        navigate('/sops/library');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/sops/library')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Procedures Library
        </button>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          Process Architect Mode
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">New SOP Builder</h3>
              <p className="text-xs text-slate-400">Initialize a compliant, standardized operating procedure framework</p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-8 space-y-10">
            {/* Header Data Section */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">Header Data</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">SOP Title *</label>
                  <input 
                    type="text" 
                    required
                    value={newSop.title || ''}
                    onChange={e => setNewSop({ ...newSop, title: e.target.value })}
                    placeholder="e.g. US Visa Processing" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Objective</label>
                  <textarea 
                    value={newSop.objective || ''}
                    onChange={e => setNewSop({ ...newSop, objective: e.target.value })}
                    placeholder="What is the goal of this process?" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none h-24 resize-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Scope</label>
                  <textarea 
                    value={newSop.scope || ''}
                    onChange={e => setNewSop({ ...newSop, scope: e.target.value })}
                    placeholder="Who and what does this process cover?" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none h-24 resize-none" 
                  />
                </div>
              </div>
            </section>

            {/* Core Content Section */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">Core Content</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Roles & Responsibilities</label>
                  <textarea 
                    value={newSop.roles_responsibilities || ''}
                    onChange={e => setNewSop({ ...newSop, roles_responsibilities: e.target.value })}
                    placeholder="List the roles involved and their key duties..." 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none h-32 resize-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Required Documentation</label>
                  <textarea 
                    value={newSop.required_documentation || ''}
                    onChange={e => setNewSop({ ...newSop, required_documentation: e.target.value })}
                    placeholder="What documents are needed for this process?" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none h-32 resize-none" 
                  />
                </div>
              </div>
            </section>

            {/* Governance Section */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">Governance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Reporting Line</label>
                  <input 
                    type="text" 
                    value={newSop.reporting_line || ''}
                    onChange={e => setNewSop({ ...newSop, reporting_line: e.target.value })}
                    placeholder="Who reports to whom in this process?" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tools & Channels Used</label>
                  <input 
                    type="text" 
                    value={newSop.tools_channels_used || ''}
                    onChange={e => setNewSop({ ...newSop, tools_channels_used: e.target.value })}
                    placeholder="Software, communication channels, etc." 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
              </div>
            </section>

            {/* Measurement & Visuals Section */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">Measurement & Visuals</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">KPIs (Comma separated)</label>
                  <input 
                    type="text" 
                    value={newSop.kpis || ''}
                    onChange={e => setNewSop({ ...newSop, kpis: e.target.value })}
                    placeholder="e.g. Processing Time, Error Rate, Customer Satisfaction" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Flowchart Data (JSON/Text)</label>
                  <textarea 
                    value={newSop.flowchart_data || ''}
                    onChange={e => setNewSop({ ...newSop, flowchart_data: e.target.value })}
                    placeholder="Paste flowchart definition or data here..." 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none h-32 font-mono text-xs resize-none" 
                  />
                </div>
              </div>
            </section>

            {/* Metadata Section */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">Metadata</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Department</label>
                  <select 
                    value={newSop.department_id || 1}
                    onChange={e => setNewSop({ ...newSop, department_id: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  >
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Process Type</label>
                  <select 
                    value={newSop.process_type || 'Standard'}
                    onChange={e => setNewSop({ ...newSop, process_type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  >
                    <option>Standard</option>
                    <option>Critical</option>
                    <option>Support</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tags (Comma separated)</label>
                  <input 
                    type="text" 
                    value={newSop.tags || ''}
                    onChange={e => setNewSop({ ...newSop, tags: e.target.value })}
                    placeholder="e.g. Compliance, Operations, High Priority" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Status</label>
                  <select 
                    value={newSop.status || (globalStatuses.find(s => s.module_id === 'sops' && s.is_default)?.label || 'Draft')}
                    onChange={e => setNewSop({ ...newSop, status: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  >
                    {globalStatuses.filter(s => s.module_id === 'sops').map(s => (
                      <option key={s.id} value={s.label}>{s.label}</option>
                    ))}
                    {globalStatuses.filter(s => s.module_id === 'sops').length === 0 && (
                      <>
                        <option>Draft</option>
                        <option>Under Review</option>
                        <option>Pending Approval</option>
                        <option>Published</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Next Review Date</label>
                  <input 
                    type="date" 
                    value={newSop.review_date || ''}
                    onChange={e => setNewSop({ ...newSop, review_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => navigate('/sops/library')} 
              className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Initialize SOP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SOPBuilderPage;
