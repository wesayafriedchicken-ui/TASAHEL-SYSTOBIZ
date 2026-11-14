import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Settings, 
  X, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  Clock, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';

interface PayrollPolicyPageProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const PayrollPolicyPage: React.FC<PayrollPolicyPageProps> = ({ isModal = false, onClose }) => {
  const navigate = useNavigate();
  const {
    payrollConfig,
    setPayrollConfig,
    currentUser,
    fetchData,
    showCustomToast
  } = useHRContext();

  const [configActiveTab, setConfigActiveTab] = useState<'general' | 'tardy' | 'leave_policy' | 'disciplinary' | 'insurance' | 'taxes'>('general');
  const [payrollConfigDraft, setPayrollConfigDraft] = useState<any>({
    start_day: 1,
    late_deduction_per_hour: 0,
    absence_penalty_multiplier: 1.0,
    early_departure_deduction: 0,
    disciplinary_rules: [],
    insurance_benefits: {
      enable_social_insurance: true,
      social_insurance_mode: 'brackets',
      social_insurance_brackets: [
        { name: 'Category A (Entry Level)', min_salary: 0, max_salary: 6000, employee_pct: 11, employer_pct: 18.75 },
        { name: 'Category B (Mid Level)', min_salary: 6001, max_salary: 15000, employee_pct: 14, employer_pct: 20.0 },
        { name: 'Category C (Senior / Executive)', min_salary: 15001, max_salary: 50000, employee_pct: 16, employer_pct: 22.5 }
      ],
      social_insurance_employee_pct: 11,
      social_insurance_employer_pct: 18.75,
      enable_medical_insurance: false,
      medical_insurance_mode: 'flat',
      medical_insurance_brackets: [],
      medical_insurance_employee_fee: 0,
      medical_insurance_employer_fee: 0
    },
    tardy_deduction_rules: {
      mode: 'slab',
      grace_minutes_per_occurrence: 15,
      monthly_grace_minutes: 60,
      slabs: [
        { min_mins: 1, max_mins: 15, deduction_type: 'none', value: 0, applies_to: 'all', label: '1-15 Mins (Grace / Warning)' },
        { min_mins: 16, max_mins: 30, deduction_type: 'quarter_day', value: 0.25, applies_to: 'all', label: '16-30 Mins (0.25 Day)' },
        { min_mins: 31, max_mins: 60, deduction_type: 'half_day', value: 0.50, applies_to: 'all', label: '31-60 Mins (0.50 Day)' },
        { min_mins: 61, max_mins: 120, deduction_type: 'full_day', value: 1.0, applies_to: 'all', label: '61-120 Mins (1.0 Day)' }
      ]
    },
    tax_brackets: [
      { min_salary: 0, max_salary: 15000, tax_rate: 0 },
      { min_salary: 15001, max_salary: 30000, tax_rate: 2.5 },
      { min_salary: 30001, max_salary: 45000, tax_rate: 10 },
      { min_salary: 45001, max_salary: 60000, tax_rate: 15 },
      { min_salary: 60001, max_salary: 200000, tax_rate: 20 },
      { min_salary: 200001, max_salary: 400000, tax_rate: 22.5 },
      { min_salary: 400001, max_salary: 9999999, tax_rate: 25 }
    ],
    leave_policy_defaults: {
      annual_leave_default: 21,
      sick_leave_default: 15,
      bereavement_leave_default: 3
    },
    custom_rules: {
      overtime_normal_multiplier: 1.35,
      overtime_holiday_multiplier: 2.0
    }
  });

  const [isSyncingLeaveBalances, setIsSyncingLeaveBalances] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (payrollConfig) {
      setPayrollConfigDraft(prev => ({
        ...prev,
        ...payrollConfig,
        insurance_benefits: {
          ...prev.insurance_benefits,
          ...(payrollConfig.insurance_benefits || {})
        },
        tardy_deduction_rules: {
          ...prev.tardy_deduction_rules,
          ...(payrollConfig.tardy_deduction_rules || {})
        },
        leave_policy_defaults: {
          ...prev.leave_policy_defaults,
          ...(payrollConfig.leave_policy_defaults || {})
        },
        custom_rules: {
          ...prev.custom_rules,
          ...(payrollConfig.custom_rules || {})
        }
      }));
    }
  }, [payrollConfig]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/hr/payroll');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/hr/payroll/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify(payrollConfigDraft)
      });
      if (res.ok) {
        setPayrollConfig(payrollConfigDraft);
        showCustomToast('Payroll policy settings saved successfully.', 'success');
        handleClose();
      } else {
        showCustomToast('Failed to save payroll settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomToast('Failed to save payroll policy.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncLeaveBalances = async () => {
    setIsSyncingLeaveBalances(true);
    try {
      const res = await fetch('/api/hr/payroll/config/sync-leave-balances', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify({
          annual_default: payrollConfigDraft.leave_policy_defaults?.annual_leave_default ?? 21,
          sick_default: payrollConfigDraft.leave_policy_defaults?.sick_leave_default ?? 15,
          bereavement_default: payrollConfigDraft.leave_policy_defaults?.bereavement_leave_default ?? 3
        })
      });
      if (res.ok) {
        const data = await res.json();
        showCustomToast(data.message || 'Leave balances successfully synced for all employees.', 'success');
        fetchData();
      } else {
        showCustomToast('Failed to sync leave balances across employee files.', 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomToast('Failed to sync leave balances.', 'error');
    } finally {
      setIsSyncingLeaveBalances(false);
    }
  };

  const addDisciplinaryRule = () => {
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      disciplinary_rules: [
        ...(payrollConfigDraft.disciplinary_rules || []),
        { violation: '', penalty_days: 0.5 }
      ]
    });
  };

  const updateDisciplinaryRule = (index: number, field: string, value: any) => {
    const rules = [...(payrollConfigDraft.disciplinary_rules || [])];
    rules[index] = { ...rules[index], [field]: value };
    setPayrollConfigDraft({ ...payrollConfigDraft, disciplinary_rules: rules });
  };

  const removeDisciplinaryRule = (index: number) => {
    const rules = (payrollConfigDraft.disciplinary_rules || []).filter((_: any, i: number) => i !== index);
    setPayrollConfigDraft({ ...payrollConfigDraft, disciplinary_rules: rules });
  };

  const addTaxBracket = () => {
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      tax_brackets: [
        ...(payrollConfigDraft.tax_brackets || []),
        { min_salary: 0, max_salary: 0, tax_rate: 0 }
      ]
    });
  };

  const updateTaxBracket = (index: number, field: string, value: any) => {
    const brackets = [...(payrollConfigDraft.tax_brackets || [])];
    brackets[index] = { ...brackets[index], [field]: parseFloat(value) || 0 };
    setPayrollConfigDraft({ ...payrollConfigDraft, tax_brackets: brackets });
  };

  const removeTaxBracket = (index: number) => {
    const brackets = (payrollConfigDraft.tax_brackets || []).filter((_: any, i: number) => i !== index);
    setPayrollConfigDraft({ ...payrollConfigDraft, tax_brackets: brackets });
  };

  const updateInsurance = (field: string, value: any) => {
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      insurance_benefits: {
        ...(payrollConfigDraft.insurance_benefits || {}),
        [field]: value
      }
    });
  };

  const addSocialInsuranceBracket = () => {
    const ins = payrollConfigDraft.insurance_benefits || {};
    const brackets = [...(ins.social_insurance_brackets || [])];
    let nextMin = 0;
    if (brackets.length > 0) {
      nextMin = Math.max(...brackets.map((b: any) => parseFloat(b.max_salary || 0))) + 1;
    }
    const categoryLetter = String.fromCharCode(65 + (brackets.length % 26));
    brackets.push({
      name: `Category ${categoryLetter}`,
      min_salary: nextMin,
      max_salary: nextMin + 10000,
      employee_pct: 11,
      employer_pct: 18.75
    });
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      insurance_benefits: {
        ...ins,
        social_insurance_brackets: brackets
      }
    });
  };

  const updateSocialInsuranceBracket = (index: number, field: string, value: any) => {
    const ins = payrollConfigDraft.insurance_benefits || {};
    const brackets = [...(ins.social_insurance_brackets || [])];
    brackets[index] = {
      ...brackets[index],
      [field]: field === 'name' ? value : (parseFloat(value) || 0)
    };
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      insurance_benefits: {
        ...ins,
        social_insurance_brackets: brackets
      }
    });
  };

  const removeSocialInsuranceBracket = (index: number) => {
    const ins = payrollConfigDraft.insurance_benefits || {};
    const brackets = (ins.social_insurance_brackets || []).filter((_: any, i: number) => i !== index);
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      insurance_benefits: {
        ...ins,
        social_insurance_brackets: brackets
      }
    });
  };

  const loadDefaultSocialInsuranceBrackets = () => {
    const ins = payrollConfigDraft.insurance_benefits || {};
    const defaultBrackets = [
      { name: 'Category A (Entry Level)', min_salary: 0, max_salary: 6000, employee_pct: 11, employer_pct: 18.75 },
      { name: 'Category B (Mid Level)', min_salary: 6001, max_salary: 15000, employee_pct: 14, employer_pct: 20.0 },
      { name: 'Category C (Senior / Executive)', min_salary: 15001, max_salary: 50000, employee_pct: 16, employer_pct: 22.5 }
    ];
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      insurance_benefits: {
        ...ins,
        social_insurance_brackets: defaultBrackets
      }
    });
  };

  const addMedicalInsuranceBracket = () => {
    const ins = payrollConfigDraft.insurance_benefits || {};
    const brackets = [...(ins.medical_insurance_brackets || [])];
    let nextMin = 0;
    if (brackets.length > 0) {
      nextMin = Math.max(...brackets.map((b: any) => parseFloat(b.max_salary || 0))) + 1;
    }
    brackets.push({
      name: `Plan ${String.fromCharCode(65 + (brackets.length % 26))}`,
      min_salary: nextMin,
      max_salary: nextMin + 15000,
      employee_fee: 150,
      employer_fee: 300
    });
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      insurance_benefits: {
        ...ins,
        medical_insurance_brackets: brackets
      }
    });
  };

  const updateMedicalInsuranceBracket = (index: number, field: string, value: any) => {
    const ins = payrollConfigDraft.insurance_benefits || {};
    const brackets = [...(ins.medical_insurance_brackets || [])];
    brackets[index] = {
      ...brackets[index],
      [field]: field === 'name' ? value : (parseFloat(value) || 0)
    };
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      insurance_benefits: {
        ...ins,
        medical_insurance_brackets: brackets
      }
    });
  };

  const removeMedicalInsuranceBracket = (index: number) => {
    const ins = payrollConfigDraft.insurance_benefits || {};
    const brackets = (ins.medical_insurance_brackets || []).filter((_: any, i: number) => i !== index);
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      insurance_benefits: {
        ...ins,
        medical_insurance_brackets: brackets
      }
    });
  };

  const addTardySlab = () => {
    const tardy = payrollConfigDraft.tardy_deduction_rules || {};
    const slabs = [...(tardy.slabs || [])];
    let nextMin = 1;
    if (slabs.length > 0) {
      nextMin = Math.max(...slabs.map((s: any) => parseFloat(s.max_mins || 0))) + 1;
    }
    slabs.push({
      min_mins: nextMin,
      max_mins: nextMin + 15,
      deduction_type: 'quarter_day',
      value: 0.25,
      applies_to: 'all',
      label: `${nextMin}-${nextMin + 15} Mins`
    });
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      tardy_deduction_rules: { ...tardy, slabs }
    });
  };

  const updateTardySlab = (index: number, field: string, value: any) => {
    const tardy = payrollConfigDraft.tardy_deduction_rules || {};
    const slabs = [...(tardy.slabs || [])];
    slabs[index] = { ...slabs[index], [field]: value };
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      tardy_deduction_rules: { ...tardy, slabs }
    });
  };

  const removeTardySlab = (index: number) => {
    const tardy = payrollConfigDraft.tardy_deduction_rules || {};
    const slabs = (tardy.slabs || []).filter((_: any, i: number) => i !== index);
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      tardy_deduction_rules: { ...tardy, slabs }
    });
  };

  const updateLeaveDefaults = (field: string, value: any) => {
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      leave_policy_defaults: {
        ...(payrollConfigDraft.leave_policy_defaults || {}),
        [field]: value
      }
    });
  };

  const updateCustomRules = (field: string, value: any) => {
    setPayrollConfigDraft({
      ...payrollConfigDraft,
      custom_rules: {
        ...(payrollConfigDraft.custom_rules || {}),
        [field]: value
      }
    });
  };

  const content = (
    <div className={cn(
      "bg-white overflow-hidden text-slate-800 flex flex-col",
      isModal 
        ? "rounded-[32px] w-full max-w-5xl shadow-2xl border border-slate-200 max-h-[90vh]" 
        : "rounded-3xl w-full shadow-sm border border-slate-200"
    )}>
      <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          {!isModal && (
            <button
              onClick={() => navigate('/hr/payroll')}
              className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white cursor-pointer mr-1"
              title="Back to Payroll"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2.5 bg-white/10 rounded-2xl">
            <Settings className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
              Payroll Policy Setup
            </h2>
            <p className="text-slate-400 text-xs">Configure custom start cycle dates, attendance deduction rules, leave policies, insurance, and tax brackets.</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white cursor-pointer"
          title={isModal ? "Close" : "Return to Payroll"}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex bg-slate-100 border-b border-slate-200 p-2 gap-1 overflow-x-auto sticky top-0 z-20">
        {[
          { id: 'general', label: 'General & Pay Cycle' },
          { id: 'tardy', label: 'Tardy & Late Deductions' },
          { id: 'leave_policy', label: 'Leave Policy & Balances' },
          { id: 'disciplinary', label: 'Disciplinary Rules' },
          { id: 'insurance', label: 'Insurance & Benefits' },
          { id: 'taxes', label: 'Income Taxes' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setConfigActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center flex-1 min-w-[130px] cursor-pointer",
              configActiveTab === tab.id 
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" 
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            )}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={cn("space-y-6 text-left", isModal ? "flex-1 overflow-y-auto p-8" : "p-6 sm:p-8")}>
        {/* TAB 1: GENERAL */}
        {configActiveTab === 'general' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pay Cycle Start Day</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={payrollConfigDraft.start_day || 1}
                  onChange={e => setPayrollConfigDraft({ ...payrollConfigDraft, start_day: parseInt(e.target.value) || 1 })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. 1"
                />
                <p className="text-[10px] text-slate-400">Determines the starting day of the monthly calculations. Set to 1 for standard calendar month.</p>
              </div>

              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Unexcused Absence Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  min={1}
                  value={payrollConfigDraft.absence_penalty_multiplier || 1.0}
                  onChange={e => setPayrollConfigDraft({ ...payrollConfigDraft, absence_penalty_multiplier: parseFloat(e.target.value) || 1.0 })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. 1.5"
                />
                <p className="text-[10px] text-slate-400">Factor deducted per unexcused absent day (e.g. 1.5 means missing 1 day deducts 1.5 days salary).</p>
              </div>

              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Overtime Normal Workday Multiplier</label>
                <input
                  type="number"
                  step="0.05"
                  min={1}
                  value={payrollConfigDraft.custom_rules?.overtime_normal_multiplier || 1.35}
                  onChange={e => updateCustomRules('overtime_normal_multiplier', parseFloat(e.target.value) || 1.0)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. 1.35"
                />
                <p className="text-[10px] text-slate-400">Hourly salary multiplier applied for overtime worked on regular weekdays (e.g. 1.35x).</p>
              </div>

              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Overtime Weekend / Holiday Multiplier</label>
                <input
                  type="number"
                  step="0.05"
                  min={1}
                  value={payrollConfigDraft.custom_rules?.overtime_holiday_multiplier || 2.0}
                  onChange={e => updateCustomRules('overtime_holiday_multiplier', parseFloat(e.target.value) || 1.0)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. 2.0"
                />
                <p className="text-[10px] text-slate-400">Hourly salary multiplier applied for overtime worked on official holidays or weekends (e.g. 2.0x).</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TARDY & LATE DEDUCTIONS */}
        {configActiveTab === 'tardy' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-indigo-50/60 border border-indigo-200/80 p-4 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-indigo-900">Configurable Late Deduction Rules (Daily Logs Sync)</h4>
                <p className="text-[11px] text-indigo-700 font-medium">Specify how tardiness from Daily Logs attendance check-ins is calculated and penalized.</p>
              </div>
              <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Primary Calculation Strategy</label>
                <select
                  value={payrollConfigDraft.tardy_deduction_rules?.mode || 'slab'}
                  onChange={e => {
                    const tardy = payrollConfigDraft.tardy_deduction_rules || {};
                    setPayrollConfigDraft({
                      ...payrollConfigDraft,
                      tardy_deduction_rules: { ...tardy, mode: e.target.value }
                    });
                  }}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="slab">Tiered Minutes Slabs (Day Fractions)</option>
                  <option value="per_minute">Exact Minute-by-Minute Calculation</option>
                  <option value="frequency">Monthly Occurrence Escalation</option>
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Grace Period per Check-In</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={payrollConfigDraft.tardy_deduction_rules?.grace_minutes_per_occurrence ?? 15}
                    onChange={e => {
                      const tardy = payrollConfigDraft.tardy_deduction_rules || {};
                      setPayrollConfigDraft({
                        ...payrollConfigDraft,
                        tardy_deduction_rules: { ...tardy, grace_minutes_per_occurrence: parseInt(e.target.value) || 0 }
                      });
                    }}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">Mins</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Monthly Free Grace Minutes Pool</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={payrollConfigDraft.tardy_deduction_rules?.monthly_grace_minutes ?? 60}
                    onChange={e => {
                      const tardy = payrollConfigDraft.tardy_deduction_rules || {};
                      setPayrollConfigDraft({
                        ...payrollConfigDraft,
                        tardy_deduction_rules: { ...tardy, monthly_grace_minutes: parseInt(e.target.value) || 0 }
                      });
                    }}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">Mins/Mo</span>
                </div>
              </div>
            </div>

            {/* Slabs Table */}
            {payrollConfigDraft.tardy_deduction_rules?.mode === 'slab' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Late Minutes Deduction Slabs</h5>
                  <button
                    type="button"
                    onClick={addTardySlab}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Slab</span>
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/80 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">From Min</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">To Min</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Applies To / تطبق على</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Penalty Type</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-28">Value (Days/EGP)</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center w-16">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(payrollConfigDraft.tardy_deduction_rules?.slabs || []).map((slab: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-100/40">
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={slab.min_mins}
                              onChange={e => updateTardySlab(idx, 'min_mins', parseInt(e.target.value) || 0)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={slab.max_mins}
                              onChange={e => updateTardySlab(idx, 'max_mins', parseInt(e.target.value) || 0)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={slab.applies_to || 'all'}
                              onChange={e => updateTardySlab(idx, 'applies_to', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                            >
                              <option value="all">All Employees (الجميع)</option>
                              <option value="login_system">Login System (نظام الدخول)</option>
                              <option value="fingerprint">Fingerprint (البصمة)</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={slab.deduction_type}
                              onChange={e => updateTardySlab(idx, 'deduction_type', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                            >
                              <option value="none">No Penalty (Grace / Warning)</option>
                              <option value="quarter_day">Quarter Day Salary (0.25d)</option>
                              <option value="half_day">Half Day Salary (0.50d)</option>
                              <option value="full_day">Full Day Salary (1.0d)</option>
                              <option value="custom_days">Custom Days Factor</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.05"
                              value={slab.value}
                              onChange={e => updateTardySlab(idx, 'value', parseFloat(e.target.value) || 0)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeTardySlab(idx)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LEAVE POLICY & BALANCES */}
        {configActiveTab === 'leave_policy' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-emerald-900">Standard Leave Entitlements Policy</h4>
                <p className="text-[11px] text-emerald-700 font-medium">These settings serve as baseline defaults and feed directly into the <span className="font-extrabold underline">Adjust Leave Balances</span> screen in Employee Files.</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Annual Leave / Holiday Available</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={payrollConfigDraft.leave_policy_defaults?.annual_leave_default ?? 21}
                    onChange={e => updateLeaveDefaults('annual_leave_default', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">Days</span>
                </div>
                <p className="text-[10px] text-slate-400">Default annual vacation quota assigned per employee per calendar year.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sick Leave Available</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={payrollConfigDraft.leave_policy_defaults?.sick_leave_default ?? 15}
                    onChange={e => updateLeaveDefaults('sick_leave_default', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">Days</span>
                </div>
                <p className="text-[10px] text-slate-400">Default sick leave days allowed per employee annually.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Bereavement Used YTD (Days)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={payrollConfigDraft.leave_policy_defaults?.bereavement_leave_default ?? 3}
                    onChange={e => updateLeaveDefaults('bereavement_leave_default', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">Days</span>
                </div>
                <p className="text-[10px] text-slate-400">Standard bereavement leave entitlement days.</p>
              </div>
            </div>

            <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <h5 className="text-xs font-black text-indigo-900">Synchronize Policy Balances with Employee Records</h5>
                <p className="text-[11px] text-indigo-700">Apply these baseline leave balances across all active employee files in one click.</p>
              </div>
              <button
                type="button"
                onClick={handleSyncLeaveBalances}
                disabled={isSyncingLeaveBalances}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={cn("w-4 h-4", isSyncingLeaveBalances && "animate-spin")} />
                <span>{isSyncingLeaveBalances ? 'Syncing...' : 'Sync All Employee Files'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: DISCIPLINARY */}
        {configActiveTab === 'disciplinary' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-slate-900">Disciplinary Violations Code</h4>
                <p className="text-xs text-slate-400">Define standard employee behavior penalties (deduction in days of basic salary).</p>
              </div>
              <button
                type="button"
                onClick={addDisciplinaryRule}
                className="bg-indigo-50 text-indigo-600 text-xs font-black px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Violation</span>
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Violation Description</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-40">Penalty Days</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(payrollConfigDraft.disciplinary_rules || []).map((rule: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-100/30 transition-colors">
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={rule.violation}
                          onChange={e => updateDisciplinaryRule(idx, 'violation', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="e.g. Second Late Check-in"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          step="0.05"
                          min={0}
                          value={rule.penalty_days}
                          onChange={e => updateDisciplinaryRule(idx, 'penalty_days', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeDisciplinaryRule(idx)}
                          className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(payrollConfigDraft.disciplinary_rules || []).length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-slate-400 text-xs">
                        No violations configured. Click the button above to add custom disciplinary rules.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: INSURANCE */}
        {configActiveTab === 'insurance' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* SOCIAL INSURANCE */}
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enable_social"
                    checked={payrollConfigDraft.insurance_benefits?.enable_social_insurance ?? true}
                    onChange={e => updateInsurance('enable_social_insurance', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="enable_social" className="text-xs font-black text-slate-800 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
                      <span>Social Insurance Integration</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        (payrollConfigDraft.insurance_benefits?.enable_social_insurance ?? true)
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {(payrollConfigDraft.insurance_benefits?.enable_social_insurance ?? true) ? 'Active' : 'Disabled'}
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-400">Apply salary-bracketed insurance contributions for employees and employers.</p>
                  </div>
                </div>

                {(payrollConfigDraft.insurance_benefits?.enable_social_insurance ?? true) && (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => updateInsurance('social_insurance_mode', 'brackets')}
                      className={cn(
                        "px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer",
                        (payrollConfigDraft.insurance_benefits?.social_insurance_mode || 'brackets') === 'brackets'
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Salary Brackets (Categories)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateInsurance('social_insurance_mode', 'flat')}
                      className={cn(
                        "px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer",
                        payrollConfigDraft.insurance_benefits?.social_insurance_mode === 'flat'
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Flat Rate
                    </button>
                  </div>
                )}
              </div>

              {(payrollConfigDraft.insurance_benefits?.enable_social_insurance ?? true) && (
                <>
                  {(payrollConfigDraft.insurance_benefits?.social_insurance_mode || 'brackets') === 'brackets' ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Social Insurance Category Brackets</h4>
                          <p className="text-[11px] text-slate-400">Set insurance tiers by salary range (Starts from → Up to salary). Each bracket applies specific employee and employer rates.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={loadDefaultSocialInsuranceBrackets}
                            className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Populate standard default salary categories"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Default Tiers</span>
                          </button>
                          <button
                            type="button"
                            onClick={addSocialInsuranceBracket}
                            className="bg-indigo-50 text-indigo-600 text-xs font-black px-3.5 py-2 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Bracket</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50/80 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Category / Tier Name</th>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Salary starts from</th>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Up to salary</th>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-36">Employee Share %</th>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-36">Employer Share %</th>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-16 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(payrollConfigDraft.insurance_benefits?.social_insurance_brackets || []).map((bracket: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-4 py-2.5">
                                  <input
                                    type="text"
                                    value={bracket.name || ''}
                                    onChange={e => updateSocialInsuranceBracket(idx, 'name', e.target.value)}
                                    className="w-full p-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder={`Category ${String.fromCharCode(65 + (idx % 26))}`}
                                  />
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min={0}
                                      value={bracket.min_salary}
                                      onChange={e => updateSocialInsuranceBracket(idx, 'min_salary', e.target.value)}
                                      className="w-full p-2 pr-10 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                                      placeholder="0"
                                    />
                                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">EGP</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min={0}
                                      value={bracket.max_salary}
                                      onChange={e => updateSocialInsuranceBracket(idx, 'max_salary', e.target.value)}
                                      className="w-full p-2 pr-10 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                                      placeholder="15000"
                                    />
                                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">EGP</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min={0}
                                      max={100}
                                      value={bracket.employee_pct}
                                      onChange={e => updateSocialInsuranceBracket(idx, 'employee_pct', e.target.value)}
                                      className="w-full p-2 pr-8 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                                      placeholder="11"
                                    />
                                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min={0}
                                      max={100}
                                      value={bracket.employer_pct}
                                      onChange={e => updateSocialInsuranceBracket(idx, 'employer_pct', e.target.value)}
                                      className="w-full p-2 pr-8 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                                      placeholder="18.75"
                                    />
                                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeSocialInsuranceBracket(idx)}
                                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all cursor-pointer"
                                    title="Delete Bracket"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {(payrollConfigDraft.insurance_benefits?.social_insurance_brackets || []).length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                                  <p className="font-semibold text-slate-600">No social insurance brackets configured.</p>
                                  <p className="text-[11px] text-slate-400 mt-1">Click "Add Bracket" or "Default Tiers" above to establish salary category brackets.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-[11px] text-indigo-900">
                        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>
                          During payroll generation, the system matches the employee's base salary against these category ranges to automatically deduct the employee share and calculate the company's insurance contribution.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Default Employee Share %</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            value={payrollConfigDraft.insurance_benefits?.social_insurance_employee_pct || 0}
                            onChange={e => updateInsurance('social_insurance_employee_pct', parseFloat(e.target.value) || 0)}
                            className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="11"
                          />
                          <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Default Employer Share %</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            value={payrollConfigDraft.insurance_benefits?.social_insurance_employer_pct || 0}
                            onChange={e => updateInsurance('social_insurance_employer_pct', parseFloat(e.target.value) || 0)}
                            className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="18.75"
                          />
                          <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* MEDICAL INSURANCE */}
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enable_medical"
                    checked={payrollConfigDraft.insurance_benefits?.enable_medical_insurance || false}
                    onChange={e => updateInsurance('enable_medical_insurance', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="enable_medical" className="text-xs font-black text-slate-800 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
                      <span>Medical Insurance Integration</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        payrollConfigDraft.insurance_benefits?.enable_medical_insurance
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {payrollConfigDraft.insurance_benefits?.enable_medical_insurance ? 'Active' : 'Disabled'}
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-400">Configure healthcare tiers or fixed monthly contribution deductions.</p>
                  </div>
                </div>

                {payrollConfigDraft.insurance_benefits?.enable_medical_insurance && (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => updateInsurance('medical_insurance_mode', 'brackets')}
                      className={cn(
                        "px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer",
                        payrollConfigDraft.insurance_benefits?.medical_insurance_mode === 'brackets'
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Plan Brackets
                    </button>
                    <button
                      type="button"
                      onClick={() => updateInsurance('medical_insurance_mode', 'flat')}
                      className={cn(
                        "px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer",
                        (payrollConfigDraft.insurance_benefits?.medical_insurance_mode || 'flat') === 'flat'
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Fixed Monthly Fee
                    </button>
                  </div>
                )}
              </div>

              {payrollConfigDraft.insurance_benefits?.enable_medical_insurance && (
                <>
                  {payrollConfigDraft.insurance_benefits?.medical_insurance_mode === 'brackets' ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Medical Plan Salary Brackets</h4>
                          <p className="text-[11px] text-slate-400">Medical fees categorized by salary range (Starts from → Up to salary).</p>
                        </div>
                        <button
                          type="button"
                          onClick={addMedicalInsuranceBracket}
                          className="bg-indigo-50 text-indigo-600 text-xs font-black px-3.5 py-2 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Plan Bracket</span>
                        </button>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50/80 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Plan Name</th>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Salary starts from</th>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Up to salary</th>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-36">Employee Fee</th>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-36">Employer Fee</th>
                              <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-16 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(payrollConfigDraft.insurance_benefits?.medical_insurance_brackets || []).map((bracket: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-4 py-2.5">
                                  <input
                                    type="text"
                                    value={bracket.name || ''}
                                    onChange={e => updateMedicalInsuranceBracket(idx, 'name', e.target.value)}
                                    className="w-full p-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder={`Plan ${idx + 1}`}
                                  />
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min={0}
                                      value={bracket.min_salary}
                                      onChange={e => updateMedicalInsuranceBracket(idx, 'min_salary', e.target.value)}
                                      className="w-full p-2 pr-10 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                                      placeholder="0"
                                    />
                                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">EGP</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min={0}
                                      value={bracket.max_salary}
                                      onChange={e => updateMedicalInsuranceBracket(idx, 'max_salary', e.target.value)}
                                      className="w-full p-2 pr-10 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                                      placeholder="25000"
                                    />
                                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">EGP</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min={0}
                                      value={bracket.employee_fee}
                                      onChange={e => updateMedicalInsuranceBracket(idx, 'employee_fee', e.target.value)}
                                      className="w-full p-2 pr-10 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                                      placeholder="150"
                                    />
                                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">EGP</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min={0}
                                      value={bracket.employer_fee}
                                      onChange={e => updateMedicalInsuranceBracket(idx, 'employer_fee', e.target.value)}
                                      className="w-full p-2 pr-10 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                                      placeholder="300"
                                    />
                                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">EGP</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeMedicalInsuranceBracket(idx)}
                                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all cursor-pointer"
                                    title="Delete Medical Bracket"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {(payrollConfigDraft.insurance_benefits?.medical_insurance_brackets || []).length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                                  No medical plan brackets configured. Click "Add Plan Bracket" above to add tiers.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Employee Monthly Fee</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            value={payrollConfigDraft.insurance_benefits?.medical_insurance_employee_fee || 0}
                            onChange={e => updateInsurance('medical_insurance_employee_fee', parseFloat(e.target.value) || 0)}
                            className="w-full p-3 pr-12 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="150"
                          />
                          <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">EGP</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Employer Monthly Fee</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            value={payrollConfigDraft.insurance_benefits?.medical_insurance_employer_fee || 0}
                            onChange={e => updateInsurance('medical_insurance_employer_fee', parseFloat(e.target.value) || 0)}
                            className="w-full p-3 pr-12 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="300"
                          />
                          <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">EGP</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: TAXES */}
        {configActiveTab === 'taxes' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-slate-900">Progressive Income Tax Brackets</h4>
                <p className="text-xs text-slate-400">Set progressive tax slabs. Income is calculated progressively based on the slabs below.</p>
              </div>
              <button
                type="button"
                onClick={addTaxBracket}
                className="bg-indigo-50 text-indigo-600 text-xs font-black px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Bracket</span>
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Salary starts from</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Up to salary</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-40">Tax Rate</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(payrollConfigDraft.tax_brackets || []).map((slab: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-100/30 transition-colors">
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          value={slab.min_salary}
                          onChange={e => updateTaxBracket(idx, 'min_salary', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          value={slab.max_salary}
                          onChange={e => updateTaxBracket(idx, 'max_salary', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="30000"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min={0}
                            max={100}
                            value={slab.tax_rate}
                            onChange={e => updateTaxBracket(idx, 'tax_rate', e.target.value)}
                            className="w-full p-2 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                            placeholder="10"
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeTaxBracket(idx)}
                          className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(payrollConfigDraft.tax_brackets || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-xs">
                        No progressive tax slabs configured. Click the button above to add tax brackets.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className={cn(
        "p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3",
        isModal ? "rounded-b-[32px] shrink-0" : "rounded-b-3xl sticky bottom-0 z-10 bg-slate-50/95 backdrop-blur-xs"
      )}>
        <button
          type="button"
          onClick={handleClose}
          className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-2xs"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Policy Setup'}</span>
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="w-full max-w-5xl flex justify-center"
        >
          {content}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-4">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/hr/payroll')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Payroll</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/hr/payroll')}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Policy Setup'}</span>
          </button>
        </div>
      </div>

      {content}
    </div>
  );
};
