import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Calendar, 
  Filter, 
  User, 
  Building2, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  FileText,
  Clock,
  RotateCcw,
  XCircle,
  Edit3,
  X,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { QAAdvancedFilter } from './QAAdvancedFilter';

interface EmployeeItem {
  id: string;
  rawId: number;
  name: string;
  role: string;
  department: string;
  casesCount: number;
  totalCases: number;
  openCases: number;
  closedCases: number;
  totalErrors: number;
  performanceScore: number;
  performanceLevel: string;
}

interface DepartmentGroup {
  id: string;
  name: string;
  count: number;
  employees: EmployeeItem[];
}

interface ActionPlanItem {
  id: string;
  action: string;
  assignee: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Completed' | string;
}

interface NoteItem {
  id: number;
  title?: string;
  content: string;
  priority?: string;
  createdAt?: string;
}

export const EmployeeQualityTracker: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live Data State
  const [departments, setDepartments] = useState<DepartmentGroup[]>([]);
  const [activeEmployee, setActiveEmployee] = useState<EmployeeItem | null>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [errorTypeData, setErrorTypeData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [casesDetails, setCasesDetails] = useState<any[]>([]);
  const [filteredCasesDetails, setFilteredCasesDetails] = useState<any[] | null>(null);
  const [actionPlans, setActionPlans] = useState<ActionPlanItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  // Advanced Filter state for employee list
  const [advancedFilteredEmployees, setAdvancedFilteredEmployees] = useState<EmployeeItem[] | null>(null);

  const flatEmployeesList = useMemo(() => {
    return departments.flatMap(d => d.employees.map(e => ({ ...e, department: d.name })));
  }, [departments]);

  const allowedEmployeeIds = useMemo(() => {
    if (!advancedFilteredEmployees) return null;
    return new Set(advancedFilteredEmployees.map(e => e.id));
  }, [advancedFilteredEmployees]);

  // Interactive Form States
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [newActionForm, setNewActionForm] = useState({
    action: '',
    assignee: 'QA Team',
    dueDate: '',
    status: 'Open'
  });

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('Quality Recommendation');
  const [newNotePriority, setNewNotePriority] = useState('Medium');

  useEffect(() => {
    fetchEmployeeData();
  }, [selectedEmpId]);

  const fetchEmployeeData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const headers = { 'Authorization': `Bearer ${token}`, 'x-user-id': userId };

      const url = selectedEmpId 
        ? `/api/qa/employee-tracker-data?employeeId=${encodeURIComponent(selectedEmpId)}`
        : '/api/qa/employee-tracker-data';

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.departments) {
          setDepartments(data.departments);
          // Default expand the first 2 departments if not set yet
          if (expandedDepts.length === 0 && data.departments.length > 0) {
            setExpandedDepts(data.departments.slice(0, 2).map((d: DepartmentGroup) => d.id));
          }
        }

        if (data.activeEmployeeDetails) {
          const details = data.activeEmployeeDetails;
          setActiveEmployee(details.employee);
          setCategoryData(details.categoryData || []);
          setErrorTypeData(details.errorData || []);
          setStatusData(details.statusData || []);
          setCasesDetails(details.casesList || []);
          setActionPlans(details.actionPlans || []);
          setNotes(details.notes || []);

          if (!selectedEmpId && details.employee) {
            setSelectedEmpId(details.employee.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load employee tracker data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleDept = (deptId: string) => {
    setExpandedDepts(prev => 
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const handleSelectEmployee = (emp: EmployeeItem) => {
    setSelectedEmpId(emp.id);
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionForm.action.trim() || !activeEmployee) return;

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const headers = { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json',
        'x-user-id': userId 
      };

      const res = await fetch('/api/qa/employee-action-plans', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: newActionForm.action,
          assignee: newActionForm.assignee,
          dueDate: newActionForm.dueDate,
          status: newActionForm.status,
          employee_name: activeEmployee.name,
          employee_id: activeEmployee.rawId
        })
      });

      if (res.ok) {
        setNewActionForm({ action: '', assignee: 'QA Team', dueDate: '', status: 'Open' });
        setIsAddingAction(false);
        fetchEmployeeData(true);
      }
    } catch (err) {
      console.error("Failed to add action plan:", err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !activeEmployee) return;

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const headers = { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json',
        'x-user-id': userId 
      };

      const res = await fetch('/api/qa/employee-recommendations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employee_id: activeEmployee.rawId,
          employee_name: activeEmployee.name,
          department: activeEmployee.department,
          title: newNoteTitle,
          content: newNoteText.trim(),
          priority: newNotePriority
        })
      });

      if (res.ok) {
        setNewNoteText('');
        setIsAddingNote(false);
        fetchEmployeeData(true);
      }
    } catch (err) {
      console.error("Failed to add recommendation note:", err);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const headers = { 'Authorization': `Bearer ${token}`, 'x-user-id': userId };

      const res = await fetch(`/api/qa/employee-recommendations/${noteId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
      }
    } catch (err) {
      console.error("Failed to delete recommendation:", err);
    }
  };

  const totalEmployeesCount = departments.reduce((acc, d) => acc + d.employees.length, 0);

  return (
    <div className="space-y-6" id="employee-quality-tracker">
      
      {/* 1. Header Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Employee Quality Tracking</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Live evaluation, audits, and performance accountability across company teams
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchEmployeeData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-Time DB
          </span>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Departments & Employees Tree (4 SPANS) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Departments & Employees</h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              {totalEmployeesCount} Members
            </span>
          </div>

          {/* Search & Advanced Filter Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search department or employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <QAAdvancedFilter
              items={flatEmployeesList}
              onFilter={(filtered) => setAdvancedFilteredEmployees(filtered as EmployeeItem[] | null)}
              title="Filter Team Members"
              buttonLabel="Filter"
            />
          </div>

          {/* Collapsible Departments Tree */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {departments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">
                Loading team members...
              </div>
            ) : (
              departments.map((dept) => {
                const isExpanded = expandedDepts.includes(dept.id);
                const filteredEmployees = dept.employees.filter(emp => {
                  if (allowedEmployeeIds && !allowedEmployeeIds.has(emp.id)) return false;
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    emp.name.toLowerCase().includes(q) ||
                    dept.name.toLowerCase().includes(q)
                  );
                });

                if ((searchQuery || allowedEmployeeIds) && filteredEmployees.length === 0) return null;

                return (
                  <div key={dept.id} className="space-y-1">
                    {/* Department Header */}
                    <div
                      onClick={() => toggleDept(dept.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer transition-all border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{dept.name}</span>
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {dept.employees.length}
                      </span>
                    </div>

                    {/* Employees List */}
                    {isExpanded && (
                      <div className="pl-6 space-y-1.5 border-l-2 border-slate-100 ml-3.5 my-1">
                        {filteredEmployees.map((emp) => {
                          const isSelected = activeEmployee?.id === emp.id || activeEmployee?.rawId === emp.rawId;
                          return (
                            <div
                              key={emp.id}
                              onClick={() => handleSelectEmployee(emp)}
                              className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all text-xs ${
                                isSelected
                                  ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/20'
                                  : 'hover:bg-slate-50 text-slate-700 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isSelected ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {emp.name.charAt(0)}
                                </div>
                                <div>
                                  <span className="block truncate max-w-[140px]">{emp.name}</span>
                                  <span className={`text-[10px] block font-normal ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                    {emp.role}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {emp.performanceScore}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Employee Performance & Analytics (8 SPANS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Employee Profile Header Card */}
          {activeEmployee && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Profile Details */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shrink-0 shadow-lg shadow-indigo-600/20">
                  {activeEmployee.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{activeEmployee.name}</h3>
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full text-[11px] font-bold">
                      {activeEmployee.performanceLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                    <span>{activeEmployee.role}</span>
                    <span>•</span>
                    <span className="text-slate-700 font-semibold">{activeEmployee.department}</span>
                  </div>
                </div>
              </div>

              {/* 4 Stats Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[11px] text-slate-400 font-bold block">Total Audits</span>
                  <span className="text-base font-black text-slate-900 block mt-0.5">{activeEmployee.totalCases}</span>
                </div>

                <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-100 text-center">
                  <span className="text-[11px] text-amber-700 font-bold block">Open Cases</span>
                  <span className="text-base font-black text-amber-900 block mt-0.5">{activeEmployee.openCases}</span>
                </div>

                <div className="bg-rose-50/60 p-3 rounded-2xl border border-rose-100 text-center">
                  <span className="text-[11px] text-rose-700 font-bold block">Total Exceptions</span>
                  <span className="text-base font-black text-rose-900 block mt-0.5">{activeEmployee.totalErrors}</span>
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-center">
                  <span className="text-[11px] text-emerald-700 font-bold block">Quality Score</span>
                  <span className="text-base font-black text-emerald-900 block mt-0.5">{activeEmployee.performanceScore}%</span>
                </div>
              </div>

            </div>
          )}

          {/* 2. Middle Row: 3 Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Chart 1: Cases Distribution by Category */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <h5 className="text-xs font-black text-slate-900 mb-1">Cases by Category</h5>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-24 h-24 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={28}
                        outerRadius={40}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-cat-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-1 text-[11px]">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 2: Errors Distribution by Type */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <h5 className="text-xs font-black text-slate-900 mb-1">Errors by Reason</h5>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-24 h-24 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={errorTypeData}
                        innerRadius={28}
                        outerRadius={40}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {errorTypeData.map((entry, index) => (
                          <Cell key={`cell-err-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-1 text-[11px]">
                  {errorTypeData.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-600 truncate max-w-[80px]" title={item.name}>{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 3: Cases by Status (Bar Chart) */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <h5 className="text-xs font-black text-slate-900 mb-1">Cases by Status</h5>
              <div className="h-28 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* 3. Cases & Errors Details Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-900">Cases & Audit Details</h4>
                <span className="text-xs text-slate-400 font-medium">Audits assigned to {activeEmployee?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <QAAdvancedFilter
                  items={casesDetails}
                  onFilter={(filtered) => setFilteredCasesDetails(filtered)}
                  title="Filter Cases & Audit Exceptions"
                  buttonLabel="Filter Records"
                />
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  {(filteredCasesDetails !== null ? filteredCasesDetails : casesDetails).length} Records
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3 pl-4">Transaction / Case ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Identified Root Cause</th>
                    <th className="p-3 text-center">Defect Count</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4">Assigned Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(filteredCasesDetails !== null ? filteredCasesDetails : casesDetails).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                        No audit exceptions match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    (filteredCasesDetails !== null ? filteredCasesDetails : casesDetails).map((row, idx) => (
                      <tr key={row.id || `audit-row-${idx}`} className="hover:bg-slate-50/70 transition-all">
                        <td className="p-3 pl-4 font-bold text-slate-900 whitespace-nowrap">{row.transaction_id || row.id}</td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">{row.date}</td>
                        <td className="p-3 font-semibold text-slate-800">{row.errorType}</td>
                        <td className="p-3 text-center font-bold text-slate-900">{row.errorCount}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.actionColor}`}>
                            {row.actionStatus}
                          </span>
                        </td>
                        <td className="p-3 pr-4 font-semibold text-slate-700">{row.owner}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Bottom Row: Action Plan & Notes/Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Action Plan Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-black text-slate-900">Corrective Action Plan</h4>
                  <span className="text-[11px] text-slate-400 font-bold">{actionPlans.length} Actions</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="p-2 pl-3">Required Action</th>
                        <th className="p-2">Assignee</th>
                        <th className="p-2">Due Date</th>
                        <th className="p-2 pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {actionPlans.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">
                            No active action plans assigned.
                          </td>
                        </tr>
                      ) : (
                        actionPlans.map((plan) => (
                          <tr key={plan.id} className="hover:bg-slate-50 transition-all">
                            <td className="p-2 pl-3 font-semibold text-slate-800 text-xs">{plan.action}</td>
                            <td className="p-2 text-slate-600 text-[11px] whitespace-nowrap">{plan.assignee}</td>
                            <td className="p-2 text-slate-500 text-[11px] whitespace-nowrap">{plan.dueDate}</td>
                            <td className="p-2 pr-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                plan.status.toLowerCase().includes('open')
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : plan.status.toLowerCase().includes('progress')
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {plan.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Action Button / Form */}
              {isAddingAction ? (
                <form onSubmit={handleAddAction} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>New Corrective Action</span>
                    <button type="button" onClick={() => setIsAddingAction(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter action description..."
                    value={newActionForm.action}
                    onChange={(e) => setNewActionForm(prev => ({ ...prev, action: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Assignee (e.g. QA Team)"
                      value={newActionForm.assignee}
                      onChange={(e) => setNewActionForm(prev => ({ ...prev, assignee: e.target.value }))}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs"
                    />
                    <input
                      type="date"
                      value={newActionForm.dueDate}
                      onChange={(e) => setNewActionForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-1.5 font-bold text-xs cursor-pointer transition-all"
                  >
                    Save Action to Database
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingAction(true)}
                  className="w-full py-2.5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Corrective Action</span>
                </button>
              )}
            </div>

            {/* Notes & Recommendations Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-black text-slate-900">Notes & Recommendations</h4>
                  <span className="text-[11px] text-slate-400 font-bold">{notes.length} Notes</span>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {notes.length === 0 ? (
                    <p className="text-slate-400 text-xs py-4 text-center">No recommendations logged yet.</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-start justify-between gap-2 group">
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                          <div>
                            {note.title && <h6 className="text-[11px] font-bold text-slate-900">{note.title}</h6>}
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">{note.content}</p>
                            {note.createdAt && <span className="text-[10px] text-slate-400 font-semibold">{note.createdAt}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Note Button / Form */}
              {isAddingNote ? (
                <form onSubmit={handleAddNote} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>New Recommendation</span>
                    <button type="button" onClick={() => setIsAddingNote(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Title (e.g. Coaching Note)"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium"
                  />
                  <textarea
                    placeholder="Enter observation or recommendation note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium resize-none"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-1.5 font-bold text-xs cursor-pointer transition-all"
                  >
                    Save Recommendation Note
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingNote(true)}
                  className="w-full py-2.5 border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Quality Recommendation</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
