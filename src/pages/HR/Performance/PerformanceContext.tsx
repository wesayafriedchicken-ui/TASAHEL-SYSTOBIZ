import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useHRContext } from '../HRContext';
import { Employee, Department } from '../../../types';
import { saveCustomFieldValues } from '../../../components/HR/CustomFieldsManager';

export interface PerformanceContextType {
  // Live Evaluations List & Calculation
  liveEvaluations: any[];
  setLiveEvaluations: React.Dispatch<React.SetStateAction<any[]>>;
  isLoadingLiveEvaluations: boolean;
  fetchLiveEvaluations: (start?: string, end?: string, deptId?: number | 'all') => Promise<void>;

  // Filters & Views
  perfFilterStartDate: string;
  setPerfFilterStartDate: (val: string) => void;
  perfFilterEndDate: string;
  setPerfFilterEndDate: (val: string) => void;
  perfFilterDept: number | 'all';
  setPerfFilterDept: (val: number | 'all') => void;
  perfFilterEmployee: string;
  setPerfFilterEmployee: (val: string) => void;
  performanceViewMode: 'board' | 'list';
  setPerformanceViewMode: (val: 'board' | 'list') => void;
  advancedFilteredPerformance: any[] | null;
  setAdvancedFilteredPerformance: (val: any[] | null) => void;

  // Review Form & Custom Fields
  reviewFormData: any;
  setReviewFormData: React.Dispatch<React.SetStateAction<any>>;
  resetReviewFormData: (empId?: number) => void;
  performanceCustomFieldValues: any;
  setPerformanceCustomFieldValues: (val: any) => void;
  handleSubmitReview: (e: React.FormEvent, customData?: any) => Promise<boolean>;
  handleEvaluateEmployee: (emp: Employee) => Promise<any>;

  // Performance Analysis Hub Single Employee
  performanceAnalysis: any;
  setPerformanceAnalysis: React.Dispatch<React.SetStateAction<any>>;
  analyzedEmployee: Employee | null;
  setAnalyzedEmployee: React.Dispatch<React.SetStateAction<Employee | null>>;
  analysisStartDate: string;
  setAnalysisStartDate: (val: string) => void;
  analysisEndDate: string;
  setAnalysisEndDate: (val: string) => void;
  isRefreshingAnalysis: boolean;
  fetchAnalysisWithDates: (empId: number, start: string, end: string) => Promise<any>;

  // Commission Engine Calculation
  calculateCommissionForEmployee: (employeeId: number, wonCount: number, wonValue: number) => {
    amount: number;
    formula: string;
    description: string;
    wonCount: number;
    wonValue: number;
  };
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export const usePerformanceContext = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
};

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    currentUser, 
    fetchData, 
    showCustomToast, 
    fetchTabData,
    employees
  } = useHRContext();

  // Filters State
  const [perfFilterStartDate, setPerfFilterStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [perfFilterEndDate, setPerfFilterEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [perfFilterDept, setPerfFilterDept] = useState<number | 'all'>('all');
  const [perfFilterEmployee, setPerfFilterEmployee] = useState('');
  const [performanceViewMode, setPerformanceViewMode] = useState<'board' | 'list'>('board');
  const [advancedFilteredPerformance, setAdvancedFilteredPerformance] = useState<any[] | null>(null);

  // Live Performance State
  const [liveEvaluations, setLiveEvaluations] = useState<any[]>([]);
  const [isLoadingLiveEvaluations, setIsLoadingLiveEvaluations] = useState(false);

  // Analysis Hub State
  const [performanceAnalysis, setPerformanceAnalysis] = useState<any>(null);
  const [analyzedEmployee, setAnalyzedEmployee] = useState<Employee | null>(null);
  const [analysisStartDate, setAnalysisStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [analysisEndDate, setAnalysisEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isRefreshingAnalysis, setIsRefreshingAnalysis] = useState(false);

  // Review Form Data State
  const [performanceCustomFieldValues, setPerformanceCustomFieldValues] = useState<any>({});
  const [reviewFormData, setReviewFormData] = useState<any>({
    id: null,
    user_id: '',
    period: 'Quarterly',
    score: 8.5,
    productivity_rate: 85,
    strengths: '',
    areas_for_improvement: '',
    status: 'Finalized',
    created_at: new Date().toISOString().slice(0, 16)
  });

  const resetReviewFormData = useCallback((empId?: number) => {
    setReviewFormData({
      id: null,
      user_id: empId || '',
      period: 'Quarterly',
      score: 8.5,
      productivity_rate: 85,
      strengths: '',
      areas_for_improvement: '',
      status: 'Finalized',
      created_at: new Date().toISOString().slice(0, 16)
    });
    setPerformanceCustomFieldValues({});
  }, []);

  // Ensure performance tab data is loaded
  useEffect(() => {
    fetchTabData('performance').catch(() => null);
  }, [fetchTabData]);

  // Fetch Live Evaluations
  const fetchLiveEvaluations = useCallback(async (start?: string, end?: string, deptId?: number | 'all') => {
    setIsLoadingLiveEvaluations(true);
    try {
      const s = start || perfFilterStartDate;
      const e = end || perfFilterEndDate;
      const d = deptId || perfFilterDept;
      let url = `/api/hr/performance/evaluate-all?startDate=${s}&endDate=${e}`;
      if (d !== 'all') {
        url += `&departmentId=${d}`;
      }
      const headers = { 'x-user-id': currentUser?.id?.toString() || '1' };
      const res = await fetch(url, { headers });
      if (res.ok) {
        const evals = await res.json();
        if (Array.isArray(evals)) {
          setLiveEvaluations(evals);
        }
      }
    } catch (err) {
      console.error('Failed to fetch live evaluations:', err);
    } finally {
      setIsLoadingLiveEvaluations(false);
    }
  }, [perfFilterStartDate, perfFilterEndDate, perfFilterDept, currentUser]);

  // Initial fetch of live evaluations
  useEffect(() => {
    fetchLiveEvaluations().catch(() => null);
  }, [fetchLiveEvaluations]);

  // Single Employee Analysis Fetch
  const fetchAnalysisWithDates = useCallback(async (empId: number, start: string, end: string) => {
    try {
      setIsRefreshingAnalysis(true);
      const url = `/api/hr/performance/evaluate/${empId}?startDate=${start}&endDate=${end}`;
      const res = await fetch(url, {
        headers: { 'x-user-id': currentUser?.id?.toString() || '1' }
      });
      if (res.ok) {
        const data = await res.json();
        setPerformanceAnalysis(data);
        const emp = employees.find(e => e.id === empId) || null;
        if (emp) setAnalyzedEmployee(emp);
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
    } finally {
      setIsRefreshingAnalysis(false);
    }
  }, [currentUser, employees]);

  // Evaluate Employee Helper
  const handleEvaluateEmployee = useCallback(async (emp: Employee) => {
    try {
      const res = await fetch(`/api/hr/performance/evaluate/${emp.id}`, {
        headers: { 'x-user-id': currentUser?.id?.toString() || '1' }
      });
      if (res.ok) {
        const result = await res.json();
        const kpiText = result.hasKpis 
          ? ` | Active KPIs achievement: ${result.kpiRate.toFixed(1)}% across ${result.kpis.length} KPIs.`
          : '';
        const populatedData = {
          id: null,
          user_id: emp.id,
          period: result.period || 'Quarterly',
          score: parseFloat(result.score.toFixed(1)),
          productivity_rate: Math.round(result.productivity_rate),
          strengths: `Total Tasks: ${result.total_tasks}, Completed: ${result.completed_tasks}${kpiText}`,
          areas_for_improvement: result.hasKpis ? 'Keep up with the high-performance KPI standards.' : 'Link more KPIs to track quantitative results.',
          status: 'Finalized',
          created_at: new Date().toISOString().slice(0, 16)
        };
        setReviewFormData(populatedData);
        return populatedData;
      }
    } catch (err) {
      console.error('Failed to run automated evaluation:', err);
    }
  }, [currentUser]);

  // Submit Review Handler
  const handleSubmitReview = useCallback(async (e: React.FormEvent, customData?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    const dataToSubmit = customData || reviewFormData;
    try {
      const res = await fetch('/api/hr/performance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify({ ...dataToSubmit, reviewer_id: currentUser?.id })
      });
      if (res.ok) {
        let savedId = dataToSubmit.id;
        try {
          const result = await res.json();
          savedId = result.id || (Array.isArray(result) ? result[0]?.id : null) || savedId;
        } catch (e) {}
        if (savedId && Object.keys(performanceCustomFieldValues).length > 0) {
          await saveCustomFieldValues(savedId, performanceCustomFieldValues);
        }
        await fetchData();
        fetchLiveEvaluations().catch(() => null);
        showCustomToast('Performance appraisal saved successfully!', 'success');
        return true;
      } else {
        showCustomToast('Failed to save performance appraisal', 'error');
        return false;
      }
    } catch (err) {
      console.error('Failed to save performance review:', err);
      showCustomToast('Failed to save performance appraisal', 'error');
      return false;
    }
  }, [reviewFormData, performanceCustomFieldValues, currentUser, fetchData, fetchLiveEvaluations, showCustomToast]);

  // Commission Engine
  const calculateCommissionForEmployee = useCallback((employeeId: number, wonCount: number, wonValue: number) => {
    let settings = {
      activeScheme: 'revenue_fixed',
      profitCostPercentage: 15,
      revenueFixedPercentage: 3.5,
      volumeCalculationType: 'flat',
      volumeTiers: [
        { min: 1, max: 5, rate: 250 },
        { min: 6, max: 15, rate: 450 },
        { min: 16, max: 999999, rate: 700 }
      ],
      revenueCalculationType: 'flat',
      revenueTiers: [
        { min: 1, max: 50000, rate: 2.0 },
        { min: 50001, max: 200000, rate: 4.5 },
        { min: 200001, max: 99999999, rate: 7.0 }
      ],
      repOverrides: {} as Record<number, { customCost?: number; customCostPercentage?: number }>
    };

    const saved = localStorage.getItem('crm_commission_settings');
    if (saved) {
      try {
        settings = JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }

    const { activeScheme } = settings;
    let amount = 0;
    let description = '';
    let formula = '';

    switch (activeScheme) {
      case 'revenue_fixed': {
        const rate = settings.revenueFixedPercentage || 0;
        amount = wonValue * (rate / 100);
        formula = `${wonValue.toLocaleString()} × ${rate}%`;
        description = `Fixed percentage (${rate}%) of total revenue won.`;
        break;
      }
      case 'volume_tiers': {
        const tiers = [...settings.volumeTiers].sort((a, b) => a.min - b.min);
        const type = settings.volumeCalculationType;

        if (type === 'flat') {
          const matched = tiers.find(t => wonCount >= t.min && wonCount <= t.max) || 
                          tiers.filter(t => wonCount >= t.min).pop();
          const rate = matched ? matched.rate : 0;
          amount = wonCount * rate;
          formula = `${wonCount} orders × EGP ${rate}/order (Flat Tier Mode)`;
          description = matched ? `Flat tier payout of EGP ${rate} per order because orders count is in range [${matched.min} - ${matched.max === 999999 ? '∞' : matched.max}].` : 'No tier matched.';
        } else {
          // Cumulative
          let calcSum = 0;
          let steps: string[] = [];
          tiers.forEach((t) => {
            if (wonCount >= t.min) {
              const countInTier = Math.min(wonCount, t.max) - (t.min - 1);
              if (countInTier > 0) {
                const tierPayout = countInTier * t.rate;
                calcSum += tierPayout;
                steps.push(`${countInTier} in Tier [${t.min}-${t.max === 999999 ? '∞' : t.max}] @ EGP ${t.rate}`);
              }
            }
          });
          amount = calcSum;
          formula = steps.join(' + ');
          description = `Cumulative payout calculated progressively across all tiers.`;
        }
        break;
      }
      case 'revenue_tiers': {
        const tiers = [...settings.revenueTiers].sort((a, b) => a.min - b.min);
        const type = settings.revenueCalculationType;

        if (type === 'flat') {
          const matched = tiers.find(t => wonValue >= t.min && wonValue <= t.max) || 
                          tiers.filter(t => wonValue >= t.min).pop();
          const rate = matched ? matched.rate : 0;
          amount = wonValue * (rate / 100);
          formula = `${wonValue.toLocaleString()} × ${rate}% (Flat Tier Mode)`;
          description = matched ? `Flat percentage of ${rate}% because revenue is in range [EGP ${matched.min.toLocaleString()} - EGP ${matched.max === 99999999 ? '∞' : matched.max.toLocaleString()}].` : 'No tier matched.';
        } else {
          let calcSum = 0;
          let steps: string[] = [];
          tiers.forEach((t) => {
            const minPortion = Math.min(t.max, wonValue);
            const portion = Math.max(0, minPortion - t.min);
            if (portion > 0) {
              const tierPayout = portion * (t.rate / 100);
              calcSum += tierPayout;
              steps.push(`EGP ${portion.toLocaleString()} in Tier [${t.min.toLocaleString()}-${t.max === 99999999 ? '∞' : t.max.toLocaleString()}] @ ${t.rate}%`);
            }
          });
          amount = calcSum;
          formula = steps.join(' + ');
          description = `Cumulative percentage calculated progressively across all revenue bands.`;
        }
        break;
      }
      default:
        break;
    }

    return {
      amount,
      formula,
      description,
      wonCount,
      wonValue
    };
  }, []);

  return (
    <PerformanceContext.Provider
      value={{
        liveEvaluations,
        setLiveEvaluations,
        isLoadingLiveEvaluations,
        fetchLiveEvaluations,
        perfFilterStartDate,
        setPerfFilterStartDate,
        perfFilterEndDate,
        setPerfFilterEndDate,
        perfFilterDept,
        setPerfFilterDept,
        perfFilterEmployee,
        setPerfFilterEmployee,
        performanceViewMode,
        setPerformanceViewMode,
        advancedFilteredPerformance,
        setAdvancedFilteredPerformance,
        reviewFormData,
        setReviewFormData,
        resetReviewFormData,
        performanceCustomFieldValues,
        setPerformanceCustomFieldValues,
        handleSubmitReview,
        handleEvaluateEmployee,
        performanceAnalysis,
        setPerformanceAnalysis,
        analyzedEmployee,
        setAnalyzedEmployee,
        analysisStartDate,
        setAnalysisStartDate,
        analysisEndDate,
        setAnalysisEndDate,
        isRefreshingAnalysis,
        fetchAnalysisWithDates,
        calculateCommissionForEmployee
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};
