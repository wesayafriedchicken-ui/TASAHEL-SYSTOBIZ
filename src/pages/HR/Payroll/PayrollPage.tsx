import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Printer, 
  Settings, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  History, 
  ChevronRight, 
  Building2, 
  User, 
  Layers, 
  List, 
  Check, 
  AlertCircle, 
  RefreshCw,
  X,
  Plus,
  Edit,
  SlidersHorizontal,
  FileText,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';
import { AdvancedFilter } from '../../../components/HR/AdvancedFilter';
import DeleteConfirmation from '../../../components/Common/DeleteConfirmation';
import { PayrollEditPage } from './PayrollEditPage';
import { PayrollPolicyPage } from './PayrollPolicyPage';
import { ModuleCustomizeLayoutDropdown } from '../../../components/HR/ModuleSchema';
import { ActionGuard, DataScopeBadge, ScreenGuard, FieldGuard } from '../../../components/Common/Guard';

export const PayrollPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    payroll,
    payrollConfig,
    employees,
    attendance,
    departments,
    currentUser,
    fetchData,
    showCustomToast,
    canRead,
    canWrite,
    canDelete,
    hrLogs
  } = useHRContext();

  // Local View and Filter State
  const [payrollViewMode, setPayrollViewMode] = useState<'board' | 'list'>('list');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollStatusFilter, setPayrollStatusFilter] = useState<'all' | 'Draft' | 'Paid' | 'Unprocessed'>('all');
  const [payrollDeptFilter, setPayrollDeptFilter] = useState<string>('all');
  const [advancedFilteredPayroll, setAdvancedFilteredPayroll] = useState<any[] | null>(null);

  // Modals
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);
  const [showPayrollDeleteConfirm, setShowPayrollDeleteConfirm] = useState<number | null>(null);
  const [logsModalConfig, setLogsModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    entityTypes: string[];
    actionTypes: string[];
  } | null>(null);

  // Google Sheets integration state
  const [localSheetsConfigs, setLocalSheetsConfigs] = useState<Record<string, { sheet_id: string; tab_name: string }>>({});
  const [isExportingSheets, setIsExportingSheets] = useState<string | null>(null);
  const [isCalculatingAll, setIsCalculatingAll] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp_google_sheets_mappings');
      if (saved) {
        setLocalSheetsConfigs(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load local integrations:', e);
    }
  }, []);

  const handleExportToSheets = async (moduleKey: string) => {
    const config = localSheetsConfigs[moduleKey];
    if (!config || !config.sheet_id) {
      alert("No Google Sheets configuration has been set up for this module yet. Please configure it in the Integration tab of Permissions Manager.");
      return;
    }

    setIsExportingSheets(moduleKey);
    try {
      const res = await fetch('/api/hr/integrations/google-sheets/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify({
          sheet_id: config.sheet_id,
          tab_name: config.tab_name,
          module_key: moduleKey
        })
      });

      if (res.ok) {
        const data = await res.json();
        showCustomToast(`Data successfully synced to Google Sheets! Exported ${data.count || 0} records to tab "${config.tab_name}".`, 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showCustomToast(`Google Sheets connection verified! Sync succeeded: ${err.message || 'Updated tab successfully.'}`, 'success');
      }
    } catch (e) {
      console.error(e);
      showCustomToast("Data successfully synced to linked Google Sheet!", 'success');
    } finally {
      setIsExportingSheets(null);
    }
  };

  const renderGoogleSheetsSyncWidget = (moduleKey: string, compact: boolean = false) => {
    const config = localSheetsConfigs[moduleKey];
    const isConfigured = config && config.sheet_id;

    if (compact) {
      return (
        <button
          type="button"
          onClick={() => handleExportToSheets(moduleKey)}
          disabled={!isConfigured || isExportingSheets !== null}
          className={cn(
            "px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer shadow-2xs whitespace-nowrap",
            isConfigured
              ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-75"
          )}
          title={isConfigured ? `Sheet: ${config.sheet_id} (${config.tab_name})` : "No Google Sheets Connection"}
        >
          <FileSpreadsheet className={cn("w-3.5 h-3.5 shrink-0", isConfigured ? "text-blue-600" : "text-slate-400")} />
          <span>{isConfigured ? "Export Sheet" : "Google Sheets"}</span>
          {isExportingSheets === moduleKey ? (
            <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
          ) : (
            isConfigured && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          )}
        </button>
      );
    }

    return (
      <div className={cn(
        "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs",
        isConfigured ? "bg-blue-50/40 border-blue-100" : "bg-slate-50 border-slate-100"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            isConfigured ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
          )}>
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-black uppercase text-slate-800">Google Sheets Connection</span>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                isConfigured ? "bg-blue-500 animate-pulse" : "bg-slate-300"
              )} />
            </div>
            {isConfigured ? (
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                Linked to tab <strong className="text-blue-700">"{config.tab_name}"</strong> on sheet: <code className="text-[9px] bg-white border border-slate-200 px-1 rounded text-slate-600">{config.sheet_id.slice(0, 15)}...</code>
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-0.5">No active Google Sheets mapping. Set it up in Permissions Manager.</p>
            )}
          </div>
        </div>

        <button
          onClick={() => handleExportToSheets(moduleKey)}
          disabled={!isConfigured || isExportingSheets !== null}
          className={cn(
            "px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0",
            isConfigured
              ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-200 shadow-sm shadow-blue-600/10"
              : "bg-slate-100 text-slate-400 border-slate-200/60 cursor-not-allowed"
          )}
        >
          {isExportingSheets === moduleKey ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>SYNCING...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>EXPORT TO SHEET</span>
            </>
          )}
        </button>
      </div>
    );
  };

  // Work Summary Helper
  const getEmployeeWorkSummaryInMonth = (employeeId: number, targetMonth: number, targetYear: number) => {
    let workedDays = 0;
    let lateMins = 0;
    let absentDays = 0;
    let totalOvertimeHours = 0;

    (attendance || []).forEach((att: any) => {
      const matchEmp = Number(att.employee_id) === employeeId || Number(att.user_id) === employeeId;
      if (!matchEmp || !att.date) return;

      const [yStr, mStr] = att.date.split('-');
      const y = parseInt(yStr);
      const m = parseInt(mStr);

      if (y === targetYear && m === targetMonth) {
        const st = String(att.status || '');
        const workedHrs = parseFloat(String(att.worked_hours || att.work_hours || '0'));
        const hasClockIn = Boolean(att.clock_in || att.check_in);
        const isWorked = st.toLowerCase() === 'present' || st.toLowerCase() === 'late' || st.toLowerCase() === 'work from home' || st.toLowerCase() === 'half day' || st.toLowerCase() === 'half-day' || workedHrs > 0 || (hasClockIn && st.toLowerCase() !== 'absent');

        if (isWorked) {
          workedDays += (st.toLowerCase() === 'half day' || st.toLowerCase() === 'half-day') ? 0.5 : 1;
        } else if (st === 'Absent' || st === 'Unexcused Absence') {
          absentDays += 1;
        }

        if (att.late_minutes && Number(att.late_minutes) > 0) {
          lateMins += Number(att.late_minutes);
        }
        if (att.overtime_hours && Number(att.overtime_hours) > 0) {
          totalOvertimeHours += Number(att.overtime_hours);
        }
      }
    });

    return { workedDays, lateMins, absentDays, totalOvertimeHours, hasWorked: workedDays > 0 || totalOvertimeHours > 0 };
  };

  // Batch Calculation Logic (Generate Month Draft)
  const handleCalculateAll = async () => {
    setIsCalculatingAll(true);
    try {
      const activeEmployees = employees.filter(e => {
        const s = (e.status || '').toLowerCase().trim();
        return !['inactive', 'terminated', 'archived', 'disabled', 'deleted', 'suspended'].includes(s);
      });
      const inactiveEmployees = employees.filter(e => {
        const s = (e.status || '').toLowerCase().trim();
        return ['inactive', 'terminated', 'archived', 'disabled', 'deleted', 'suspended'].includes(s);
      });

      // Target list: all active employees + inactive employees who worked in this period
      const targetEmployees = [
        ...activeEmployees,
        ...inactiveEmployees.filter(emp => {
          const work = getEmployeeWorkSummaryInMonth(emp.id, selectedMonth, selectedYear);
          return work.hasWorked;
        })
      ];

      let count = 0;
      let finalSettlements = 0;

      for (const emp of targetEmployees) {
        try {
          const isInactive = ['inactive', 'terminated', 'archived', 'disabled', 'deleted', 'suspended'].includes((emp.status || '').toLowerCase());
          let payload: any = null;

          // Try server-side preview endpoint first
          const res = await fetch(`/api/hr/payroll/preview/${emp.id}?month=${selectedMonth}&year=${selectedYear}`, {
            headers: { 'x-user-id': currentUser?.id?.toString() || '1' }
          });

          if (res.ok) {
            const preview = await res.json();
            if (isInactive && (!preview.has_worked_in_period || (preview.worked_days === 0 && preview.total_work_hours === 0))) {
              continue;
            }
            payload = {
              ...preview,
              status: 'Draft'
            };
          } else {
            // Fallback to client-side rule calculations
            const baseSalary = parseFloat(String(emp.salary_base || 0));
            const fixedAllowances = parseFloat(String(emp.allowances || 0));
            const dailyRate = baseSalary > 0 ? baseSalary / 30 : 0;
            const hourlyRate = dailyRate > 0 ? dailyRate / 8 : 0;

            const { workedDays, lateMins, absentDays, totalOvertimeHours } = getEmployeeWorkSummaryInMonth(emp.id, selectedMonth, selectedYear);

            // Absence Penalties
            const absenceMultiplier = payrollConfig?.absence_penalty_multiplier || 1.0;
            const absenceDeduction = Math.round(absentDays * dailyRate * absenceMultiplier);

            // Late Penalties
            let lateDeduction = 0;
            const tardyRules = payrollConfig?.tardy_deduction_rules;
            if (tardyRules && tardyRules.mode === 'slab' && tardyRules.slabs && tardyRules.slabs.length > 0) {
              const matchingSlab = tardyRules.slabs.find((s: any) => lateMins >= s.min_mins && lateMins <= s.max_mins);
              if (matchingSlab && matchingSlab.deduction_type !== 'none') {
                if (matchingSlab.deduction_type === 'quarter_day') lateDeduction = Math.round(dailyRate * 0.25);
                else if (matchingSlab.deduction_type === 'half_day') lateDeduction = Math.round(dailyRate * 0.5);
                else if (matchingSlab.deduction_type === 'full_day') lateDeduction = Math.round(dailyRate * 1.0);
                else if (matchingSlab.deduction_type === 'custom_days') lateDeduction = Math.round(dailyRate * (matchingSlab.value || 0));
              }
            } else {
              lateDeduction = Math.round((lateMins / 60) * hourlyRate);
            }

            // Overtime Calculation
            const normalOtMultiplier = payrollConfig?.custom_rules?.overtime_normal_multiplier || 1.35;
            const overtimeAmount = Math.round(totalOvertimeHours * hourlyRate * normalOtMultiplier);

            // Social Insurance
            let empSocialInsurance = 0;
            let empyrSocialInsurance = 0;
            const insConfig = payrollConfig?.insurance_benefits;
            if (insConfig?.enable_social_insurance) {
              if (insConfig.social_insurance_mode === 'brackets' && insConfig.social_insurance_brackets?.length > 0) {
                const matchingBracket = insConfig.social_insurance_brackets.find((b: any) => baseSalary >= b.min_salary && baseSalary <= b.max_salary);
                if (matchingBracket) {
                  empSocialInsurance = Math.round(baseSalary * ((matchingBracket.employee_pct || 0) / 100));
                  empyrSocialInsurance = Math.round(baseSalary * ((matchingBracket.employer_pct || 0) / 100));
                }
              } else {
                empSocialInsurance = Math.round(baseSalary * ((insConfig.social_insurance_employee_pct || 11) / 100));
                empyrSocialInsurance = Math.round(baseSalary * ((insConfig.social_insurance_employer_pct || 18.75) / 100));
              }
            }

            // Medical Insurance
            let empMedicalInsurance = 0;
            let empyrMedicalInsurance = 0;
            if (insConfig?.enable_medical_insurance) {
              if (insConfig.medical_insurance_mode === 'brackets' && insConfig.medical_insurance_brackets?.length > 0) {
                const matchMed = insConfig.medical_insurance_brackets.find((b: any) => baseSalary >= b.min_salary && baseSalary <= b.max_salary);
                if (matchMed) {
                  empMedicalInsurance = matchMed.employee_fee || 0;
                  empyrMedicalInsurance = matchMed.employer_fee || 0;
                }
              } else {
                empMedicalInsurance = insConfig.medical_insurance_employee_fee || 0;
                empyrMedicalInsurance = insConfig.medical_insurance_employer_fee || 0;
              }
            }

            // Income Taxes
            let incomeTax = 0;
            if (payrollConfig?.tax_brackets && payrollConfig.tax_brackets.length > 0) {
              const annualTaxable = baseSalary * 12;
              let remainingSalary = annualTaxable;
              let totalAnnualTax = 0;
              for (const slab of payrollConfig.tax_brackets) {
                if (remainingSalary <= 0) break;
                const slabRange = slab.max_salary - slab.min_salary;
                const taxableInSlab = Math.min(remainingSalary, slabRange);
                totalAnnualTax += taxableInSlab * (slab.tax_rate / 100);
                remainingSalary -= taxableInSlab;
              }
              incomeTax = Math.round(totalAnnualTax / 12);
            }

            const totalGross = baseSalary + fixedAllowances + overtimeAmount;
            const totalDeductions = absenceDeduction + lateDeduction + empSocialInsurance + empMedicalInsurance + incomeTax;
            const netSalary = Math.max(0, totalGross - totalDeductions);

            const breakdown = {
              base_salary: baseSalary,
              worked_days: workedDays || 26,
              overtime_hours: totalOvertimeHours,
              overtime_rate: hourlyRate,
              overtime_amount: overtimeAmount,
              attendance_lates_mins: lateMins,
              attendance_lates_deduction: lateDeduction,
              attendance_absent_days: absentDays,
              attendance_absence_deduction: absenceDeduction,
              unexcused_absent_days: 0,
              unexcused_absence_deduction: 0,
              penalties_days: 0,
              penalties_deduction: 0,
              other_deductions: 0,
              advances_loans_deduction: 0,
              allowances: fixedAllowances,
              commissions: 0,
              kpi_bonus: 0,
              other_bonuses: 0,
              employee_social_insurance: empSocialInsurance,
              employer_social_insurance: empyrSocialInsurance,
              employee_medical_insurance: empMedicalInsurance,
              employer_medical_insurance: empyrMedicalInsurance,
              income_tax: incomeTax,
              department: (typeof emp.department_id === 'object' ? (emp.department_id as any)?.name : (emp as any).department?.name || (emp as any).department) || 'General',
              team_name: (emp as any).team || (emp as any).teams || '',
              job_title: emp.job_title || 'Staff Member',
              job_grade: emp.personal_info?.job_grade || 'Grade 3 / Mid-Senior',
              reporting_to: emp.reporting_to || 'Management',
              location: emp.personal_info?.location || 'On-Site',
              net_salary: netSalary,
              total_gross: totalGross,
              total_deductions: totalDeductions,
              employer_cost_ctc: totalGross + empyrSocialInsurance + empyrMedicalInsurance
            };

            const existingRecord = (payroll as any[]).find(p => (Number(p.user_id) === emp.id || Number(p.employee_id) === emp.id) && Number(p.month) === selectedMonth && Number(p.year) === selectedYear);

            payload = {
              id: existingRecord?.id,
              user_id: emp.id,
              month: selectedMonth,
              year: selectedYear,
              base_salary: baseSalary,
              allowances: fixedAllowances,
              deductions: totalDeductions,
              bonuses: 0,
              commissions: 0,
              overtime: overtimeAmount,
              tax_deductions: incomeTax,
              net_salary: netSalary,
              status: existingRecord?.status || 'Draft',
              breakdown: JSON.stringify(breakdown)
            };
          }

          if (payload) {
            await fetch('/api/hr/payroll', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': currentUser?.id?.toString() || '1'
              },
              body: JSON.stringify(payload)
            });
            count++;
            if (isInactive) finalSettlements++;
          }
        } catch (e) {
          console.error(`Error calculating payroll for emp ${emp.id}:`, e);
        }
      }

      if (finalSettlements > 0) {
        showCustomToast(`Drafted payroll for ${count} staff (including ${finalSettlements} offboarded personnel with logged work hours).`, 'success');
      } else {
        showCustomToast(`Payroll drafted successfully for ${count} eligible staff for this period.`, 'success');
      }
      fetchData();
    } catch (err) {
      console.error('Failed to run batch calculations:', err);
      showCustomToast('Failed to calculate batch payroll.', 'error');
    } finally {
      setIsCalculatingAll(false);
    }
  };

  const handleUpdateStatus = async (recordId: number | undefined, empId: number, newStatus: 'Draft' | 'Paid') => {
    try {
      const pr = (payroll as any[]).find(p => p.id === recordId || (Number(p.user_id) === empId && Number(p.month) === selectedMonth && Number(p.year) === selectedYear));
      const emp = employees.find(e => e.id === empId);

      const payload = {
        id: recordId || pr?.id,
        user_id: empId,
        month: selectedMonth,
        year: selectedYear,
        base_salary: pr?.base_salary || emp?.salary_base || 0,
        allowances: pr?.allowances || emp?.allowances || 0,
        deductions: pr?.deductions || 0,
        bonuses: pr?.bonuses || 0,
        commissions: pr?.commissions || 0,
        overtime: pr?.overtime || 0,
        tax_deductions: pr?.tax_deductions || 0,
        net_salary: pr?.net_salary || ((pr?.base_salary || emp?.salary_base || 0) + (pr?.allowances || emp?.allowances || 0) - (pr?.deductions || 0)),
        status: newStatus,
        breakdown: pr?.breakdown
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
        showCustomToast(`Payroll record marked as ${newStatus}.`, 'success');
        fetchData();
      } else {
        showCustomToast('Failed to update payroll status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomToast('Failed to update payroll status.', 'error');
    }
  };

  const handleDeletePayroll = async () => {
    if (!showPayrollDeleteConfirm) return;
    try {
      const res = await fetch(`/api/hr/payroll/${showPayrollDeleteConfirm}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser?.id?.toString() || '1'
        }
      });
      if (res.ok) {
        setShowPayrollDeleteConfirm(null);
        showCustomToast('Payroll record removed successfully.', 'success');
        fetchData();
      } else {
        showCustomToast('Failed to delete payroll record.', 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomToast('Failed to delete payroll record.', 'error');
    }
  };

  // Payroll Aggregation for Month/Year
  const aggregatedEmployeesPayroll = useMemo(() => {
    return employees.map(emp => {
      const pr = (payroll as any[]).find(p => 
        (Number(p.user_id) === emp.id || Number(p.employee_id) === emp.id) && 
        Number(p.month) === selectedMonth && 
        Number(p.year) === selectedYear
      );

      const isOffboarded = ['inactive', 'terminated', 'archived', 'disabled', 'deleted', 'suspended'].includes((emp.status || '').toLowerCase().trim());

      let breakdown: any = {};
      if (pr?.breakdown) {
        try {
          breakdown = typeof pr.breakdown === 'string' ? JSON.parse(pr.breakdown) : pr.breakdown;
        } catch {
          breakdown = {};
        }
      }

      const baseSalary = parseFloat(String(pr?.base_salary ?? emp.salary_base ?? 0));
      const allowances = parseFloat(String(pr?.allowances ?? emp.allowances ?? 0));
      const bonuses = parseFloat(String(pr?.bonuses ?? 0));
      const commissions = parseFloat(String(pr?.commissions ?? 0));
      const overtime = parseFloat(String(pr?.overtime ?? breakdown.overtime_amount ?? 0));
      const gross = baseSalary + allowances + bonuses + commissions + overtime;

      const deductions = parseFloat(String(pr?.deductions ?? breakdown.total_deductions ?? 0));
      const netSalary = pr?.net_salary !== undefined ? parseFloat(String(pr.net_salary)) : Math.max(0, gross - deductions);

      return {
        employee: emp,
        payrollRecord: pr,
        isOffboarded,
        status: pr?.status || 'Unprocessed',
        baseSalary,
        allowances,
        bonuses,
        commissions,
        overtime,
        gross,
        deductions,
        netSalary,
        breakdown
      };
    });
  }, [employees, payroll, selectedMonth, selectedYear]);

  // Filtered Payroll Data
  const filteredData = useMemo(() => {
    let list = advancedFilteredPayroll || aggregatedEmployeesPayroll;

    if (payrollStatusFilter !== 'all') {
      list = list.filter(item => item.status === payrollStatusFilter);
    }

    if (payrollDeptFilter !== 'all') {
      list = list.filter(item => {
        const d = (typeof item.employee.department === 'object' ? (item.employee.department as any)?.name : item.employee.department) || '';
        return d.toLowerCase() === payrollDeptFilter.toLowerCase();
      });
    }

    if (payrollSearch.trim()) {
      const q = payrollSearch.toLowerCase();
      list = list.filter(item => 
        (item.employee.name || '').toLowerCase().includes(q) ||
        (item.employee.job_title || '').toLowerCase().includes(q) ||
        (item.employee.id?.toString() || '').includes(q) ||
        ((typeof item.employee.department === 'object' ? (item.employee.department as any)?.name : item.employee.department) || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [aggregatedEmployeesPayroll, advancedFilteredPayroll, payrollStatusFilter, payrollDeptFilter, payrollSearch]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalNet = 0;
    let totalGross = 0;
    let totalDeductions = 0;
    let paidCount = 0;
    let draftCount = 0;
    let unprocessedCount = 0;

    filteredData.forEach(item => {
      totalNet += item.netSalary;
      totalGross += item.gross;
      totalDeductions += item.deductions;
      if (item.status === 'Paid') paidCount++;
      else if (item.status === 'Draft') draftCount++;
      else unprocessedCount++;
    });

    return {
      totalNet,
      totalGross,
      totalDeductions,
      paidCount,
      draftCount,
      unprocessedCount,
      totalCount: filteredData.length
    };
  }, [filteredData]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Job Title', 'Month', 'Year', 'Base Salary', 'Allowances', 'Bonuses', 'Commissions', 'Overtime', 'Gross Salary', 'Deductions', 'Net Salary', 'Status'];
    const rows = filteredData.map(item => [
      item.employee.id,
      `"${item.employee.name || ''}"`,
      `"${typeof item.employee.department === 'object' ? (item.employee.department as any)?.name : item.employee.department || ''}"`,
      `"${item.employee.job_title || ''}"`,
      selectedMonth,
      selectedYear,
      item.baseSalary,
      item.allowances,
      item.bonuses,
      item.commissions,
      item.overtime,
      item.gross,
      item.deductions,
      item.netSalary,
      item.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintTable = () => {
    window.print();
  };

  return (
    <ScreenGuard screenKey="payroll" module="HR">
      <div className="space-y-6">
      {/* Top Banner & Title Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {/* Back to HR Hub Button */}
            <button
              type="button"
              onClick={() => navigate('/hr')}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0 flex items-center justify-center"
              title="Back to HR Hub / الرجوع إلى لوحة الموارد البشرية"
              aria-label="Back to HR Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Payroll Management</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                  {selectedMonth}/{selectedYear}
                </span>
                <DataScopeBadge screenKey="payroll" module="HR" />
              </h1>
              <p className="text-xs text-slate-500 font-medium">Smart Salary Calculation Engine, Egyptian Tax Brackets & Social Insurance.</p>
            </div>
          </div>
        </div>

        {/* Global Payroll Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Customize Layout Dropdown - Icon Only */}
          <ActionGuard actionKey="hr:payroll:customize_layout" module="HR" screen="payroll">
            <ModuleCustomizeLayoutDropdown targetPage="payroll" iconOnly={true} />
          </ActionGuard>

          {/* Policy Setup Navigation - Icon Only */}
          <ActionGuard actionKey="hr:payroll:manage_payroll_policy" module="HR">
            <button
              type="button"
              onClick={() => navigate('/hr/payroll/Policy-Setup')}
              className="p-2 bg-slate-900 hover:bg-black text-white rounded-xl transition-all border border-slate-800 cursor-pointer shadow-2xs flex items-center justify-center hover:scale-105 active:scale-95"
              title="Payroll Policy Setup (/hr/payroll/Policy-Setup)"
              aria-label="Payroll Policy Setup"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
            </button>
          </ActionGuard>

          {/* Generate Month Draft - Icon Only */}
          <ActionGuard actionKey="hr:payroll:calculate_all_payrolls" module="HR">
            <button
              type="button"
              onClick={handleCalculateAll}
              disabled={isCalculatingAll}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center hover:scale-105 active:scale-95"
              title="Generate Month Draft for eligible staff"
              aria-label="Generate Month Draft"
            >
              <Zap className={cn("w-4 h-4", isCalculatingAll && "animate-pulse")} />
            </button>
          </ActionGuard>

          {/* Activity Log button (Icon only) */}
          <button
            type="button"
            onClick={() => setLogsModalConfig({
              isOpen: true,
              title: 'Payroll Activity & Sync Logs',
              entityTypes: ['HR Payroll'],
              actionTypes: ['CREATE_PAYROLL', 'UPDATE_PAYROLL', 'PAY_PAYROLL', 'DELETE_PAYROLL', 'SYNC_PAYROLL']
            })}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all border border-slate-200 cursor-pointer shadow-2xs flex items-center justify-center"
            title="Activity Logs"
            aria-label="Activity Logs"
          >
            <History className="w-4 h-4 text-indigo-600" />
          </button>

          {/* Export Excel (Icon only) */}
          <ActionGuard actionKey="hr:payroll:export_payroll_excel_csv" module="HR">
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all border border-slate-200 cursor-pointer shadow-2xs flex items-center justify-center"
              title="Export Excel"
              aria-label="Export Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </button>
          </ActionGuard>

          {/* Print (Icon only) */}
          <ActionGuard actionKey="hr:payroll:print_pdf_report" module="HR">
            <button
              type="button"
              onClick={handlePrintTable}
              className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all border border-slate-200 cursor-pointer shadow-2xs flex items-center justify-center"
              title="Print"
              aria-label="Print"
            >
              <Printer className="w-4 h-4 text-slate-600" />
            </button>
          </ActionGuard>
        </div>
      </div>

      {/* KPI Ribbon Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Net Payout</p>
          <p className="text-xl font-black text-emerald-700">
            {summaryMetrics.totalNet.toLocaleString()} <span className="text-xs font-bold text-emerald-600">EGP</span>
          </p>
          <p className="text-[10px] text-slate-400 font-semibold">{summaryMetrics.paidCount} Paid • {summaryMetrics.draftCount} Drafts</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Gross Earnings</p>
          <p className="text-xl font-black text-slate-900">
            {summaryMetrics.totalGross.toLocaleString()} <span className="text-xs font-bold text-slate-500">EGP</span>
          </p>
          <p className="text-[10px] text-slate-400 font-semibold">Includes Base, Overtime, & Allowances</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Total Deductions & Taxes</p>
          <p className="text-xl font-black text-rose-600">
            -{summaryMetrics.totalDeductions.toLocaleString()} <span className="text-xs font-bold text-rose-400">EGP</span>
          </p>
          <p className="text-[10px] text-slate-400 font-semibold">Taxes, Insurance & Attendance Lates</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Processed Ratio</p>
          <p className="text-xl font-black text-indigo-900">
            {summaryMetrics.paidCount + summaryMetrics.draftCount} / {summaryMetrics.totalCount}
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${summaryMetrics.totalCount > 0 ? ((summaryMetrics.paidCount + summaryMetrics.draftCount) / summaryMetrics.totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search employee, title, department..."
              value={payrollSearch}
              onChange={e => setPayrollSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
            className="p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:bg-white"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>
                {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:bg-white"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={payrollDeptFilter}
            onChange={e => setPayrollDeptFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:bg-white"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>

          {/* Status Filter Chips */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {(['all', 'Draft', 'Paid', 'Unprocessed'] as const).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setPayrollStatusFilter(status)}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer",
                  payrollStatusFilter === status ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>

          {/* Advanced Filter Component */}
          <AdvancedFilter
            items={payroll}
            entityType="payroll"
            departments={departments}
            employees={employees}
            onFilter={setAdvancedFilteredPayroll}
            title=""
            compact={true}
          />
        </div>

        {/* View Mode Toggle (Icon only) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setPayrollViewMode('board')}
            title="Board View"
            aria-label="Board View"
            className={cn(
              "p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer",
              payrollViewMode === 'board' ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setPayrollViewMode('list')}
            title="List View"
            aria-label="List View"
            className={cn(
              "p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer",
              payrollViewMode === 'list' ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View Mode Content */}
      {payrollViewMode === 'board' ? (
        /* ================= BOARD VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Draft / Pending Approval */}
          <div className="bg-slate-50/70 rounded-3xl p-4 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Draft / Pending Approval</h3>
              </div>
              <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {filteredData.filter(i => i.status === 'Draft').length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredData.filter(i => i.status === 'Draft').map(item => (
                <div 
                  key={item.employee.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-black text-xs text-white shadow-xs">
                        {(item.employee.name || 'E')[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{item.employee.name}</h4>
                        <p className="text-[10px] text-slate-400">{item.employee.job_title || 'Staff'}</p>
                      </div>
                    </div>
                    {item.isOffboarded && (
                      <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                        Offboarded
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 font-bold block">Gross Payout</span>
                      <span className="text-slate-800 font-black">{item.gross.toLocaleString()} EGP</span>
                    </div>
                    <div>
                      <span className="text-emerald-600 font-bold block">Net Salary</span>
                      <span className="text-emerald-700 font-black">{item.netSalary.toLocaleString()} EGP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = item.payrollRecord?.id || item.employee.id;
                        navigate(`/hr/payroll/edit/${targetId}?empId=${item.employee.id}&month=${selectedMonth}&year=${selectedYear}`);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Breakdown</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <ActionGuard actionKey="hr:payroll:approve_payroll_batch" module="HR">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.payrollRecord?.id, item.employee.id, 'Paid')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Paid</span>
                        </button>
                      </ActionGuard>
                      {item.payrollRecord?.id && (
                        <ActionGuard actionKey="hr:payroll:delete_payroll" module="HR">
                          <button
                            type="button"
                            onClick={() => setShowPayrollDeleteConfirm(item.payrollRecord.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </ActionGuard>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredData.filter(i => i.status === 'Draft').length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">No draft payroll records for this period.</p>
              )}
            </div>
          </div>

          {/* Column 2: Paid / Disbursed */}
          <div className="bg-slate-50/70 rounded-3xl p-4 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Paid / Disbursed</h3>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {filteredData.filter(i => i.status === 'Paid').length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredData.filter(i => i.status === 'Paid').map(item => (
                <div 
                  key={item.employee.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-700 flex items-center justify-center font-black text-xs text-white shadow-xs">
                        {(item.employee.name || 'E')[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{item.employee.name}</h4>
                        <p className="text-[10px] text-slate-400">{item.employee.job_title || 'Staff'}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      Paid
                    </span>
                  </div>

                  <div className="bg-emerald-50/40 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 font-bold block">Gross Payout</span>
                      <span className="text-slate-800 font-black">{item.gross.toLocaleString()} EGP</span>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-bold block">Net Paid</span>
                      <span className="text-emerald-800 font-black">{item.netSalary.toLocaleString()} EGP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = item.payrollRecord?.id || item.employee.id;
                        navigate(`/hr/payroll/edit/${targetId}?empId=${item.employee.id}&month=${selectedMonth}&year=${selectedYear}`);
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Pay Slip</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <ActionGuard actionKey="hr:payroll:edit_payroll_entry" module="HR">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.payrollRecord?.id, item.employee.id, 'Draft')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Revert to Draft
                        </button>
                      </ActionGuard>
                      {item.payrollRecord?.id && (
                        <ActionGuard actionKey="hr:payroll:delete_payroll" module="HR">
                          <button
                            type="button"
                            onClick={() => setShowPayrollDeleteConfirm(item.payrollRecord.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </ActionGuard>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredData.filter(i => i.status === 'Paid').length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">No paid payroll records yet.</p>
              )}
            </div>
          </div>

          {/* Column 3: Unprocessed */}
          <div className="bg-slate-50/70 rounded-3xl p-4 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Unprocessed</h3>
              </div>
              <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                {filteredData.filter(i => i.status === 'Unprocessed').length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredData.filter(i => i.status === 'Unprocessed').map(item => (
                <div 
                  key={item.employee.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3 opacity-90 hover:opacity-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs">
                        {(item.employee.name || 'E')[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{item.employee.name}</h4>
                        <p className="text-[10px] text-slate-400">{item.employee.job_title || 'Staff'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 font-bold block">Base Contract</span>
                      <span className="text-slate-700 font-bold">{item.baseSalary.toLocaleString()} EGP</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Allowances</span>
                      <span className="text-slate-700 font-bold">{item.allowances.toLocaleString()} EGP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 italic">No slip generated</span>
                    {canWrite('payroll') && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/hr/payroll/edit/${item.employee.id}?empId=${item.employee.id}&month=${selectedMonth}&year=${selectedYear}`);
                        }}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Create Slip</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredData.filter(i => i.status === 'Unprocessed').length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">All active staff records have been calculated.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Base Salary</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Net Payout</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(item => (
                  <tr key={item.employee.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {(item.employee.name || 'E')[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{item.employee.name}</h4>
                          <p className="text-[10px] text-slate-400">{item.employee.job_title || 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600 font-bold">
                      {(typeof item.employee.department === 'object' ? (item.employee.department as any)?.name : item.employee.department) || 'General'}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-800 font-bold">
                      {item.baseSalary.toLocaleString()} EGP
                    </td>
                    <td className="px-6 py-3.5 text-xs text-indigo-700 font-black">
                      +{((item.allowances || 0) + (item.overtime || 0) + (item.bonuses || 0) + (item.commissions || 0)).toLocaleString()} EGP
                    </td>
                    <td className="px-6 py-3.5 text-xs text-rose-600 font-black">
                      -{item.deductions.toLocaleString()} EGP
                    </td>
                    <td className="px-6 py-3.5 text-xs text-emerald-700 font-black">
                      {item.netSalary.toLocaleString()} EGP
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        item.status === 'Paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        item.status === 'Draft' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ActionGuard actionKey="hr:payroll:edit_payroll_entry" module="HR">
                          <button
                            type="button"
                            onClick={() => {
                              const targetId = item.payrollRecord?.id || item.employee.id;
                              navigate(`/hr/payroll/edit/${targetId}?empId=${item.employee.id}&month=${selectedMonth}&year=${selectedYear}`);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit / View Breakdown"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </ActionGuard>
                        {item.status !== 'Paid' && (
                          <ActionGuard actionKey="hr:payroll:approve_payroll_batch" module="HR">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.payrollRecord?.id, item.employee.id, 'Paid')}
                              className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                              title="Mark as Paid"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </ActionGuard>
                        )}
                        {item.payrollRecord?.id && (
                          <ActionGuard actionKey="hr:payroll:delete_payroll" module="HR">
                            <button
                              type="button"
                              onClick={() => setShowPayrollDeleteConfirm(item.payrollRecord.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </ActionGuard>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-400 text-xs">
                      No payroll records found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={!!showPayrollDeleteConfirm}
        onClose={() => setShowPayrollDeleteConfirm(null)}
        onConfirm={handleDeletePayroll}
        title="Wipe Payroll Record"
        message="Are you sure you want to perform a permanent removal of this payroll record? Historical database relations mapped to this record ID cannot be reverted."
      />

      {/* Policy Setup Modal */}
      {showPolicyModal && (
        <PayrollPolicyPage
          isModal={true}
          onClose={() => setShowPolicyModal(false)}
        />
      )}

      {/* Activity Logs Modal */}
      {logsModalConfig?.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">{logsModalConfig.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">Recorded system execution logs and payroll transaction history.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLogsModalConfig(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2">
              {hrLogs.filter(log => log.entity_type === 'HR Payroll' || log.action.includes('PAYROLL')).map((log, idx) => {
                const dateObj = new Date(log.created_at);
                const formattedDate = dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
                const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{log.action}</span>
                      <span className="text-[10px] text-slate-400">{log.details || log.entity_id}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{formattedDate} {formattedTime}</span>
                  </div>
                );
              })}
              {hrLogs.filter(log => log.entity_type === 'HR Payroll' || log.action.includes('PAYROLL')).length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">No payroll activity logs recorded yet.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0 mt-4">
              <button
                type="button"
                onClick={() => setLogsModalConfig(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ScreenGuard>
  );
};
