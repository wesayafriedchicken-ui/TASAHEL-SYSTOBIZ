import React from 'react';
import { 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  UserCheck, 
  FileText, 
  ShieldCheck, 
  ArrowLeft, 
  RotateCcw 
} from 'lucide-react';
import { useSOP } from './SOPContext';

export const SOPTrainingPage: React.FC = () => {
  const { 
    sopList, 
    trainingSops, 
    setTrainingSops, 
    activeQuizTrainingId, 
    setActiveQuizTrainingId, 
    quizAnswers, 
    setQuizAnswers, 
    quizScore, 
    setQuizScore, 
    certifiedCode, 
    setCertifiedCode, 
    enrollEmployeeName, 
    setEnrollEmployeeName, 
    enrollSopId, 
    setEnrollSopId, 
    showToast 
  } = useSOP();

  const activeTrainingRecord = trainingSops.find(t => t.id === activeQuizTrainingId);
  const activeSop = sopList.find(s => s.id === activeTrainingRecord?.sopId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Enroll & Active Path Registry */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Assign SOP Training Path</h4>
                <p className="text-xs text-slate-400">Enroll personnel into mandatory standard reading & quiz certification</p>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!enrollEmployeeName || !enrollSopId) return;
                const chosenSop = sopList.find(s => s.id === Number(enrollSopId));
                setTrainingSops(prev => [
                  {
                    id: Date.now(),
                    employeeName: enrollEmployeeName,
                    sopId: Number(enrollSopId),
                    sopTitle: chosenSop?.title || 'Selected SOP',
                    progress: 0,
                    status: 'enrolled',
                    dateAssigned: new Date().toISOString().slice(0, 10)
                  },
                  ...prev
                ]);
                setEnrollEmployeeName('');
                setEnrollSopId('');
                showToast('Training path assigned successfully!', 'success');
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1 font-mono">
                  Employee / Recruits Name
                </label>
                <input
                  type="text"
                  required
                  value={enrollEmployeeName}
                  onChange={e => setEnrollEmployeeName(e.target.value)}
                  placeholder="e.g. Ziad Mansour"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1 font-mono">
                  Standard Operating Procedure
                </label>
                <select
                  required
                  value={enrollSopId}
                  onChange={e => setEnrollSopId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="">-- Choose Procedure --</option>
                  {sopList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.department_name})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-100 cursor-pointer"
              >
                Initialize Course Path
              </button>
            </form>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-6 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-relaxed">
                <strong className="block font-bold">Automation Retraining Rule</strong>
                Whenever an SOP is modified to a new major revision (v2.0), all certified personnel are automatically queued for re-training.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Training Records & Quiz Simulation */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-extrabold text-slate-900 mb-1">Active Compliance Path Registry</h4>
            <p className="text-xs text-slate-400 mb-4">Track personnel reading ratios, examination scores, and credentials</p>

            <div className="divide-y divide-slate-100">
              {trainingSops.map(t => (
                <div key={t.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-800">{t.employeeName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono ${
                        t.status === 'certified' ? 'bg-emerald-100 text-emerald-700' :
                        t.status === 'reading' ? 'bg-amber-100 text-amber-700' :
                        t.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{t.sopTitle}</p>
                    <span className="text-[10px] text-slate-400 block font-mono">Assigned: {t.dateAssigned}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-24 text-right">
                      <span className="text-[10px] font-bold text-slate-600">{t.progress}% Read</span>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full ${t.status === 'certified' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveQuizTrainingId(t.id);
                        setQuizAnswers({});
                        setQuizScore(null);
                        setCertifiedCode(null);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200 cursor-pointer"
                    >
                      {t.status === 'certified' ? 'View Certificate' : 'Open Standard Quiz'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Simulation Board */}
          {activeTrainingRecord && (
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Interactive Verification Exam</span>
                  <h4 className="text-base font-extrabold text-white mt-1">{activeTrainingRecord.sopTitle}</h4>
                  <p className="text-xs text-slate-400">Trainee Candidate: {activeTrainingRecord.employeeName}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveQuizTrainingId(null);
                    setQuizScore(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Close Console ✕
                </button>
              </div>

              {/* Step Sequence View */}
              {activeSop && activeSop.steps && activeSop.steps.length > 0 && (
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Standard Steps Reference</span>
                  <div className="space-y-1.5 text-xs text-slate-300 max-h-32 overflow-y-auto pr-2">
                    {activeSop.steps.map(st => (
                      <div key={st.id} className="flex gap-2">
                        <span className="text-emerald-400 font-mono font-bold">#{st.step_number}</span>
                        <span>{st.step_description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz Questions */}
              {quizScore === null && (
                <div className="space-y-5">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-2.5">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Question 1: What is the primary operational objective of this procedure?
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {['Ensure standardized execution with minimal defects', 'Increase turnaround delay by 50%', 'Bypass documentation guidelines'].map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 cursor-pointer">
                          <input
                            type="radio"
                            name="q1"
                            checked={quizAnswers[1] === opt}
                            onChange={() => setQuizAnswers(prev => ({ ...prev, 1: opt }))}
                            className="accent-emerald-500"
                          />
                          <span className="text-slate-300">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-2.5">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Question 2: Which role is primarily accountable for step execution?
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {['Assigned Process Performer / Case Officer', 'External Guest', 'Unassigned Contractor'].map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 cursor-pointer">
                          <input
                            type="radio"
                            name="q2"
                            checked={quizAnswers[2] === opt}
                            onChange={() => setQuizAnswers(prev => ({ ...prev, 2: opt }))}
                            className="accent-emerald-500"
                          />
                          <span className="text-slate-300">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-2.5">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Question 3: What governance standard applies to this process review?
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {['ISO 9001:2026 Audit Trail & Quality Gates', 'No governance required', 'Informal verbal consent'].map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 cursor-pointer">
                          <input
                            type="radio"
                            name="q3"
                            checked={quizAnswers[3] === opt}
                            onChange={() => setQuizAnswers(prev => ({ ...prev, 3: opt }))}
                            className="accent-emerald-500"
                          />
                          <span className="text-slate-300">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      let correct = 0;
                      if (quizAnswers[1] === 'Ensure standardized execution with minimal defects') correct++;
                      if (quizAnswers[2] === 'Assigned Process Performer / Case Officer') correct++;
                      if (quizAnswers[3] === 'ISO 9001:2026 Audit Trail & Quality Gates') correct++;
                      const score = Math.round((correct / 3) * 100);
                      setQuizScore(score);

                      if (score >= 66) {
                        const code = 'SYSTO-CERT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
                        setCertifiedCode(code);
                        setTrainingSops(prev => prev.map(t => t.id === activeTrainingRecord.id ? {
                          ...t,
                          status: 'certified',
                          progress: 100
                        } : t));
                        showToast(`Passed with ${score}%! Compliance Certificate Generated.`, 'success');
                      } else {
                        setTrainingSops(prev => prev.map(t => t.id === activeTrainingRecord.id ? {
                          ...t,
                          status: 'failed'
                        } : t));
                        showToast(`Score: ${score}%. Failed competency threshold.`, 'error');
                      }
                    }}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    Submit Exam & Verify Competency
                  </button>
                </div>
              )}

              {/* Results & Certificate */}
              {quizScore !== null && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border text-center ${
                    quizScore >= 66 ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : 'bg-rose-950/60 border-rose-500 text-rose-300'
                  }`}>
                    <span className="text-2xl font-black block">{quizScore}%</span>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {quizScore >= 66 ? 'Official Competency Verified' : 'Competency Threshold Not Met'}
                    </span>
                  </div>

                  {quizScore >= 66 && (
                    <div className="bg-white text-slate-900 p-6 rounded-2xl border-4 border-emerald-500 space-y-4 shadow-2xl relative overflow-hidden">
                      <div className="absolute right-2 top-2 opacity-5 text-slate-900 pointer-events-none">
                        <Award className="w-48 h-48" />
                      </div>
                      <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-600 font-black block">SYSTO BIZ OPERATIONAL COMPLIANCE</span>
                          <h3 className="text-lg font-black text-slate-900">Certificate of SOP Operational Compliance</h3>
                        </div>
                        <ShieldCheck className="w-8 h-8 text-emerald-600" />
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        This digital document certifies that <strong>{activeTrainingRecord.employeeName}</strong> has thoroughly reviewed, validated, and successfully passed the quality gate examination for:
                      </p>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-xs font-extrabold text-slate-900 block">{activeTrainingRecord.sopTitle}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ISO 9001:2026 Process Verification Standard</span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
                        <span>CODE: {certifiedCode || 'SYSTO-CERT-9001'}</span>
                        <span>ISSUED: {new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  {quizScore < 66 && (
                    <button
                      onClick={() => {
                        setQuizScore(null);
                        setQuizAnswers({});
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retake Examination
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SOPTrainingPage;
