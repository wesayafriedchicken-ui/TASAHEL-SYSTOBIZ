import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Printer, 
  CheckCircle, 
  Award, 
  Tag, 
  Zap, 
  Plus, 
  Settings, 
  ArrowLeft, 
  GraduationCap, 
  Edit2 
} from 'lucide-react';
import RACIAssignmentManager from '../../components/RACI/RACIAssignmentManager';
import ContextualChat from '../../components/Chat/ContextualChat';
import { SOPFlowchart } from './components/SOPFlowchart';
import { useSOP } from './SOPContext';

export const SOPDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    selectedSop, 
    fetchSopDetails, 
    isAcknowledged, 
    handleAcknowledge, 
    handleStatusChange, 
    relatedCourses, 
    isAddingStep, 
    setIsAddingStep, 
    newStep, 
    setNewStep, 
    handleAddStep 
  } = useSOP();

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
        <p className="text-slate-600 font-bold">Loading Standard Operating Procedure...</p>
        <button 
          onClick={() => navigate('/sops/library')}
          className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200"
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top back navigation (no-print) */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate('/sops/library')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Procedures Library
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            SOP ID: #{selectedSop.id}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        <div className="lg:col-span-2 space-y-6 print:space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm print:border-none print:shadow-none">
            {/* Print Header */}
            <div className="hidden print:block sop-print-header p-8 border-b-2 border-slate-900">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center rounded-xl">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">{selectedSop.title}</h1>
                    <p className="text-slate-500 font-medium">Standard Operating Procedure • v{selectedSop.version_number} • {selectedSop.process_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-emerald-600 uppercase tracking-tighter">Systo Biz</p>
                  <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Official Document</p>
                  <p className="text-[10px] text-slate-400 mt-4">Printed on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Non-print top action bar */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 no-print">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{selectedSop.title}</h4>
                  <p className="text-sm text-slate-500">v{selectedSop.version_number} • {selectedSop.process_type}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => window.print()}
                  className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                  title="Print SOP"
                >
                  <Printer className="w-4 h-4" />
                  <span className="text-sm font-bold">Print</span>
                </button>
                <button 
                  onClick={() => navigate(`/sops/edit/${selectedSop.id}`)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit SOP
                </button>
                {selectedSop.status === 'Draft' && (
                  <button 
                    onClick={() => handleStatusChange('Pending Approval')}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Submit for Approval
                  </button>
                )}
                {selectedSop.status === 'Pending Approval' && (
                  <button 
                    onClick={() => handleStatusChange('Published')}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Approve & Publish
                  </button>
                )}
                {selectedSop.status === 'Published' && !isAcknowledged && (
                  <button 
                    onClick={handleAcknowledge}
                    className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Acknowledge SOP
                  </button>
                )}
                {selectedSop.status === 'Published' && isAcknowledged && (
                  <div className="px-4 py-2 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Acknowledged
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 space-y-10">
              {relatedCourses.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between no-print"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">Training Available</p>
                      <p className="text-xs text-blue-600">There is a training course available for this procedure.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      alert(`Go to Training Hub to start: ${relatedCourses[0].title}`);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    Start Training
                  </button>
                </motion.div>
              )}

              {/* Header Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Objective</h5>
                  <p className="text-slate-700 text-sm leading-relaxed">{selectedSop.objective || 'Not defined'}</p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scope</h5>
                  <p className="text-slate-700 text-sm leading-relaxed">{selectedSop.scope || 'Not defined'}</p>
                </div>
              </div>

              {/* RACI Section for SOP */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <RACIAssignmentManager sopId={selectedSop.id} />
              </div>

              {/* Core Content */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Roles & Responsibilities</h5>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                    {selectedSop.roles_responsibilities || 'Not defined'}
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required Documentation</h5>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                    {selectedSop.required_documentation || 'Not defined'}
                  </div>
                </div>
              </div>

              {/* Governance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reporting Line</h5>
                  <p className="text-slate-700 text-sm">{selectedSop.reporting_line || 'Not defined'}</p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tools & Channels Used</h5>
                  <p className="text-slate-700 text-sm">{selectedSop.tools_channels_used || 'Not defined'}</p>
                </div>
              </div>

              {/* Measurement & Visuals */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Key Performance Indicators (KPIs)</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedSop.kpis ? selectedSop.kpis.split(',').map((kpi, i) => (
                        <span key={`kpi-${kpi.trim()}-${i}`} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                          {kpi.trim()}
                        </span>
                      )) : <span className="text-slate-400 text-sm italic">No KPIs defined</span>}
                    </div>
                  </div>
                  {selectedSop.tags && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tags</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedSop.tags.split(',').map((tag, i) => (
                          <span key={`tag-${tag.trim()}-${i}`} className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2 print:hidden">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Visual Process Map</h5>
                  <SOPFlowchart sopId={selectedSop.id} steps={selectedSop.steps || []} flowchartData={selectedSop.flowchart_data} />
                </div>
              </div>

              {/* Step-by-Step Process */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h5 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Step-by-Step Process
                  </h5>
                  <button 
                    onClick={() => {
                      setNewStep({
                        step_number: (selectedSop.steps?.length || 0) + 1,
                        step_description: '',
                        attachment_url: '',
                        required_course_id: undefined
                      });
                      setIsAddingStep(true);
                    }}
                    className="text-emerald-600 text-sm font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Step
                  </button>
                </div>
                <div className="space-y-4">
                  {selectedSop.steps?.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-slate-500 text-sm">No steps added yet. Start documenting the process.</p>
                    </div>
                  ) : (
                    selectedSop.steps?.map((step, idx) => (
                      <div key={step.id} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {step.step_number}
                          </div>
                          {idx !== (selectedSop.steps?.length || 0) - 1 && (
                            <div className="w-0.5 h-full bg-slate-100 my-1"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-emerald-200 group-hover:bg-emerald-50/30 transition-all">
                            <p className="text-slate-700 leading-relaxed mb-4">{step.step_description}</p>
                            {step.required_course_id && (
                              <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
                                <GraduationCap className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-bold text-amber-700">Training Required: Course #{step.required_course_id}</span>
                              </div>
                            )}
                            <RACIAssignmentManager sopStepId={step.id} />
                            {step.attachment_url && (
                              <div className="mt-3 flex items-center gap-2 text-xs text-indigo-600 font-bold">
                                <Settings className="w-3 h-3" /> Attachment: {step.attachment_url}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 print:mt-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm print:border-none print:shadow-none">
            <h5 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">SOP Metadata</h5>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Department</span>
                <span className="font-bold text-slate-900">{selectedSop.department_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Owner</span>
                <span className="font-bold text-slate-900">{selectedSop.owner_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Approver</span>
                <span className="font-bold text-slate-900">{selectedSop.approver_name || 'Pending'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Review Date</span>
                <span className="font-bold text-slate-900">
                  {selectedSop.review_date ? new Date(selectedSop.review_date).toLocaleDateString() : 'Not Scheduled'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm print:border-none print:shadow-none print:mt-8">
            <h5 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Version History</h5>
            <div className="space-y-4">
              {selectedSop.versions?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No previous versions recorded.</p>
              ) : (
                selectedSop.versions?.map(v => (
                  <div key={v.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-900">v{v.version_number}</span>
                      <span className="text-[10px] text-slate-400">{new Date(v.updated_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{v.change_summary}</p>
                    <p className="text-[10px] text-indigo-600 mt-1 font-bold">By {v.updated_by_name}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <ContextualChat 
            contextType="sop" 
            contextId={selectedSop.id} 
            contextName={selectedSop.title} 
          />
        </div>
      </div>

      {/* Add Step Modal */}
      {isAddingStep && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Add Process Step</h3>
              <button onClick={() => setIsAddingStep(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddStep}>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Step Number</label>
                  <input 
                    type="number" 
                    required
                    value={newStep.step_number}
                    onChange={e => setNewStep({ ...newStep, step_number: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea 
                    rows={4} 
                    required
                    value={newStep.step_description}
                    onChange={e => setNewStep({ ...newStep, step_description: e.target.value })}
                    placeholder="Describe this step in detail..." 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                  ></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Attachment URL (Optional)</label>
                  <input 
                    type="text" 
                    value={newStep.attachment_url}
                    onChange={e => setNewStep({ ...newStep, attachment_url: e.target.value })}
                    placeholder="Link to document or image" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Required Training Course ID (Optional)</label>
                  <input 
                    type="number" 
                    value={newStep.required_course_id || ''}
                    onChange={e => setNewStep({ ...newStep, required_course_id: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Course ID to unlock this step" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddingStep(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer">Cancel</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-all cursor-pointer">Add Step</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SOPDetailsPage;
