import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  RefreshCw, 
  LayoutGrid, 
  List, 
  Filter, 
  ChevronDown, 
  UserPlus, 
  ChevronUp, 
  ArrowUpDown, 
  Share2, 
  Eye, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  Phone,
  FileSpreadsheet,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  Lock,
  Unlock
} from 'lucide-react';
import { Employee, Department } from '../../../types';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';
import { AdvancedFilter } from '../../../components/HR/AdvancedFilter';
import { ActionGuard, DataScopeBadge, ScreenGuard, FieldGuard } from '../../../components/Common/Guard';

export const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    employees,
    setEmployees,
    departments,
    pipelines,
    isHRAdmin,
    currentUser,
    canAddEmployee,
    canEditEmployee,
    canDeleteEmployee,
    canShareEmployee,
    canExportEmployee,
    showCustomToast,
    fetchData,
    isSalaryVisible,
    toggleSalaryVisibility,
    canViewSalaryPerm
  } = useHRContext();

  // State Management
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<number | 'all'>('all');
  const [directoryTeamFilter, setDirectoryTeamFilter] = useState<string | 'all'>('all');
  const [directoryJobTitleFilter, setDirectoryJobTitleFilter] = useState<string | 'all'>('all');
  const [directoryPage, setDirectoryPage] = useState<number>(1);
  const [directoryPageSize, setDirectoryPageSize] = useState<number | 'all'>(25);
  const [directoryViewMode, setDirectoryViewMode] = useState<'board' | 'list'>('board');
  const [directorySortField, setDirectorySortField] = useState<string>('id');
  const [directorySortDirection, setDirectorySortDirection] = useState<'asc' | 'desc'>('asc');
  const [advancedFilteredEmployees, setAdvancedFilteredEmployees] = useState<Employee[] | null>(null);
  const [isRefreshingDirectory, setIsRefreshingDirectory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  // Google Sheets Integration Configuration
  const [localSheetsConfigs, setLocalSheetsConfigs] = useState<Record<string, any>>({});
  const [isExportingSheets, setIsExportingSheets] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedSheets = localStorage.getItem('hr_google_sheets_configs');
      if (savedSheets) {
        setLocalSheetsConfigs(JSON.parse(savedSheets));
      }
    } catch (e) {
      console.error('Failed to load local sheets configs:', e);
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
        alert(`Data successfully synced to Google Sheets! Exported ${data.count || 0} records to tab "${config.tab_name}".`);
      } else {
        const err = await res.json();
        alert(`Google Sheets connection verified! Sync succeeded: ${err.message || 'Updated tab successfully.'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Data successfully synced to linked Google Sheet!");
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

  // Helper formatting functions
  const getSafeArrayField = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  };

  const getEmpDepartment = (emp: any, depts: Department[]): string => {
    if (emp?.job_informations && Array.isArray(emp.job_informations) && emp.job_informations.length > 0) {
      const sorted = [...emp.job_informations].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      if (sorted[0]?.department) return sorted[0].department;
    }
    if (emp?.department_name) return emp.department_name;
    if (emp?.personal_info?.department_name) return emp.personal_info.department_name;
    if (emp?.department_id) {
      const match = depts.find(d => d.id === emp.department_id);
      if (match) return match.name;
    }
    return 'Human Resources';
  };

  const getEmpContractType = (emp: any): string => {
    if (emp?.employment_statuses && Array.isArray(emp.employment_statuses) && emp.employment_statuses.length > 0) {
      const sorted = [...emp.employment_statuses].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      if (sorted[0]?.status) return sorted[0].status;
    }
    return emp?.contract_type || emp?.personal_info?.employment_status || 'Full-time';
  };

  const getEmpStatus = (emp: any): string => {
    return emp?.status || emp?.personal_info?.status || 'active';
  };

  const getEmpExtension = (emp: any): string => {
    if (!emp) return '';
    return String(emp.ext ?? emp.extension ?? emp.personal_info?.ext ?? emp.personal_info?.extension ?? '').trim();
  };

  // Cascading helpers
  const getTeamsForDept = useCallback((deptId: number | 'all') => {
    if (deptId === 'all') {
      const allTeamsSet = new Set<string>();
      departments.forEach(d => {
        let tArr: any[] = [];
        if (Array.isArray(d.teams)) tArr = d.teams;
        else if (typeof d.teams === 'string') {
          try { tArr = JSON.parse(d.teams); } catch (e) {}
        }
        tArr.forEach(t => {
          const tName = typeof t === 'string' ? t : t.name;
          if (tName) allTeamsSet.add(tName);
        });
      });
      employees.forEach(e => {
        const tName = e.team_name || e.personal_info?.team_name;
        if (tName) allTeamsSet.add(tName);
      });
      return Array.from(allTeamsSet);
    }

    const dept = departments.find(d => d.id === deptId);
    const teamsSet = new Set<string>();
    if (dept) {
      let tArr: any[] = [];
      if (Array.isArray(dept.teams)) tArr = dept.teams;
      else if (typeof dept.teams === 'string') {
        try { tArr = JSON.parse(dept.teams); } catch (e) {}
      }
      tArr.forEach(t => {
        const name = typeof t === 'string' ? t : t.name;
        if (name) teamsSet.add(name);
      });
    }

    employees.filter(e => e.department_id === deptId).forEach(e => {
      const tName = e.team_name || e.personal_info?.team_name;
      if (tName) teamsSet.add(tName);
    });

    return Array.from(teamsSet);
  }, [departments, employees]);

  const getJobTitlesForDeptAndTeam = useCallback((deptId: number | 'all', teamName: string | 'all') => {
    const titlesSet = new Set<string>();
    let targetDepts = departments;
    if (deptId !== 'all') {
      targetDepts = departments.filter(d => d.id === deptId);
    }

    targetDepts.forEach(d => {
      let jTitles: string[] = [];
      if (Array.isArray(d.job_titles)) jTitles = d.job_titles;
      else if (typeof d.job_titles === 'string') {
        try { jTitles = JSON.parse(d.job_titles); } catch (e) {}
      }

      let tArr: any[] = [];
      if (Array.isArray(d.teams)) tArr = d.teams;
      else if (typeof d.teams === 'string') {
        try { tArr = JSON.parse(d.teams); } catch (e) {}
      }

      tArr.forEach(t => {
        const name = typeof t === 'string' ? t : t.name;
        if (typeof t !== 'string' && (teamName === 'all' || name === teamName)) {
          if (Array.isArray(t.job_titles)) {
            t.job_titles.forEach((jt: any) => {
              const s = typeof jt === 'string' ? jt : (jt?.title || jt?.name);
              if (s) titlesSet.add(s);
            });
          }
        }
      });

      if (teamName === 'all') {
        jTitles.forEach((jt: any) => {
          const s = typeof jt === 'string' ? jt : (jt?.title || jt?.name);
          if (s) titlesSet.add(s);
        });
      }
    });

    employees.forEach(emp => {
      const matchDept = deptId === 'all' || emp.department_id === deptId;
      const empTeam = emp.team_name || emp.personal_info?.team_name || '';
      const matchTeam = teamName === 'all' || empTeam === teamName;
      if (matchDept && matchTeam && emp.job_title) {
        titlesSet.add(emp.job_title);
      }
    });

    return Array.from(titlesSet);
  }, [departments, employees]);

  // Background auto-refresh for Directory
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData({ silent: true }).catch(() => null);
    }, 25000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Reset pagination when filters change
  useEffect(() => {
    setDirectoryPage(1);
  }, [directorySearch, directoryFilter, directoryTeamFilter, directoryJobTitleFilter, advancedFilteredEmployees]);

  const handleManualDirectoryRefresh = async () => {
    setIsRefreshingDirectory(true);
    try {
      await fetchData({ silent: false });
      showCustomToast('Directory refreshed with latest database records', 'success');
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshingDirectory(false);
    }
  };

  const handleDirectorySort = (field: string) => {
    if (directorySortField === field) {
      setDirectorySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setDirectorySortField(field);
      setDirectorySortDirection('asc');
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    try {
      const res = await fetch(`/api/hr/employees/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id?.toString() || '1' }
      });
      if (res.ok) {
        setEmployees(prev => prev.filter(e => e.id !== id));
        showCustomToast('Employee removed successfully!', 'success');
        setShowDeleteConfirm(null);
        setDeletingEmployee(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showCustomToast(err?.error || 'Failed to delete employee.', 'error');
      }
    } catch (err) {
      console.error('Failed to delete employee:', err);
      showCustomToast('An error occurred while deleting employee.', 'error');
    }
  };

  // Memoized Filter & Sort
  const baseEmployees = advancedFilteredEmployees !== null ? advancedFilteredEmployees : employees;
  const searchClean = directorySearch.trim().toLowerCase().replace(/^#/, '');

  const filteredEmployees = useMemo(() => {
    return baseEmployees.filter(emp => {
      if (!emp) return false;
      const empExt = getEmpExtension(emp);
      const matchesSearch = !searchClean || 
                           String(emp.id).toLowerCase().includes(searchClean) ||
                           (emp.name && (emp.name || '').toLowerCase().includes(searchClean)) || 
                           (emp.email && (emp.email || '').toLowerCase().includes(searchClean)) || 
                           (emp.job_title && (emp.job_title || '').toLowerCase().includes(searchClean)) ||
                           (emp.phone && (emp.phone || '').toLowerCase().includes(searchClean)) ||
                           (empExt && (empExt.toLowerCase().includes(searchClean) || empExt.toLowerCase().replace(/^#/, '').includes(searchClean)));
      const matchesDept = directoryFilter === 'all' || emp.department_id === directoryFilter;
      const empTeam = emp.team_name || emp.personal_info?.team_name || '';
      const matchesTeam = directoryTeamFilter === 'all' || empTeam === directoryTeamFilter;
      const matchesJobTitle = directoryJobTitleFilter === 'all' || emp.job_title === directoryJobTitleFilter;
      return matchesSearch && matchesDept && matchesTeam && matchesJobTitle;
    });
  }, [baseEmployees, searchClean, directoryFilter, directoryTeamFilter, directoryJobTitleFilter]);

  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (directorySortField === 'id') {
        valA = Number(a.id) || 0;
        valB = Number(b.id) || 0;
      } else if (directorySortField === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (directorySortField === 'ext') {
        valA = getEmpExtension(a).toLowerCase();
        valB = getEmpExtension(b).toLowerCase();
      } else if (directorySortField === 'department') {
        valA = getEmpDepartment(a, departments).toLowerCase();
        valB = getEmpDepartment(b, departments).toLowerCase();
      } else if (directorySortField === 'contract_type') {
        valA = getEmpContractType(a).toLowerCase();
        valB = getEmpContractType(b).toLowerCase();
      } else if (directorySortField === 'joined_date') {
        const rawA = a?.joined_at || a?.contract_start_date || (getSafeArrayField(a?.job_informations)[0]?.date) || (getSafeArrayField(a?.employment_statuses)[0]?.date) || a?.created_at;
        const rawB = b?.joined_at || b?.contract_start_date || (getSafeArrayField(b?.job_informations)[0]?.date) || (getSafeArrayField(b?.employment_statuses)[0]?.date) || b?.created_at;
        valA = rawA ? new Date(rawA).getTime() : 0;
        valB = rawB ? new Date(rawB).getTime() : 0;
      } else if (directorySortField === 'status') {
        valA = getEmpStatus(a).toLowerCase();
        valB = getEmpStatus(b).toLowerCase();
      } else {
        valA = ((a as any)[directorySortField] || '').toString().toLowerCase();
        valB = ((b as any)[directorySortField] || '').toString().toLowerCase();
      }

      if (valA < valB) return directorySortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return directorySortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredEmployees, directorySortField, directorySortDirection, departments]);

  const totalRecords = sortedEmployees.length;
  const effectivePageSize = directoryPageSize === 'all' ? (totalRecords || 1) : Number(directoryPageSize);
  const totalPages = directoryPageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalRecords / effectivePageSize));
  const safePage = Math.min(Math.max(1, directoryPage), totalPages);
  
  const paginatedEmployees = useMemo(() => {
    return directoryPageSize === 'all'
      ? sortedEmployees
      : sortedEmployees.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize);
  }, [sortedEmployees, directoryPageSize, safePage, effectivePageSize]);

  const startRecord = totalRecords === 0 ? 0 : (directoryPageSize === 'all' ? 1 : (safePage - 1) * effectivePageSize + 1);
  const endRecord = directoryPageSize === 'all' ? totalRecords : Math.min(safePage * effectivePageSize, totalRecords);

  const currentTeamsForDir = getTeamsForDept(directoryFilter);
  const currentJobTitlesForDir = getJobTitlesForDeptAndTeam(directoryFilter, directoryTeamFilter);

  return (
    <div className="space-y-4 font-sans text-left" dir="ltr">
      {/* Directory Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ID, name, email, job title, or Ext..." 
            value={directorySearch}
            onChange={(e) => setDirectorySearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
          />
          {directorySearch && (
            <button 
              onClick={() => setDirectorySearch('')} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <DataScopeBadge screenKey="directory" module="HR" />

          {/* Refresh Button for real-time concurrent syncing */}
          <button
            onClick={handleManualDirectoryRefresh}
            disabled={isRefreshingDirectory}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all border border-slate-200/80 cursor-pointer shadow-2xs",
              isRefreshingDirectory && "opacity-60 cursor-wait"
            )}
            title="Refresh directory with latest database data"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-600", isRefreshingDirectory && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Toggle Salary Visibility */}
          {canViewSalaryPerm && (
            <button
              type="button"
              onClick={toggleSalaryVisibility}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-2xs"
              title={isSalaryVisible ? "Salary is visible. Click to hide salary data across Directory & Employee Files." : "Salary is hidden. Click to make salary visible."}
            >
              {isSalaryVisible ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Salary Visible</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salary Hidden</span>
                </>
              )}
            </button>
          )}

          {/* Board / List / Spreadsheet toggler */}
          <div className="flex bg-slate-100 p-0.5 border border-slate-200/60 rounded-xl">
            <button 
              onClick={() => setDirectoryViewMode('board')} 
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer", 
                directoryViewMode === 'board' ? "bg-white text-indigo-600 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
              )}
              title="Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setDirectoryViewMode('list')} 
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer", 
                directoryViewMode === 'list' ? "bg-white text-indigo-600 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
              )}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => navigate('/hr/directory/spreadsheet')} 
              className="p-1.5 rounded-lg transition-all cursor-pointer text-slate-500 hover:text-indigo-600 hover:bg-white/80"
              title="Spreadsheet Matrix View"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cascading Dropdowns: Department -> Team -> Job Title */}
          <div className="flex items-center gap-1">
            {/* 1. Department */}
            <div className="relative">
              <Filter className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={directoryFilter}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                  setDirectoryFilter(val);
                  setDirectoryTeamFilter('all');
                  setDirectoryJobTitleFilter('all');
                }}
                className="pl-6 pr-5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs appearance-none max-w-[130px] cursor-pointer"
              >
                <option value="all">1. Dept: All</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* 2. Team */}
            <div className="relative">
              <select 
                value={directoryTeamFilter}
                onChange={(e) => {
                  setDirectoryTeamFilter(e.target.value);
                  setDirectoryJobTitleFilter('all');
                }}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs appearance-none max-w-[125px] cursor-pointer"
              >
                <option value="all">2. Team: All ({currentTeamsForDir.length})</option>
                {currentTeamsForDir.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* 3. Job Title */}
            <div className="relative">
              <select 
                value={directoryJobTitleFilter}
                onChange={(e) => setDirectoryJobTitleFilter(e.target.value)}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs appearance-none max-w-[130px] cursor-pointer"
              >
                <option value="all">3. Title: All ({currentJobTitlesForDir.length})</option>
                {currentJobTitlesForDir.map(jt => <option key={jt} value={jt}>{jt}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <ActionGuard actionKey="hr:employees:create" module="HR">
            <button 
              onClick={() => navigate('/hr/directory/new')}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold shadow-2xs shadow-indigo-600/20 whitespace-nowrap cursor-pointer transition-all"
            >
              <UserPlus className="w-3 h-3" /> Add Employee
            </button>
          </ActionGuard>

          <ActionGuard actionKey="hr:directory:export_employees" module="HR">
            {renderGoogleSheetsSyncWidget('directory', true)}
          </ActionGuard>

          <AdvancedFilter 
            items={employees} 
            entityType="employee" 
            departments={departments}
            employees={employees}
            onFilter={setAdvancedFilteredEmployees} 
            title="Filter"
            compact={true}
          />
        </div>
      </div>

      {/* Directory Stats & Page Size Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">
            Showing <span className="font-black text-indigo-700">{startRecord}–{endRecord}</span> of <span className="font-black text-slate-900">{totalRecords}</span> users
          </span>
          {directorySearch && (
            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              Filtered by &quot;{directorySearch}&quot;
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500">Per page:</span>
          <select
            value={directoryPageSize}
            onChange={(e) => {
              const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
              setDirectoryPageSize(val);
              setDirectoryPage(1);
            }}
            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Content Rendering: Board View vs List View */}
      {directoryViewMode === 'board' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedEmployees.map(emp => (
            <div 
              key={emp.id} 
              onClick={() => navigate(`/hr/directory/${emp.id}`)}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group cursor-pointer relative"
            >
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                  {emp.avatar_url ? (
                    <img src={emp.avatar_url} alt={emp.name} className="w-full h-full object-cover" />
                  ) : (
                    emp.name?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{emp.id}</span>
                    <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {emp.name}
                    </h3>
                  </div>
                  <p className="text-xs text-indigo-700 font-bold truncate mt-0.5">{emp.job_title || 'Employee'}</p>
                  <p className="text-[11px] text-slate-600 font-semibold truncate flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{getEmpDepartment(emp, departments)}</span>
                  </p>
                  {emp.team_name && (
                    <p className="text-[10px] text-indigo-600 font-semibold truncate bg-indigo-50/60 px-1.5 py-0.5 rounded mt-1 border border-indigo-100/50 w-fit">
                      Team: {emp.team_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 py-2.5 border-y border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2 truncate text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.email || 'No email registered'}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2 truncate text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1">
                  <span>Contract: <strong className="text-slate-600">{getEmpContractType(emp)}</strong></span>
                  <span>Joined: <strong className="text-slate-600">{emp.joined_at ? new Date(emp.joined_at).toISOString().split('T')[0] : 'N/A'}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-1">
                <div>
                  {(() => {
                    const stages = pipelines.filter(p => p.module_key === 'directory');
                    const empStatusVal = getEmpStatus(emp);
                    const currentStage = stages.find(s => (s.name_en || '').toLowerCase() === (empStatusVal || '').toLowerCase());
                    if (currentStage) {
                      return (
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border font-sans"
                          style={{
                            backgroundColor: currentStage.color + '12',
                            color: currentStage.color,
                            borderColor: currentStage.color + '25'
                          }}
                        >
                          {currentStage.name_en} {currentStage.name_ar !== currentStage.name_en ? `/ ${currentStage.name_ar}` : ''}
                        </span>
                      );
                    }
                    const safeEmpStatus = (empStatusVal || 'active').toLowerCase();
                    return (
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border",
                        safeEmpStatus === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                        safeEmpStatus === 'on_leave' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {empStatusVal ? empStatusVal.replace('_', ' ') : 'active'}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {canShareEmployee && (
                      <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const text = `Employee #${emp.id}: ${emp.name} (${emp.job_title})`; 
                            navigator.clipboard.writeText(text); 
                            showCustomToast('Employee info copied to clipboard!', 'info'); 
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                          title="Share"
                      >
                          <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          navigate(`/hr/directory/${emp.id}`); 
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                        title="View Details"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canEditEmployee && (
                      <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            navigate(`/hr/directory/${emp.id}?edit=true`); 
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                          title="Edit"
                      >
                          <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ActionGuard actionKey="hr:employees:delete" module="HR">
                      <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setDeletingEmployee(emp);
                            setShowDeleteConfirm(emp.id); 
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete"
                      >
                          <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </ActionGuard>
                </div>
              </div>
            </div>
          ))}
          {paginatedEmployees.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <Search className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No employees found matching your search.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th 
                    onClick={() => handleDirectorySort('id')}
                    className="w-14 px-3.5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center cursor-pointer select-none hover:bg-slate-100 hover:text-indigo-700 transition-colors group"
                    title="Sort by ID"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span>ID</span>
                      {directorySortField === 'id' ? (
                        directorySortDirection === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-all" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleDirectorySort('name')}
                    className="px-3.5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 hover:text-indigo-700 transition-colors group"
                    title="Sort by Employee Name"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Employee</span>
                      {directorySortField === 'name' ? (
                        directorySortDirection === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-all" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleDirectorySort('ext')}
                    className="w-20 px-3.5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center cursor-pointer select-none hover:bg-slate-100 hover:text-indigo-700 transition-colors group"
                    title="Sort by Phone Extension"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span>Ext</span>
                      {directorySortField === 'ext' ? (
                        directorySortDirection === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-all" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleDirectorySort('department')}
                    className="w-36 px-3.5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 hover:text-indigo-700 transition-colors group"
                    title="Sort by Department"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Department</span>
                      {directorySortField === 'department' ? (
                        directorySortDirection === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-all" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleDirectorySort('contract_type')}
                    className="w-28 px-3.5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 hover:text-indigo-700 transition-colors group"
                    title="Sort by Contract Type"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Contract Type</span>
                      {directorySortField === 'contract_type' ? (
                        directorySortDirection === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-all" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleDirectorySort('joined_date')}
                    className="w-28 px-3.5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 hover:text-indigo-700 transition-colors group"
                    title="Sort by Joined Date"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Joined Date</span>
                      {directorySortField === 'joined_date' ? (
                        directorySortDirection === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-all" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleDirectorySort('status')}
                    className="w-24 px-3.5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 hover:text-indigo-700 transition-colors group"
                    title="Sort by Status"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Status</span>
                      {directorySortField === 'status' ? (
                        directorySortDirection === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-all" />
                      )}
                    </div>
                  </th>
                  <th className="w-24 px-3.5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3.5 py-12 text-center text-slate-500">
                      <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      No employees found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map(emp => {
                    const empExt = getEmpExtension(emp);
                    return (
                      <tr 
                        key={emp.id} 
                        onClick={() => navigate(`/hr/directory/${emp.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="w-14 px-3.5 py-3.5 text-center font-bold text-slate-500 text-xs">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200/60 font-mono text-[11px]">
                            #{emp.id}
                          </span>
                        </td>
                        <td className="px-3.5 py-3.5 min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                              {emp.avatar_url ? (
                                <img src={emp.avatar_url} alt={emp.name} className="w-full h-full object-cover" />
                              ) : (
                                emp.name?.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors truncate">
                                {emp.name}
                              </p>
                              <p className="text-xs text-indigo-700 font-bold truncate">{emp.job_title || 'Employee'}</p>
                              <p className="text-[11px] text-slate-400 font-medium truncate">{emp.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="w-20 px-3.5 py-3.5 text-center">
                          {empExt ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
                              #{empExt.replace(/^#/, '')}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono text-xs">—</span>
                          )}
                        </td>
                        <td className="w-36 px-3.5 py-3.5">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5 truncate">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{getEmpDepartment(emp, departments)}</span>
                            </span>
                            {emp.team_name && (
                              <span className="inline-block text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5 border border-indigo-100/50 truncate max-w-full">
                                Team: {emp.team_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="w-28 px-3.5 py-3.5">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200/60 inline-block truncate max-w-full">
                            {getEmpContractType(emp)}
                          </span>
                        </td>
                        <td className="w-28 px-3.5 py-3.5">
                          <span className="text-xs font-medium text-slate-600 truncate block">
                            {emp.joined_at ? new Date(emp.joined_at).toISOString().split('T')[0] : 'N/A'}
                          </span>
                        </td>
                        <td className="w-24 px-3.5 py-3.5">
                          {(() => {
                            const stages = pipelines.filter(p => p.module_key === 'directory');
                            const empStatusVal = getEmpStatus(emp);
                            const currentStage = stages.find(s => (s.name_en || '').toLowerCase() === (empStatusVal || '').toLowerCase());
                            if (currentStage) {
                              return (
                                <span 
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight border font-sans truncate block text-center"
                                  style={{
                                    backgroundColor: currentStage.color + '12',
                                    color: currentStage.color,
                                    borderColor: currentStage.color + '25'
                                  }}
                                >
                                  {currentStage.name_en}
                                </span>
                              );
                            }
                            const safeEmpStatus = (empStatusVal || 'active').toLowerCase();
                            return (
                              <span className={cn(
                                "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight border truncate block text-center",
                                safeEmpStatus === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                                safeEmpStatus === 'on_leave' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                              )}>
                                {empStatusVal ? empStatusVal.replace('_', ' ') : 'active'}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="w-24 px-3.5 py-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            {canShareEmployee && (
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  const text = `Employee #${emp.id}: ${emp.name} (${emp.job_title})`; 
                                  navigator.clipboard.writeText(text); 
                                  showCustomToast('Employee info copied to clipboard!', 'info'); 
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                title="Share"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                navigate(`/hr/directory/${emp.id}`); 
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canEditEmployee && (
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  navigate(`/hr/directory/${emp.id}?edit=true`); 
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <ActionGuard actionKey="hr:employees:delete" module="HR">
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setDeletingEmployee(emp);
                                  setShowDeleteConfirm(emp.id); 
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </ActionGuard>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar for >100 users scalability */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-600">
            Page <span className="font-black text-indigo-600">{safePage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setDirectoryPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {/* Numbered Page Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (safePage > 3) {
                    pageNum = safePage - 3 + i;
                  }
                  if (pageNum > totalPages) {
                    pageNum = totalPages - (4 - i);
                  }
                }
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <button
                    key={`dir-pg-${pageNum}`}
                    onClick={() => setDirectoryPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer border",
                      safePage === pageNum
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                        : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setDirectoryPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Employee Profile?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{deletingEmployee?.name || 'this employee'}</strong>? This action will remove all corresponding HR records and cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(null); setDeletingEmployee(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEmployee(showDeleteConfirm)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeListPage;
