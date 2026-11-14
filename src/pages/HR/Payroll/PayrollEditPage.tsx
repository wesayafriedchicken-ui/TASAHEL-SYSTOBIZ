import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  DollarSign, 
  X, 
  Printer, 
  Save, 
  User, 
  ArrowLeft,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Coins,
  Building2,
  Calendar,
  Check,
  AlertCircle
} from 'lucide-react';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';
import { CustomFieldsDisplay } from '../../../components/HR/CustomFieldsManager';
import { getJDForTitle, getGradeForJobTitle } from '../../../lib/hrData';

interface PayrollEditPageProps {
  record?: any;
  isModal?: boolean;
  onClose?: () => void;
}

export const PayrollEditPage: React.FC<PayrollEditPageProps> = ({ 
  record: propRecord, 
  isModal = false, 
  onClose 
}) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    payroll,
    employees,
    departments,
    currentUser,
    fetchData,
    showCustomToast,
    canWrite,
    canEditPayrollEntry
  } = useHRContext();

  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [breakdownDraft, setBreakdownDraft] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const queryEmpId = searchParams.get('empId');
  const queryMonth = searchParams.get('month');
  const queryYear = searchParams.get('year');

  // Resolve record from prop or URL param or search in payroll
  useEffect(() => {
    if (propRecord) {
      setSelectedRecord(propRecord);
      return;
    }

    if (id) {
      const parsedId = parseInt(id, 10);
      const targetMonth = queryMonth ? parseInt(queryMonth, 10) : undefined;
      const targetYear = queryYear ? parseInt(queryYear, 10) : undefined;

      // 1. Try finding by payroll record id
      let rec = payroll.find(p => p.id === parsedId);

      // 2. If not found or if id is employee id, search by user_id/employee_id and optionally month/year
      if (!rec) {
        rec = payroll.find(p => {
          const pAny = p as any;
          const matchUser = pAny.user_id === parsedId || pAny.employee_id === parsedId;
          if (!matchUser) return false;
          if (targetMonth && parseInt(String(pAny.month || 0), 10) !== targetMonth) return false;
          if (targetYear && parseInt(String(pAny.year || 0), 10) !== targetYear) return false;
          return true;
        });
      }

      // 3. If still not found and queryEmpId is provided
      if (!rec && queryEmpId) {
        const pEmpId = parseInt(queryEmpId, 10);
        rec = payroll.find(p => {
          const pAny = p as any;
          const matchUser = pAny.user_id === pEmpId || pAny.employee_id === pEmpId;
          if (!matchUser) return false;
          if (targetMonth && parseInt(String(pAny.month || 0), 10) !== targetMonth) return false;
          if (targetYear && parseInt(String(pAny.year || 0), 10) !== targetYear) return false;
          return true;
        });
      }

      if (rec) {
        setSelectedRecord(rec);
      } else {
        // Fallback to employee profile to create a new draft record
        const empId = queryEmpId ? parseInt(queryEmpId, 10) : parsedId;
        const emp = employees.find(e => e.id === empId);
        if (emp) {
          setSelectedRecord({
            user_id: emp.id,
            employee_id: emp.id,
            emp_name: emp.name,
            base_salary: emp.salary_base || 0,
            allowances: emp.allowances || 0,
            month: targetMonth || (new Date().getMonth() + 1),
            year: targetYear || new Date().getFullYear(),
            status: 'Draft',
            breakdown: {}
          });
        }
      }
    }
  }, [propRecord, id, queryEmpId, queryMonth, queryYear, payroll, employees]);

  // Initialize breakdown draft from record and employee
  useEffect(() => {
    if (!selectedRecord) return;
    const pr = selectedRecord;
    let bd: any = {};
    if (pr.breakdown) {
      try {
        bd = typeof pr.breakdown === 'string' ? JSON.parse(pr.breakdown) : pr.breakdown;
      } catch {
        bd = {};
      }
    }

    const emp: any = employees.find(e => e.id === (pr.user_id || pr.employee_id)) || {};
    const deptName = departments.find(d => d.id === (emp.department_id || emp.department))?.name || (typeof emp.department === 'object' ? emp.department?.name : emp.department) || 'General';

    // Personal & Employment
    const hr_id = bd.hr_id || emp.hr_id || (emp.id ? `#HR-${emp.id.toString().padStart(4, '0')}` : '#HR-0000');
    const emp_name_en = bd.emp_name_en || pr.employee_name || pr.emp_name || emp.name || '';
    const emp_name_ar = bd.emp_name_ar || emp.arabic_name || emp.name_ar || '';
    const email = bd.email || emp.email || '';
    const address = bd.address || emp.address || '';
    const national_id = bd.national_id || emp.national_id || '';
    const sin = bd.sin || emp.sin || emp.social_insurance_number || '';
    const hiring_date = bd.hiring_date || emp.joined_date || emp.hiring_date || '';
    const last_working_day = bd.last_working_day || emp.last_working_day || '-';
    const working_days = bd.working_days ?? 22;
    const location = bd.location || emp.location || emp.branch || 'Main HQ';
    const division = bd.division || emp.division || 'Operations';
    const job_grade = bd.job_grade || bd.division || emp.personal_info?.job_grade || emp.job_grade || emp.division || 'Grade 7 / Entry Level';
    const department = bd.department || deptName;
    const team_name = bd.team_name || emp.team_name || emp.personal_info?.team_name || emp.team || emp.teams || '';
    const job_title = bd.job_title || emp.job_title || 'Employee';
    const reporting_to = bd.reporting_to || emp.reporting_to || emp.manager_name || '';

    // Payment & Bank
    const payment_method = bd.payment_method || emp.payment_method || 'Bank Transfer';
    const bank_name = bd.bank_name || emp.bank_name || 'CIB Bank';
    const iban = bd.iban || emp.iban || emp.bank_account || '';
    const salary_transfer = bd.salary_transfer || 'Transfer Pending';

    // Earnings & Gross
    const base_salary = parseFloat(bd.base_salary ?? pr.base_salary ?? emp.salary_base ?? 0);
    const social_insurance_amount = parseFloat(bd.social_insurance_amount ?? 0);
    const defaultKpiVal = emp.personal_info?.kpi_settings?.amount ?? emp.kpi_settings?.amount ?? emp.kpi_amount ?? emp.kpis ?? 0;
    const kpis = parseFloat((bd.kpis !== undefined && bd.kpis !== null) ? bd.kpis : defaultKpiVal);
    const overtime_amount = parseFloat(bd.overtime_amount ?? 0);
    const transportation_allowance = parseFloat(bd.transportation_allowance ?? pr.allowances ?? 0);
    const leave_balance = parseFloat(bd.leave_balance ?? emp.annual_leave_days ?? 21);
    const bonus = parseFloat(bd.bonus ?? pr.bonuses ?? 0);
    const commission = parseFloat(bd.commission ?? pr.commissions ?? 0);
    const incentives = parseFloat(bd.incentives ?? 0);

    // Deductions
    const deducted_days = parseFloat(bd.deducted_days ?? 0);
    const deducted_hours = parseFloat(bd.deducted_hours ?? 0);
    const advances = parseFloat(bd.advances ?? 0);
    const sick_leave_deduction = parseFloat(bd.sick_leave_deduction ?? 0);
    const other_deductions = parseFloat(bd.other_deductions ?? pr.deductions ?? 0);
    const loans = parseFloat(bd.loans ?? 0);
    const purchasing = parseFloat(bd.purchasing ?? 0);
    const social_insurance_employee_share = parseFloat(bd.social_insurance_employee_share ?? 0);
    const martyrs_tax = parseFloat(bd.martyrs_tax ?? 0);
    const taxable_amount = parseFloat(bd.taxable_amount ?? 0);
    const annual_taxable = parseFloat(bd.annual_taxable ?? 0);
    const income_tax_deduction = parseFloat(bd.income_tax_deduction ?? 0);

    // Employer Overhead & CTC
    const emergency_fund = parseFloat(bd.emergency_fund ?? 0);
    const social_insurance_company_share = parseFloat(bd.social_insurance_company_share ?? 0);
    const comments = bd.comments || pr.comments || '';

    setBreakdownDraft({
      hr_id,
      emp_name_en,
      emp_name_ar,
      email,
      address,
      national_id,
      sin,
      hiring_date,
      last_working_day,
      working_days,
      location,
      division,
      job_grade,
      department,
      team_name,
      job_title,
      reporting_to,
      payment_method,
      bank_name,
      iban,
      salary_transfer,
      base_salary,
      social_insurance_amount,
      kpis,
      overtime_amount,
      transportation_allowance,
      leave_balance,
      bonus,
      commission,
      incentives,
      deducted_days,
      deducted_hours,
      advances,
      sick_leave_deduction,
      other_deductions,
      loans,
      purchasing,
      social_insurance_employee_share,
      martyrs_tax,
      taxable_amount,
      annual_taxable,
      income_tax_deduction,
      emergency_fund,
      social_insurance_company_share,
      comments
    });
  }, [selectedRecord, employees, departments]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/hr/payroll');
    }
  };

  const updateBDField = (field: string, val: any) => {
    setBreakdownDraft((prev: any) => {
      if (!prev) return prev;
      return { ...prev, [field]: val };
    });
  };

  // Live calculations
  const calculatedValues = useMemo(() => {
    if (!breakdownDraft) {
      return {
        base_salary: 0,
        total_gross: 0,
        deducted_days_cost: 0,
        deducted_hours_cost: 0,
        total_deductions: 0,
        net_salary: 0,
        ctc: 0
      };
    }

    const base_salary = parseFloat(breakdownDraft.base_salary || 0);
    const social_insurance_amount = parseFloat(breakdownDraft.social_insurance_amount || 0);
    const kpis = parseFloat(breakdownDraft.kpis || 0);
    const overtime_amount = parseFloat(breakdownDraft.overtime_amount || 0);
    const transportation_allowance = parseFloat(breakdownDraft.transportation_allowance || 0);
    const bonus = parseFloat(breakdownDraft.bonus || 0);
    const commission = parseFloat(breakdownDraft.commission || 0);
    const incentives = parseFloat(breakdownDraft.incentives || 0);

    const total_gross = base_salary + social_insurance_amount + kpis + overtime_amount + transportation_allowance + bonus + commission + incentives;

    const working_days = parseFloat(breakdownDraft.working_days || 22) || 22;
    const deducted_days = parseFloat(breakdownDraft.deducted_days || 0);
    const deducted_hours = parseFloat(breakdownDraft.deducted_hours || 0);
    const deducted_days_cost = (deducted_days * base_salary) / working_days;
    const deducted_hours_cost = (deducted_hours * base_salary) / (working_days * 8);

    const advances = parseFloat(breakdownDraft.advances || 0);
    const sick_leave_deduction = parseFloat(breakdownDraft.sick_leave_deduction || 0);
    const other_deductions = parseFloat(breakdownDraft.other_deductions || 0);
    const loans = parseFloat(breakdownDraft.loans || 0);
    const purchasing = parseFloat(breakdownDraft.purchasing || 0);
    const social_insurance_employee_share = parseFloat(breakdownDraft.social_insurance_employee_share || 0);
    const martyrs_tax = parseFloat(breakdownDraft.martyrs_tax || 0);
    const income_tax_deduction = parseFloat(breakdownDraft.income_tax_deduction || 0);

    const total_deductions = deducted_days_cost + deducted_hours_cost + advances + sick_leave_deduction + other_deductions + loans + purchasing + social_insurance_employee_share + martyrs_tax + income_tax_deduction;
    const net_salary = Math.max(0, total_gross - total_deductions);

    const emergency_fund = parseFloat(breakdownDraft.emergency_fund || 0);
    const social_insurance_company_share = parseFloat(breakdownDraft.social_insurance_company_share || 0);
    const ctc = total_gross + social_insurance_company_share + emergency_fund;

    return {
      base_salary,
      total_gross,
      deducted_days_cost,
      deducted_hours_cost,
      total_deductions,
      net_salary,
      ctc
    };
  }, [breakdownDraft]);

  const handleSave = async () => {
    if (!selectedRecord || !breakdownDraft) return;
    setIsSaving(true);
    try {
      const pr = selectedRecord;
      const emp: any = employees.find(e => e.id === (pr.user_id || pr.employee_id)) || {};
      const {
        base_salary,
        total_gross,
        deducted_days_cost,
        deducted_hours_cost,
        total_deductions,
        net_salary,
        ctc
      } = calculatedValues;

      const fullBreakdown = {
        ...breakdownDraft,
        deducted_days_cost,
        deducted_hours_cost,
        total_gross,
        total_deductions,
        ctc,
        net_salary
      };

      const payload = {
        ...pr,
        user_id: pr.user_id || emp.id,
        employee_id: pr.user_id || emp.id,
        base_salary,
        allowances: parseFloat(breakdownDraft.transportation_allowance || 0),
        bonuses: parseFloat(breakdownDraft.bonus || 0),
        commissions: parseFloat(breakdownDraft.commission || 0),
        overtime: parseFloat(breakdownDraft.overtime_amount || 0),
        deductions: total_deductions,
        tax_deductions: parseFloat(breakdownDraft.income_tax_deduction || 0),
        net_salary,
        total_net: net_salary,
        month: pr.month || (queryMonth ? parseInt(queryMonth, 10) : new Date().getMonth() + 1),
        year: pr.year || (queryYear ? parseInt(queryYear, 10) : new Date().getFullYear()),
        status: pr.status || 'Draft',
        comments: breakdownDraft.comments || '',
        breakdown: fullBreakdown
      };

      const res = await fetch('/api/hr/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showCustomToast('Payroll breakdown and calculations saved successfully.', 'success');
        fetchData();
        handleClose();
      } else {
        showCustomToast('Failed to save payroll breakdown.', 'error');
      }
    } catch (err) {
      console.error('Failed to save payroll breakdown:', err);
      showCustomToast('Failed to save payroll record.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  if (!selectedRecord || !breakdownDraft) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center max-w-sm w-full space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-800">Loading Payroll Details...</h3>
          <p className="text-xs text-slate-400">Retrieving employee breakdown & calculation matrices.</p>
        </div>
      </div>
    );
  }

  const pr = selectedRecord;
  const emp: any = employees.find(e => e.id === (pr.user_id || pr.employee_id)) || {};
  const isPayrollWritable = canEditPayrollEntry ?? canWrite('payroll');
  const currentMonthNum = parseInt(pr.month || queryMonth || new Date().getMonth() + 1, 10);
  const currentYearNum = parseInt(pr.year || queryYear || new Date().getFullYear(), 10);
  const monthName = new Date(2000, currentMonthNum - 1).toLocaleString('default', { month: 'long' });

  const {
    base_salary,
    total_gross,
    deducted_days_cost,
    deducted_hours_cost,
    total_deductions,
    net_salary,
    ctc
  } = calculatedValues;

  const pageContainerClass = isModal
    ? "fixed inset-0 z-[100] bg-slate-100/90 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 md:p-8 animate-fadeIn"
    : "min-h-screen bg-slate-100/80 p-3 sm:p-6 md:p-8";

  return (
    <div className={pageContainerClass}>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        
        {/* Top Bar Header */}
        <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4 sticky top-4 z-30 print:static print:border-none print:shadow-none">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all cursor-pointer print:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Payroll List</span>
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>{breakdownDraft.emp_name_en || pr.emp_name || emp?.name || 'Employee'}</span>
                {breakdownDraft.emp_name_ar && (
                  <span className="text-slate-400 font-normal text-sm">({breakdownDraft.emp_name_ar})</span>
                )}
              </h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                PAYROLL BREAKDOWN • {monthName} {currentYearNum}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border",
              pr.status === 'Paid' 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}>
              {pr.status || 'Draft'}
            </span>

            <button
              onClick={handlePrintSlip}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-black transition-all shadow-xs cursor-pointer print:hidden"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print / PDF</span>
            </button>

            {isPayrollWritable && pr.status !== 'Paid' && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50 print:hidden"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Details'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Financial Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Gross Basic Salary */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              GROSS BASIC SALARY
            </span>
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              {base_salary.toLocaleString()} <span className="text-xs font-bold text-slate-400">EGP</span>
            </p>
            <span className="text-[10px] text-slate-400 font-medium mt-1">Base Salary</span>
          </div>

          {/* Card 2: Total Monthly Gross */}
          <div className="p-5 bg-emerald-50/60 rounded-3xl border border-emerald-100 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block mb-1">
              TOTAL MONTHLY GROSS
            </span>
            <p className="text-2xl font-black text-emerald-700 tracking-tight">
              {total_gross.toLocaleString()} <span className="text-xs font-bold text-emerald-600">EGP</span>
            </p>
            <span className="text-[10px] text-emerald-600 font-medium mt-1">Total Gross Allowances</span>
          </div>

          {/* Card 3: Total Deductions */}
          <div className="p-5 bg-rose-50/60 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block mb-1">
              TOTAL DEDUCTIONS
            </span>
            <p className="text-2xl font-black text-rose-700 tracking-tight">
              {total_deductions.toLocaleString()} <span className="text-xs font-bold text-rose-600">EGP</span>
            </p>
            <span className="text-[10px] text-rose-600 font-medium mt-1">Total Deductions & Taxes</span>
          </div>

          {/* Card 4: Calculated Net Salary (Indigo Gradient) */}
          <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl shadow-lg flex flex-col justify-between col-span-1 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-black text-indigo-100 uppercase tracking-wider block mb-1">
              CALCULATED NET SALARY
            </span>
            <p className="text-3xl font-black text-amber-300 tracking-tight">
              {net_salary.toLocaleString()} <span className="text-xs font-bold text-indigo-200">EGP</span>
            </p>
            <span className="text-[10px] text-indigo-200 font-medium mt-1">Net Pay to Employee</span>
          </div>

          {/* Card 5: Cost To Company (CTC) */}
          <div className="p-5 bg-purple-50/60 rounded-3xl border border-purple-100 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-black text-purple-800 uppercase tracking-wider block mb-1">
              COST TO COMPANY (CTC)
            </span>
            <p className="text-2xl font-black text-purple-700 tracking-tight">
              {ctc.toLocaleString()} <span className="text-xs font-bold text-purple-600">EGP</span>
            </p>
            <span className="text-[10px] text-purple-600 font-medium mt-1">Total Employer Cost</span>
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-6">

          {/* Section 1: Personal & Job Information */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">1. Personal & Job Information</h3>
                <p className="text-xs text-slate-400 font-medium">Employee identification, department, and contract details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">HR ID</label>
                <input 
                  type="text" 
                  value={breakdownDraft.hr_id} 
                  onChange={e => updateBDField('hr_id', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">English Name</label>
                <input 
                  type="text" 
                  value={breakdownDraft.emp_name_en} 
                  onChange={e => updateBDField('emp_name_en', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Arabic Name</label>
                <input 
                  type="text" 
                  value={breakdownDraft.emp_name_ar} 
                  onChange={e => updateBDField('emp_name_ar', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Email</label>
                <input 
                  type="email" 
                  value={breakdownDraft.email} 
                  onChange={e => updateBDField('email', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Address</label>
                <input 
                  type="text" 
                  value={breakdownDraft.address} 
                  onChange={e => updateBDField('address', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">National ID</label>
                <input 
                  type="text" 
                  value={breakdownDraft.national_id} 
                  onChange={e => updateBDField('national_id', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">SIN (Insurance No.)</label>
                <input 
                  type="text" 
                  value={breakdownDraft.sin} 
                  onChange={e => updateBDField('sin', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Hiring Date</label>
                <input 
                  type="date" 
                  value={breakdownDraft.hiring_date ? breakdownDraft.hiring_date.substring(0, 10) : ''} 
                  onChange={e => updateBDField('hiring_date', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Last Working Day</label>
                <input 
                  type="text" 
                  value={breakdownDraft.last_working_day} 
                  onChange={e => updateBDField('last_working_day', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Working Days</label>
                <input 
                  type="number" 
                  value={breakdownDraft.working_days} 
                  onChange={e => updateBDField('working_days', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Location</label>
                <input 
                  type="text" 
                  value={breakdownDraft.location} 
                  onChange={e => updateBDField('location', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Job Grade / Level</label>
                <input 
                  type="text" 
                  value={breakdownDraft.job_grade || breakdownDraft.division} 
                  onChange={e => { 
                    updateBDField('job_grade', e.target.value); 
                    updateBDField('division', e.target.value); 
                  }} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Department</label>
                <input 
                  type="text" 
                  value={breakdownDraft.department} 
                  onChange={e => updateBDField('department', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Teams</label>
                <input 
                  type="text" 
                  value={breakdownDraft.team_name || ''} 
                  onChange={e => updateBDField('team_name', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Job Title</label>
                <input 
                  type="text" 
                  value={breakdownDraft.job_title} 
                  onChange={e => {
                    const newTitle = e.target.value;
                    updateBDField('job_title', newTitle);
                    const autoGrade = getGradeForJobTitle(newTitle, breakdownDraft.department, departments);
                    const jd = getJDForTitle(newTitle, breakdownDraft.department, departments);
                    if (autoGrade) {
                      updateBDField('job_grade', autoGrade);
                      updateBDField('division', autoGrade);
                    }
                    if (jd) {
                      if (jd.department) updateBDField('department', jd.department);
                      if (jd.team) updateBDField('team_name', jd.team);
                      if (jd.reportsTo) updateBDField('reporting_to', jd.reportsTo);
                      if (jd.location) updateBDField('location', jd.location);
                      if (jd.grade && !autoGrade) { 
                        updateBDField('job_grade', jd.grade); 
                        updateBDField('division', jd.grade); 
                      }
                    }
                  }} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Reporting to</label>
                <input 
                  type="text" 
                  value={breakdownDraft.reporting_to || ''} 
                  onChange={e => updateBDField('reporting_to', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment & Banking Information */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">2. Payment & Banking Information</h3>
                <p className="text-xs text-slate-400 font-medium">Bank account details and transfer status</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Payment Method</label>
                <select 
                  value={breakdownDraft.payment_method} 
                  onChange={e => updateBDField('payment_method', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Instapay">Instapay</option>
                  <option value="Wallet">Digital Wallet</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Bank Name</label>
                <input 
                  type="text" 
                  value={breakdownDraft.bank_name} 
                  onChange={e => updateBDField('bank_name', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">IBAN</label>
                <input 
                  type="text" 
                  value={breakdownDraft.iban} 
                  onChange={e => updateBDField('iban', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none font-mono" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">Salary Transfer</label>
                <input 
                  type="text" 
                  value={breakdownDraft.salary_transfer} 
                  onChange={e => updateBDField('salary_transfer', e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Monthly Gross Earnings & Allowances */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">3. Monthly Gross Earnings & Allowances</h3>
                  <p className="text-xs text-slate-400 font-medium">Base salary, allowances, bonuses, and performance incentives</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl text-right">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">TOTAL GROSS MONTHLY</span>
                <span className="text-lg font-black text-emerald-800">{total_gross.toLocaleString()} EGP</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Gross Basic Salary EGP</label>
                <input 
                  type="number" 
                  value={breakdownDraft.base_salary} 
                  onChange={e => updateBDField('base_salary', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Social Insurance Amount</label>
                <input 
                  type="number" 
                  value={breakdownDraft.social_insurance_amount} 
                  onChange={e => updateBDField('social_insurance_amount', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">KPIs</label>
                <input 
                  type="number" 
                  value={breakdownDraft.kpis} 
                  onChange={e => updateBDField('kpis', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Overtime Amount</label>
                <input 
                  type="number" 
                  value={breakdownDraft.overtime_amount} 
                  onChange={e => updateBDField('overtime_amount', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Transportation Allowance</label>
                <input 
                  type="number" 
                  value={breakdownDraft.transportation_allowance} 
                  onChange={e => updateBDField('transportation_allowance', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Leave Balance</label>
                <input 
                  type="number" 
                  value={breakdownDraft.leave_balance} 
                  onChange={e => updateBDField('leave_balance', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Bonus</label>
                <input 
                  type="number" 
                  value={breakdownDraft.bonus} 
                  onChange={e => updateBDField('bonus', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Commission</label>
                <input 
                  type="number" 
                  value={breakdownDraft.commission} 
                  onChange={e => updateBDField('commission', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Incentives</label>
                <input 
                  type="number" 
                  value={breakdownDraft.incentives} 
                  onChange={e => updateBDField('incentives', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Section 4: Deductions, Penalties & Tax */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">4. Deductions, Penalties & Tax</h3>
                  <p className="text-xs text-slate-400 font-medium">Absence, delay, loans, advances, social insurance, and taxes</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-2xl text-right">
                <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">TOTAL DEDUCTIONS</span>
                <span className="text-lg font-black text-rose-800">{total_deductions.toLocaleString()} EGP</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Deducted Days</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={breakdownDraft.deducted_days} 
                    onChange={e => updateBDField('deducted_days', parseFloat(e.target.value) || 0)} 
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                  />
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 shrink-0">
                    ={deducted_days_cost.toFixed(1)} EGP
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Deducted Hours</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={breakdownDraft.deducted_hours} 
                    onChange={e => updateBDField('deducted_hours', parseFloat(e.target.value) || 0)} 
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                  />
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 shrink-0">
                    ={deducted_hours_cost.toFixed(1)} EGP
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Advances</label>
                <input 
                  type="number" 
                  value={breakdownDraft.advances} 
                  onChange={e => updateBDField('advances', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Sick Leave Deduction</label>
                <input 
                  type="number" 
                  value={breakdownDraft.sick_leave_deduction} 
                  onChange={e => updateBDField('sick_leave_deduction', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Other Deductions</label>
                <input 
                  type="number" 
                  value={breakdownDraft.other_deductions} 
                  onChange={e => updateBDField('other_deductions', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Loans</label>
                <input 
                  type="number" 
                  value={breakdownDraft.loans} 
                  onChange={e => updateBDField('loans', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Purchasing</label>
                <input 
                  type="number" 
                  value={breakdownDraft.purchasing} 
                  onChange={e => updateBDField('purchasing', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Social Insurance Employee Share</label>
                <input 
                  type="number" 
                  value={breakdownDraft.social_insurance_employee_share} 
                  onChange={e => updateBDField('social_insurance_employee_share', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Martyrs Tax</label>
                <input 
                  type="number" 
                  value={breakdownDraft.martyrs_tax} 
                  onChange={e => updateBDField('martyrs_tax', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Taxable Amount</label>
                <input 
                  type="number" 
                  value={breakdownDraft.taxable_amount} 
                  onChange={e => updateBDField('taxable_amount', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Annual Taxable</label>
                <input 
                  type="number" 
                  value={breakdownDraft.annual_taxable} 
                  onChange={e => updateBDField('annual_taxable', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Income Tax Deduction</label>
                <input 
                  type="number" 
                  value={breakdownDraft.income_tax_deduction} 
                  onChange={e => updateBDField('income_tax_deduction', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Section 5: Employer Share & Net Salary (CTC) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">5. Employer Share & Net Salary (CTC)</h3>
                <p className="text-xs text-slate-400 font-medium">Company contributions, emergency funds, and comments</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Emergency Fund</label>
                <input 
                  type="number" 
                  value={breakdownDraft.emergency_fund} 
                  onChange={e => updateBDField('emergency_fund', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Social Insurance Company Share</label>
                <input 
                  type="number" 
                  value={breakdownDraft.social_insurance_company_share} 
                  onChange={e => updateBDField('social_insurance_company_share', parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">CTC (Cost To Company)</label>
                <div className="w-full bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 text-xs font-black text-purple-900">
                  {ctc.toLocaleString()} EGP
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Comments</label>
              <textarea
                rows={3}
                value={breakdownDraft.comments || ''}
                onChange={e => updateBDField('comments', e.target.value)}
                placeholder="Add comments..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Custom Fields Section (if record ID exists) */}
          {pr.id && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs print:hidden">
              <CustomFieldsDisplay entityType="payroll" entityId={pr.id} />
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-md print:hidden">
            <div>
              <span className="text-xs font-extrabold text-slate-400 block uppercase tracking-wider">
                NET SALARY EGP
              </span>
              <span className="text-3xl font-black text-slate-900">
                {net_salary.toLocaleString()} EGP
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all cursor-pointer"
              >
                Close Breakdown
              </button>

              {isPayrollWritable && pr.status !== 'Paid' && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Payroll Details'}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
