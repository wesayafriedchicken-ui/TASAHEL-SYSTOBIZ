import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { 
  Briefcase, Check, Plus, Trash2, Calendar, DollarSign, Clock, 
  LogIn, Fingerprint, Sun, Lock, Loader2, Building2,
  TrendingUp, Award, Coins, AlertTriangle, Users, ChevronRight,
  X, Search, Target, FileText, CreditCard
} from "lucide-react";
import { EmployeeProfileOutletContext } from "./types";
import { Employee, Shift } from "../../../../types";
import { cn } from "../../../../lib/utils";
import { PermittedField } from "../../../../components/common/PermittedField";
import { DynamicLayoutSection } from "../../../../components/HR/DynamicLayoutSection";
import { CustomAddableSelect } from "../../../../components/Common/CustomAddableSelect";
import { 
  getTeamsAndTitlesForDepartment, 
  getGradeForJobTitle, 
  getJDForTitle,
  LOCATION_OPTIONS,
  GRADE_LEVEL_OPTIONS
} from "../../../../lib/hrData";

const getSafeArrayField = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = typeof val === "string" ? JSON.parse(val) : val;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getLatestJobInfo = (jobInfos: any[]) => {
  const arr = getSafeArrayField(jobInfos);
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  return sorted[0];
};

export interface JobTabProps {
  employee?: Employee | null;
  currentUser?: any;
  isViewOnly?: boolean;
  isSalaryVisible?: boolean;
  onRefreshEmployee?: () => Promise<void>;
  onSaveEmployeeDetails?: (updatedFields: Partial<Employee>) => Promise<void>;
  showCustomToast?: (msg: string, type?: "success" | "error" | "info") => void;
  employees?: Employee[];
  departments?: any[];
}

export const JobTab: React.FC<JobTabProps> = (props) => {
  const navigate = useNavigate();
  const outletCtx = useOutletContext<EmployeeProfileOutletContext | undefined>();

  const emp = props.employee !== undefined ? props.employee : (outletCtx?.employee || null);
  const currentUser = props.currentUser || outletCtx?.currentUser || { id: "1", name: "Admin", role: "admin" };
  const isViewOnlyMode = props.isViewOnly !== undefined ? props.isViewOnly : (outletCtx?.isViewOnly ?? false);
  const isSalaryVisible = props.isSalaryVisible !== undefined ? props.isSalaryVisible : (outletCtx?.isSalaryVisible ?? true);
  const showCustomToast = props.showCustomToast || outletCtx?.showCustomToast || ((msg: string) => console.log(msg));
  const onRefreshEmployee = props.onRefreshEmployee || outletCtx?.onRefreshEmployee;
  const onSaveEmployeeDetails = props.onSaveEmployeeDetails || outletCtx?.onSaveEmployeeDetails;

  const passedEmployees = props.employees || outletCtx?.employees;
  const passedDepartments = props.departments || outletCtx?.departments;

  // External / Fallback Employees List
  const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);
  useEffect(() => {
    if (!passedEmployees || passedEmployees.length === 0) {
      let isMounted = true;
      fetch("/api/hr/employees")
        .then(res => res.json())
        .then(data => {
          if (isMounted && Array.isArray(data)) setLocalEmployees(data);
        })
        .catch(err => console.warn("Could not load employees:", err));
      return () => { isMounted = false; };
    }
  }, [passedEmployees]);
  const employees = (passedEmployees && passedEmployees.length > 0) ? passedEmployees : localEmployees;

  // External / Fallback Departments List
  const [localDepartments, setLocalDepartments] = useState<any[]>([]);
  useEffect(() => {
    if (!passedDepartments || passedDepartments.length === 0) {
      let isMounted = true;
      fetch("/api/hr/departments")
        .then(res => res.json())
        .then(data => {
          if (isMounted && Array.isArray(data)) setLocalDepartments(data);
        })
        .catch(err => console.warn("Could not load departments:", err));
      return () => { isMounted = false; };
    }
  }, [passedDepartments]);
  const departments = (passedDepartments && passedDepartments.length > 0) ? passedDepartments : localDepartments;

  // Shifts state
  const [shifts, setShifts] = useState<Shift[]>([]);
  useEffect(() => {
    let isMounted = true;
    fetch("/api/hr/shifts")
      .then(res => res.json())
      .then(data => {
        if (isMounted && Array.isArray(data)) setShifts(data);
      })
      .catch(err => console.warn("Could not load shifts:", err));
    return () => { isMounted = false; };
  }, []);

  // --- Detailed Job Tab States ---
  const [jobHireDate, setJobHireDate] = useState("");
  const [jobProbationDate, setJobProbationDate] = useState("");
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [empContractType, setEmpContractType] = useState<string>("Full-time");
  const [empAttendanceMethod, setEmpAttendanceMethod] = useState<string>("Login System");
  const [jobAssignedShiftId, setJobAssignedShiftId] = useState<number | null>(null);
  const [empContractStartDate, setEmpContractStartDate] = useState<string>("");
  const [empContractEndDate, setEmpContractEndDate] = useState<string>("");
  const [jobKpiAmount, setJobKpiAmount] = useState<number>(0);
  const [jobKpiFrequency, setJobKpiFrequency] = useState<string>("Monthly");
  const [jobKpiPayoutMechanism, setJobKpiPayoutMechanism] = useState<string>("With Regular Payroll");
  const [jobKpiPayoutDate, setJobKpiPayoutDate] = useState<string>("");
  const [showEmpPenaltyForm, setShowEmpPenaltyForm] = useState<boolean>(false);
  const [newEmpPenalty, setNewEmpPenalty] = useState<{ type: string; amount: number; date: string; reason: string }>({
    type: "Deduction",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    reason: ""
  });
  const [employmentStatuses, setEmploymentStatuses] = useState<any[]>([]);
  const [jobInformations, setJobInformations] = useState<any[]>([]);
  const [compensations, setCompensations] = useState<any[]>([]);
  const [potentialBonusPercent, setPotentialBonusPercent] = useState<number>(7);
  const [potentialBonusAmount, setPotentialBonusAmount] = useState<string>("");
  const [bonusesList, setBonusesList] = useState<any[]>([]);
  const [commissionsList, setCommissionsList] = useState<any[]>([]);
  const [equitiesList, setEquitiesList] = useState<any[]>([]);
  const [shiftAllowancesList, setShiftAllowancesList] = useState<any[]>([]);

  // Direct reports selection states
  const [showAssignDirectReport, setShowAssignDirectReport] = useState(false);
  const [selectedDirectReportId, setSelectedDirectReportId] = useState<string>("");
  const [directReportSearchQuery, setDirectReportSearchQuery] = useState<string>("");
  const [jobBaseSalary, setJobBaseSalary] = useState<number>(0);
  const [jobAllowances, setJobAllowances] = useState<number>(0);

  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const [layoutTrigger, setLayoutTrigger] = useState(0);
  const handleLayoutRefresh = () => {
    setLayoutTrigger(prev => prev + 1);
  };

  // States to toggle inline adding for each section
  const [addingStatus, setAddingStatus] = useState(false);
  const [addingJobInfo, setAddingJobInfo] = useState(false);
  const [addingComp, setAddingComp] = useState(false);
  const [addingBonus, setAddingBonus] = useState(false);
  const [addingCommission, setAddingCommission] = useState(false);
  const [addingEquity, setAddingEquity] = useState(false);
  const [addingShiftAllowance, setAddingShiftAllowance] = useState(false);

  // Forms for adding entries
  const [newStatusForm, setNewStatusForm] = useState({ date: "", status: "Full-Time", comments: "" });
  const [newJobInfoForm, setNewJobInfoForm] = useState({ date: "", location: "", division: "", jobGrade: "", department: "", teams: "", jobTitle: "", reportingTo: "", changeReason: "Promotion" });
  const [newCompForm, setNewCompForm] = useState({ date: "", paySchedule: "Monthly", payType: "Salary", payRate: "", paidPer: "Year", overtimeStatus: "Exempt", changeReason: "", comments: "" });
  const [newBonusForm, setNewBonusForm] = useState({ date: "", amount: "", reason: "Performance", comment: "" });
  const [newCommissionForm, setNewCommissionForm] = useState({ date: "", amount: "", comment: "" });
  const [newEquityForm, setNewEquityForm] = useState({ grantType: "ISO", customName: "Employee Stock Options", grantDate: "", vestingStart: "", granted: "", strikePrice: "", schedule: "Monthly", vestingMonths: "48", cliffMonths: "12" });
  const [newShiftForm, setNewShiftForm] = useState({ allowance: "", startDate: "", endDate: "" });

  // Sync state when emp changes
  useEffect(() => {
    if (emp) {
      setJobHireDate(emp.joined_at ? emp.joined_at.slice(0, 10) : (emp.contract_start_date ? new Date(emp.contract_start_date).toISOString().split("T")[0] : "2022-02-05"));
      setEmpContractType(emp.contract_type || "Full-time");
      setEmpAttendanceMethod(emp.attendance_method || "Login System");
      setJobAssignedShiftId(emp.assigned_shift_id ? Number(emp.assigned_shift_id) : (((emp as any).shift_id) ? Number((emp as any).shift_id) : null));
      setEmpContractStartDate(emp.contract_start_date ? new Date(emp.contract_start_date).toISOString().split("T")[0] : (emp.joined_at ? emp.joined_at.slice(0, 10) : ""));
      setEmpContractEndDate(emp.contract_end_date ? new Date(emp.contract_end_date).toISOString().split("T")[0] : "");
      
      let probDate = "";
      if (emp.joined_at) {
        try {
          const d = new Date(emp.joined_at);
          d.setMonth(d.getMonth() + 6);
          probDate = d.toISOString().slice(0, 10);
        } catch (e) {}
      }
      setJobProbationDate((emp.personal_info as any)?.jobProbationDate || probDate);
      setJobDescriptionText((emp.personal_info as any)?.jobDescriptionText || "");
      
      setJobBaseSalary(emp.salary_base || 0);
      setJobAllowances(emp.allowances || 0);
      
      const kpiSettings = (emp.personal_info as any)?.kpi_settings || {};
      setJobKpiAmount(kpiSettings.amount ?? emp.kpi_amount ?? (emp as any).kpis ?? 0);
      setJobKpiFrequency(kpiSettings.frequency || emp.kpi_frequency || "Monthly");
      setJobKpiPayoutMechanism(kpiSettings.payout_mechanism || emp.kpi_payout_mechanism || "With Regular Payroll");
      setJobKpiPayoutDate(kpiSettings.payout_date || emp.kpi_payout_date || "");

      setDirectReportSearchQuery("");
      setSelectedDirectReportId("");

      setEmploymentStatuses(getSafeArrayField(emp.employment_statuses));
      setJobInformations(getSafeArrayField(emp.job_informations));
      setCompensations(getSafeArrayField(emp.compensations));
      setPotentialBonusPercent(emp.potential_bonus?.percent ?? 0);
      setPotentialBonusAmount(emp.potential_bonus?.amount?.toString() ?? "0");
      setBonusesList(getSafeArrayField(emp.bonuses_list));
      setCommissionsList(getSafeArrayField(emp.commissions_list));
      setEquitiesList(getSafeArrayField(emp.equities_list));
      setShiftAllowancesList(getSafeArrayField(emp.shift_allowances_list));
    }
  }, [emp]);

  const setViewingEmployee = (dr: any) => {
    if (dr?.id || dr?.user_id) {
      navigate(`/hr/directory/${dr.user_id || dr.id}/job`);
    }
  };

  const fetchData = async () => {
    if (typeof onRefreshEmployee === "function") {
      await onRefreshEmployee();
    }
  };

  const getDepartmentManagerOptions = useCallback((
    deptIdOrName: any,
    currentEmpId?: any,
    currentJobTitle?: string
  ) => {
    const selectedDeptObj = departments.find(d => 
      (d.id && String(d.id) === String(deptIdOrName)) || 
      (d.name && (d.name || "").toLowerCase() === String(deptIdOrName).toLowerCase())
    );

    const titleLower = (currentJobTitle || "").toLowerCase();
    
    let isDeptHead = false;
    if (selectedDeptObj) {
      const headId = selectedDeptObj.department_head_id || (selectedDeptObj as any).head_id;
      if (headId && currentEmpId && (String(headId) === String(currentEmpId))) {
        isDeptHead = true;
      }
      const headName = (selectedDeptObj as any).department_head_name || (selectedDeptObj as any).head_name || (selectedDeptObj as any).manager_name;
      if (headName && currentEmpId) {
        const curEmp = employees.find(e => e.id === currentEmpId || e.user_id === currentEmpId);
        if (curEmp && curEmp.name && (curEmp.name || "").toLowerCase() === (headName || "").toLowerCase()) {
          isDeptHead = true;
        }
      }
    }
    if (titleLower.includes("department head") || titleLower.includes("head of department") || titleLower.includes("head of") || titleLower === "department head") {
      isDeptHead = true;
    }

    const options: { value: string | number; label: string; isCeoMd?: boolean; isHead?: boolean }[] = [];
    const addedKeys = new Set<string>();

    const addOption = (val: string | number, label: string, isCeoMd = false, isHead = false) => {
      const key = `${val}_${label}`;
      if (!addedKeys.has(key)) {
        addedKeys.add(key);
        options.push({ value: val, label, isCeoMd, isHead });
      }
    };

    addOption("No Manager / Board of Directors", "No Manager / Board of Directors", true);

    const ceoMdEmps = employees.filter(e => {
      if (currentEmpId && (e.id === currentEmpId || e.user_id === currentEmpId)) return false;
      const jt = (e.job_title || "").toLowerCase();
      return jt.includes("ceo") || jt.includes("md") || jt.includes("managing director") || jt.includes("chief executive") || jt.includes("president") || jt.includes("executive director");
    });

    if (ceoMdEmps.length > 0) {
      ceoMdEmps.forEach(ceo => {
        addOption(ceo.id || ceo.name, `${ceo.name} (${ceo.job_title || "CEO / MD"})`, true);
      });
    }
    
    addOption("CEO", "Chief Executive Officer (CEO)", true);
    addOption("MD", "Managing Director (MD)", true);

    if (selectedDeptObj) {
      const headId = selectedDeptObj.department_head_id || (selectedDeptObj as any).head_id;
      const headName = (selectedDeptObj as any).department_head_name || (selectedDeptObj as any).head_name || (selectedDeptObj as any).manager_name;

      if (headId) {
        const matchEmp = employees.find(e => (e.id === headId || e.user_id === headId) && e.id !== currentEmpId);
        if (matchEmp) {
          addOption(matchEmp.id, `${matchEmp.name} (Department Head - ${selectedDeptObj.name})`, false, true);
        } else if (headName) {
          addOption(headName, `${headName} (Department Head - ${selectedDeptObj.name})`, false, true);
        }
      } else if (headName) {
        addOption(headName, `${headName} (Department Head - ${selectedDeptObj.name})`, false, true);
      }

      employees.forEach(e => {
        if (currentEmpId && (e.id === currentEmpId || e.user_id === currentEmpId)) return;
        const belongsToDept = (e.department_id && String(e.department_id) === String(selectedDeptObj.id)) || 
                              (e.department_name && selectedDeptObj?.name && (e.department_name || "").toLowerCase() === (selectedDeptObj.name || "").toLowerCase());
        if (belongsToDept) {
          const jt = (e.job_title || "").toLowerCase();
          if (jt.includes("head") || jt.includes("director") || jt.includes("manager")) {
            addOption(e.id, `${e.name} (${e.job_title || "Manager"})`);
          }
        }
      });

      let teamsArr: any[] = [];
      if (Array.isArray(selectedDeptObj.teams)) teamsArr = selectedDeptObj.teams;
      else if (typeof selectedDeptObj.teams === "string") {
        try { teamsArr = JSON.parse(selectedDeptObj.teams); } catch (e) {}
      }

      teamsArr.forEach(team => {
        if (typeof team === "object" && team !== null) {
          const leadId = team.team_lead_id || team.lead_id;
          const leadName = team.team_lead_name || team.leader_name || team.lead_name || team.team_lead;
          const teamLabel = team.name ? `Team Lead - ${team.name}` : "Team Lead";

          if (leadId) {
            const matchEmp = employees.find(e => (e.id === leadId || e.user_id === leadId) && e.id !== currentEmpId);
            if (matchEmp) {
              addOption(matchEmp.id, `${matchEmp.name} (${teamLabel})`);
            } else if (leadName) {
              addOption(leadName, `${leadName} (${teamLabel})`);
            }
          } else if (leadName) {
            addOption(leadName, `${leadName} (${teamLabel})`);
          }
        }
      });

      employees.forEach(e => {
        if (currentEmpId && (e.id === currentEmpId || e.user_id === currentEmpId)) return;
        const belongsToDept = (e.department_id && String(e.department_id) === String(selectedDeptObj.id)) || 
                              (e.department_name && selectedDeptObj?.name && (e.department_name || "").toLowerCase() === (selectedDeptObj.name || "").toLowerCase());
        if (belongsToDept) {
          addOption(e.id, `${e.name} (${e.job_title || "Employee"})`);
        }
      });
    } else {
      employees.forEach(e => {
        if (currentEmpId && (e.id === currentEmpId || e.user_id === currentEmpId)) return;
        addOption(e.id, `${e.name} (${e.job_title || "Employee"})`);
      });
    }

    return { options, isDeptHead, selectedDeptObj };
  }, [departments, employees]);

  const getResolvedManagerDisplay = (repToVal?: string | number) => {
    if (!repToVal) return "Management";
    const repStr = String(repToVal).trim();
    const matchedMgr = employees.find(e => 
      e.id !== emp?.id && (
        String(e.id) === repStr ||
        String(e.user_id) === repStr ||
        e.name?.toLowerCase().trim() === (repStr || "").toLowerCase() ||
        e.job_title?.toLowerCase().trim() === (repStr || "").toLowerCase() ||
        (e.job_title && (repStr || "").toLowerCase().includes((e.job_title || "").toLowerCase().trim())) ||
        (e.job_title && (e.job_title || "").toLowerCase().trim().includes((repStr || "").toLowerCase()))
      )
    );
    if (matchedMgr && matchedMgr.name) {
      if ((matchedMgr.name || "").toLowerCase().trim() === (repStr || "").toLowerCase()) {
        return matchedMgr.job_title ? `${matchedMgr.name} (${matchedMgr.job_title})` : matchedMgr.name;
      } else {
        return `${repStr} - ${matchedMgr.name}`;
      }
    }
    return repStr;
  };

  const getTargetJobTitleFromReportingTo = (repToVal?: string | number): string => {
    if (!repToVal) return "";
    const repStr = String(repToVal).trim();
    if (!repStr || (repStr || "").toLowerCase() === "management") return "";

    const matchedMgr = employees.find(e => 
      e.id !== emp?.id && (
        String(e.id) === repStr ||
        String(e.user_id) === repStr ||
        e.name?.toLowerCase().trim() === (repStr || "").toLowerCase()
      )
    );

    if (matchedMgr) {
      const eJobInfos = getSafeArrayField(matchedMgr.job_informations);
      const eLatestJob = getLatestJobInfo(eJobInfos);
      const mgrTitle = eLatestJob?.jobTitle || matchedMgr.job_title;
      if (mgrTitle) return mgrTitle.trim();
    }

    const parenMatch = repStr.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) {
      const insideParen = parenMatch[1].trim();
      if (!(insideParen || "").toLowerCase().includes("department head")) {
        return insideParen;
      }
    }
    if (repStr.includes(" - ")) {
      const parts = repStr.split(" - ").map(p => p.trim());
      if (parts[1]) return parts[1];
    }
    return repStr;
  };

  const saveEmployeeDetails = async (updatedEmp: Partial<Employee>) => {
    if (!emp) return;
    const targetId = updatedEmp.user_id || updatedEmp.id || emp.user_id || emp.id;

    const effectiveJobInfos = getSafeArrayField(updatedEmp.job_informations !== undefined ? updatedEmp.job_informations : jobInformations);
    const effectiveCompensations = getSafeArrayField(updatedEmp.compensations !== undefined ? updatedEmp.compensations : compensations);
    const effectiveStatuses = getSafeArrayField(updatedEmp.employment_statuses !== undefined ? updatedEmp.employment_statuses : employmentStatuses);

    const latestJobInfo = getLatestJobInfo(effectiveJobInfos);

    let effectiveJobTitle = latestJobInfo?.jobTitle || updatedEmp.job_title || emp.job_title || "Employee";
    let effectiveDeptName = latestJobInfo?.department || updatedEmp.department_name || emp.department_name || "";
    let effectiveTeamName = latestJobInfo?.teams || updatedEmp.team_name || emp.team_name || "";
    let effectiveReportingTo = latestJobInfo?.reportingTo || updatedEmp.reporting_to || emp.reporting_to || "";

    let effectiveSalaryBase = updatedEmp.salary_base !== undefined ? updatedEmp.salary_base : emp.salary_base;
    if (effectiveCompensations.length > 0) {
      const sortedComp = [...effectiveCompensations].sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      const val = parseFloat(sortedComp[0].payRate || sortedComp[0].amount || "0");
      if (!isNaN(val) && val > 0) effectiveSalaryBase = val;
    }
    if ((effectiveSalaryBase === undefined || effectiveSalaryBase === null || Number(effectiveSalaryBase) === 0) && ((updatedEmp.personal_info as any)?.pay_rate || (emp.personal_info as any)?.pay_rate)) {
      const val = parseFloat((updatedEmp.personal_info as any)?.pay_rate || (emp.personal_info as any)?.pay_rate || "0");
      if (!isNaN(val) && val > 0) effectiveSalaryBase = val;
    }

    let effectiveContractType = updatedEmp.contract_type || emp.contract_type;
    if (effectiveStatuses.length > 0) {
      const sortedStatuses = [...effectiveStatuses].sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      if (sortedStatuses[0]?.status) effectiveContractType = sortedStatuses[0].status;
    }
    if (!effectiveContractType && ((updatedEmp.personal_info as any)?.employment_status || (emp.personal_info as any)?.employment_status)) {
      effectiveContractType = (updatedEmp.personal_info as any)?.employment_status || (emp.personal_info as any)?.employment_status;
    }

    let effectiveJoinedAt = updatedEmp.joined_at || emp.joined_at;
    if ((!effectiveJoinedAt || effectiveJoinedAt.startsWith("1970")) && effectiveJobInfos.length > 0 && effectiveJobInfos[0].date) {
      effectiveJoinedAt = effectiveJobInfos[0].date;
    }

    let effectiveDeptId = updatedEmp.department_id !== undefined ? updatedEmp.department_id : emp.department_id;
    if (effectiveDeptName) {
      const matched = departments.find(d => (d.name || "").toLowerCase() === (effectiveDeptName || "").toLowerCase());
      if (matched) effectiveDeptId = matched.id;
    }

    const payload: any = {
      name: updatedEmp.name !== undefined ? updatedEmp.name : emp.name,
      email: updatedEmp.email !== undefined ? updatedEmp.email : ((updatedEmp.personal_info as any)?.work_email || emp.email),
      department_id: effectiveDeptId,
      department_name: effectiveDeptName,
      job_title: effectiveJobTitle,
      team_name: effectiveTeamName,
      salary_base: effectiveSalaryBase || 0,
      allowances: updatedEmp.allowances !== undefined ? updatedEmp.allowances : emp.allowances,
      contract_type: effectiveContractType || "Full-time",
      status: updatedEmp.status !== undefined ? updatedEmp.status : (emp.status || "active"),
      reporting_to: effectiveReportingTo,
      manager_name: effectiveReportingTo,
      id_number: updatedEmp.id_number !== undefined ? updatedEmp.id_number : emp.id_number,
      phone: updatedEmp.phone !== undefined ? updatedEmp.phone : emp.phone,
      contract_start_date: updatedEmp.contract_start_date !== undefined ? updatedEmp.contract_start_date : (emp.contract_start_date || effectiveJoinedAt),
      contract_end_date: updatedEmp.contract_end_date !== undefined ? updatedEmp.contract_end_date : emp.contract_end_date,
      vacation_balance: updatedEmp.vacation_balance !== undefined ? updatedEmp.vacation_balance : emp.vacation_balance,
      documents: updatedEmp.documents !== undefined ? updatedEmp.documents : emp.documents,
      penalty_history: updatedEmp.penalty_history !== undefined ? updatedEmp.penalty_history : emp.penalty_history,
      personal_info: {
        ...(emp.personal_info || {}),
        ...(updatedEmp.personal_info || {}),
        job_title: effectiveJobTitle,
        department_name: effectiveDeptName,
        team_name: effectiveTeamName,
        reporting_to: effectiveReportingTo,
        manager_name: effectiveReportingTo
      },
      joined_at: effectiveJoinedAt,
      avatar_url: updatedEmp.avatar_url !== undefined ? updatedEmp.avatar_url : emp.avatar_url,
      employment_statuses: effectiveStatuses,
      job_informations: effectiveJobInfos,
      compensations: effectiveCompensations,
      bonuses_list: updatedEmp.bonuses_list !== undefined ? updatedEmp.bonuses_list : bonusesList,
      commissions_list: updatedEmp.commissions_list !== undefined ? updatedEmp.commissions_list : commissionsList,
      equities_list: updatedEmp.equities_list !== undefined ? updatedEmp.equities_list : equitiesList,
      shift_allowances_list: updatedEmp.shift_allowances_list !== undefined ? updatedEmp.shift_allowances_list : shiftAllowancesList,
      potential_bonus: updatedEmp.potential_bonus !== undefined ? updatedEmp.potential_bonus : { percent: potentialBonusPercent, amount: potentialBonusAmount },
      kpi_amount: updatedEmp.kpi_amount !== undefined ? updatedEmp.kpi_amount : jobKpiAmount,
      kpi_frequency: updatedEmp.kpi_frequency !== undefined ? updatedEmp.kpi_frequency : jobKpiFrequency,
      kpi_payout_mechanism: updatedEmp.kpi_payout_mechanism !== undefined ? updatedEmp.kpi_payout_mechanism : jobKpiPayoutMechanism,
      kpi_payout_date: updatedEmp.kpi_payout_date !== undefined ? updatedEmp.kpi_payout_date : jobKpiPayoutDate,
      attendance_method: updatedEmp.attendance_method !== undefined ? updatedEmp.attendance_method : empAttendanceMethod,
      assigned_shift_id: updatedEmp.assigned_shift_id !== undefined ? updatedEmp.assigned_shift_id : jobAssignedShiftId,
      ...updatedEmp
    };

    try {
      const res = await fetch(`/api/hr/employees/${targetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (res && res.ok) {
        if (typeof onSaveEmployeeDetails === "function") {
          await onSaveEmployeeDetails(payload).catch(() => null);
        }
        if (typeof onRefreshEmployee === "function") {
          await onRefreshEmployee();
        }
      } else {
        const errorData = await res?.json().catch(() => ({}));
        const errMsg = errorData?.error || "Could not save employee details to server";
        console.warn(errMsg);
        showCustomToast(errMsg, "error");
        throw new Error(errMsg);
      }
    } catch (err: any) {
      console.error("Notice: issue updating employee details:", err);
      if (err?.message) {
        showCustomToast(err.message, "error");
      }
      throw err;
    }
  };

  const handleRemoveDirectReport = async (dr: any, managerEmp?: any) => {
    if (!dr) return;
    const targetManagerId = managerEmp?.id || emp?.id;
    const confirmMsg = `Are you sure you want to remove ${dr.name || "this employee"} from direct reports?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/hr/employees/${targetManagerId}/remove-direct-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser?.id?.toString() || "1"
        },
        body: JSON.stringify({
          directReportId: dr.user_id || dr.id
        })
      });

      if (!res.ok) {
        const cleanJobInfos = getSafeArrayField(dr.job_informations).map(ji => ({
          ...ji,
          reportingTo: ""
        }));
        await fetch(`/api/hr/employees/${dr.user_id || dr.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": currentUser?.id?.toString() || "1"
          },
          body: JSON.stringify({
            ...dr,
            reporting_to: null,
            manager_name: null,
            job_informations: cleanJobInfos,
            personal_info: {
              ...(typeof dr.personal_info === "object" ? dr.personal_info : {}),
              reporting_to: null,
              manager_name: null,
              reportingTo: null
            }
          })
        });
      }

      showCustomToast("Direct report removed successfully", "success");
      if (typeof onRefreshEmployee === "function") {
        await onRefreshEmployee();
      }
    } catch (err) {
      console.error("Error removing direct report:", err);
      showCustomToast("Failed to remove direct report", "error");
    }
  };

  if (!emp) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 font-medium text-xs">
        No employee data available.
      </div>
    );
  }

  // Calculated profile summaries matching original JSX
  const effectiveJobInfos = getSafeArrayField(emp.job_informations?.length ? emp.job_informations : jobInformations);
  const latestJobInfo = getLatestJobInfo(effectiveJobInfos);
  const displayJobTitle = latestJobInfo?.jobTitle || emp.job_title || "Employee";
  const displayDeptName = latestJobInfo?.department || emp.department_name || "Human Resources";
  const displayManagerName = latestJobInfo?.reportingTo || emp.manager_name || emp.reporting_to;
  const effectiveStatuses = getSafeArrayField(emp.employment_statuses?.length ? emp.employment_statuses : employmentStatuses);
  const latestStatusRow = [...effectiveStatuses].sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
  const displayContractType = latestStatusRow?.status || emp.contract_type || "Full-time";
  const effectiveComps = getSafeArrayField(emp.compensations?.length ? emp.compensations : compensations);
  const latestCompRow = [...effectiveComps].sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
  const displayBaseSalary = latestCompRow?.payRate ? (typeof latestCompRow.payRate === "number" ? latestCompRow.payRate : parseFloat(latestCompRow.payRate)) : (jobBaseSalary || emp.salary_base || 0);

  const directReports = employees.filter(e => {
    if (!e || e.id === emp.id || (e.user_id && e.user_id === emp.id) || (emp.user_id && e.id === emp.user_id)) return false;
    const eJobInfos = getSafeArrayField(e.job_informations);
    const eLatestJob = getLatestJobInfo(eJobInfos);
    const eMgr = eLatestJob?.reportingTo || e.reporting_to || e.manager_name;
    if (!eMgr) return false;
    const eMgrStr = String(eMgr).trim().toLowerCase();
    const empNameStr = String(emp.name || "").trim().toLowerCase();
    const empTitleStr = String(displayJobTitle || emp.job_title || "").trim().toLowerCase();
    const empIdStr = String(emp.id);
    const empUserIdStr = String(emp.user_id || "");
    return (
      e.reporting_to === emp.id || 
      e.reporting_to === emp.user_id || 
      String(eMgr) === empIdStr || 
      String(eMgr) === empUserIdStr || 
      (empNameStr && eMgrStr === empNameStr) ||
      (empTitleStr && eMgrStr === empTitleStr) ||
      (empTitleStr && eMgrStr.length >= 3 && empTitleStr.includes(eMgrStr)) ||
      (empTitleStr && eMgrStr.length >= 3 && eMgrStr.includes(empTitleStr))
    );
  });

  return (
                    <div className="space-y-6">
                      {/* Top main card: Job Details */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                          <div>
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                              <Briefcase className="w-5 h-5 text-[#1b5e20]" /> Job Details
                            </h3>
                            <p className="text-xs text-slate-400 font-semibold">Manage hire settings and dynamic job descriptions</p>
                          </div>
                          {!isViewOnlyMode && (
                            <div className="flex items-center gap-2.5 self-end md:self-center">
                              <button
                                onClick={async () => {
                                  const updatedPersonal = {
                                    ...(emp.personal_info || {}),
                                    jobProbationDate,
                                    jobDescriptionText
                                  };
                                  await saveEmployeeDetails({
                                    joined_at: jobHireDate,
                                    salary_base: jobBaseSalary,
                                    allowances: jobAllowances,
                                    attendance_method: empAttendanceMethod,
                                    assigned_shift_id: jobAssignedShiftId,
                                    personal_info: updatedPersonal
                                  });
                                  showCustomToast('Job details saved successfully', 'success');
                                }}
                                className="px-4 py-2 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors shadow-sm cursor-pointer"
                              >
                                <Check className="w-4 h-4" /> Save Job Details
                              </button>
                            </div>
                          )}
                        </div>
                        <fieldset disabled={isViewOnlyMode} className="contents">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
                          <div className="space-y-4">
                            <PermittedField moduleName="HR" tabName="job" fieldKey="std_job_contract_date" label="Contract Date" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email}>
                              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between mb-1">
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {effectiveLabel || "Contract Date"}
                                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                                    </span>
                                    {isReadOnly && (
                                      <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5" /> View only
                                      </span>
                                    )}
                                  </label>
                                  <input
                                    type="date"
                                    required={isRequired}
                                    value={jobHireDate}
                                    readOnly={isReadOnly || (isViewOnlyMode && !allowOnSubmit)}
                                    disabled={isReadOnly || (isViewOnlyMode && !allowOnSubmit)}
                                    onChange={(e) => setJobHireDate(e.target.value)}
                                    className={cn(
                                      "w-full text-xs font-bold p-2.5 rounded-xl border focus:outline-none transition-all",
                                      isReadOnly || (isViewOnlyMode && !allowOnSubmit)
                                        ? "bg-slate-100/90 text-slate-500 cursor-not-allowed border-slate-200"
                                        : "text-slate-800 border-slate-200 bg-white focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20]"
                                    )}
                                  />
                                </div>
                              )}
                            </PermittedField>

                            <PermittedField moduleName="HR" tabName="job" fieldKey="std_job_probation_date" label="Probationary Date" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email}>
                              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between mb-1">
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {effectiveLabel || "Probationary Date"}
                                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                                    </span>
                                    {isReadOnly && (
                                      <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5" /> View only
                                      </span>
                                    )}
                                  </label>
                                  <input
                                    type="date"
                                    required={isRequired}
                                    value={jobProbationDate}
                                    readOnly={isReadOnly || (isViewOnlyMode && !allowOnSubmit)}
                                    disabled={isReadOnly || (isViewOnlyMode && !allowOnSubmit)}
                                    onChange={(e) => setJobProbationDate(e.target.value)}
                                    className={cn(
                                      "w-full text-xs font-bold p-2.5 rounded-xl border focus:outline-none transition-all",
                                      isReadOnly || (isViewOnlyMode && !allowOnSubmit)
                                        ? "bg-slate-100/90 text-slate-500 cursor-not-allowed border-slate-200"
                                        : "text-slate-800 border-slate-200 bg-white focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20]"
                                    )}
                                  />
                                </div>
                              )}
                            </PermittedField>

                            {/* Attendance Method & Assigned Shift Section */}
                            <div className="space-y-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
                              <PermittedField moduleName="HR" tabName="job" fieldKey="std_job_attendance_method" label="Attendance Method" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email}>
                                {({ isReadOnly: attReadOnly, isRequired: attReq, allowOnSubmit: attAllow, effectiveLabel: attLabel }) => (
                                  <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase flex items-center justify-between mb-1.5">
                                      <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-500" /> {attLabel || "Attendance Method"}
                                        {attReq && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                                      </span>
                                      {attReadOnly && (
                                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" /> View only
                                        </span>
                                      )}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        disabled={attReadOnly || (isViewOnlyMode && !attAllow)}
                                        onClick={() => setEmpAttendanceMethod('Login System')}
                                        className={cn(
                                          "p-2.5 rounded-xl border text-left transition-all flex items-center gap-2",
                                          attReadOnly || (isViewOnlyMode && !attAllow) ? "opacity-75 cursor-not-allowed" : "cursor-pointer",
                                          empAttendanceMethod === 'Login System'
                                            ? "border-indigo-600 bg-indigo-50 font-bold text-indigo-900 ring-1 ring-indigo-500/20 shadow-xs"
                                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                                        )}
                                      >
                                        <LogIn className="w-4 h-4 shrink-0 text-indigo-600" />
                                        <div>
                                          <div className="text-xs font-bold">Login System</div>
                                          <div className="text-[9px] text-slate-500 font-normal">Sales / Call Center</div>
                                        </div>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={attReadOnly || (isViewOnlyMode && !attAllow)}
                                        onClick={() => setEmpAttendanceMethod('Fingerprint')}
                                        className={cn(
                                          "p-2.5 rounded-xl border text-left transition-all flex items-center gap-2",
                                          attReadOnly || (isViewOnlyMode && !attAllow) ? "opacity-75 cursor-not-allowed" : "cursor-pointer",
                                          empAttendanceMethod === 'Fingerprint'
                                            ? "border-amber-600 bg-amber-50 font-bold text-amber-900 ring-1 ring-amber-500/20 shadow-xs"
                                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                                        )}
                                      >
                                        <Fingerprint className="w-4 h-4 shrink-0 text-amber-600" />
                                        <div>
                                          <div className="text-xs font-bold">Fingerprint</div>
                                          <div className="text-[9px] text-slate-500 font-normal">Managers / HR / Admin</div>
                                        </div>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </PermittedField>

                              {/* Assigned Shift (Compatible with Selected Method) */}
                              <PermittedField moduleName="HR" tabName="job" fieldKey="std_job_assigned_shift" label="Assigned Shift" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email}>
                                {({ isReadOnly: shiftReadOnly, isRequired: shiftReq, allowOnSubmit: shiftAllow, effectiveLabel: shiftLabel }) => (
                                  <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                                        <Sun className="w-3.5 h-3.5 text-amber-500" /> {shiftLabel || "Assigned Shift (Default)"}
                                        {shiftReq && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                                      </label>
                                      {shiftReadOnly ? (
                                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" /> View only
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-medium text-slate-400">
                                          Filtered by: <span className="font-bold text-slate-600">{empAttendanceMethod}</span>
                                        </span>
                                      )}
                                    </div>
                                    
                                    <select
                                      value={jobAssignedShiftId || ''}
                                      required={shiftReq}
                                      disabled={shiftReadOnly || (isViewOnlyMode && !shiftAllow)}
                                      onChange={(e) => {
                                        const val = e.target.value ? Number(e.target.value) : null;
                                        setJobAssignedShiftId(val);
                                      }}
                                      className={cn(
                                        "w-full text-xs font-bold p-2.5 rounded-xl border focus:outline-none transition-all",
                                        shiftReadOnly || (isViewOnlyMode && !shiftAllow)
                                          ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                                          : "border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                      )}
                                    >
                                      <option value="">No Default Shift Assigned (Unassigned)</option>
                                      {shifts
                                        .filter(s => !s.attendance_method || s.attendance_method === 'Both' || s.attendance_method === empAttendanceMethod)
                                        .map(s => {
                                          const sType = s.type || 'Fixed';
                                          const timing = sType === 'Flexible' 
                                            ? `${s.required_hours || 8}h Flexible` 
                                            : `${s.start_time?.slice(0,5)} - ${s.end_time?.slice(0,5)}`;
                                          const methodLabel = s.attendance_method === 'Both' ? 'Universal' : (s.attendance_method || 'Both');
                                          return (
                                            <option key={s.id} value={s.id}>
                                              {s.name} ({timing}) • [{methodLabel}]
                                            </option>
                                          );
                                        })}
                                    </select>

                                    {/* Selected Shift Summary Card */}
                                    {(() => {
                                      const currentShift = shifts.find(s => s.id === jobAssignedShiftId);
                                      if (!currentShift) return null;
                                      return (
                                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs mt-1 shadow-2xs">
                                          <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: currentShift.color || '#3b82f6' }} />
                                            <div>
                                              <span className="font-bold text-slate-800">{currentShift.name}</span>
                                              <div className="text-[10px] text-slate-500">
                                                {currentShift.type === 'Flexible' 
                                                  ? `Target: ${currentShift.required_hours || 8} hrs/day (${currentShift.start_time?.slice(0,5)} - ${currentShift.end_time?.slice(0,5)})`
                                                  : `Hours: ${currentShift.start_time?.slice(0,5)} to ${currentShift.end_time?.slice(0,5)} (Grace: +${currentShift.grace_period_mins ?? 15}m)`
                                                }
                                              </div>
                                            </div>
                                          </div>
                                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                            {currentShift.attendance_method || 'Both'}
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </PermittedField>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <PermittedField moduleName="HR" tabName="job" fieldKey="std_job_base_salary" label="Base Salary (EGP)" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email}>
                                {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between mb-1">
                                      <span className="flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5 text-[#1b5e20]" /> {effectiveLabel || "Base Salary (EGP)"}
                                        {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                                      </span>
                                      {!isSalaryVisible ? (
                                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" /> Hidden
                                        </span>
                                      ) : isReadOnly ? (
                                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" /> View only
                                        </span>
                                      ) : null}
                                    </label>
                                    {!isSalaryVisible ? (
                                      <div className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 flex items-center justify-between select-none">
                                        <span className="tracking-widest">••••••••</span>
                                        <span className="text-[9px] text-slate-500 font-bold">Salary Hidden</span>
                                      </div>
                                    ) : (
                                      <input
                                        type="number"
                                        required={isRequired}
                                        value={jobBaseSalary}
                                        readOnly={isReadOnly || (isViewOnlyMode && !allowOnSubmit)}
                                        disabled={isReadOnly || (isViewOnlyMode && !allowOnSubmit)}
                                        onChange={(e) => setJobBaseSalary(parseFloat(e.target.value) || 0)}
                                        className={cn(
                                          "w-full text-xs font-bold p-2.5 rounded-xl border focus:outline-none transition-all",
                                          isReadOnly || (isViewOnlyMode && !allowOnSubmit)
                                            ? "bg-slate-100/90 text-slate-500 cursor-not-allowed border-slate-200"
                                            : "text-slate-800 border-slate-200 bg-white focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20]"
                                        )}
                                      />
                                    )}
                                  </div>
                                )}
                              </PermittedField>

                              <PermittedField moduleName="HR" tabName="job" fieldKey="std_job_allowances" label="Allowances (EGP)" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email}>
                                {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between mb-1">
                                      <span className="flex items-center gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5 text-[#1b5e20]" /> {effectiveLabel || "Allowances (EGP)"}
                                        {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                                      </span>
                                      {!isSalaryVisible ? (
                                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" /> Hidden
                                        </span>
                                      ) : isReadOnly ? (
                                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" /> View only
                                        </span>
                                      ) : null}
                                    </label>
                                    {!isSalaryVisible ? (
                                      <div className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 flex items-center justify-between select-none">
                                        <span className="tracking-widest">••••••••</span>
                                        <span className="text-[9px] text-slate-500 font-bold">Salary Hidden</span>
                                      </div>
                                    ) : (
                                      <input
                                        type="number"
                                        required={isRequired}
                                        value={jobAllowances}
                                        readOnly={isReadOnly || (isViewOnlyMode && !allowOnSubmit)}
                                        disabled={isReadOnly || (isViewOnlyMode && !allowOnSubmit)}
                                        onChange={(e) => setJobAllowances(parseFloat(e.target.value) || 0)}
                                        className={cn(
                                          "w-full text-xs font-bold p-2.5 rounded-xl border focus:outline-none transition-all",
                                          isReadOnly || (isViewOnlyMode && !allowOnSubmit)
                                            ? "bg-slate-100/90 text-slate-500 cursor-not-allowed border-slate-200"
                                            : "text-slate-800 border-slate-200 bg-white focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20]"
                                        )}
                                      />
                                    )}
                                  </div>
                                )}
                              </PermittedField>
                            </div>
                          </div>
                          <div className="space-y-4">
                              <div>
                                <PermittedField moduleName="HR" tabName="job" fieldKey="std_job_direct_reports" label="Direct Reports" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email}>
                                {({ isReadOnly: drReadOnly, isRequired: drReq, effectiveLabel: drLabel }) => (
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between mb-1">
                                      <span className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-slate-400" /> {drLabel || "Direct Reports"}
                                        {drReq && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                                      </span>
                                      {drReadOnly && (
                                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" /> View only
                                        </span>
                                      )}
                                    </label>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {directReports.length > 0 ? (
                                        directReports.map(dr => (
                                          <div key={dr.id} className="px-3 py-1.5 bg-emerald-50 text-[#1b5e20] font-bold rounded-full text-xs border border-emerald-100 flex items-center gap-1.5">
                                            <span 
                                              className="cursor-pointer hover:underline"
                                              onClick={() => setViewingEmployee(dr)}
                                              title="Click to view employee profile"
                                            >
                                              {dr.name}
                                            </span>
                                            {!drReadOnly && !isViewOnlyMode && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRemoveDirectReport(dr, emp);
                                                }}
                                                className="text-emerald-600 hover:text-rose-600 p-0.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                                                title="Remove direct report"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <span className="text-slate-400 italic text-xs">No direct reports recorded</span>
                                      )}
                                      {!drReadOnly && !isViewOnlyMode && (
                                        <button 
                                          className="px-2.5 py-1.5 rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 flex items-center gap-1 transition-colors text-[10px] font-bold uppercase cursor-pointer" 
                                          onClick={() => {
                                            setShowAssignDirectReport(!showAssignDirectReport);
                                            setSelectedDirectReportId('');
                                            setDirectReportSearchQuery('');
                                          }}
                                        >
                                          {showAssignDirectReport ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />} 
                                          {showAssignDirectReport ? 'Cancel' : 'Assign'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </PermittedField>
                              {showAssignDirectReport && (() => {
                                  const activeReportingTo = (addingJobInfo && newJobInfoForm.reportingTo)
                                    ? newJobInfoForm.reportingTo
                                    : (latestJobInfo?.reportingTo || emp.manager_name || emp.reporting_to || '');

                                  const targetReportingTitle = getTargetJobTitleFromReportingTo(activeReportingTo);
                                  const targetTitleLower = (targetReportingTitle || '').toLowerCase().trim();

                                  return (
                                  <div className="flex flex-col gap-2.5 mt-2 w-full max-w-md bg-slate-50 p-3.5 rounded-2xl border border-slate-200 animate-fadeIn shadow-xs">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                        Select Direct Report
                                      </label>
                                      {targetReportingTitle ? (
                                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                                          Reporting To: {targetReportingTitle}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-bold">
                                          Searchable List
                                        </span>
                                      )}
                                    </div>

                                    {/* Search input with filter capability */}
                                    <div className="relative">
                                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                      <input
                                        type="text"
                                        placeholder="Type name, job title, or department..."
                                        value={directReportSearchQuery}
                                        onChange={(e) => setDirectReportSearchQuery(e.target.value)}
                                        className="w-full text-xs font-bold border border-slate-200 rounded-xl pl-9 pr-8 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20] focus:border-[#1b5e20]"
                                        autoFocus
                                      />
                                      {directReportSearchQuery && (
                                        <button
                                          type="button"
                                          onClick={() => setDirectReportSearchQuery('')}
                                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Filtered candidates */}
                                    <div className="max-h-48 overflow-y-auto space-y-1 my-1 pr-1 border border-slate-200 rounded-xl bg-white p-1">
                                      {(() => {
                                        const sortSameDept = (list: any[]) => {
                                          return [...list].sort((a, b) => {
                                            const aSame = (a.department_id === emp.department_id || (a.department_name && emp.department_name && (a.department_name || '').toLowerCase() === (emp.department_name || '').toLowerCase())) ? 1 : 0;
                                            const bSame = (b.department_id === emp.department_id || (b.department_name && emp.department_name && (b.department_name || '').toLowerCase() === (emp.department_name || '').toLowerCase())) ? 1 : 0;
                                            return bSame - aSame;
                                          });
                                        };
                                        const candidates = employees.filter(e => {
                                          const isSelf = e.id === emp.id || (e.user_id && e.user_id === emp.user_id) || (e.user_id && e.user_id === emp.id) || (emp.user_id && e.id === emp.user_id);
                                          if (isSelf) return false;
                                          const isAlreadyDR = directReports.some(dr => dr.id === e.id || (dr.user_id && dr.user_id === e.user_id) || (dr.user_id && dr.user_id === e.id) || (e.user_id && dr.id === e.user_id));
                                          if (isAlreadyDR) return false;

                                          const eJobInfos = getSafeArrayField(e.job_informations);
                                          const eLatestJob = getLatestJobInfo(eJobInfos);
                                          const candidateTitle = (eLatestJob?.jobTitle || e.job_title || '').toLowerCase().trim();

                                          if (targetTitleLower) {
                                            const isTitleMatch = candidateTitle === targetTitleLower || 
                                                                 candidateTitle.includes(targetTitleLower) || 
                                                                 targetTitleLower.includes(candidateTitle);
                                            if (!isTitleMatch && !directReportSearchQuery.trim()) {
                                              return false;
                                            }
                                          }

                                          if (!directReportSearchQuery.trim()) return true;
                                          const q = (directReportSearchQuery || '').toLowerCase();
                                          return (
                                            (e.name || '').toLowerCase().includes(q) ||
                                            candidateTitle.includes(q) ||
                                            (e.department_name || '').toLowerCase().includes(q)
                                          );
                                        });

                                        if (candidates.length === 0) {
                                          return (
                                            <div className="p-3 text-center text-xs text-slate-400 italic">
                                              {targetReportingTitle ? `No employees found with Job Title matching "${targetReportingTitle}"` : "No matching employees found"}
                                            </div>
                                          );
                                        }

                                        return sortSameDept(candidates).map(candidate => {
                                          const candidateIdStr = (candidate.user_id || candidate.id).toString();
                                          const isSelected = selectedDirectReportId.toString() === candidateIdStr || selectedDirectReportId.toString() === candidate.id.toString();
                                          const initials = candidate.name ? candidate.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'EE';

                                          return (
                                            <div
                                              key={candidate.id}
                                              onClick={() => setSelectedDirectReportId(candidateIdStr)}
                                              className={cn(
                                                "p-2 rounded-lg cursor-pointer flex items-center justify-between transition-all text-xs font-semibold",
                                                isSelected
                                                  ? "bg-[#1b5e20]/10 border border-[#1b5e20]/30 text-[#1b5e20]"
                                                  : "hover:bg-slate-50 text-slate-700"
                                              )}
                                            >
                                              <div className="flex items-center gap-2">
                                                <div className={cn(
                                                  "w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0",
                                                  isSelected ? "bg-[#1b5e20] text-white" : "bg-emerald-50 text-[#1b5e20]"
                                                )}>
                                                  {initials}
                                                </div>
                                                <div>
                                                  <p className="font-bold text-slate-800 leading-none">{candidate.name}</p>
                                                  <p className="text-[10px] text-slate-400 font-normal mt-0.5 flex items-center gap-1">
                                                    <span>{candidate.job_title || 'No Title'} • {candidate.department_name || 'HR'}</span>
                                                    {(candidate.department_id === emp.department_id || (candidate.department_name && emp.department_name && (candidate.department_name || '').toLowerCase() === (emp.department_name || '').toLowerCase())) && (
                                                      <span className="px-1.5 py-0.2 text-[8px] bg-emerald-100 text-emerald-800 rounded font-bold">
                                                        Same Dept
                                                      </span>
                                                    )}
                                                  </p>
                                                </div>
                                              </div>
                                              {isSelected && <Check className="w-4 h-4 text-[#1b5e20] shrink-0" />}
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>

                                    <button
                                      type="button"
                                      disabled={!selectedDirectReportId}
                                      onClick={async () => {
                                        if (!selectedDirectReportId) {
                                          alert('Please select an employee');
                                          return;
                                        }
                                        const targetEmp = employees.find(e => e.id.toString() === selectedDirectReportId.toString() || (e.user_id && e.user_id.toString() === selectedDirectReportId.toString()));
                                        if (targetEmp) {
                                          try {
                                            const res = await fetch(`/api/hr/employees/${targetEmp.user_id || targetEmp.id}`, {
                                              method: 'PUT',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                'x-user-id': currentUser?.id?.toString() || '1'
                                              },
                                              body: JSON.stringify({
                                                ...targetEmp,
                                                reporting_to: emp.id
                                              })
                                            });
                                            if (res.ok) {
                                              showCustomToast('Successfully assigned direct report!', 'success');
                                              setShowAssignDirectReport(false);
                                              setSelectedDirectReportId('');
                                              setDirectReportSearchQuery('');
                                              if (typeof fetchData === 'function') {
                                                await fetchData();
                                              }
                                            } else {
                                              alert('Failed to assign direct report.');
                                            }
                                          } catch (err) {
                                            console.error('Error assigning direct report:', err);
                                          }
                                        }
                                      }}
                                      className="px-3 py-2 bg-[#1b5e20] text-white rounded-xl hover:bg-[#123f15] text-xs font-bold w-full cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-xs"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Confirm Assignment
                                    </button>
                                  </div>
                                );
                              })()}
                              </div>
                              <div>
                                <PermittedField moduleName="HR" tabName="job" fieldKey="std_job_description" label="Current Job Description" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email}>
                              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between mb-1">
                                    <span className="flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-slate-400" /> {effectiveLabel || "Current Job Description"}
                                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                                    </span>
                                    {isReadOnly && (
                                      <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5" /> View only
                                      </span>
                                    )}
                                  </label>
                                  <textarea
                                    value={jobDescriptionText}
                                    required={isRequired}
                                    readOnly={isReadOnly || (isViewOnlyMode && !allowOnSubmit)}
                                    disabled={isReadOnly || (isViewOnlyMode && !allowOnSubmit)}
                                    onChange={(e) => setJobDescriptionText(e.target.value)}
                                    rows={6}
                                    className={cn(
                                      "w-full text-xs font-medium p-3 rounded-xl border focus:outline-none resize-none transition-all",
                                      isReadOnly || (isViewOnlyMode && !allowOnSubmit)
                                        ? "bg-slate-100/90 text-slate-500 cursor-not-allowed border-slate-200"
                                        : "text-slate-700 border-slate-200 bg-white focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20]"
                                    )}
                                    placeholder="Enter detailed job description here..."
                                  />
                                </div>
                              )}
                            </PermittedField>
                          </div>
                        </div>
                      </div>
                      </fieldset>

                        <DynamicLayoutSection 
                          tab="job" 
                          section="Job Details" 
                          employeeId={emp.id} 
                          key={`jd-${layoutTrigger}`} 
                        />
                      </div>

                      {/* Unified Employment Status & Contract Details Section */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-7">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                          <div>
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                              <Briefcase className="w-5 h-5 text-[#1b5e20]" /> Employment Status & Contract Details
                            </h3>
                            <p className="text-xs text-slate-400 font-semibold mt-0.5">
                              Manage employment contract type, validity duration, and track contract status changes
                            </p>
                          </div>
                          {!isViewOnlyMode && (
                            <div className="flex items-center gap-2.5 self-end md:self-center">
                              <button
                                onClick={() => {
                                  setAddingStatus(!addingStatus);
                                  setNewStatusForm({ 
                                    date: new Date().toISOString().split('T')[0], 
                                    status: empContractType || 'Full-time', 
                                    comments: '' 
                                  });
                                }}
                                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {addingStatus ? 'Cancel' : 'Add Policy'}
                              </button>

                              <button
                                onClick={async () => {
                                  const currentList = getSafeArrayField(employmentStatuses?.length ? employmentStatuses : emp.employment_statuses);
                                  const effectiveDateStr = empContractStartDate 
                                    ? (empContractStartDate.includes('-') ? new Date(empContractStartDate).toLocaleDateString() : empContractStartDate) 
                                    : new Date().toLocaleDateString();
                                  
                                  let commentText = `Current Contract Details (${emp.status || 'Active'})`;
                                  if (empContractEndDate) {
                                    commentText = `Contract: ${empContractType || 'Full-time'} (${empContractStartDate || 'Start'} to ${empContractEndDate})`;
                                  } else if (empContractStartDate) {
                                    commentText = `Contract: ${empContractType || 'Full-time'} (Effective from ${empContractStartDate})`;
                                  } else {
                                    commentText = `Contract Policy: ${empContractType || 'Full-time'}`;
                                  }

                                  const newHistoryEntry = {
                                    id: `policy-${Date.now()}`,
                                    date: effectiveDateStr,
                                    status: empContractType || 'Full-time',
                                    comments: commentText,
                                    isActive: true
                                  };

                                  const updatedHistory = [
                                    newHistoryEntry,
                                    ...currentList.map(item => ({ ...item, isActive: false }))
                                  ];

                                  setEmploymentStatuses(updatedHistory);

                                  await saveEmployeeDetails({
                                    contract_type: empContractType || 'Full-time',
                                    contract_start_date: empContractStartDate || null,
                                    contract_end_date: empContractEndDate || null,
                                    employment_statuses: updatedHistory
                                  });

                                  showCustomToast('Contract & employment status policy saved to history successfully', 'success');
                                }}
                                className="px-4 py-2 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors shadow-2xs cursor-pointer"
                              >
                                <Check className="w-4 h-4" /> Save
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Contract Input Fields with generous spacing */}
                        <fieldset disabled={isViewOnlyMode} className="contents">
                          <div className="bg-slate-50/70 p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-700">
                              <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                                  <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Contract Type
                                </label>
                                <CustomAddableSelect
                                  options={[
                                    'Full-time',
                                    'Part-time',
                                    'Contractor',
                                    'Permanent',
                                    'Fixed-term',
                                    'Probationary',
                                    'Internship',
                                    'Freelance'
                                  ]}
                                  value={empContractType}
                                  onChange={(val) => {
                                    setEmpContractType(val);
                                    setIsProfileDirty(true);
                                  }}
                                  placeholder="Select or Add Contract Type"
                                />
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Date
                                </label>
                                <input
                                  type="date"
                                  value={empContractStartDate}
                                  onChange={(e) => {
                                    setEmpContractStartDate(e.target.value);
                                    setIsProfileDirty(true);
                                  }}
                                  className="w-full text-xs font-bold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20] transition-all"
                                />
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> End Date
                                </label>
                                <input
                                  type="date"
                                  value={empContractEndDate}
                                  onChange={(e) => {
                                    setEmpContractEndDate(e.target.value);
                                    setIsProfileDirty(true);
                                  }}
                                  className="w-full text-xs font-bold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20] transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        </fieldset>

                        {/* Inline Add Policy / Status Change Form */}
                        {addingStatus && (
                          <div className="p-5 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-[#1b5e20] uppercase tracking-wider flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Add Policy / Status History Entry
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">Adds a new timestamped policy row to history</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Effective Date</label>
                                <input
                                  type="date"
                                  value={newStatusForm.date}
                                  onChange={(e) => setNewStatusForm({ ...newStatusForm, date: e.target.value })}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employment Status</label>
                                <select
                                  value={newStatusForm.status}
                                  onChange={(e) => setNewStatusForm({ ...newStatusForm, status: e.target.value })}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                                >
                                  <option value="Full-time">Full-time</option>
                                  <option value="Part-time">Part-time</option>
                                  <option value="Contractor">Contractor</option>
                                  <option value="Permanent">Permanent</option>
                                  <option value="Fixed-term">Fixed-term</option>
                                  <option value="Probationary">Probationary</option>
                                  <option value="Internship">Internship</option>
                                  <option value="Freelance">Freelance</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Comments / Reason</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={newStatusForm.comments}
                                    placeholder="e.g. Promotion, Contract renewal"
                                    onChange={(e) => setNewStatusForm({ ...newStatusForm, comments: e.target.value })}
                                    className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                                  />
                                  <button
                                    onClick={async () => {
                                      if (!newStatusForm.date) return alert('Please specify a date');
                                      const effectiveDateStr = newStatusForm.date 
                                        ? (newStatusForm.date.includes('-') ? new Date(newStatusForm.date).toLocaleDateString() : newStatusForm.date) 
                                        : new Date().toLocaleDateString();

                                      const newEntry = {
                                        id: `policy-${Date.now()}`,
                                        date: effectiveDateStr,
                                        status: newStatusForm.status,
                                        comments: newStatusForm.comments || 'Contract Status Update',
                                        isActive: true
                                      };

                                      const currentList = getSafeArrayField(employmentStatuses?.length ? employmentStatuses : emp.employment_statuses);
                                      const updated = [
                                        newEntry, 
                                        ...currentList.map(item => ({ ...item, isActive: false }))
                                      ];

                                      setEmploymentStatuses(updated);
                                      setEmpContractType(newStatusForm.status);

                                      await saveEmployeeDetails({ 
                                        employment_statuses: updated,
                                        contract_type: newStatusForm.status,
                                        contract_start_date: empContractStartDate || null,
                                        contract_end_date: empContractEndDate || null
                                      });
                                      setAddingStatus(false);
                                      showCustomToast('Employment status policy added and saved to history', 'success');
                                    }}
                                    className="px-3.5 py-2.5 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-xl font-bold cursor-pointer shadow-xs transition-colors shrink-0 flex items-center gap-1 text-xs"
                                  >
                                    <Check className="w-4 h-4" /> Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* History Section Container with Spacing & Clear Header */}
                        <div className="pt-6 border-t border-slate-100 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                Employment Status & Contract History
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                {(() => {
                                  const list = getSafeArrayField(employmentStatuses?.length ? employmentStatuses : emp.employment_statuses);
                                  return list.length > 0 ? list.length : 1;
                                })()} records
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">All contract changes and policies are preserved as history</span>
                          </div>

                          {/* History Table */}
                          <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-2xs">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50/80 border-b border-slate-100">
                                  <th className="py-3 px-4">Employment Status: Date</th>
                                  <th className="py-3 px-4">Employment Status</th>
                                  <th className="py-3 px-4">Employment Status Comments</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(() => {
                                  const list = getSafeArrayField(employmentStatuses?.length ? employmentStatuses : emp.employment_statuses);
                                  if (list.length === 0) {
                                    const defaultStatusRow = {
                                      id: 'default-contract-status',
                                      date: emp.contract_start_date ? new Date(emp.contract_start_date).toLocaleDateString() : (emp.joined_at ? new Date(emp.joined_at).toLocaleDateString() : new Date().toLocaleDateString()),
                                      status: emp.contract_type || empContractType || 'Full-time',
                                      comments: `Current Contract Details (${emp.status || 'Active'})`,
                                      isActive: true
                                    };
                                    return (
                                      <tr className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-slate-700">
                                          <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                                            <span>{defaultStatusRow.date}</span>
                                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              Current
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <span className="font-bold text-slate-800 bg-slate-100/80 px-2.5 py-1 rounded-lg text-xs">
                                            {defaultStatusRow.status}
                                          </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500 font-medium">{defaultStatusRow.comments}</td>
                                        <td className="py-3.5 px-4 text-right font-medium text-slate-400">Auto (Contract)</td>
                                      </tr>
                                    );
                                  }

                                  return list.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                      <td className="py-3.5 px-4 font-bold text-slate-700">
                                        <div className="flex items-center gap-2">
                                          <span className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            idx === 0 || row.isActive !== false ? "bg-emerald-500 shadow-xs" : "bg-slate-300"
                                          )} />
                                          <span>{row.date}</span>
                                          {(idx === 0 || row.isActive !== false) && (
                                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              Current
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <span className="font-bold text-slate-800 bg-slate-100/80 px-2.5 py-1 rounded-lg text-xs">
                                          {row.status}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-slate-500 font-medium">{row.comments}</td>
                                      <td className="py-3.5 px-4 text-right">
                                        {!isViewOnlyMode && (
                                          <button
                                            onClick={async () => {
                                              const updated = list.filter(x => x.id !== row.id);
                                              setEmploymentStatuses(updated);
                                              await saveEmployeeDetails({ employment_statuses: updated });
                                              showCustomToast('Status entry removed', 'info');
                                            }}
                                            title="Delete history entry"
                                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <DynamicLayoutSection 
                          tab="job" 
                          section="Employment Status" 
                          employeeId={emp.id} 
                          key={`es-${layoutTrigger}`} 
                        />
                      </div>

                      {/* 3. Job Information & Role History */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-7">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                          <div>
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                              <Building2 className="w-5 h-5 text-[#1b5e20]" /> Job Information
                            </h3>
                            <p className="text-xs text-slate-400 font-semibold mt-0.5">
                              Manage department, team assignment, job role, reporting line, and track position history
                            </p>
                          </div>
                          {!isViewOnlyMode && (
                            <div className="flex items-center gap-2.5 self-end md:self-center">
                              <button
                                onClick={() => {
                                  setAddingJobInfo(!addingJobInfo);
                                  const currentActive = getLatestJobInfo(jobInformations) || {};
                                  const initDept = currentActive.department || emp.department_name || departments[0]?.name || '';
                                  const selDeptObj = departments.find((d: any) => d.name === initDept);
                                  const { teams: deptTeams, allJobTitles: deptAllTitles } = getTeamsAndTitlesForDepartment(initDept, selDeptObj);
                                  const initTeam = currentActive.teams || emp.team_name || deptTeams[0]?.name || '';
                                  const selTeamObj = deptTeams.find(t => t.name === initTeam);
                                  const titlesForTeam = selTeamObj && selTeamObj.jobTitles.length > 0 ? selTeamObj.jobTitles : deptAllTitles;
                                  const initTitle = currentActive.jobTitle || emp.job_title || titlesForTeam[0] || '';

                                  const { options: deptMgrOpts } = getDepartmentManagerOptions(initDept, emp.id, initTitle);
                                  const initManager = String(currentActive.reportingTo || emp.manager_name || emp.reporting_to || deptMgrOpts[0]?.label || '');

                                  const configuredGrades = (() => {
                                    try {
                                      const raw = localStorage.getItem('systo_org_structure_settings');
                                      if (raw) {
                                        const parsed = JSON.parse(raw);
                                        if (Array.isArray(parsed.job_grades) && parsed.job_grades.length > 0) return parsed.job_grades;
                                      }
                                    } catch (err) {}
                                    return [];
                                  })();

                                  const autoGrade = getGradeForJobTitle(initTitle, initDept, departments, configuredGrades);
                                  const initJD = getJDForTitle(initTitle, initDept, departments, configuredGrades);
                                  const initGrade = autoGrade || currentActive.jobGrade || currentActive.division || emp.personal_info?.job_grade || emp.personal_info?.division || initJD?.grade || 'Grade 3 / Mid-Senior';
                                  const initLoc = currentActive.location || initJD?.location || emp.personal_info?.location || 'On-Site';

                                  setNewJobInfoForm({
                                    date: new Date().toISOString().split('T')[0],
                                    department: initDept,
                                    teams: initTeam,
                                    jobTitle: initTitle,
                                    reportingTo: initManager,
                                    location: initLoc,
                                    division: initGrade,
                                    jobGrade: initGrade,
                                    changeReason: 'Promotion'
                                  });
                                }}
                                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {addingJobInfo ? 'Cancel' : 'Add / Change Role'}
                              </button>

                              <button
                                onClick={async () => {
                                  const currentList = getSafeArrayField(jobInformations?.length ? jobInformations : emp.job_informations);
                                  const activeItem = getLatestJobInfo(currentList) || {};
                                  const effectiveDept = activeItem.department || emp.department_name || departments[0]?.name || 'Corporate';
                                  const targetDeptObj = departments.find((d: any) => d.name === effectiveDept);
                                  const effectiveDeptId = targetDeptObj?.id || emp.department_id || null;
                                  const effectiveTeam = activeItem.teams || emp.team_name || '';
                                  const effectiveTitle = activeItem.jobTitle || emp.job_title || 'Employee';
                                  const effectiveReporting = activeItem.reportingTo || emp.manager_name || emp.reporting_to || 'Management';
                                  const effectiveLocation = activeItem.location || emp.personal_info?.location || 'On-Site';
                                  const effectiveGrade = activeItem.jobGrade || activeItem.division || emp.personal_info?.job_grade || 'Grade 3 / Mid-Senior';

                                  const effectiveDateStr = activeItem.date || new Date().toISOString().split('T')[0];

                                  const newEntry = {
                                    id: `job-info-${Date.now()}`,
                                    date: effectiveDateStr,
                                    department: effectiveDept,
                                    teams: effectiveTeam,
                                    jobTitle: effectiveTitle,
                                    reportingTo: effectiveReporting,
                                    location: effectiveLocation,
                                    division: effectiveGrade,
                                    jobGrade: effectiveGrade,
                                    changeReason: activeItem.changeReason || 'Current Position Confirmation',
                                    isActive: true
                                  };

                                  const updatedHistory = [
                                    newEntry,
                                    ...currentList.filter(x => x.id !== activeItem.id && x.id !== 'default-job-info').map(item => ({ ...item, isActive: false }))
                                  ];

                                  setJobInformations(updatedHistory);

                                  await saveEmployeeDetails({
                                    job_title: effectiveTitle,
                                    department_name: effectiveDept,
                                    department_id: effectiveDeptId,
                                    team_name: effectiveTeam,
                                    reporting_to: effectiveReporting,
                                    manager_name: effectiveReporting,
                                    job_informations: updatedHistory,
                                    personal_info: {
                                      ...(emp.personal_info || {}),
                                      job_title: effectiveTitle,
                                      department_name: effectiveDept,
                                      team_name: effectiveTeam,
                                      reporting_to: effectiveReporting,
                                      manager_name: effectiveReporting,
                                      location: effectiveLocation,
                                      job_grade: effectiveGrade,
                                      division: effectiveGrade
                                    }
                                  });

                                  showCustomToast('Job Information saved & synchronized across system', 'success');
                                }}
                                className="px-4 py-2 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors shadow-2xs cursor-pointer"
                              >
                                <Check className="w-4 h-4" /> Save
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Inline Add / Change Role Form */}
                        {addingJobInfo && (() => {
                          const selDeptObj = departments.find((d: any) => d.name === newJobInfoForm.department);
                          const { teams: deptTeams, allJobTitles: deptAllTitles } = getTeamsAndTitlesForDepartment(newJobInfoForm.department, selDeptObj);

                          const deptOptions = departments.map((d: any) => d.name);
                          const teamOptions = deptTeams.map(t => t.name);

                          const selectedTeamObj = deptTeams.find(t => t.name === newJobInfoForm.teams);
                          const titleOptions = selectedTeamObj && selectedTeamObj.jobTitles.length > 0 ? selectedTeamObj.jobTitles : deptAllTitles;

                          const { options: deptMgrOpts } = getDepartmentManagerOptions(newJobInfoForm.department, emp.id, newJobInfoForm.jobTitle);
                          const managerOptions = deptMgrOpts.map(o => o.label);

                          const configuredGrades = (() => {
                            try {
                              const raw = localStorage.getItem('systo_org_structure_settings');
                              if (raw) {
                                const parsed = JSON.parse(raw);
                                if (Array.isArray(parsed.job_grades) && parsed.job_grades.length > 0) return parsed.job_grades;
                              }
                            } catch (err) {}
                            return [];
                          })();

                          return (
                          <div className="p-5 md:p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-fadeIn shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5 text-[#1b5e20]" /> Record New Job Role / Promotion / Transfer
                              </h4>
                              <span className="text-[10px] text-slate-400 font-semibold">Will become the new Current position in the system</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              {/* 1. Date */}
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Effective Date</label>
                                <input
                                  type="date"
                                  value={newJobInfoForm.date}
                                  onChange={(e) => setNewJobInfoForm({ ...newJobInfoForm, date: e.target.value })}
                                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2 outline-none text-slate-800 transition-all cursor-pointer"
                                />
                              </div>

                              {/* 2. Department */}
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Department</label>
                                <select
                                  value={newJobInfoForm.department}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const targetDeptObj = departments.find((d: any) => d.name === val);
                                    const { teams: newTeams, allJobTitles: newTitles } = getTeamsAndTitlesForDepartment(val, targetDeptObj);
                                    const firstTeam = newTeams[0]?.name || '';
                                    const firstTeamObj = newTeams.find(t => t.name === firstTeam);
                                    const firstTitles = firstTeamObj && firstTeamObj.jobTitles.length > 0 ? firstTeamObj.jobTitles : newTitles;
                                    const newTitle = firstTitles[0] || '';
                                    
                                    const { options: newMgrOpts, isDeptHead: isHead } = getDepartmentManagerOptions(val, emp.id, newTitle);
                                    const defaultManager = isHead 
                                      ? (newMgrOpts.find(o => o.isCeoMd)?.label || 'Chief Executive Officer (CEO)')
                                      : (newMgrOpts.find(o => o.isHead)?.label || newMgrOpts[0]?.label || '');

                                    const autoGrade = getGradeForJobTitle(newTitle, val, departments, configuredGrades);
                                    const jd = getJDForTitle(newTitle, val, departments, configuredGrades);
                                    const updatedLoc = jd?.location || 'On-Site';
                                    const updatedGrade = autoGrade || jd?.grade || newJobInfoForm.division || newJobInfoForm.jobGrade || 'Grade 3 / Mid-Senior';

                                    setNewJobInfoForm({
                                      ...newJobInfoForm,
                                      department: val,
                                      teams: firstTeam,
                                      jobTitle: newTitle,
                                      reportingTo: defaultManager,
                                      location: updatedLoc,
                                      division: updatedGrade,
                                      jobGrade: updatedGrade
                                    });
                                  }}
                                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2 outline-none text-slate-800 transition-all cursor-pointer"
                                >
                                  {deptOptions.length === 0 ? (
                                    <option value="">No Departments</option>
                                  ) : (
                                    deptOptions.map((dept) => (
                                      <option key={dept} value={dept}>{dept}</option>
                                    ))
                                  )}
                                </select>
                              </div>

                              {/* 3. Teams */}
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Teams</label>
                                <select
                                  value={newJobInfoForm.teams}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const selTeamObj = deptTeams.find(t => t.name === val);
                                    const titlesForTeam = selTeamObj && selTeamObj.jobTitles.length > 0 ? selTeamObj.jobTitles : deptAllTitles;
                                    const validTitle = titlesForTeam.includes(newJobInfoForm.jobTitle) ? newJobInfoForm.jobTitle : (titlesForTeam[0] || '');
                                    
                                    const { options: newMgrOpts, isDeptHead: isHead } = getDepartmentManagerOptions(newJobInfoForm.department, emp.id, validTitle);
                                    const updatedManager = isHead 
                                      ? (newMgrOpts.find(o => o.isCeoMd)?.label || 'Chief Executive Officer (CEO)')
                                      : (newJobInfoForm.reportingTo || newMgrOpts[0]?.label || '');

                                    const autoGrade = getGradeForJobTitle(validTitle, newJobInfoForm.department, departments, configuredGrades);
                                    const jd = getJDForTitle(validTitle, newJobInfoForm.department, departments, configuredGrades);
                                    const updatedLoc = jd?.location || newJobInfoForm.location;
                                    const updatedGrade = autoGrade || jd?.grade || newJobInfoForm.division || newJobInfoForm.jobGrade;

                                    setNewJobInfoForm({ 
                                      ...newJobInfoForm, 
                                      teams: val, 
                                      jobTitle: validTitle,
                                      reportingTo: updatedManager,
                                      location: updatedLoc,
                                      division: updatedGrade,
                                      jobGrade: updatedGrade
                                    });
                                  }}
                                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2 outline-none text-slate-800 transition-all cursor-pointer"
                                >
                                  {teamOptions.length === 0 ? (
                                    <option value="">No Teams in Department</option>
                                  ) : (
                                    teamOptions.map((tm) => (
                                      <option key={tm} value={tm}>{tm}</option>
                                    ))
                                  )}
                                </select>
                              </div>

                              {/* 4. Job Title */}
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Job Title</label>
                                <select
                                  value={newJobInfoForm.jobTitle}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const { options: newMgrOpts, isDeptHead: isHead } = getDepartmentManagerOptions(newJobInfoForm.department, emp.id, val);
                                    let updatedManager = isHead 
                                      ? (newMgrOpts.find(o => o.isCeoMd)?.label || 'Chief Executive Officer (CEO)')
                                      : (newJobInfoForm.reportingTo || newMgrOpts[0]?.label || '');

                                    const autoGrade = getGradeForJobTitle(val, newJobInfoForm.department, departments, configuredGrades);
                                    const jd = getJDForTitle(val, newJobInfoForm.department, departments, configuredGrades);
                                    let updatedDept = newJobInfoForm.department;
                                    let updatedTeam = newJobInfoForm.teams;
                                    let updatedLoc = jd?.location || 'On-Site';
                                    let updatedGrade = autoGrade || jd?.grade || newJobInfoForm.division || newJobInfoForm.jobGrade || 'Grade 3 / Mid-Senior';

                                    if (jd) {
                                      if (jd.reportsTo && !isHead) updatedManager = jd.reportsTo;
                                      if (jd.location) updatedLoc = jd.location;
                                      if (jd.department) updatedDept = jd.department;
                                      if (jd.team) updatedTeam = jd.team;
                                    }

                                    setNewJobInfoForm({ 
                                      ...newJobInfoForm, 
                                      department: updatedDept,
                                      teams: updatedTeam,
                                      location: updatedLoc,
                                      division: updatedGrade,
                                      jobGrade: updatedGrade,
                                      jobTitle: val,
                                      reportingTo: updatedManager 
                                    });
                                  }}
                                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2 outline-none text-slate-800 transition-all cursor-pointer"
                                >
                                  {titleOptions.length === 0 ? (
                                    <option value="">No Job Titles Available</option>
                                  ) : (
                                    titleOptions.map((title) => (
                                      <option key={title} value={title}>{title}</option>
                                    ))
                                  )}
                                </select>
                              </div>

                              {/* 5. Reporting to */}
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Reporting to</label>
                                <select
                                  value={newJobInfoForm.reportingTo}
                                  onChange={(e) => setNewJobInfoForm({ ...newJobInfoForm, reportingTo: e.target.value })}
                                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2 outline-none text-slate-800 transition-all cursor-pointer"
                                >
                                  {managerOptions.length === 0 ? (
                                    <option value="">No Managers Available</option>
                                  ) : (
                                    managerOptions.map((mgr) => (
                                      <option key={mgr} value={mgr}>{mgr}</option>
                                    ))
                                  )}
                                </select>
                              </div>

                              {/* 6. Location */}
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Location</label>
                                <select
                                  value={newJobInfoForm.location}
                                  onChange={(e) => setNewJobInfoForm({ ...newJobInfoForm, location: e.target.value })}
                                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2 outline-none text-slate-800 transition-all cursor-pointer"
                                >
                                  {(() => {
                                    const jd = getJDForTitle(newJobInfoForm.jobTitle, newJobInfoForm.department, departments, configuredGrades);
                                    const standardLocs = LOCATION_OPTIONS;
                                    const combined = Array.from(new Set([...standardLocs, jd?.location, newJobInfoForm.location].filter((x): x is string => Boolean(x))));
                                    return combined.map((loc) => (
                                      <option key={loc} value={loc}>{loc}</option>
                                    ));
                                  })()}
                                </select>
                              </div>

                              {/* 7. Job Grade / Level */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Job Grade / Level</label>
                                  {newJobInfoForm.jobTitle && (
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      Auto-synced from Job Directory
                                    </span>
                                  )}
                                </div>
                                <select
                                  value={newJobInfoForm.division || newJobInfoForm.jobGrade || ''}
                                  onChange={(e) => setNewJobInfoForm({ ...newJobInfoForm, division: e.target.value, jobGrade: e.target.value })}
                                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2 outline-none text-slate-800 transition-all cursor-pointer"
                                >
                                  <option value="">-- Select Grade --</option>
                                  {(() => {
                                    const opts = new Set<string>();
                                    if (configuredGrades.length > 0) {
                                      configuredGrades.forEach((g: any) => {
                                        if (g.code && g.name) opts.add(`${g.code} - ${g.name}`);
                                        else if (g.name) opts.add(g.name);
                                      });
                                    }
                                    GRADE_LEVEL_OPTIONS.forEach(gr => opts.add(gr));
                                    if (Array.isArray(departments)) {
                                      departments.forEach((dept: any) => {
                                        let deptTitles: any[] = [];
                                        if (Array.isArray(dept.job_titles)) deptTitles = dept.job_titles;
                                        else if (typeof dept.job_titles === 'string') {
                                          try { deptTitles = JSON.parse(dept.job_titles); } catch (e) {}
                                        }
                                        deptTitles.forEach((jt: any) => {
                                          if (typeof jt === 'object' && jt) {
                                            const l = jt.level || jt.grade;
                                            if (typeof l === 'string' && l.trim()) opts.add(l.trim());
                                          }
                                        });
                                      });
                                    }
                                    if (newJobInfoForm.jobGrade) opts.add(newJobInfoForm.jobGrade);
                                    if (newJobInfoForm.division) opts.add(newJobInfoForm.division);
                                    return Array.from(opts).map((gr) => (
                                      <option key={gr} value={gr}>{gr}</option>
                                    ));
                                  })()}
                                </select>
                              </div>

                              {/* 8. Change Reason */}
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Change Reason</label>
                                <select
                                  value={newJobInfoForm.changeReason}
                                  onChange={(e) => setNewJobInfoForm({ ...newJobInfoForm, changeReason: e.target.value })}
                                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2 outline-none text-slate-800 transition-all cursor-pointer"
                                >
                                  {['Promotion', 'Demotion', 'Transfer', 'New Hire', 'Rehire', 'Title Change', 'Department Reorganization', 'Team Reassignment', 'Lateral Move'].map((reason) => (
                                    <option key={reason} value={reason}>{reason}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                              <button
                                onClick={() => setAddingJobInfo(false)}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={async () => {
                                  if (!newJobInfoForm.date) return alert('Please specify a date');
                                  const newEntry = {
                                    id: `job-info-${Date.now()}`,
                                    ...newJobInfoForm,
                                    isActive: true
                                  };
                                  const currentList = getSafeArrayField(jobInformations);
                                  const baseList = currentList.length === 0 ? [{
                                    id: 'default-job-info',
                                    date: emp.joined_at ? new Date(emp.joined_at).toISOString().split('T')[0] : 'Initial Hire',
                                    department: emp.department_name || departments.find(d => d.id === emp.department_id)?.name || 'Corporate',
                                    teams: emp.team_name || emp.personal_info?.team_name || 'Operations Team',
                                    jobTitle: emp.job_title || 'Employee',
                                    reportingTo: emp.manager_name || emp.reporting_to || 'Management',
                                    location: emp.personal_info?.location || 'On-Site',
                                    division: emp.personal_info?.division || 'Grade 3 / Mid-Senior',
                                    jobGrade: emp.personal_info?.job_grade || emp.personal_info?.division || 'Grade 3 / Mid-Senior',
                                    changeReason: 'Initial Contract Hire',
                                    isActive: false
                                  }] : currentList.map(item => ({ ...item, isActive: false }));

                                  const updatedHistory = [newEntry, ...baseList];
                                  setJobInformations(updatedHistory);

                                  const targetDeptObj = departments.find((d: any) => d.name === newJobInfoForm.department);
                                  const effectiveDeptId = targetDeptObj?.id || emp.department_id || null;

                                  await saveEmployeeDetails({
                                    job_title: newJobInfoForm.jobTitle,
                                    department_name: newJobInfoForm.department,
                                    department_id: effectiveDeptId,
                                    team_name: newJobInfoForm.teams,
                                    reporting_to: newJobInfoForm.reportingTo,
                                    manager_name: newJobInfoForm.reportingTo,
                                    job_informations: updatedHistory,
                                    personal_info: {
                                      ...(emp.personal_info || {}),
                                      job_title: newJobInfoForm.jobTitle,
                                      department_name: newJobInfoForm.department,
                                      team_name: newJobInfoForm.teams,
                                      reporting_to: newJobInfoForm.reportingTo,
                                      manager_name: newJobInfoForm.reportingTo,
                                      location: newJobInfoForm.location,
                                      job_grade: newJobInfoForm.jobGrade || newJobInfoForm.division,
                                      division: newJobInfoForm.division || newJobInfoForm.jobGrade
                                    }
                                  });

                                  setAddingJobInfo(false);
                                  showCustomToast('New Job Information recorded and set as current', 'success');
                                }}
                                className="px-4 py-2 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors shadow-2xs cursor-pointer"
                              >
                                <Check className="w-4 h-4" /> Save Role Change
                              </button>
                            </div>
                          </div>
                          );
                        })()}

                        {/* History Table Container with Spacing & Clear Header */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                Job Information & Position History
                              </h4>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                                {(() => {
                                  const list = getSafeArrayField(jobInformations);
                                  return list.length === 0 ? '1 record' : `${list.length} records`;
                                })()}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                              All role changes, promotions, and transfers are preserved as history
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-2xl border border-slate-100">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                  <th className="py-3 px-3.5">Effective Date</th>
                                  <th className="py-3 px-3">Department</th>
                                  <th className="py-3 px-3">Team</th>
                                  <th className="py-3 px-3">Job Title</th>
                                  <th className="py-3 px-3">Reporting to</th>
                                  <th className="py-3 px-3">Location</th>
                                  <th className="py-3 px-3">Grade / Level</th>
                                  <th className="py-3 px-3">Change Reason</th>
                                  <th className="py-3 px-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {(() => {
                                  const list = getSafeArrayField(jobInformations);
                                  if (list.length === 0) {
                                    const empJD = getJDForTitle(emp.job_title);
                                    const defaultRow = {
                                      id: 'default-job-info',
                                      date: emp.joined_at ? new Date(emp.joined_at).toISOString().split('T')[0] : 'Initial Hire',
                                      department: emp.department_name || departments.find(d => d.id === emp.department_id)?.name || empJD?.department || 'Corporate',
                                      teams: emp.team_name || emp.personal_info?.team_name || empJD?.team || 'Operations Team',
                                      jobTitle: emp.job_title || 'Employee',
                                      reportingTo: emp.manager_name || emp.reporting_to || empJD?.reportsTo || 'Management',
                                      location: emp.personal_info?.location || empJD?.location || 'On-Site',
                                      jobGrade: emp.personal_info?.job_grade || emp.personal_info?.division || empJD?.grade || 'Grade 3 / Mid-Senior',
                                      changeReason: 'Initial Contract Hire',
                                      isActive: true
                                    };
                                    return (
                                      <tr className="hover:bg-slate-50/50 bg-emerald-50/20">
                                        <td className="py-3 px-3.5">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 animate-pulse" />
                                            <span className="font-bold text-slate-800">{defaultRow.date}</span>
                                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black uppercase">
                                              Current
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-3 text-slate-700 font-semibold">{defaultRow.department}</td>
                                        <td className="py-3 px-3 text-slate-600 font-medium">{defaultRow.teams}</td>
                                        <td className="py-3 px-3 font-black text-[#1b5e20]">{defaultRow.jobTitle}</td>
                                        <td className="py-3 px-3 text-indigo-600 font-bold">{getResolvedManagerDisplay(defaultRow.reportingTo)}</td>
                                        <td className="py-3 px-3 font-semibold text-slate-700">{defaultRow.location}</td>
                                        <td className="py-3 px-3 font-semibold text-slate-700">{defaultRow.jobGrade}</td>
                                        <td className="py-3 px-3 text-slate-600 font-bold">{defaultRow.changeReason}</td>
                                        <td className="py-3 px-3 text-right font-medium text-slate-400">
                                          <span className="text-[10px] text-slate-400 italic">Active Role</span>
                                        </td>
                                      </tr>
                                    );
                                  }

                                  const activeItem = getLatestJobInfo(list);

                                  return list.map((row, idx) => {
                                    const isCurrent = row.id === activeItem?.id || (activeItem === null && idx === 0) || row.isActive === true;

                                    return (
                                      <tr 
                                        key={row.id || idx} 
                                        className={`hover:bg-slate-50/80 transition-colors ${
                                          isCurrent ? 'bg-emerald-50/25 font-medium' : ''
                                        }`}
                                      >
                                        <td className="py-3 px-3.5 whitespace-nowrap">
                                          <div className="flex items-center gap-2">
                                            <div 
                                              className={`w-2 h-2 rounded-full ${
                                                isCurrent 
                                                  ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse' 
                                                  : 'bg-slate-300'
                                              }`} 
                                            />
                                            <span className="font-bold text-slate-800">{row.date || row.effective_date || '—'}</span>
                                            {isCurrent && (
                                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black uppercase">
                                                Current
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-3 px-3 text-slate-700 font-semibold">{row.department || '—'}</td>
                                        <td className="py-3 px-3 text-slate-600 font-medium">{row.teams || '—'}</td>
                                        <td className="py-3 px-3 font-black text-[#1b5e20]">{row.jobTitle || row.job_title || '—'}</td>
                                        <td className="py-3 px-3 text-indigo-600 font-bold hover:underline cursor-pointer">
                                          {getResolvedManagerDisplay(row.reportingTo || row.reporting_to)}
                                        </td>
                                        <td className="py-3 px-3 font-semibold text-slate-700">{row.location || '—'}</td>
                                        <td className="py-3 px-3 font-semibold text-slate-700">{row.jobGrade || row.job_grade || row.grade || row.division || 'Grade 3 / Mid-Senior'}</td>
                                        <td className="py-3 px-3 text-slate-600 font-bold">{row.changeReason || row.change_reason || '—'}</td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                          <div className="flex items-center justify-end gap-1.5">
                                            {!isCurrent && !isViewOnlyMode && (
                                              <button
                                                onClick={async () => {
                                                  const updatedHistory = list.map(x => ({
                                                    ...x,
                                                    isActive: x.id === row.id
                                                  }));
                                                  setJobInformations(updatedHistory);

                                                  const targetDeptObj = departments.find((d: any) => d.name === row.department);
                                                  const effectiveDeptId = targetDeptObj?.id || emp.department_id || null;

                                                  await saveEmployeeDetails({
                                                    job_title: row.jobTitle,
                                                    department_name: row.department,
                                                    department_id: effectiveDeptId,
                                                    team_name: row.teams,
                                                    reporting_to: row.reportingTo,
                                                    manager_name: row.reportingTo,
                                                    job_informations: updatedHistory,
                                                    personal_info: {
                                                      ...(emp.personal_info || {}),
                                                      job_title: row.jobTitle,
                                                      department_name: row.department,
                                                      team_name: row.teams,
                                                      reporting_to: row.reportingTo,
                                                      manager_name: row.reportingTo,
                                                      location: row.location,
                                                      job_grade: row.jobGrade || row.division,
                                                      division: row.division || row.jobGrade
                                                    }
                                                  });

                                                  showCustomToast(`Activated "${row.jobTitle}" as current position`, 'success');
                                                }}
                                                className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-200 transition-all cursor-pointer"
                                                title="Set this history record as active in the system"
                                              >
                                                Set as Current
                                              </button>
                                            )}

                                            {!isViewOnlyMode && (
                                              <button
                                                onClick={async () => {
                                                  const updated = list.filter(x => x.id !== row.id);
                                                  setJobInformations(updated);
                                                  const newActive = getLatestJobInfo(updated);
                                                  const targetDeptObj = newActive ? departments.find((d: any) => d.name === newActive.department) : null;

                                                  await saveEmployeeDetails({ 
                                                    job_informations: updated,
                                                    ...(newActive ? {
                                                      job_title: newActive.jobTitle,
                                                      department_name: newActive.department,
                                                      department_id: targetDeptObj?.id || emp.department_id,
                                                      team_name: newActive.teams,
                                                      reporting_to: newActive.reportingTo,
                                                      manager_name: newActive.reportingTo
                                                    } : {})
                                                  });
                                                }}
                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                                title="Delete entry"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  });
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <DynamicLayoutSection 
                          tab="job" 
                          section="Job Information" 
                          employeeId={emp.id} 
                          key={`ji-${layoutTrigger}`} 
                        />
                      </div>

                      {/* 4. Compensation */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-[#1b5e20]" /> Compensation
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold">Track base compensation adjustments and rate histories</p>
                          </div>
                          {!isSalaryVisible ? (
                            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-xl border border-amber-200 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-600" /> Salary Hidden
                            </span>
                          ) : !isViewOnlyMode ? (
                            <button
                              onClick={() => {
                                setAddingComp(!addingComp);
                                setNewCompForm({
                                  date: new Date().toISOString().split('T')[0],
                                  paySchedule: 'Monthly',
                                  payType: 'Salary',
                                  payRate: (emp.salary_base || 75000).toString(),
                                  paidPer: 'Year',
                                  overtimeStatus: 'Exempt',
                                  changeReason: 'Promotion',
                                  comments: ''
                                });
                              }}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-[10px] font-bold uppercase rounded-xl border border-emerald-200 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              {addingComp ? 'Cancel' : 'Add Policy'}
                            </button>
                          ) : null}
                        </div>

                        {/* Inline Add Form */}
                        {addingComp && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-fadeIn">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                              <input
                                type="date"
                                value={newCompForm.date}
                                onChange={(e) => setNewCompForm({ ...newCompForm, date: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pay Schedule</label>
                              <select
                                value={newCompForm.paySchedule}
                                onChange={(e) => setNewCompForm({ ...newCompForm, paySchedule: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              >
                                <option>Monthly</option>
                                <option>Twice a month</option>
                                <option>Bi-weekly</option>
                                <option>Weekly</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pay Type</label>
                              <select
                                value={newCompForm.payType}
                                onChange={(e) => setNewCompForm({ ...newCompForm, payType: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              >
                                <option>Salary</option>
                                <option>Hourly</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pay Rate</label>
                              <input
                                type="number"
                                value={newCompForm.payRate}
                                onChange={(e) => setNewCompForm({ ...newCompForm, payRate: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Paid Per</label>
                              <select
                                value={newCompForm.paidPer}
                                onChange={(e) => setNewCompForm({ ...newCompForm, paidPer: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              >
                                <option>Year</option>
                                <option>Hour</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Overtime Status</label>
                              <select
                                value={newCompForm.overtimeStatus}
                                onChange={(e) => setNewCompForm({ ...newCompForm, overtimeStatus: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              >
                                <option>Exempt</option>
                                <option>Non-Exempt</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Change Reason</label>
                              <CustomAddableSelect
                                options={['Promotion', 'Demotion', 'Transfer', 'Market Adjustment', 'Merit Increase', 'New Hire']}
                                value={newCompForm.changeReason}
                                onChange={(val) => setNewCompForm({ ...newCompForm, changeReason: val })}
                                placeholder="Select Reason"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Comments</label>
                              <input
                                type="text"
                                value={newCompForm.comments}
                                onChange={(e) => setNewCompForm({ ...newCompForm, comments: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div className="col-span-2 md:col-span-4 flex justify-end">
                              <button
                                onClick={async () => {
                                  if (!newCompForm.date || !newCompForm.payRate) return alert('Please complete required fields');
                                  const newEntry = {
                                    id: Date.now(),
                                    date: newCompForm.date,
                                    paySchedule: newCompForm.paySchedule,
                                    payType: newCompForm.payType,
                                    payRate: parseFloat(newCompForm.payRate),
                                    paidPer: newCompForm.paidPer,
                                    overtimeStatus: newCompForm.overtimeStatus,
                                    changeReason: newCompForm.changeReason || 'Adjustment',
                                    comments: newCompForm.comments,
                                    isActive: false
                                  };
                                  const currentList = getSafeArrayField(compensations);
                                  const baseList = (currentList.length === 0 && (emp.salary_base || jobBaseSalary)) ? [{
                                    id: 'default-salary-base',
                                    date: emp.joined_at ? new Date(emp.joined_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                                    paySchedule: 'Monthly',
                                    payType: 'Salary',
                                    payRate: emp.salary_base || jobBaseSalary || 0,
                                    paidPer: 'Year',
                                    overtimeStatus: 'Exempt',
                                    changeReason: 'Initial Base Salary',
                                    comments: 'Hire Salary Policy',
                                    isActive: true
                                  }] : currentList;
                                  const updated = [newEntry, ...baseList];
                                  setCompensations(updated);
                                  setJobBaseSalary(parseFloat(newCompForm.payRate));
                                  await saveEmployeeDetails({ compensations: updated, salary_base: parseFloat(newCompForm.payRate) });
                                  setAddingComp(false);
                                }}
                                className="px-4 py-2 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-4 h-4" /> Save
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                <th className="pb-2">Compensation: Date</th>
                                <th className="pb-2">Pay Schedule</th>
                                <th className="pb-2">Pay type</th>
                                <th className="pb-2">Pay rate</th>
                                <th className="pb-2">Paid per</th>
                                <th className="pb-2">Overtime Status</th>
                                <th className="pb-2">Compensation Change Reason</th>
                                <th className="pb-2">Compensation comments</th>
                                <th className="pb-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {compensations.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 font-bold text-slate-500 flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${row.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                    {row.date}
                                  </td>
                                  <td className="py-2.5 font-bold text-slate-800">{row.paySchedule}</td>
                                  <td className="py-2.5 text-slate-600">{row.payType}</td>
                                  <td className="py-2.5 font-black text-[#1b5e20]">
                                    {!isSalaryVisible ? (
                                      <span className="font-mono text-slate-400">••••••••</span>
                                    ) : typeof row.payRate === 'number' ? (
                                      `£${row.payRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                    ) : (
                                      row.payRate || row.pay_rate || row.amount ? `£${(parseFloat(row.payRate || row.pay_rate || row.amount || 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'
                                    )}
                                  </td>
                                  <td className="py-2.5 text-slate-500 font-semibold">{row.paidPer}</td>
                                  <td className="py-2.5 text-slate-600">{row.overtimeStatus}</td>
                                  <td className="py-2.5 font-bold text-indigo-700">{row.changeReason}</td>
                                  <td className="py-2.5 text-slate-500 italic text-[11px]">{row.comments || '—'}</td>
                                  <td className="py-2.5 text-right">
                                    <button
                                      onClick={async () => {
                                        const updated = compensations.filter(x => x.id !== row.id);
                                        setCompensations(updated);
                                        await saveEmployeeDetails({ compensations: updated });
                                      }}
                                      className="text-rose-600 hover:text-rose-800 p-1 rounded-md cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <DynamicLayoutSection 
                          tab="job" 
                          section="Compensation History" 
                          employeeId={emp.id} 
                          key={`comp-${layoutTrigger}`} 
                        />
                      </div>

                      {/* 4.5. Key Performance Indicators (KPIs) Config */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <Target className="w-4 h-4 text-[#1b5e20]" /> Key Performance Indicators (KPIs)
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold">Define target KPI value, payout frequency, and payroll integration schedule</p>
                          </div>
                          {!isViewOnlyMode && (
                            <button
                              onClick={async () => {
                                const updatedPersonalInfo = {
                                  ...(emp.personal_info || {}),
                                  kpi_settings: {
                                    amount: jobKpiAmount,
                                    frequency: jobKpiFrequency,
                                    payout_mechanism: jobKpiPayoutMechanism,
                                    payout_date: jobKpiPayoutDate
                                  }
                                };
                                await saveEmployeeDetails({
                                  kpi_amount: jobKpiAmount,
                                  kpi_frequency: jobKpiFrequency,
                                  kpi_payout_mechanism: jobKpiPayoutMechanism,
                                  kpi_payout_date: jobKpiPayoutDate,
                                  personal_info: updatedPersonalInfo
                                });
                                showCustomToast('KPI configuration saved successfully!', 'success');
                              }}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-[10px] font-bold uppercase rounded-xl border border-emerald-200 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Save KPI Settings
                            </button>
                          )}
                        </div>

                        <fieldset disabled={isViewOnlyMode} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Target KPI Value (قيمة الـ KPIs)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">£</span>
                              {!isSalaryVisible ? (
                                <div className="w-full text-xs font-mono text-slate-400 p-2.5 pl-8 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-between select-none">
                                  <span className="tracking-widest">••••••••</span>
                                  <span className="text-[9px] text-slate-500 font-bold">Hidden</span>
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  value={jobKpiAmount || ''}
                                  onChange={(e) => setJobKpiAmount(parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-full text-xs font-bold text-slate-800 p-2.5 pl-8 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50"
                                />
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Payout Frequency (تكرار الصرف)
                            </label>
                            <select
                              value={jobKpiFrequency}
                              onChange={(e) => setJobKpiFrequency(e.target.value)}
                              className="w-full text-xs font-bold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50"
                            >
                              <option value="Monthly">Monthly (شهرياً)</option>
                              <option value="Quarterly">Quarterly (ربع سنوي)</option>
                              <option value="Semi-Annually">Semi-Annually (نصف سنوي)</option>
                              <option value="Annually">Annually (سنوياً)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Payout Mechanism (طريقة وتوقيت الصرف)
                            </label>
                            <select
                              value={jobKpiPayoutMechanism}
                              onChange={(e) => setJobKpiPayoutMechanism(e.target.value)}
                              className="w-full text-xs font-bold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50"
                            >
                              <option value="With Regular Payroll">With Monthly Payroll (مع المرتب الشهري)</option>
                              <option value="Separate Payment Date">Separate Payment Date (في موعد منفصل)</option>
                            </select>
                          </div>

                          {jobKpiPayoutMechanism === 'Separate Payment Date' && (
                            <div className="md:col-span-3">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Separate Payment Schedule (موعد الصرف المنفصل)
                              </label>
                              <input
                                type="text"
                                value={jobKpiPayoutDate}
                                onChange={(e) => setJobKpiPayoutDate(e.target.value)}
                                placeholder="e.g. 15th of month or End of Quarter (مثال: 15 من كل شهر أو نهاية الربع)"
                                className="w-full text-xs font-bold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50"
                              />
                            </div>
                          )}
                        </fieldset>

                        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 text-[#1b5e20] rounded-lg font-bold text-[10px]">
                              {jobKpiFrequency}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800">Payroll Integration: </span>
                              {jobKpiPayoutMechanism === 'With Regular Payroll' ? (
                                <span className="text-[#1b5e20] font-semibold">
                                  Linked with Payroll Breakdown KPIs field ({!isSalaryVisible ? '••••••••' : (jobKpiAmount || 0).toLocaleString()} EGP)
                                </span>
                              ) : (
                                <span className="text-amber-700 font-semibold">
                                  Paid separately outside monthly payroll ({jobKpiPayoutDate || 'Schedule pending'})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 5. Potential Bonus */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-[#1b5e20]" /> Potential Bonus
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold">Define percentage-based target bonuses</p>
                          </div>
                          {!isSalaryVisible ? (
                            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-xl border border-amber-200 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-600" /> Salary Hidden
                            </span>
                          ) : !isViewOnlyMode ? (
                            <button
                              onClick={async () => {
                                await saveEmployeeDetails({ potential_bonus: { percent: potentialBonusPercent, amount: potentialBonusAmount } });
                                showCustomToast('Potential bonus saved successfully!', 'success');
                              }}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-[10px] font-bold uppercase rounded-xl border border-emerald-200 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Save Potential Bonus
                            </button>
                          ) : null}
                        </div>
                        <fieldset disabled={isViewOnlyMode || !isSalaryVisible} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Annual Percentage</label>
                            <div className="relative">
                              {!isSalaryVisible ? (
                                <div className="w-full text-xs font-mono text-slate-400 p-2.5 pr-8 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-between select-none">
                                  <span className="tracking-widest">••••</span>
                                  <span className="text-[9px] text-slate-500 font-bold">Hidden</span>
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  value={isNaN(potentialBonusPercent) ? '' : potentialBonusPercent}
                                  min="0"
                                  max="100"
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setPotentialBonusPercent(val);
                                    const base = emp.salary_base || 75000;
                                    setPotentialBonusAmount(Math.round(base * (val / 100)).toString());
                                  }}
                                  className="w-full text-xs font-bold text-slate-800 p-2.5 pr-8 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50"
                                />
                              )}
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Annual Amount</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">£</span>
                              {!isSalaryVisible ? (
                                <div className="w-full text-xs font-mono text-slate-400 p-2.5 pl-8 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-between select-none">
                                  <span className="tracking-widest">••••••••</span>
                                  <span className="text-[9px] text-slate-500 font-bold">Hidden</span>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={parseFloat(potentialBonusAmount || '0').toLocaleString()}
                                  onChange={(e) => {
                                    const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                                    setPotentialBonusAmount(numericValue);
                                    const base = emp.salary_base || 75000;
                                    const numVal = parseFloat(numericValue) || 0;
                                    if (base > 0) {
                                      setPotentialBonusPercent(parseFloat(((numVal / base) * 100).toFixed(2)));
                                    }
                                  }}
                                  className="w-full text-xs font-bold text-slate-800 p-2.5 pl-8 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50"
                                />
                              )}
                            </div>
                          </div>
                        </fieldset>
                      </div>

                      {/* 6. Bonus */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <Award className="w-4 h-4 text-[#1b5e20]" /> Bonus
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold">Record discretionary and performance-based bonuses paid</p>
                          </div>
                          {!isSalaryVisible ? (
                            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-xl border border-amber-200 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-600" /> Salary Hidden
                            </span>
                          ) : !isViewOnlyMode ? (
                            <button
                              onClick={() => {
                                setAddingBonus(!addingBonus);
                                setNewBonusForm({
                                  date: new Date().toISOString().split('T')[0],
                                  amount: '',
                                  reason: 'Performance',
                                  comment: ''
                                });
                              }}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-[10px] font-bold uppercase rounded-xl border border-emerald-200 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              {addingBonus ? 'Cancel' : 'Add Policy'}
                            </button>
                          ) : null}
                        </div>

                        {/* Inline Add Form */}
                        {addingBonus && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3 text-xs animate-fadeIn">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                              <input
                                type="date"
                                value={newBonusForm.date}
                                onChange={(e) => setNewBonusForm({ ...newBonusForm, date: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount</label>
                              <input
                                type="number"
                                value={newBonusForm.amount}
                                onChange={(e) => setNewBonusForm({ ...newBonusForm, amount: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason</label>
                              <select
                                value={newBonusForm.reason}
                                onChange={(e) => setNewBonusForm({ ...newBonusForm, reason: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              >
                                <option>Performance</option>
                                <option>Sign-on</option>
                                <option>Referral</option>
                                <option>Annual</option>
                              </select>
                            </div>
                            <div className="flex items-end justify-between gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Comment</label>
                                <input
                                  type="text"
                                  value={newBonusForm.comment}
                                  placeholder="e.g. Charlotte exceeded expectations"
                                  onChange={(e) => setNewBonusForm({ ...newBonusForm, comment: e.target.value })}
                                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                />
                              </div>
                              <button
                                onClick={async () => {
                                  if (!newBonusForm.date || !newBonusForm.amount) return alert('Please complete required fields');
                                  const newEntry = {
                                    id: Date.now(),
                                    date: newBonusForm.date,
                                    amount: parseFloat(newBonusForm.amount),
                                    reason: newBonusForm.reason,
                                    comment: newBonusForm.comment || 'NA'
                                  };
                                  const updated = [newEntry, ...bonusesList];
                                  setBonusesList(updated);
                                  await saveEmployeeDetails({ bonuses_list: updated });
                                  setAddingBonus(false);
                                }}
                                className="p-2.5 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-lg font-bold cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                <th className="pb-2">Bonus: Date</th>
                                <th className="pb-2">Bonus: Amount</th>
                                <th className="pb-2">Bonus: Reason</th>
                                <th className="pb-2">Bonus: Comment</th>
                                <th className="pb-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {bonusesList.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 font-bold text-slate-500">{row.date || row.payoutDate || row.payout_date || '—'}</td>
                                  <td className="py-2.5 font-black text-emerald-600">
                                    {!isSalaryVisible ? (
                                      <span className="font-mono text-slate-400">••••••••</span>
                                    ) : (
                                      `£${Number(row.amount || row.payRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                    )}
                                  </td>
                                  <td className="py-2.5 font-bold text-indigo-700">{row.reason || row.title || row.bonus_type || '—'}</td>
                                  <td className="py-2.5 text-slate-600 font-medium">{row.comment || row.notes || '—'}</td>
                                  <td className="py-2.5 text-right">
                                    <button
                                      onClick={async () => {
                                        const updated = bonusesList.filter(x => x.id !== row.id);
                                        setBonusesList(updated);
                                        await saveEmployeeDetails({ bonuses_list: updated });
                                      }}
                                      className="text-rose-600 hover:text-rose-800 p-1 rounded-md cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 7. Commission */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <Coins className="w-4 h-4 text-[#1b5e20]" /> Commission
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold">Track sales performance commissions</p>
                          </div>
                          {!isViewOnlyMode && (
                            <button
                              onClick={() => {
                                setAddingCommission(!addingCommission);
                                setNewCommissionForm({
                                  date: new Date().toISOString().split('T')[0],
                                  amount: '',
                                  comment: ''
                                });
                              }}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-[10px] font-bold uppercase rounded-xl border border-emerald-200 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              {addingCommission ? 'Cancel' : 'Add Policy'}
                            </button>
                          )}
                        </div>

                        {/* Inline Add Form */}
                        {addingCommission && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-fadeIn">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                              <input
                                type="date"
                                value={newCommissionForm.date}
                                onChange={(e) => setNewCommissionForm({ ...newCommissionForm, date: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount</label>
                              <input
                                type="number"
                                value={newCommissionForm.amount}
                                onChange={(e) => setNewCommissionForm({ ...newCommissionForm, amount: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div className="flex items-end justify-between gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Comment</label>
                                <input
                                  type="text"
                                  value={newCommissionForm.comment}
                                  placeholder="e.g. Q3 Sales Goal Commission"
                                  onChange={(e) => setNewCommissionForm({ ...newCommissionForm, comment: e.target.value })}
                                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                />
                              </div>
                              <button
                                onClick={async () => {
                                  if (!newCommissionForm.date || !newCommissionForm.amount) return alert('Please complete required fields');
                                  const newEntry = {
                                    id: Date.now(),
                                    date: newCommissionForm.date,
                                    amount: parseFloat(newCommissionForm.amount),
                                    comment: newCommissionForm.comment || 'NA'
                                  };
                                  const updated = [newEntry, ...commissionsList];
                                  setCommissionsList(updated);
                                  await saveEmployeeDetails({ commissions_list: updated });
                                  setAddingCommission(false);
                                }}
                                className="p-2.5 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-lg font-bold cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Table / Empty State */}
                        {commissionsList.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400 font-medium">
                            No commission entries have been added.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                  <th className="pb-2">Commission: Date</th>
                                  <th className="pb-2">Commission: Amount</th>
                                  <th className="pb-2">Commission: Comment</th>
                                  <th className="pb-2 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {commissionsList.map((row) => (
                                  <tr key={row.id} className="hover:bg-slate-50/50">
                                    <td className="py-2.5 font-bold text-slate-500">{row.date || row.payout_date || '—'}</td>
                                    <td className="py-2.5 font-black text-emerald-600">£{Number(row.amount || row.commission_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5 text-slate-600 font-medium">{row.comment || row.notes || '—'}</td>
                                    <td className="py-2.5 text-right">
                                      <button
                                        onClick={async () => {
                                          const updated = commissionsList.filter(x => x.id !== row.id);
                                          setCommissionsList(updated);
                                          await saveEmployeeDetails({ commissions_list: updated });
                                        }}
                                        className="text-rose-600 hover:text-rose-800 p-1 rounded-md cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Penalty History & Issues Card */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-600" /> Penalty History & Issues
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold">Recorded deductions, warnings, and disciplinary notices</p>
                          </div>
                          {!isViewOnlyMode && (
                            <button
                              onClick={() => setShowEmpPenaltyForm(!showEmpPenaltyForm)}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold uppercase rounded-xl border border-rose-200 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              {showEmpPenaltyForm ? 'Cancel' : '+ Add Penalty Record '}
                            </button>
                          )}
                        </div>

                        <AnimatePresence>
                          {showEmpPenaltyForm && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3 overflow-hidden text-xs"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-rose-800 uppercase">Type</label>
                                  <select
                                    className="w-full text-xs font-bold p-2.5 bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    value={newEmpPenalty.type}
                                    onChange={e => setNewEmpPenalty({ ...newEmpPenalty, type: e.target.value })}
                                  >
                                    <option value="Deduction">Deduction</option>
                                    <option value="Warning">Warning</option>
                                    <option value="Suspension">Suspension</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-rose-800 uppercase">Amount (EGP)</label>
                                  <input
                                    type="number"
                                    className="w-full text-xs font-bold p-2.5 bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    value={isNaN(newEmpPenalty.amount) ? '' : newEmpPenalty.amount}
                                    onChange={e => setNewEmpPenalty({ ...newEmpPenalty, amount: parseFloat(e.target.value) || 0 })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-rose-800 uppercase">Date</label>
                                  <input
                                    type="date"
                                    className="w-full text-xs font-bold p-2.5 bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    value={newEmpPenalty.date}
                                    onChange={e => setNewEmpPenalty({ ...newEmpPenalty, date: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-rose-800 uppercase">Reason</label>
                                <textarea
                                  className="w-full text-xs font-bold p-2.5 bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                                  placeholder="Describe the issue or reason for penalty..."
                                  rows={2}
                                  value={newEmpPenalty.reason}
                                  onChange={e => setNewEmpPenalty({ ...newEmpPenalty, reason: e.target.value })}
                                />
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setShowEmpPenaltyForm(false)}
                                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!newEmpPenalty.reason) {
                                      alert('Please enter a reason for the penalty');
                                      return;
                                    }
                                    const record = { ...newEmpPenalty, id: Date.now() };
                                    const currentPenalties = getSafeArrayField(emp.penalty_history);
                                    const updatedPenalties = [record, ...currentPenalties];
                                    await saveEmployeeDetails({ penalty_history: updatedPenalties });
                                    setNewEmpPenalty({ type: 'Deduction', amount: 0, reason: '', date: new Date().toISOString().split('T')[0] });
                                    setShowEmpPenaltyForm(false);
                                  }}
                                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer shadow-sm"
                                >
                                  Save Record
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {(() => {
                          const penaltyList = getSafeArrayField(emp.penalty_history);
                          if (penaltyList.length === 0) {
                            return (
                              <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center">
                                <p className="text-xs text-slate-400 font-medium">No penalty or disciplinary records found for this employee</p>
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-2">
                              {penaltyList.map((p: any, i: number) => (
                                <div key={p.id || i} className="p-3 bg-rose-50/60 border border-rose-100 rounded-2xl flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] font-black text-rose-900 uppercase tracking-tight flex items-center gap-1.5">
                                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[9px] font-bold">{p.type}</span>
                                      <span>{p.date ? new Date(p.date).toLocaleDateString() : ''}</span>
                                    </p>
                                    <p className="text-xs text-rose-700 font-medium mt-1">{p.reason}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-rose-600 bg-rose-100/80 px-2.5 py-1 rounded-lg">-{p.amount || 0} EGP</span>
                                    <button
                                      onClick={async () => {
                                        if (confirm('Are you sure you want to delete this penalty record?')) {
                                          const updatedPenalties = penaltyList.filter((item: any, idx: number) => (item.id ? item.id !== p.id : idx !== i));
                                          await saveEmployeeDetails({ penalty_history: updatedPenalties });
                                        }
                                      }}
                                      className="text-rose-500 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-100/50 transition-colors cursor-pointer"
                                      title="Delete Penalty Record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* 8. Equity */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-[#1b5e20]" /> Equity Grants
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold">Track stock options and share grant vestings</p>
                          </div>
                          {!isViewOnlyMode && (
                            <button
                              onClick={() => {
                                setAddingEquity(!addingEquity);
                                setNewEquityForm({
                                  grantType: 'ISO',
                                  customName: 'Employee Stock Options',
                                  grantDate: new Date().toISOString().split('T')[0],
                                  vestingStart: new Date().toISOString().split('T')[0],
                                  granted: '2500',
                                  strikePrice: '2.75',
                                  schedule: 'Monthly',
                                  vestingMonths: '48',
                                  cliffMonths: '12'
                                });
                              }}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-[10px] font-bold uppercase rounded-xl border border-emerald-200 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              {addingEquity ? 'Cancel' : 'Add Policy'}
                            </button>
                          )}
                        </div>

                        {/* Inline Add Form */}
                        {addingEquity && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-fadeIn">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grant Type</label>
                              <select
                                value={newEquityForm.grantType}
                                onChange={(e) => setNewEquityForm({ ...newEquityForm, grantType: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              >
                                <option>ISO</option>
                                <option>RSU</option>
                                <option>NSO</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custom Name</label>
                              <input
                                type="text"
                                value={newEquityForm.customName}
                                onChange={(e) => setNewEquityForm({ ...newEquityForm, customName: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grant Date</label>
                              <input
                                type="date"
                                value={newEquityForm.grantDate}
                                onChange={(e) => setNewEquityForm({ ...newEquityForm, grantDate: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vesting Start Date</label>
                              <input
                                type="date"
                                value={newEquityForm.vestingStart}
                                onChange={(e) => setNewEquityForm({ ...newEquityForm, vestingStart: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1"># Granted</label>
                              <input
                                type="number"
                                value={newEquityForm.granted}
                                onChange={(e) => setNewEquityForm({ ...newEquityForm, granted: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Strike Price</label>
                              <input
                                type="text"
                                value={newEquityForm.strikePrice}
                                onChange={(e) => setNewEquityForm({ ...newEquityForm, strikePrice: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vesting Schedule</label>
                              <select
                                value={newEquityForm.schedule}
                                onChange={(e) => setNewEquityForm({ ...newEquityForm, schedule: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              >
                                <option>Monthly</option>
                                <option>Quarterly</option>
                                <option>Annually</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vesting / Cliff Mos</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  placeholder="Vest"
                                  value={newEquityForm.vestingMonths}
                                  onChange={(e) => setNewEquityForm({ ...newEquityForm, vestingMonths: e.target.value })}
                                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                />
                                <input
                                  type="number"
                                  placeholder="Cliff"
                                  value={newEquityForm.cliffMonths}
                                  onChange={(e) => setNewEquityForm({ ...newEquityForm, cliffMonths: e.target.value })}
                                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                />
                              </div>
                            </div>
                            <div className="col-span-2 md:col-span-4 flex justify-end">
                              <button
                                onClick={async () => {
                                  if (!newEquityForm.grantDate || !newEquityForm.granted) return alert('Please complete required fields');
                                  const newEntry = {
                                    id: Date.now(),
                                    grantType: newEquityForm.grantType,
                                    customName: newEquityForm.customName,
                                    grantDate: newEquityForm.grantDate,
                                    vestingStart: newEquityForm.vestingStart,
                                    granted: parseInt(newEquityForm.granted) || 0,
                                    strikePrice: newEquityForm.strikePrice ? (newEquityForm.strikePrice.startsWith('$') ? newEquityForm.strikePrice : `$${newEquityForm.strikePrice}`) : '—',
                                    schedule: newEquityForm.schedule,
                                    vestingMonths: parseInt(newEquityForm.vestingMonths) || 48,
                                    cliffMonths: parseInt(newEquityForm.cliffMonths) || 12
                                  };
                                  const updated = [newEntry, ...equitiesList];
                                  setEquitiesList(updated);
                                  await saveEmployeeDetails({ equities_list: updated });
                                  setAddingEquity(false);
                                }}
                                className="px-4 py-2 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-4 h-4" /> Save Equity
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                <th className="pb-2">Equity: Grant Type</th>
                                <th className="pb-2">Equity: Custom Grant Type Name</th>
                                <th className="pb-2">Equity: Grant Date</th>
                                <th className="pb-2">Equity: Vesting Start Date</th>
                                <th className="pb-2">Equity: # of Equity Granted</th>
                                <th className="pb-2">Equity: Strike Price</th>
                                <th className="pb-2">Equity: Vesting Schedule</th>
                                <th className="pb-2">Equity: Vesting Months</th>
                                <th className="pb-2">Equity: Cliff Months</th>
                                <th className="pb-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {equitiesList.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 font-bold text-slate-500">{row.grantType || row.equity_type || row.type || '—'}</td>
                                  <td className="py-2.5 font-bold text-slate-800">{row.customName || row.notes || '—'}</td>
                                  <td className="py-2.5 font-bold text-slate-500">{row.grantDate || row.grant_date || '—'}</td>
                                  <td className="py-2.5 font-bold text-slate-500">{row.vestingStart || row.grant_date || '—'}</td>
                                  <td className="py-2.5 font-black text-[#1b5e20]">{Number(row.granted || row.total_units || row.units || 0).toLocaleString()}</td>
                                  <td className="py-2.5 text-slate-600 font-bold">{row.strikePrice || '—'}</td>
                                  <td className="py-2.5 text-indigo-700 font-bold">{row.schedule || row.vesting_schedule || row.vesting || '—'}</td>
                                  <td className="py-2.5 text-slate-500 font-bold text-center">{row.vestingMonths}</td>
                                  <td className="py-2.5 text-slate-500 font-bold text-center">{row.cliffMonths}</td>
                                  <td className="py-2.5 text-right">
                                    <button
                                      onClick={async () => {
                                        const updated = equitiesList.filter(x => x.id !== row.id);
                                        setEquitiesList(updated);
                                        await saveEmployeeDetails({ equities_list: updated });
                                      }}
                                      className="text-rose-600 hover:text-rose-800 p-1 rounded-md cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 9. Shift Differential Allowance */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-[#1b5e20]" /> UK: Shift Differential Allowance
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold">Track allowances for irregular working patterns</p>
                          </div>
                          {!isViewOnlyMode && (
                            <button
                              onClick={() => {
                                setAddingShiftAllowance(!addingShiftAllowance);
                                setNewShiftForm({
                                  allowance: 'Night Shift Differential Allowance - 15%',
                                  startDate: new Date().toISOString().split('T')[0],
                                  endDate: ''
                                });
                              }}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-[10px] font-bold uppercase rounded-xl border border-emerald-200 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              {addingShiftAllowance ? 'Cancel' : 'Add Policy'}
                            </button>
                          )}
                        </div>

                        {/* Inline Add Form */}
                        {addingShiftAllowance && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-fadeIn">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shift Differential Allowance</label>
                              <input
                                type="text"
                                value={newShiftForm.allowance}
                                onChange={(e) => setNewShiftForm({ ...newShiftForm, allowance: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</label>
                              <input
                                type="date"
                                value={newShiftForm.startDate}
                                onChange={(e) => setNewShiftForm({ ...newShiftForm, startDate: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                              />
                            </div>
                            <div className="flex items-end justify-between gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</label>
                                <input
                                  type="date"
                                  value={newShiftForm.endDate}
                                  onChange={(e) => setNewShiftForm({ ...newShiftForm, endDate: e.target.value })}
                                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                />
                              </div>
                              <button
                                onClick={async () => {
                                  if (!newShiftForm.allowance || !newShiftForm.startDate) return alert('Please complete required fields');
                                  const newEntry = {
                                    id: Date.now(),
                                    allowance: newShiftForm.allowance,
                                    startDate: newShiftForm.startDate,
                                    endDate: newShiftForm.endDate || '—'
                                  };
                                  const updated = [newEntry, ...shiftAllowancesList];
                                  setShiftAllowancesList(updated);
                                  await saveEmployeeDetails({ shift_allowances_list: updated });
                                  setAddingShiftAllowance(false);
                                }}
                                className="p-2.5 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-lg font-bold cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Table / Empty State */}
                        {shiftAllowancesList.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400 font-medium">
                            No shift differential allowance entries have been added.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                  <th className="pb-2">Shift Differential Allowance</th>
                                  <th className="pb-2">Differential Allowance Start Date</th>
                                  <th className="pb-2">Differential Allowance End Date</th>
                                  <th className="pb-2 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {shiftAllowancesList.map((row) => (
                                  <tr key={row.id} className="hover:bg-slate-50/50">
                                    <td className="py-2.5 font-bold text-slate-800">{row.allowance}</td>
                                    <td className="py-2.5 font-bold text-slate-500">{row.startDate}</td>
                                    <td className="py-2.5 text-slate-500 font-bold">{row.endDate}</td>
                                    <td className="py-2.5 text-right">
                                      <button
                                        onClick={async () => {
                                          const updated = shiftAllowancesList.filter(x => x.id !== row.id);
                                          setShiftAllowancesList(updated);
                                          await saveEmployeeDetails({ shift_allowances_list: updated });
                                        }}
                                        className="text-rose-600 hover:text-rose-800 p-1 rounded-md cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
  );
};

export default JobTab;
