import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Award, 
  Users, 
  Target, 
  Sparkles, 
  Workflow, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Sliders, 
  Calendar, 
  Check, 
  Info, 
  Cpu, 
  Star,
  Layers,
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface PerformanceEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewFormData: any;
  setReviewFormData: (data: any) => void;
  employees: any[];
  departments: any[];
  currentUser: any;
  handleSubmitReview: (e: React.FormEvent) => Promise<void>;
  performanceCustomFieldValues?: any;
  setPerformanceCustomFieldValues?: (val: any) => void;
  CustomFieldsDisplay?: React.ComponentType<any>;
  CustomFieldsForm?: React.ComponentType<any>;
}

export const PerformanceEvaluationModal: React.FC<PerformanceEvaluationModalProps> = ({
  isOpen,
  onClose,
  reviewFormData,
  setReviewFormData,
  employees,
  departments,
  currentUser,
  handleSubmitReview,
  performanceCustomFieldValues,
  setPerformanceCustomFieldValues,
  CustomFieldsDisplay,
  CustomFieldsForm
}) => {
  const [isResolvingScope, setIsResolvingScope] = useState(false);
  const [appliedRule, setAppliedRule] = useState<any>(null);
  
  // Filter active employees only
  const activeEmployees = React.useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || 'active').toLowerCase().trim();
      return s === 'active';
    });
  }, [employees]);
  
  // Sub-scores for dynamic weighting
  const [okrScore, setOkrScore] = useState<number>(85);
  const [managerScore, setManagerScore] = useState<number>(90);
  const [peerScore, setPeerScore] = useState<number>(80);
  const [subordinateScore, setSubordinateScore] = useState<number>(85);
  const [selfScore, setSelfScore] = useState<number>(85);
  const [competencyRatings, setCompetencyRatings] = useState<Record<string, number>>({});
  const [mboScore, setMboScore] = useState<number>(85);

  // When selected employee changes, resolve active rule
  useEffect(() => {
    if (reviewFormData?.user_id) {
      resolveScopeRule(reviewFormData.user_id);
    }
  }, [reviewFormData?.user_id]);

  const resolveScopeRule = async (userId: number) => {
    setIsResolvingScope(true);
    const emp = employees.find(e => e.id === userId);
    try {
      const res = await fetch('/api/hr/performance/evaluate-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          department_id: emp?.department_id,
          job_title: emp?.job_title,
          team_name: emp?.team || ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAppliedRule(data.applied_rule);
        
        // Initialize competency ratings
        if (data.applied_rule?.competencies?.length > 0) {
          const initialComp: Record<string, number> = {};
          data.applied_rule.competencies.forEach((comp: string) => {
            initialComp[comp] = 85;
          });
          setCompetencyRatings(initialComp);
        }
      }
    } catch (err) {
      console.error('Failed to resolve scope rule:', err);
    } finally {
      setIsResolvingScope(false);
    }
  };

  // Recalculate composite score live
  useEffect(() => {
    if (!appliedRule) return;

    const weights = appliedRule.evaluation_weights || {};
    const code = appliedRule.framework_code || 'hybrid';
    let totalWeighted = 0;
    let totalWeightPercent = 0;

    if (code === '360') {
      const mgrW = weights.manager ?? 40;
      const peerW = weights.peers ?? 30;
      const subW = weights.subordinates ?? 15;
      const selfW = weights.self ?? 15;

      totalWeighted = (managerScore * mgrW) + (peerScore * peerW) + (subordinateScore * subW) + (selfScore * selfW);
      totalWeightPercent = mgrW + peerW + subW + selfW;
    } else if (code === 'okrs') {
      const okrW = weights.okrs ?? 70;
      const kpiW = weights.kpis ?? 30;

      totalWeighted = (okrScore * okrW) + (okrScore * kpiW); // fallback
      totalWeightPercent = okrW + kpiW;
    } else if (code === 'hybrid') {
      const okrW = weights.okrs ?? 40;
      const f360W = weights['360'] ?? 30;
      const compW = weights.competencies ?? 15;
      const mboW = weights.mbo ?? 15;

      // Avg competency score
      const compVals = Object.values(competencyRatings);
      const avgComp = compVals.length > 0 ? compVals.reduce((a, b) => a + b, 0) / compVals.length : 85;

      // Avg 360 score
      const avg360 = (managerScore + peerScore + selfScore) / 3;

      totalWeighted = (okrScore * okrW) + (avg360 * f360W) + (avgComp * compW) + (mboScore * mboW);
      totalWeightPercent = okrW + f360W + compW + mboW;
    } else {
      totalWeighted = managerScore * 100;
      totalWeightPercent = 100;
    }

    const calculatedScorePercent = totalWeightPercent > 0 ? totalWeighted / totalWeightPercent : 85;
    const finalScore10 = Math.min(10, Math.max(0, calculatedScorePercent / 10));

    setReviewFormData({
      ...reviewFormData,
      score: parseFloat(finalScore10.toFixed(1)),
      productivity_rate: Math.round(calculatedScorePercent)
    });
  }, [okrScore, managerScore, peerScore, subordinateScore, selfScore, competencyRatings, mboScore, appliedRule]);

  if (!isOpen) return null;

  const selectedEmp = employees.find(e => e.id === reviewFormData.user_id);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[160] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-slate-800"
      >
        {/* Soothing Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
                  Engine Guided Evaluation
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                New Employee Performance Appraisal
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Record periodic assessment based on configured appraisal engine rules & weights.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmitReview} className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          
          {/* Employee & Period Selector */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Employee (الموظف المستهدف)
                </label>
                <select 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
                  value={reviewFormData.user_id || ''}
                  onChange={e => setReviewFormData({ ...reviewFormData, user_id: parseInt(e.target.value) || '' })}
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {activeEmployees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.job_title || 'Team Member'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Evaluation Cycle Period
                </label>
                <select 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
                  value={reviewFormData.period || 'Quarterly'}
                  onChange={e => setReviewFormData({ ...reviewFormData, period: e.target.value })}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly (Q1/Q2/Q3/Q4)</option>
                  <option value="Semi-Annually">Semi-Annually</option>
                  <option value="Annually">Annual Appraisal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Evaluation Date & Time
                </label>
                <input 
                  type="datetime-local" 
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                  value={reviewFormData.created_at || new Date().toISOString().slice(0, 16)}
                  onChange={e => setReviewFormData({ ...reviewFormData, created_at: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Review Status
                </label>
                <select
                  value={reviewFormData.status || 'Finalized'}
                  onChange={e => setReviewFormData({ ...reviewFormData, status: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                >
                  <option value="Draft">Draft Review</option>
                  <option value="In Approval">In Approval Chain</option>
                  <option value="Finalized">Finalized & Approved</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTIVE RULE & FRAMEWORK BADGE CARD */}
          {selectedEmp && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#1b5e20] flex items-center justify-center font-black text-xs">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Applied Appraisal Engine Rule
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Matched for {selectedEmp.name} ({selectedEmp.job_title || 'General Role'})
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#1b5e20] text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                  {appliedRule?.framework_code?.toUpperCase() || 'HYBRID'} FRAMEWORK
                </span>
              </div>

              {/* Weights Pills */}
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Applied Component Weights:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(appliedRule?.evaluation_weights || { okrs: 40, '360': 30, competencies: 15, mbo: 15 }).map(([key, val]) => (
                    <span key={key} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                      {key.toUpperCase()}: <strong className="text-emerald-700">{String(val)}%</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* DYNAMIC RATING MATRIX INPUTS */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4 pt-3">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Component Performance Scoring (تقييم المكونات الفرعية)
                </div>

                {/* OKRs / KPIs rating */}
                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 text-blue-800">
                      <Target className="w-3.5 h-3.5 text-blue-600" />
                      OKRs & Live KPI Target Achievement
                    </span>
                    <span className="font-mono font-black text-blue-700">{okrScore}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={okrScore}
                    onChange={e => setOkrScore(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* 360 Feedback Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span className="text-purple-800">Direct Manager Assessment</span>
                      <span className="font-mono font-black text-purple-700">{managerScore}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={managerScore}
                      onChange={e => setManagerScore(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>

                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span className="text-indigo-800">Peer Reviews Average</span>
                      <span className="font-mono font-black text-indigo-700">{peerScore}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={peerScore}
                      onChange={e => setPeerScore(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>

                {/* Competencies Sliders */}
                {appliedRule?.competencies?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Role Competencies Ratings:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {appliedRule.competencies.map((comp: string) => (
                        <div key={comp} className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700">
                            <span className="truncate max-w-[180px]">{comp}</span>
                            <span className="text-emerald-700 font-mono font-black">{competencyRatings[comp] || 85}%</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            value={competencyRatings[comp] || 85}
                            onChange={e => setCompetencyRatings({ ...competencyRatings, [comp]: Number(e.target.value) })}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* LIVE CALCULATED FINAL COMPOSITE SCORE CARD */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-[#1b5e20] text-white rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                    Engine Calculated Weighted Final Score
                  </p>
                  <p className="text-3xl font-black mt-0.5">
                    {reviewFormData.score?.toFixed(1) || '8.5'}
                    <span className="text-sm font-medium text-emerald-200/80"> / 10</span>
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5 font-medium">
                    Equivalent Productivity Rate: <strong>{reviewFormData.productivity_rate}%</strong>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black">
                  ⭐
                </div>
              </div>

              {/* APPROVAL WORKFLOW CHAIN PREVIEW */}
              {appliedRule?.approval_workflow?.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Workflow className="w-3.5 h-3.5 text-emerald-600" />
                    Required Approval Chain:
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700">
                    {appliedRule.approval_workflow.map((step: string, idx: number) => (
                      <React.Fragment key={idx}>
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-800">
                          {idx + 1}. {step}
                        </span>
                        {idx < appliedRule.approval_workflow.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Qualitative Comments */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Key Strengths & Notable Achievements
              </label>
              <textarea 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                rows={2}
                placeholder="Exceeded Q2 sales targets, demonstrated strong team leadership..."
                value={reviewFormData.strengths || ''}
                onChange={e => setReviewFormData({ ...reviewFormData, strengths: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Areas for Improvement / Growth Objectives
              </label>
              <textarea 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                rows={2}
                placeholder="Improve sprint task completion speed, attend advanced certification..."
                value={reviewFormData.areas_for_improvement || ''}
                onChange={e => setReviewFormData({ ...reviewFormData, areas_for_improvement: e.target.value })}
              />
            </div>
          </div>

          {/* Custom Fields */}
          {reviewFormData.id && CustomFieldsDisplay && (
            <div className="pt-2 border-t border-slate-100">
              <CustomFieldsDisplay entityType="performance" entityId={reviewFormData.id} />
            </div>
          )}
          {CustomFieldsForm && setPerformanceCustomFieldValues && (
            <CustomFieldsForm 
              entityType="performance" 
              entityId={reviewFormData.id || null} 
              onChange={setPerformanceCustomFieldValues} 
            />
          )}

          {/* Form Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-2.5 bg-[#1b5e20] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Submit Appraisal</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
