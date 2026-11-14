import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Award, 
  ArrowLeft, 
  Cpu, 
  Sliders, 
  Target, 
  Check, 
  Workflow, 
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  Star,
  Users
} from 'lucide-react';
import { usePerformanceContext } from './PerformanceContext';
import { useHRContext } from '../HRContext';
import { CustomFieldsDisplay, CustomFieldsForm } from '../../../components/HR/CustomFieldsManager';
import { cn } from '../../../lib/utils';

export const NewPerformanceAppraisalPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employee_id');

  const { employees, departments, currentUser } = useHRContext();
  const { 
    reviewFormData, 
    setReviewFormData, 
    handleSubmitReview,
    performanceCustomFieldValues,
    setPerformanceCustomFieldValues
  } = usePerformanceContext();

  const [isResolvingScope, setIsResolvingScope] = useState(false);
  const [appliedRule, setAppliedRule] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sub-scores for dynamic weighting
  const [okrScore, setOkrScore] = useState<number>(85);
  const [managerScore, setManagerScore] = useState<number>(90);
  const [peerScore, setPeerScore] = useState<number>(80);
  const [subordinateScore, setSubordinateScore] = useState<number>(85);
  const [selfScore, setSelfScore] = useState<number>(85);
  const [competencyRatings, setCompetencyRatings] = useState<Record<string, number>>({});
  const [mboScore, setMboScore] = useState<number>(85);

  // Filter active employees only
  const activeEmployees = useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || 'active').toLowerCase().trim();
      return s === 'active';
    });
  }, [employees]);

  // If employeeId is passed via URL query, set it initially
  useEffect(() => {
    if (employeeIdParam) {
      const parsedId = parseInt(employeeIdParam);
      if (!isNaN(parsedId)) {
        setReviewFormData((prev: any) => ({
          ...prev,
          user_id: parsedId
        }));
      }
    }
  }, [employeeIdParam, setReviewFormData]);

  // When selected employee changes, resolve active engine rule
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
          team_name: (emp as any)?.team || ''
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

      totalWeighted = (okrScore * okrW) + (okrScore * kpiW);
      totalWeightPercent = okrW + kpiW;
    } else if (code === 'hybrid') {
      const okrW = weights.okrs ?? 40;
      const f360W = weights['360'] ?? 30;
      const compW = weights.competencies ?? 15;
      const mboW = weights.mbo ?? 15;

      const compVals = Object.values(competencyRatings);
      const avgComp = compVals.length > 0 ? compVals.reduce((a, b) => a + b, 0) / compVals.length : 85;
      const avg360 = (managerScore + peerScore + selfScore) / 3;

      totalWeighted = (okrScore * okrW) + (avg360 * f360W) + (avgComp * compW) + (mboScore * mboW);
      totalWeightPercent = okrW + f360W + compW + mboW;
    } else {
      totalWeighted = managerScore * 100;
      totalWeightPercent = 100;
    }

    const calculatedScorePercent = totalWeightPercent > 0 ? totalWeighted / totalWeightPercent : 85;
    const finalScore10 = Math.min(10, Math.max(0, calculatedScorePercent / 10));

    const newScore = parseFloat(finalScore10.toFixed(1));
    const newRate = Math.round(calculatedScorePercent);

    setReviewFormData((prev: any) => {
      if (prev.score === newScore && prev.productivity_rate === newRate) {
        return prev;
      }
      return {
        ...prev,
        score: newScore,
        productivity_rate: newRate
      };
    });
  }, [
    okrScore, 
    managerScore, 
    peerScore, 
    subordinateScore, 
    selfScore, 
    competencyRatings, 
    mboScore, 
    appliedRule, 
    setReviewFormData
  ]);

  const selectedEmp = useMemo(() => {
    return employees.find(e => e.id === Number(reviewFormData.user_id));
  }, [employees, reviewFormData.user_id]);

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await handleSubmitReview(e);
      if (success) {
        navigate('/hr/performance');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Breadcrumb & Page Banner */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/performance')}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Back to Performance Core"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1b5e20] border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                Engine Guided Evaluation
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              New Employee Performance Appraisal
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Record periodic assessment based on configured appraisal engine rules, dynamic weights, and competencies.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/hr/performance')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Main Form Content */}
      <form onSubmit={onFormSubmit} className="space-y-6">
        
        {/* Step 1: Employee & Period Selector */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>1. Target Employee & Appraisal Cycle</span>
          </h3>

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
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
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
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
              >
                <option value="Draft">Draft Review</option>
                <option value="In Approval">In Approval Chain</option>
                <option value="Finalized">Finalized & Approved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Active Rule & Rating Matrix */}
        {selectedEmp && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1b5e20] flex items-center justify-center font-black text-xs">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Applied Appraisal Engine Rule
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Resolved for {selectedEmp.name} ({selectedEmp.job_title || 'General Role'})
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#1b5e20] text-[10px] font-black uppercase tracking-wider border border-emerald-200 self-start sm:self-auto">
                {appliedRule?.framework_code?.toUpperCase() || 'HYBRID'} FRAMEWORK
              </span>
            </div>

            {/* Weights Pills */}
            <div className="space-y-2">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Applied Component Weights:
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(appliedRule?.evaluation_weights || { okrs: 40, '360': 30, competencies: 15, mbo: 15 }).map(([key, val]) => (
                  <span key={key} className="px-3 py-1 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5">
                    <span className="text-slate-400 uppercase text-[10px]">{key}:</span>
                    <strong className="text-emerald-700">{String(val)}%</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Dynamic Rating Matrix Sliders */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Component Performance Scoring (تقييم المكونات الفرعية)</span>
              </div>

              {/* OKRs / KPIs rating */}
              <div className="space-y-1.5 bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5 text-blue-800">
                    <Target className="w-4 h-4 text-blue-600" />
                    OKRs & Live KPI Target Achievement
                  </span>
                  <span className="font-mono font-black text-blue-700 text-sm">{okrScore}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={okrScore}
                  onChange={e => setOkrScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* 360 Feedback Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="text-purple-800">Direct Manager Assessment</span>
                    <span className="font-mono font-black text-purple-700 text-sm">{managerScore}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={managerScore}
                    onChange={e => setManagerScore(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <div className="space-y-1.5 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="text-indigo-800">Peer Reviews Average</span>
                    <span className="font-mono font-black text-indigo-700 text-sm">{peerScore}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={peerScore}
                    onChange={e => setPeerScore(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              {/* Competencies Sliders */}
              {appliedRule?.competencies?.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Role Competencies Ratings:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {appliedRule.competencies.map((comp: string) => (
                      <div key={comp} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="truncate max-w-[200px]">{comp}</span>
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

            {/* Live Calculated Final Score Banner */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-[#1b5e20] text-white rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                  Engine Calculated Weighted Final Score
                </p>
                <p className="text-4xl font-black mt-1">
                  {reviewFormData.score?.toFixed(1) || '8.5'}
                  <span className="text-lg font-medium text-emerald-200/80"> / 10</span>
                </p>
                <p className="text-xs text-slate-300 mt-1 font-medium">
                  Equivalent Productivity Rate: <strong className="text-emerald-300">{reviewFormData.productivity_rate}%</strong>
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black">
                ⭐
              </div>
            </div>

            {/* Approval Workflow Chain Preview */}
            {appliedRule?.approval_workflow?.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Required Approval Chain:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700">
                  {appliedRule.approval_workflow.map((step: string, idx: number) => (
                    <React.Fragment key={idx}>
                      <span className="px-3 py-1 bg-slate-100 rounded-xl border border-slate-200 text-slate-800">
                        {idx + 1}. {step}
                      </span>
                      {idx < appliedRule.approval_workflow.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Qualitative Comments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
            3. Qualitative Evaluation & Feedback
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Key Strengths & Notable Achievements
            </label>
            <textarea 
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
              rows={3}
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
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
              rows={3}
              placeholder="Improve sprint task completion speed, attend advanced certification..."
              value={reviewFormData.areas_for_improvement || ''}
              onChange={e => setReviewFormData({ ...reviewFormData, areas_for_improvement: e.target.value })}
            />
          </div>
        </div>

        {/* Custom Fields */}
        {reviewFormData.id && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
            <CustomFieldsDisplay entityType="performance" entityId={reviewFormData.id} />
          </div>
        )}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
          <CustomFieldsForm 
            entityType="performance" 
            entityId={reviewFormData.id || null} 
            onChange={setPerformanceCustomFieldValues} 
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button 
            type="button"
            onClick={() => navigate('/hr/performance')}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting || !reviewFormData.user_id}
            className="flex-1 py-3 bg-[#1b5e20] hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Appraisal...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save & Submit Appraisal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPerformanceAppraisalPage;
