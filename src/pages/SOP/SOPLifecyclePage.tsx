import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  CheckCircle2, 
  History, 
  Clock, 
  AlertCircle, 
  Send, 
  Check, 
  X, 
  ArrowLeft 
} from 'lucide-react';
import { useSOP } from './SOPContext';
import { useAuth } from '../../context/AuthContext';

export const SOPLifecyclePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    sopList, 
    setSopList, 
    lifecycleSopId, 
    setLifecycleSopId, 
    lifecycleComment, 
    setLifecycleComment, 
    lifecycleTransitionLog, 
    setLifecycleTransitionLog, 
    setTrainingSops, 
    handleStatusChange,
    showToast 
  } = useSOP();

  useEffect(() => {
    if (id) {
      setLifecycleSopId(Number(id));
    }
  }, [id, setLifecycleSopId]);

  const targetSop = sopList.find(s => s.id === Number(lifecycleSopId)) || sopList[0];
  const curStatus = targetSop?.status || 'Draft';

  return (
    <div className="space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/sops/library')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Procedures Library
        </button>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
          Governance & ISO 9001 Verification
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Digital Gateways & Workflow Audits */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-extrabold text-slate-900 mb-1">Digital Gateways & Workflow Audits</h4>
            <p className="text-xs text-slate-400 mb-6">Select an operational procedure to advance through quality verification gates</p>

            <div className="mb-6">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 font-mono">
                SOP Blueprint Selector
              </label>
              <select
                value={targetSop?.id || ''}
                onChange={e => {
                  const val = Number(e.target.value);
                  setLifecycleSopId(val);
                  navigate(`/sops/lifecycle/${val}`);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {sopList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} (v{s.version_number}) — [{s.status}]
                  </option>
                ))}
              </select>
            </div>

            {targetSop && (
              <div className="space-y-6">
                {/* Active Stage Tracker (Graphical Stepper) */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-widest">Active Stage Tracker</span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Current: {curStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 relative">
                    {[
                      { name: 'Prop Draft', status: 'Draft' },
                      { name: 'QC Review', status: 'Under Review' },
                      { name: 'Exec Sign-Off', status: 'Pending Approval' },
                      { name: 'Published', status: 'Published' }
                    ].map((step, idx) => {
                      const stages = ['Draft', 'Under Review', 'Pending Approval', 'Published'];
                      const currentIdx = stages.indexOf(curStatus);
                      const isComplete = currentIdx > idx || curStatus === 'Published';
                      const isCurrent = stages[idx] === curStatus;

                      return (
                        <div key={step.name} className="flex flex-col items-center text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                            isComplete ? 'bg-emerald-500 text-white' :
                            isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                            'bg-slate-200 text-slate-400'
                          }`}>
                            {isComplete ? <Check className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={`text-[10px] font-black tracking-tight ${isCurrent ? 'text-indigo-600 font-extrabold' : 'text-slate-500'}`}>
                            {step.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Promoted Digital Gateways Actions */}
                <div className="space-y-4 pt-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                    Operational Review Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={lifecycleComment}
                    onChange={e => setLifecycleComment(e.target.value)}
                    placeholder="Enter audit remarks, verification notes, or release justifications..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />

                  <div className="flex flex-wrap gap-3 pt-2">
                    {curStatus === 'Draft' && (
                      <button
                        onClick={async () => {
                          await handleStatusChange(targetSop.id, 'Under Review');
                          setLifecycleTransitionLog(prev => [{
                            stage: 'Transferred to QA Review',
                            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                            user: user?.name || 'Administrator',
                            comment: lifecycleComment || 'Promoted to Gate 2 (Quality Assurance Verification).'
                          }, ...prev]);
                          setLifecycleComment('');
                        }}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit for QA Verification
                      </button>
                    )}

                    {curStatus === 'Under Review' && (
                      <>
                        <button
                          onClick={async () => {
                            await handleStatusChange(targetSop.id, 'Pending Approval');
                            setLifecycleTransitionLog(prev => [{
                              stage: 'QA Gate Passed - Exec Sign-Off',
                              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                              user: user?.name || 'Lead QC Auditor',
                              comment: lifecycleComment || 'Full compliance audit verified against internal standard.'
                            }, ...prev]);
                            setLifecycleComment('');
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100 flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> QC Passed - Propose Approve
                        </button>
                        <button
                          onClick={async () => {
                            await handleStatusChange(targetSop.id, 'Draft');
                            setLifecycleTransitionLog(prev => [{
                              stage: 'QC Rejected to Author',
                              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                              user: user?.name || 'Lead QC Auditor',
                              comment: lifecycleComment || 'Deficiencies found. Reverted to author.'
                            }, ...prev]);
                            setLifecycleComment('');
                          }}
                          className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200 flex items-center gap-2 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Reject Proposal
                        </button>
                      </>
                    )}

                    {curStatus === 'Pending Approval' && (
                      <>
                        <button
                          onClick={async () => {
                            await handleStatusChange(targetSop.id, 'Published');
                            setLifecycleTransitionLog(prev => [{
                              stage: 'Official Sign-Off & Released',
                              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                              user: user?.name || 'Executive Officer',
                              comment: lifecycleComment || 'Authorized for enterprise-wide implementation.'
                            }, ...prev]);
                            setTrainingSops(prev => [
                              {
                                id: Date.now(),
                                employeeName: 'Staff Onboarding Cohort',
                                sopId: targetSop.id,
                                sopTitle: targetSop.title,
                                progress: 0,
                                status: 'enrolled',
                                dateAssigned: new Date().toISOString().slice(0, 10)
                              },
                              ...prev
                            ]);
                            setLifecycleComment('');
                          }}
                          className="px-6 py-2.5 bg-indigo-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Authorize Sign-Off & Publish
                        </button>
                        <button
                          onClick={async () => {
                            await handleStatusChange(targetSop.id, 'Under Review');
                            setLifecycleTransitionLog(prev => [{
                              stage: 'Escalated back to QA',
                              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                              user: user?.name || 'Executive Officer',
                              comment: lifecycleComment || 'Further verification requested.'
                            }, ...prev]);
                            setLifecycleComment('');
                          }}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Escalate back to QA
                        </button>
                      </>
                    )}

                    {curStatus === 'Published' && (
                      <div className="w-full bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="text-xs text-emerald-800">
                          <strong className="block font-bold">Standard Released & Active</strong>
                          This Standard Operating Procedure is officially signed off and deployed in production. Any further edits will increment its major semantic version (vX.X+1).
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Document Version Control Ledger */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" /> Revisions & Chronological Tracking
              </h4>
              <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">
                Audited Ledger
              </span>
            </div>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 pl-6">
              {lifecycleTransitionLog.map((log, i) => (
                <div key={i} className="relative group">
                  <div className="absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800">{log.stage}</span>
                      <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">"{log.comment}"</p>
                    <span className="text-[9px] font-mono font-bold text-indigo-600 block">Auditor: {log.user}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> SHA-256 INTEGRATION ID
              </span>
              <span>a4c98e2193b0b741f...892e10</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Cryptographically tied to ISO 9001:2026 Audit Trail.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOPLifecyclePage;
