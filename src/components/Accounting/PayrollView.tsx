import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, CheckCircle2, User, Sparkles, TrendingUp, Calendar, Zap, Trash2, 
  Edit2, LayoutGrid, List, Settings, AlertCircle, Filter, Coins, Users, 
  ArrowUpRight, Sliders, X, FileText, Check, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmployeeSalary, JournalEntry } from './AccountingTypes';

interface PayrollViewProps {
  baseCurrency: string;
  employees: EmployeeSalary[];
  crmDeals: any[];
  payrollExecuted: boolean;
  onExecutePayroll: () => void;
  payrollCycleStartDay?: number;
}

// Interfaces for live syncing
interface HREmployee {
  id: number;
  name: string;
  email: string;
  job_title: string;
  salary_base: number;
  allowances: number;
  status: string;
}

interface HRPayrollRecord {
  id: number;
  user_id: number;
  employee_name?: string;
  month: string;
  year: number;
  base_salary: number;
  allowances: number;
  deductions: number;
  bonuses: number;
  commissions: number;
  total_net: number;
  status: 'Draft' | 'Paid';
  created_at?: string;
}

interface CRMStage {
  id: number;
  name: string;
  is_won: boolean;
  color: string;
}

interface CRMDeal {
  id: number;
  title: string;
  value: number;
  stage_id: number;
  assigned_to: number;
  updated_at?: string;
  created_at?: string;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  baseCurrency,
  employees: defaultEmployees,
  crmDeals: defaultCrmDeals,
  payrollExecuted: defaultPayrollExecuted,
  onExecutePayroll,
  payrollCycleStartDay = 1
}) => {
  // ----------------------------------------
  // SUB-TAB NAVIGATION
  // ----------------------------------------
  const [subTab, setSubTab] = useState<'salaries' | 'commissions'>('salaries');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ----------------------------------------
  // TAB 1: SALARIES (HR PAYROLL INTEGRATION)
  // ----------------------------------------
  const [hrEmployees, setHrEmployees] = useState<HREmployee[]>([]);
  const [hrPayroll, setHrPayroll] = useState<HRPayrollRecord[]>([]);
  const [isCalculatingPayroll, setIsCalculatingPayroll] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState<number>(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState<number>(new Date().getFullYear());
  const [payrollViewMode, setPayrollViewMode] = useState<'board' | 'list'>('list');
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState<any | null>(null);
  const [showPayrollDeleteConfirm, setShowPayrollDeleteConfirm] = useState<number | null>(null);
  const [isHrLoading, setIsHrLoading] = useState(false);

  // ----------------------------------------
  // TAB 2: COMMISSIONS (SALES CRM INTEGRATION)
  // ----------------------------------------
  const [crmDeals, setCrmDeals] = useState<any[]>([]);
  const [crmStages, setCrmStages] = useState<CRMStage[]>([]);
  const [crmUsers, setCrmUsers] = useState<any[]>([]);
  const [isCrmLoading, setIsCrmLoading] = useState(false);
  const [ledgerStartDate, setLedgerStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // Default to first day of current month
    return d.toISOString().split('T')[0];
  });
  const [ledgerEndDate, setLedgerEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Recalculate automatic date range when payrollMonth, payrollYear, or payrollCycleStartDay changes
  useEffect(() => {
    const startDayVal = payrollCycleStartDay;
    let startStr: string;
    let endStr: string;

    if (startDayVal === 1) {
      // Standard calendar month
      const start = new Date(payrollYear, payrollMonth - 1, 1);
      const end = new Date(payrollYear, payrollMonth, 0); // last day of current month
      
      const formatLocal = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      startStr = formatLocal(start);
      endStr = formatLocal(end);
    } else {
      // Custom start day, e.g. 26.
      // Starts on Month-1 day 26, ends on Month day 25.
      let startYear = payrollYear;
      let startMonth = payrollMonth - 1; // 1-based minus 1 => index
      if (startMonth === 0) {
        startMonth = 12;
        startYear -= 1;
      }
      
      const start = new Date(startYear, startMonth - 1, startDayVal);
      const end = new Date(payrollYear, payrollMonth - 1, startDayVal - 1);

      const formatLocal = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      startStr = formatLocal(start);
      endStr = formatLocal(end);
    }

    setLedgerStartDate(startStr);
    setLedgerEndDate(endStr);
  }, [payrollMonth, payrollYear, payrollCycleStartDay]);

  // Read commission settings from shared localStorage
  const [commissionSettings, setCommissionSettings] = useState(() => {
    const saved = localStorage.getItem('crm_commission_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      activeScheme: 'revenue_fixed',
      revenueFixedPercentage: 5,
      volumeCalculationType: 'flat',
      volumeTiers: [
        { id: 'v1', min: 1, max: 100, rate: 10 },
        { id: 'v2', min: 101, max: 200, rate: 20 },
        { id: 'v3', min: 201, max: 999999, rate: 30 }
      ],
      revenueCalculationType: 'flat',
      revenueTiers: [
        { id: 'r1', min: 0, max: 50000, rate: 3 },
        { id: 'r2', min: 50001, max: 100000, rate: 6 },
        { id: 'r3', min: 100001, max: 99999999, rate: 10 }
      ],
      profitFixedPercentage: 10,
      profitCostPercentage: 70,
      profitCalculationType: 'flat',
      profitTiers: [
        { id: 'p1', min: 0, max: 20000, rate: 5 },
        { id: 'p2', min: 20001, max: 50000, rate: 10 },
        { id: 'p3', min: 50001, max: 99999999, rate: 15 }
      ],
      repOverrides: {} as { [repId: number]: { customCost?: number; customCostPercentage?: number } }
    };
  });

  // Load HR payroll and employees data
  const fetchHrData = useCallback(async () => {
    setIsHrLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '1'
      };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const [empRes, payRes] = await Promise.all([
        fetch('/api/hr/employees', { headers }),
        fetch('/api/hr/payroll', { headers })
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        const activeOnly = (empData || []).filter((e: any) => {
          const s = String(e.status || '').toLowerCase().trim();
          return s !== 'inactive' && s !== 'terminated' && s !== 'archived' && s !== 'disabled' && s !== 'deleted' && s !== 'suspended';
        });
        setHrEmployees(activeOnly);
      }
      if (payRes.ok) {
        const payData = await payRes.json();
        setHrPayroll(payData);
      }
    } catch (err) {
      console.error('Failed to load HR details:', err);
    } finally {
      setIsHrLoading(false);
    }
  }, []);

  // Load CRM deals, stages, and users data
  const fetchCrmData = useCallback(async () => {
    setIsCrmLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '1'
      };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const [dealsRes, stagesRes, adminRes] = await Promise.all([
        fetch('/api/crm/deals', { headers }),
        fetch('/api/crm/stages', { headers }),
        fetch('/api/admin/all', { headers })
      ]);

      if (dealsRes.ok) {
        const dData = await dealsRes.json();
        setCrmDeals(dData);
      }
      if (stagesRes.ok) {
        const sData = await stagesRes.json();
        setCrmStages(sData);
      }
      if (adminRes.ok) {
        const aData = await adminRes.json();
        if (aData.users) setCrmUsers(aData.users);
      }
    } catch (err) {
      console.error('Failed to load CRM details:', err);
    } finally {
      setIsCrmLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHrData();
    fetchCrmData();
  }, [fetchHrData, fetchCrmData]);

  // HR PAYROLL ACTIONS
  const handleCalculateAllPayroll = async () => {
    if (hrEmployees.length === 0) {
      triggerToast('لا يوجد موظفون لحساب الرواتب لهم حالياً.', 'error');
      return;
    }
    setIsCalculatingPayroll(true);
    try {
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '1'
      };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      for (const emp of hrEmployees) {
        const res = await fetch(`/api/hr/payroll/preview/${emp.id}?month=${payrollMonth}&year=${payrollYear}&startDay=${payrollCycleStartDay}`, { headers });
        if (res.ok) {
          const preview = await res.json();
          await fetch('/api/hr/payroll', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...preview,
              status: 'Draft'
            })
          });
        }
      }
      triggerToast('تم احتساب مسودة الرواتب لجميع الموظفين بنجاح.');
      fetchHrData();
    } catch (err) {
      console.error('Failed to calculate payroll:', err);
      triggerToast('فشل احتساب مسودة الرواتب للموظفين.', 'error');
    } finally {
      setIsCalculatingPayroll(false);
    }
  };

  const handleUpdatePayrollStatus = async (user_id: number, status: 'Draft' | 'Paid') => {
    const record = hrPayroll.find(p => p.user_id === user_id && parseInt(p.month as string, 10) === payrollMonth && p.year === payrollYear);
    if (!record) return;

    try {
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '1'
      };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/hr/payroll', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...record,
          status
        })
      });
      if (res.ok) {
        triggerToast(status === 'Paid' ? 'تم اعتماد صرف الراتب بنجاح!' : 'تم إعادة الراتب إلى مسودة.');
        fetchHrData();
      }
    } catch (err) {
      console.error('Failed to update payroll status:', err);
      triggerToast('فشل تحديث حالة صرف الراتب.', 'error');
    }
  };

  const handleSavePayrollEdit = async () => {
    if (!selectedPayrollRecord) return;
    try {
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '1'
      };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/hr/payroll', {
        method: 'POST',
        headers,
        body: JSON.stringify(selectedPayrollRecord)
      });
      if (res.ok) {
        triggerToast('تم تحديث تفاصيل مسودة راتب الموظف بنجاح.');
        setSelectedPayrollRecord(null);
        fetchHrData();
      } else {
        triggerToast('فشل تحديث سجل تفاصيل الراتب.', 'error');
      }
    } catch (err) {
      console.error('Failed to save payroll:', err);
      triggerToast('فشل حفظ التعديلات على تفاصيل الراتب.', 'error');
    }
  };

  const handleDeletePayrollRecord = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '1'
      };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/hr/payroll/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        triggerToast('تم حذف مسودة راتب الموظف بالكامل.');
        setShowPayrollDeleteConfirm(null);
        fetchHrData();
      } else {
        triggerToast('فشل حذف سجل الراتب.', 'error');
      }
    } catch (err) {
      console.error('Failed to delete payroll record:', err);
      triggerToast('فشل محو سجل الراتب المالي.', 'error');
    }
  };

  // HR Board / List classification
  const unprocessedEmployees = useMemo(() => {
    return hrEmployees.filter(emp => {
      const record = hrPayroll.find(p => p.user_id === emp.id && parseInt(p.month as string, 10) === payrollMonth && p.year === payrollYear);
      return !record;
    });
  }, [hrEmployees, hrPayroll, payrollMonth, payrollYear]);

  const draftPayroll = useMemo(() => {
    return hrEmployees.map(emp => {
      const pr = hrPayroll.find(p => p.user_id === emp.id && parseInt(p.month as string, 10) === payrollMonth && p.year === payrollYear);
      return pr && pr.status === 'Draft' ? { emp, pr } : null;
    }).filter((item): item is { emp: HREmployee; pr: HRPayrollRecord } => item !== null);
  }, [hrEmployees, hrPayroll, payrollMonth, payrollYear]);

  const paidPayroll = useMemo(() => {
    return hrEmployees.map(emp => {
      const pr = hrPayroll.find(p => p.user_id === emp.id && parseInt(p.month as string, 10) === payrollMonth && p.year === payrollYear);
      return pr && pr.status === 'Paid' ? { emp, pr } : null;
    }).filter((item): item is { emp: HREmployee; pr: HRPayrollRecord } => item !== null);
  }, [hrEmployees, hrPayroll, payrollMonth, payrollYear]);


  // ----------------------------------------
  // TAB 2: CRM INCENTIVES DERIVATION
  // ----------------------------------------
  const filteredWonDealsByDate = useMemo(() => {
    return crmDeals.filter(d => {
      const stage = crmStages.find(s => s.id === d.stage_id);
      const isWon = stage && (stage.is_won || stage.name === 'Won' || stage.name.includes('🟢') || stage.name.toLowerCase().includes('won') || d.stage_name === 'Closed Won' || d.status === 'Won');
      if (!isWon) return false;

      const dateStr = d.updated_at || d.created_at;
      if (!dateStr) return true;
      const dealDate = new Date(dateStr);
      
      const start = new Date(ledgerStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(ledgerEndDate);
      end.setHours(23, 59, 59, 999);

      if (isNaN(dealDate.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) return true;

      return dealDate >= start && dealDate <= end;
    });
  }, [crmDeals, crmStages, ledgerStartDate, ledgerEndDate]);

  const calculateCommissionForRep = useCallback((rep: any) => {
    const { activeScheme } = commissionSettings;
    const wonCount = rep.wonCount || 0;
    const wonValue = rep.wonValue || 0;

    const repOverride = commissionSettings.repOverrides?.[rep.id] || {};
    const costPercentage = repOverride.customCostPercentage !== undefined ? repOverride.customCostPercentage : (commissionSettings.profitCostPercentage || 70);
    const totalCost = repOverride.customCost !== undefined ? repOverride.customCost : (wonValue * (costPercentage / 100));
    const netProfit = Math.max(0, wonValue - totalCost);

    let amount = 0;
    let description = '';
    let formula = '';
    let matchedTierName = 'N/A';

    switch (activeScheme) {
      case 'revenue_fixed': {
        const rate = commissionSettings.revenueFixedPercentage || 0;
        amount = wonValue * (rate / 100);
        formula = `${wonValue.toLocaleString()} × ${rate}%`;
        description = `نسبة ثابتة بنسبة (${rate}%) من إجمالي الإيرادات المحققة.`;
        break;
      }
      case 'volume_tiers': {
        const tiers = [...(commissionSettings.volumeTiers || [])].sort((a, b) => a.min - b.min);
        const type = commissionSettings.volumeCalculationType || 'flat';

        if (type === 'flat') {
          const matched = tiers.find(t => wonCount >= t.min && wonCount <= t.max) || 
                          tiers.filter(t => wonCount >= t.min).pop();
          const rate = matched ? matched.rate : 0;
          amount = wonCount * rate;
          matchedTierName = matched ? `شريحة (${matched.min}-${matched.max === 999999 ? '∞' : matched.max})` : 'بلا شريحة';
          formula = `${wonCount} صفقة × ${rate} لكل صفقة (Flat Tier)`;
          description = matched ? `صرف عمولة بقيمة ثابتة ${rate} لجميع الصفقات لأن عدد الصفقات يقع في المدى [${matched.min} - ${matched.max === 999999 ? '∞' : matched.max}].` : 'لم يتم مواءمة أي شريحة.';
        } else {
          let temp = wonCount;
          let calcSum = 0;
          let steps: string[] = [];
          tiers.forEach((t) => {
            const minPortion = Math.min(t.max, temp);
            const portion = Math.max(0, minPortion - t.min + 1);
            if (portion > 0) {
              calcSum += portion * t.rate;
              steps.push(`${portion} صفقة في شريحة [${t.min}-${t.max === 999999 ? '∞' : t.max}] بمعدل ${t.rate}`);
            }
          });
          amount = calcSum;
          formula = steps.join(' + ');
          description = `حساب تصاعدي تراكبي للعمولة بناءً على عدد الصفقات لكل مستوى.`;
        }
        break;
      }
      case 'revenue_tiers': {
        const tiers = [...(commissionSettings.revenueTiers || [])].sort((a, b) => a.min - b.min);
        const type = commissionSettings.revenueCalculationType || 'flat';

        if (type === 'flat') {
          const matched = tiers.find(t => wonValue >= t.min && wonValue <= t.max) || 
                          tiers.filter(t => wonValue >= t.min).pop();
          const rate = matched ? matched.rate : 0;
          amount = wonValue * (rate / 100);
          matchedTierName = matched ? `شريحة (${matched.min.toLocaleString()}-${matched.max === 99999999 ? '∞' : matched.max.toLocaleString()})` : 'بلا شريحة';
          formula = `${wonValue.toLocaleString()} × ${rate}% (Flat Tier)`;
          description = matched ? `نسبة عمولة ثابتة بمقدار ${rate}% لأن حجم المبيعات يقع في شريحة [${matched.min.toLocaleString()} - ${matched.max === 99999999 ? '∞' : matched.max.toLocaleString()}].` : 'لم تطابق أي شريحة.';
        } else {
          let calcSum = 0;
          let steps: string[] = [];
          tiers.forEach((t) => {
            const minPortion = Math.min(t.max, wonValue);
            const portion = Math.max(0, minPortion - t.min);
            if (portion > 0) {
              const tierPayout = portion * (t.rate / 100);
              calcSum += tierPayout;
              steps.push(`${portion.toLocaleString()} في الشريحة [${t.min.toLocaleString()}-${t.max === 99999999 ? '∞' : t.max.toLocaleString()}] بمقدار ${t.rate}%`);
            }
          });
          amount = calcSum;
          formula = steps.join(' + ');
          description = `معدل تراكمي تدرجي محسوب عبر شرائح الإيرادات المختلفة.`;
        }
        break;
      }
      case 'profit_fixed': {
        const rate = commissionSettings.profitFixedPercentage || 0;
        amount = netProfit * (rate / 100);
        formula = `${netProfit.toLocaleString()} (صافي الربح) × ${rate}%`;
        description = `حصة ثابتة بنسبة (${rate}%) من صافي الربح المحقق. يتم احتساب الربح بخصم التكاليف المقدرة من المبيعات.`;
        break;
      }
      case 'profit_tiers': {
        const tiers = [...(commissionSettings.profitTiers || [])].sort((a, b) => a.min - b.min);
        const type = commissionSettings.profitCalculationType || 'flat';

        if (type === 'flat') {
          const matched = tiers.find(t => netProfit >= t.min && netProfit <= t.max) || 
                          tiers.filter(t => netProfit >= t.min).pop();
          const rate = matched ? matched.rate : 0;
          amount = netProfit * (rate / 100);
          matchedTierName = matched ? `شريحة (${matched.min.toLocaleString()}-${matched.max === 99999999 ? '∞' : matched.max.toLocaleString()})` : 'بلا شريحة';
          formula = `${netProfit.toLocaleString()} (الربح) × ${rate}%`;
          description = matched ? `نسبة ثابتة بمعدل ${rate}% لأن صافي الأرباح المحققة يقع في الشريحة المحددة.` : 'لم تطابق أي شريحة.';
        } else {
          let calcSum = 0;
          let steps: string[] = [];
          tiers.forEach((t) => {
            const minPortion = Math.min(t.max, netProfit);
            const portion = Math.max(0, minPortion - t.min);
            if (portion > 0) {
              const tierPayout = portion * (t.rate / 100);
              calcSum += tierPayout;
              steps.push(`${portion.toLocaleString()} في الشريحة [${t.min.toLocaleString()}-${t.max === 99999999 ? '∞' : t.max.toLocaleString()}] بمقدار ${t.rate}%`);
            }
          });
          amount = calcSum;
          formula = steps.join(' + ');
          description = `معدل تراكمي محسوب تدريجياً عبر فئات الأرباح المختلفة.`;
        }
        break;
      }
      default:
        break;
    }

    return { amount, formula, description, matchedTierName };
  }, [commissionSettings]);

  const incentiveLedgerPerformance = useMemo(() => {
    return crmUsers.map(user => {
      const repDeals = crmDeals.filter(d => d.assigned_to === user.id);
      const wonRepDeals = repDeals.filter(d => {
        return filteredWonDealsByDate.some(fd => fd.id === d.id);
      });

      const totalValueWon = wonRepDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const avDealSize = wonRepDeals.length > 0 ? Math.round(totalValueWon / wonRepDeals.length) : 0;

      return {
        id: user.id,
        name: user.name,
        role: user.role_name || 'ممثل مبيعات',
        wonCount: wonRepDeals.length,
        wonValue: totalValueWon,
        averageSize: avDealSize
      };
    }).sort((a, b) => b.wonValue - a.wonValue);
  }, [crmUsers, crmDeals, filteredWonDealsByDate]);

  const fmt = (num: number) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-right" dir="rtl">
      
      {/* A. TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '50%' }}
            animate={{ opacity: 1, y: 0, x: '50%' }}
            exit={{ opacity: 0, y: -20, x: '50%' }}
            className="fixed top-6 right-1/2 translate-x-1/2 z-[150] bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-semibold text-xs text-right"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {toast.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            </div>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* B. SUB-TAB BAR */}
      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200/50 w-full max-w-xl mx-auto mb-6 gap-2">
        <button
          onClick={() => setSubTab('salaries')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'salaries'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>رواتب الموظفين (HR Payroll)</span>
        </button>
        <button
          onClick={() => setSubTab('commissions')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'commissions'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>عمولات المبيعات (Sales CRM Ledger)</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 1: ROATIB / HR PAYROLL                       */}
      {/* ---------------------------------------------------- */}
      {subTab === 'salaries' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header summary of salaries */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-slate-400 text-[10px] font-black uppercase">الرواتب الأساسية المعتمدة (Base Salaries)</span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                {fmt(hrEmployees.reduce((sum, emp) => sum + (emp.salary_base || 0), 0))} <span className="text-xs">USD</span>
              </p>
              <p className="text-[9px] text-slate-400 mt-1">إجمالي المرتبات المسجلة بملفات الموارد البشرية النشطة</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-slate-400 text-[10px] font-black uppercase">مسودات الشهر المحتسبة (Drafted Total)</span>
              <p className="text-2xl font-black text-indigo-600 font-mono mt-1">
                {fmt(draftPayroll.reduce((sum, item) => sum + item.pr.total_net, 0))} <span className="text-xs">USD</span>
              </p>
              <p className="text-[9px] text-slate-400 mt-1">إجمالي رواتب مسودات الصرف لشهر {payrollMonth}/{payrollYear}</p>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs">
              <span className="text-slate-400 text-[10px] font-black uppercase">المدفوع بالفعل (Paid In Full)</span>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {fmt(paidPayroll.reduce((sum, item) => sum + item.pr.total_net, 0))} <span className="text-xs">USD</span>
              </p>
              <p className="text-[9px] text-slate-400 mt-1">الحوالات المالية التي تم صرفها واعتمادها هذا الشهر</p>
            </div>
          </div>

          {/* Core payroll action panel */}
          <div className="bg-white rounded-[2rem] border border-slate-150 overflow-hidden shadow-xs">
            <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800">محرك احتساب الرواتب الذكي (Smart Payroll Sync)</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <p className="text-[10px] font-bold text-slate-500">
                      دورة الصرف الحالية: {payrollMonth} / {payrollYear}
                    </p>
                  </div>
                </div>

                {/* Period Selectors */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-3xs">
                  <span className="text-[9px] font-black text-slate-400">الدورة:</span>
                  <select 
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(parseInt(e.target.value, 10))}
                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>شهر {m}</option>
                    ))}
                  </select>
                  <select 
                    value={payrollYear}
                    onChange={(e) => setPayrollYear(parseInt(e.target.value, 10))}
                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer border-r pr-2"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* View toggle & execution */}
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => setPayrollViewMode('board')} 
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      payrollViewMode === 'board' ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>البطاقات</span>
                  </button>
                  <button 
                    onClick={() => setPayrollViewMode('list')} 
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      payrollViewMode === 'list' ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>الجدول</span>
                  </button>
                </div>

                <button 
                  onClick={handleCalculateAllPayroll}
                  disabled={isCalculatingPayroll}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 ${isCalculatingPayroll ? 'animate-pulse' : ''}`} />
                  <span>{isCalculatingPayroll ? 'جاري الاحتساب...' : 'توليد مسودة الشهر'}</span>
                </button>
              </div>
            </div>

            {/* List View Rendering */}
            {payrollViewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                    <tr>
                      <th className="px-6 py-4">الموظف / Employee</th>
                      <th className="px-6 py-4">المرتب الأساسي والبدلات</th>
                      <th className="px-6 py-4 text-rose-600">الخصومات والاقتطاعات</th>
                      <th className="px-6 py-4 text-emerald-600">الحوافز والعمولات</th>
                      <th className="px-6 py-4">صافي الراتب المستحق</th>
                      <th className="px-6 py-4 text-center">الحالة</th>
                      <th className="px-6 py-4 text-center">تاريخ الإنشاء</th>
                      <th className="px-6 py-4 text-left">العمليات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {hrEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                          لا توجد بيانات موظفين مسجلة في موديول HR Management.
                        </td>
                      </tr>
                    ) : (
                      hrEmployees.map(emp => {
                        const pr = hrPayroll.find(p => p.user_id === emp.id && parseInt(p.month as string, 10) === payrollMonth && p.year === payrollYear);
                        const netSalary = pr ? (pr.total_net ?? ((pr.base_salary ?? 0) + (pr.allowances ?? 0) + (pr.bonuses ?? 0) + (pr.commissions ?? 0) - (pr.deductions ?? 0))) : ((emp.salary_base ?? 0) + (emp.allowances ?? 0));

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                                  {emp.name[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{emp.name}</p>
                                  <p className="text-[9px] text-slate-400 font-mono uppercase">{emp.job_title} | ID: #{emp.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono">
                              <p className="font-bold text-slate-800">${(pr?.base_salary ?? emp.salary_base ?? 0).toLocaleString()}</p>
                              <p className="text-[9px] text-slate-400">بدلات: ${(pr?.allowances ?? emp.allowances ?? 0).toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-4 text-rose-600 font-mono">
                              <p className="font-bold">-${(pr?.deductions ?? 0).toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-4 text-emerald-600 font-mono">
                              <p className="font-bold">+${((pr?.bonuses ?? 0) + (pr?.commissions ?? 0)).toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-900">
                              ${(netSalary ?? 0).toLocaleString()} USD
                            </td>
                            <td className="px-6 py-4 text-center">
                              {pr ? (
                                <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                                  pr.status === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                }`}>
                                  {pr.status === 'Paid' ? 'Paid / تم الصرف' : 'Draft / مسودة'}
                                </span>
                              ) : (
                                <span className="inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                                  لم يحتسب بعد
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center text-[10px] text-slate-400 font-mono">
                              {pr?.created_at ? new Date(pr.created_at).toISOString().split('T')[0] : '-'}
                            </td>
                            <td className="px-6 py-4 text-left">
                              <div className="flex items-center gap-2 justify-start">
                                {pr && pr.status === 'Draft' && (
                                  <>
                                    <button 
                                      onClick={() => handleUpdatePayrollStatus(emp.id, 'Paid')}
                                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer border border-emerald-200"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>صرف</span>
                                    </button>
                                    <button 
                                      onClick={() => setSelectedPayrollRecord(pr)}
                                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase cursor-pointer border border-slate-200"
                                    >
                                      تعديل
                                    </button>
                                    <button 
                                      onClick={() => setShowPayrollDeleteConfirm(pr.id)}
                                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                {pr && pr.status === 'Paid' && (
                                  <button 
                                    onClick={() => handleUpdatePayrollStatus(emp.id, 'Draft')}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-black cursor-pointer"
                                  >
                                    إرجاع لمسودة
                                  </button>
                                )}
                                {!pr && (
                                  <span className="text-[10px] text-slate-400 italic">بانتظار مسودة الشهر</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              // Board View Rendering
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. UNPROCESSED COLUMN */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50">
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>غير مدرج (Unprocessed)</span>
                    </h4>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-black rounded-full">{unprocessedEmployees.length}</span>
                  </div>
                  <div className="space-y-3 overflow-y-auto max-h-[500px]">
                    {unprocessedEmployees.length === 0 ? (
                      <p className="text-slate-400 text-[10px] italic text-center py-6">جميع الموظفين مدرجون بالدورة.</p>
                    ) : (
                      unprocessedEmployees.map(emp => (
                        <div key={emp.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex flex-col justify-between">
                          <div>
                            <p className="text-xs font-black text-slate-800">{emp.name}</p>
                            <p className="text-[9px] text-slate-400 uppercase font-mono">{emp.job_title}</p>
                          </div>
                          <div className="mt-4 flex justify-between items-center text-[10px] border-t pt-2 border-slate-50">
                            <span className="text-slate-400 font-bold">الراتب الافتراضي:</span>
                            <span className="font-mono font-bold text-slate-700">${(emp.salary_base + emp.allowances).toLocaleString()} USD</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. DRAFT COLUMN */}
                <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>مسودات صرف (Draft)</span>
                    </h4>
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-black rounded-full">{draftPayroll.length}</span>
                  </div>
                  <div className="space-y-3 overflow-y-auto max-h-[500px]">
                    {draftPayroll.length === 0 ? (
                      <p className="text-slate-400 text-[10px] italic text-center py-6">لا توجد مسودات رواتب لشهر {payrollMonth}.</p>
                    ) : (
                      draftPayroll.map(({ emp, pr }) => {
                        const netSalary = pr.total_net ?? ((pr.base_salary ?? 0) + (pr.allowances ?? 0) + (pr.bonuses ?? 0) + (pr.commissions ?? 0) - (pr.deductions ?? 0));
                        return (
                          <div key={emp.id} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-3xs hover:border-indigo-300 transition-all relative">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-black text-slate-800">{emp.name}</p>
                                <p className="text-[9px] text-slate-400 uppercase font-mono">{emp.job_title}</p>
                              </div>
                              <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 font-bold uppercase rounded">مسودة</span>
                            </div>

                            <div className="space-y-1 mt-3 border-t pt-2 border-slate-50 text-[10px] font-bold text-slate-500">
                              <div className="flex justify-between">
                                <span>صافي الراتب:</span>
                                <span className="text-indigo-600 font-mono font-black">${(netSalary ?? 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-[9px] text-rose-500">
                                <span>الاقتطاعات:</span>
                                <span>-${(pr.deductions ?? 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-[9px] text-emerald-500">
                                <span>حوافز وعمولات:</span>
                                <span>+${((pr.bonuses ?? 0) + (pr.commissions ?? 0)).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-50">
                              <button 
                                onClick={() => handleUpdatePayrollStatus(emp.id, 'Paid')}
                                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-black uppercase transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>صرف الراتب</span>
                              </button>
                              <button 
                                onClick={() => setSelectedPayrollRecord(pr)}
                                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-[9px] font-black border border-slate-200 cursor-pointer"
                              >
                                تعديل
                              </button>
                              <button 
                                onClick={() => setShowPayrollDeleteConfirm(pr.id)}
                                className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded cursor-pointer border border-rose-100"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 3. PAID COLUMN */}
                <div className="bg-emerald-50/20 p-4 rounded-2xl border border-emerald-100/50">
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>تم الصرف والاعتماد (Paid)</span>
                    </h4>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full">{paidPayroll.length}</span>
                  </div>
                  <div className="space-y-3 overflow-y-auto max-h-[500px]">
                    {paidPayroll.length === 0 ? (
                      <p className="text-slate-400 text-[10px] italic text-center py-6">لم يتم صرف أي مرتبات بعد لشهر {payrollMonth}.</p>
                    ) : (
                      paidPayroll.map(({ emp, pr }) => {
                        const netSalary = pr.total_net ?? ((pr.base_salary ?? 0) + (pr.allowances ?? 0) + (pr.bonuses ?? 0) + (pr.commissions ?? 0) - (pr.deductions ?? 0));
                        return (
                          <div key={emp.id} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-3xs hover:border-emerald-200 transition-all relative">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-black text-slate-800">{emp.name}</p>
                                <p className="text-[9px] text-slate-400 uppercase font-mono">{emp.job_title}</p>
                              </div>
                              <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 font-bold uppercase rounded">تم الدفع</span>
                            </div>

                            <div className="mt-3 border-t pt-2 border-slate-50 text-[10px] font-bold text-slate-500 flex justify-between">
                              <span>المبلغ المصروف:</span>
                              <span className="text-emerald-600 font-mono font-black">${(netSalary ?? 0).toLocaleString()} USD</span>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-50 flex gap-2">
                              <button 
                                onClick={() => handleUpdatePayrollStatus(emp.id, 'Draft')}
                                className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded text-[9px] font-black cursor-pointer text-center"
                              >
                                إرجاع لمسودة
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 2: OUMOULAT / CRM REPRESENTATIVES LEDGER     */}
      {/* ---------------------------------------------------- */}
      {subTab === 'commissions' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Filtering cards */}
          <div className="bg-white border border-slate-200/50 p-6 rounded-[2rem] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 justify-start text-right">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>تصفية وحساب عمولات مبيعات الموظفين (Incentive Filters)</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-bold">
                  تتم تصفية واحتساب عمولات الصفقات المغلقة بنجاح (Closed Won) من موديول Sales CRM للمدى المختار أدناه.
                </p>
              </div>
              
              {/* Date pickers */}
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="space-y-1.5 flex-1 md:flex-initial min-w-[150px]">
                  <label className="text-[9px] font-black uppercase text-slate-400">تاريخ البدء / From Date</label>
                  <input
                    type="date"
                    value={ledgerStartDate}
                    onChange={(e) => setLedgerStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2 text-xs font-extrabold outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-1.5 flex-1 md:flex-initial min-w-[150px]">
                  <label className="text-[9px] font-black uppercase text-slate-400">تاريخ الانتهاء / To Date</label>
                  <input
                    type="date"
                    value={ledgerEndDate}
                    onChange={(e) => setLedgerEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2 text-xs font-extrabold outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Filter details summary */}
            <div className="bg-indigo-50/40 border border-indigo-100/40 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1 text-right">
                <h5 className="text-[11px] font-black text-indigo-900 uppercase">ملخص الصفقات المفلترة لعملاء المبيعات</h5>
                <p className="text-[10px] text-slate-500 font-bold">
                  تتم معالجة صفقات المبيعات الناجحة للفترة: <span className="text-indigo-600 font-extrabold">من {new Date(ledgerStartDate).toLocaleDateString()} إلى {new Date(ledgerEndDate).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="bg-white px-3.5 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-4 shadow-3xs">
                <div className="text-center border-l pl-4">
                  <span className="text-[9px] text-slate-400 font-black block uppercase">الصفقات المتطابقة</span>
                  <span className="text-xs font-black text-indigo-600">{filteredWonDealsByDate.length} صفقة Won</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-slate-400 font-black block uppercase">القيمة الإجمالية للصفقات</span>
                  <span className="text-xs font-black text-emerald-600">EGP {filteredWonDealsByDate.reduce((s, d) => s + (d.value || 0), 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core representatives performance list */}
          <div className="bg-white border border-slate-200/50 rounded-[2rem] overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">كشف استحقاق عمولات الموظفين / Representative Incentive Ledger</h4>
                <p className="text-[10px] text-slate-400 font-bold">بيان الحسابات التفصيلي لعملاء المبيعات المعتمد والمنتقل حياً من صفقات CRM المبرمة.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-indigo-600 font-black uppercase bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1">
                  نظام العمولات النشط: {commissionSettings.activeScheme.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                    <th className="px-6 py-4">اسم المندوب / Representative</th>
                    <th className="px-6 py-4">الدور الوظيفي</th>
                    <th className="px-6 py-4">حجم الصفقات المبرمة</th>
                    <th className="px-6 py-4">عدد صفقات Won</th>
                    <th className="px-6 py-4">معادلة الاحتساب المقدرة</th>
                    <th className="px-6 py-4 text-left">العمولة المستحقة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incentiveLedgerPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                        لا يوجد مناديب مبيعات أو صفقات مسجلة حالياً.
                      </td>
                    </tr>
                  ) : (
                    incentiveLedgerPerformance.map((rep) => {
                      const calc = calculateCommissionForRep(rep);
                      return (
                        <tr key={rep.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black uppercase text-[10px]">
                                {rep.name.substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{rep.name}</p>
                                <span className="text-[9px] text-slate-400 font-mono block">ID: #{rep.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-500">{rep.role}</td>
                          <td className="px-6 py-4 font-bold text-slate-800 font-mono">EGP {rep.wonValue.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                              {rep.wonCount} صفقات
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-[250px]">
                            <p className="font-mono text-[10px] text-indigo-600 font-extrabold truncate" title={calc.formula}>
                              {calc.formula || 'N/A'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold truncate" title={calc.description}>
                              {calc.description}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-left font-mono">
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">
                              EGP {calc.amount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DETAILED MODAL: EDIT DRAFT HR PAYROLL RECORD         */}
      {/* ---------------------------------------------------- */}
      {selectedPayrollRecord && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[150]" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-lg w-full text-right"
          >
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <h3 className="text-sm font-black text-slate-800">تعديل مسودة راتب الموظف</h3>
                <p className="text-[10px] text-slate-400 mt-1">تعديل البدلات أو الاقتطاعات أو الحوافز والعمولات يدوياً للشهر الجاري</p>
              </div>
              <button onClick={() => setSelectedPayrollRecord(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
                  {selectedPayrollRecord.employee_name ? selectedPayrollRecord.employee_name[0] : 'U'}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{selectedPayrollRecord.employee_name || 'سجل موظف'}</p>
                  <p className="text-[10px] text-slate-400 font-mono">دورة: {selectedPayrollRecord.month}/{selectedPayrollRecord.year}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">المرتب الأساسي (Base Salary) :</label>
                  <input 
                    type="number" 
                    value={selectedPayrollRecord.base_salary} 
                    onChange={e => {
                      const base = parseFloat(e.target.value) || 0;
                      setSelectedPayrollRecord({
                        ...selectedPayrollRecord,
                        base_salary: base,
                        total_net: base + selectedPayrollRecord.allowances + selectedPayrollRecord.bonuses + selectedPayrollRecord.commissions - selectedPayrollRecord.deductions
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-left font-bold" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">البدلات (Allowances) :</label>
                  <input 
                    type="number" 
                    value={selectedPayrollRecord.allowances} 
                    onChange={e => {
                      const allow = parseFloat(e.target.value) || 0;
                      setSelectedPayrollRecord({
                        ...selectedPayrollRecord,
                        allowances: allow,
                        total_net: selectedPayrollRecord.base_salary + allow + selectedPayrollRecord.bonuses + selectedPayrollRecord.commissions - selectedPayrollRecord.deductions
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-left font-bold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-rose-500">الاقتطاعات والخصم :</label>
                  <input 
                    type="number" 
                    value={selectedPayrollRecord.deductions} 
                    onChange={e => {
                      const ded = parseFloat(e.target.value) || 0;
                      setSelectedPayrollRecord({
                        ...selectedPayrollRecord,
                        deductions: ded,
                        total_net: selectedPayrollRecord.base_salary + selectedPayrollRecord.allowances + selectedPayrollRecord.bonuses + selectedPayrollRecord.commissions - ded
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-rose-100 rounded-xl font-mono text-left text-rose-600 font-bold" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-emerald-500">مكافآت (Bonuses) :</label>
                  <input 
                    type="number" 
                    value={selectedPayrollRecord.bonuses} 
                    onChange={e => {
                      const bon = parseFloat(e.target.value) || 0;
                      setSelectedPayrollRecord({
                        ...selectedPayrollRecord,
                        bonuses: bon,
                        total_net: selectedPayrollRecord.base_salary + selectedPayrollRecord.allowances + bon + selectedPayrollRecord.commissions - selectedPayrollRecord.deductions
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-emerald-100 rounded-xl font-mono text-left text-emerald-600 font-bold" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-emerald-500">العمولات المتراكمة :</label>
                  <input 
                    type="number" 
                    value={selectedPayrollRecord.commissions} 
                    onChange={e => {
                      const comm = parseFloat(e.target.value) || 0;
                      setSelectedPayrollRecord({
                        ...selectedPayrollRecord,
                        commissions: comm,
                        total_net: selectedPayrollRecord.base_salary + selectedPayrollRecord.allowances + selectedPayrollRecord.bonuses + comm - selectedPayrollRecord.deductions
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-emerald-100 rounded-xl font-mono text-left text-emerald-600 font-bold" 
                  />
                </div>
              </div>

              {/* Total output representation */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center font-mono">
                <span className="font-sans font-bold text-slate-300">صافي المستحق النهائي (Net Payout):</span>
                <span className="text-xl font-black text-indigo-400">${selectedPayrollRecord.total_net.toLocaleString()} USD</span>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayrollRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء التعديل
                </button>
                <button
                  type="button"
                  onClick={handleSavePayrollEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black"
                >
                  حفظ وتأكيد التعديلات
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DELETE CONFIRMATION DIALOG                           */}
      {/* ---------------------------------------------------- */}
      {showPayrollDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[150]" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl border shadow-2xl max-w-sm w-full text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">حذف مسودة راتب الموظف</h3>
              <p className="text-[11px] text-slate-400 mt-1 font-bold">هل أنت متأكد من رغبتك في حذف مسودة احتساب هذا الموظف بالكامل؟ لا يمكن التراجع عن هذه العملية.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPayrollDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                تراجع
              </button>
              <button
                onClick={() => handleDeletePayrollRecord(showPayrollDeleteConfirm)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black"
              >
                حذف وتأكيد
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
