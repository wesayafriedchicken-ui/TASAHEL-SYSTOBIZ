import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, ArrowLeft, BookOpen } from 'lucide-react';
import { useSOP } from './SOPContext';

export const SOPEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    selectedSop, 
    setSelectedSop, 
    fetchSopDetails, 
    departments, 
    globalStatuses, 
    changeSummary, 
    setChangeSummary, 
    handleUpdate 
  } = useSOP();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const numId = Number(id);
      fetchSopDetails(numId);
    }
  }, [id, fetchSopDetails]);

  if (!selectedSop) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
        <p className="text-slate-600 font-bold">Loading SOP for editing...</p>
        <button 
          onClick={() => navigate('/sops/library')}
          className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await handleUpdate(e);
      if (success) {
        navigate(`/sops/${selectedSop.id}`);
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
          onClick={() => navigate(`/sops/${selectedSop.id}`)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return to SOP
        </button>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
          Editing v{selectedSop.version_number}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Edit SOP: {selectedSop.title}</h3>
              <p className="text-xs text-slate-400">Modify process guidelines, governance, or metadata</p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-8 space-y-10">
            {/* Header Data Section */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">Header Data</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">SOP Title *</label>
                  <input 
                    type="text" 
                    required
                    value={selectedSop.title || ''}
                    onChange={e => setSelectedSop({ ...selectedSop, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Objective</label>
                  <textarea 
                    value={selectedSop.objective || ''}
                    onChange={e => setSelectedSop({ ...selectedSop, objective: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none h-24 resize-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Scope</label>
                  <textarea 
                    value={selectedSop.scope || ''}
                    onChange={e => setSelectedSop({ ...selectedSop, scope: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none h-24 resize-none" 
                  />
                </div>
              </div>
            </section>

            {/* Core Content Section */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">Core Content</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Roles & Responsibilities</label>
                  <textarea 
                    value={selectedSop.roles_responsibilities || ''}
                    onChange={e => setSelectedSop({ ...selectedSop, roles_responsibilities: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none h-32 resize-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Required Documentation</label>
                  <textarea 
                    value={selectedSop.required_documentation || ''}
                    onChange={e => setSelectedSop({ ...selectedSop, required_documentation: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none h-32 resize-none" 
                  />
                </div>
              </div>
            </section>

            {/* Governance Section */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">Governance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Reporting Line</label>
                  <input 
                    type="text" 
                    value={selectedSop.reporting_line || ''}
                    onChange={e => setSelectedSop({ ...selectedSop, reporting_line: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tools & Channels Used</label>
                  <input 
                    type="text" 
                    value={selectedSop.tools_channels_used || ''}
                    onChange={e => setSelectedSop({ ...selectedSop, tools_channels_used: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                  />
                </div>
              </div>
            </section>

            {/* Measurement & Visuals Section */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">Measurement & Visuals</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">KPIs (Comma separated)</label>
                  <input 
                    type="text" 
                    value={selectedSop.kpis || ''}
                    onChange={e => setSelectedSop({ ...selectedSop, kpis: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Flowchart Data (JSON/Text)</label>
                  <textarea 
                    value={selectedSop.flowchart_data || ''}
                    onChange={e => setSelectedSop({ ...selectedSop, flowchart_data: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none h-32 font-mono text-xs resize-none" 
                  />
                </div>
              </div>
            </section>

            {/* Metadata Section */}
            <section className="space-y-6">
              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">Metadata</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Department</label>
                  <select 
                    value={selectedSop.department_id || 1}
                    onChange={e => setSelectedSop({ ...selectedSop, department_id: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Process Type</label>
                  <select 
                    value={selectedSop.process_type || 'Standard'}
                    onChange={e => setSelectedSop({ ...selectedSop, process_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
                    value={selectedSop.tags || ''}
                    onChange={e => setSelectedSop({ ...selectedSop, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Status</label>
                  <select 
                    value={selectedSop.status || 'Draft'}
                    onChange={e => setSelectedSop({ ...selectedSop, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
                    value={selectedSop.review_date ? selectedSop.review_date.split('T')[0] : ''}
                    onChange={e => setSelectedSop({ ...selectedSop, review_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                  />
                </div>
              </div>
            </section>

            {/* Change Summary if Published */}
            {selectedSop.status === 'Published' && (
              <section className="space-y-4 pt-4 border-t border-slate-100 bg-amber-50/50 p-6 rounded-2xl border border-amber-200/60">
                <label className="text-sm font-bold text-amber-900 block">
                  Change Summary (Required for new version of Published SOP)
                </label>
                <textarea 
                  required
                  value={changeSummary}
                  onChange={e => setChangeSummary(e.target.value)}
                  placeholder="What changed in this version? (Creates vX.X+1)" 
                  className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 outline-none bg-white h-24 resize-none" 
                />
              </section>
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => navigate(`/sops/${selectedSop.id}`)} 
              className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SOPEditPage;
