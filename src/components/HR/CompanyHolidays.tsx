import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Search,
  Filter,
  Trash2,
  Edit2,
  CalendarCheck,
  CalendarRange,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Palmtree,
  Sparkles,
  Info,
  X,
  Check,
  Flag,
  Globe,
  Briefcase,
  HelpCircle,
  Clock4
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Department } from '../../types';

export interface CompanyHoliday {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD (inclusive)
  type: 'National' | 'Religious' | 'Company' | 'Observance';
  isPaid: boolean;
  isRecurringYearly: boolean;
  departmentScope: 'All' | number[]; // 'All' or department IDs
  description?: string;
  color: string; // Hex color or Tailwind accent
}

export const DEFAULT_HOLIDAYS: CompanyHoliday[] = [
  {
    id: 'hol-2026-01',
    name: "New Year's Day",
    startDate: '2026-01-01',
    endDate: '2026-01-01',
    type: 'National',
    isPaid: true,
    isRecurringYearly: true,
    departmentScope: 'All',
    description: 'Statutory public holiday marking the beginning of the Gregorian new year.',
    color: '#6366f1' // Indigo
  },
  {
    id: 'hol-2026-02',
    name: 'Coptic Christmas Day',
    startDate: '2026-01-07',
    endDate: '2026-01-07',
    type: 'Religious',
    isPaid: true,
    isRecurringYearly: true,
    departmentScope: 'All',
    description: 'Eastern Christian Christmas observance and national non-working holiday.',
    color: '#059669' // Emerald
  },
  {
    id: 'hol-2026-03',
    name: 'National Police & Revolution Day',
    startDate: '2026-01-25',
    endDate: '2026-01-25',
    type: 'National',
    isPaid: true,
    isRecurringYearly: true,
    departmentScope: 'All',
    description: 'National holiday commemorating Police Day and the January 25 Revolution.',
    color: '#e11d48' // Rose
  },
  {
    id: 'hol-2026-04',
    name: 'Eid Al-Fitr Holiday',
    startDate: '2026-03-20',
    endDate: '2026-03-23',
    type: 'Religious',
    isPaid: true,
    isRecurringYearly: false,
    departmentScope: 'All',
    description: 'Official 4-day statutory break marking the conclusion of the holy month of Ramadan.',
    color: '#059669' // Emerald
  },
  {
    id: 'hol-2026-05',
    name: 'Sham El-Nessim (Spring Festival)',
    startDate: '2026-04-13',
    endDate: '2026-04-13',
    type: 'National',
    isPaid: true,
    isRecurringYearly: true,
    departmentScope: 'All',
    description: 'Traditional Egyptian spring festival and nationwide public holiday.',
    color: '#d97706' // Amber
  },
  {
    id: 'hol-2026-06',
    name: 'Sinai Liberation Day',
    startDate: '2026-04-25',
    endDate: '2026-04-25',
    type: 'National',
    isPaid: true,
    isRecurringYearly: true,
    departmentScope: 'All',
    description: 'National holiday commemorating the complete restoration of the Sinai Peninsula.',
    color: '#e11d48' // Rose
  },
  {
    id: 'hol-2026-07',
    name: 'Labor Day',
    startDate: '2026-05-01',
    endDate: '2026-05-01',
    type: 'National',
    isPaid: true,
    isRecurringYearly: true,
    departmentScope: 'All',
    description: 'International Workers Day honoring employee dedication and workforce contributions.',
    color: '#6366f1' // Indigo
  },
  {
    id: 'hol-2026-08',
    name: 'Eid Al-Adha Holiday',
    startDate: '2026-05-27',
    endDate: '2026-05-31',
    type: 'Religious',
    isPaid: true,
    isRecurringYearly: false,
    departmentScope: 'All',
    description: '5-day official corporate and public holiday for the Feast of the Sacrifice and Arafat Day.',
    color: '#059669' // Emerald
  },
  {
    id: 'hol-2026-09',
    name: 'Islamic New Year (Hijri 1448)',
    startDate: '2026-06-16',
    endDate: '2026-06-16',
    type: 'Religious',
    isPaid: true,
    isRecurringYearly: false,
    departmentScope: 'All',
    description: 'First day of Muharram marking the start of the new Hijri lunar calendar year.',
    color: '#059669' // Emerald
  },
  {
    id: 'hol-2026-10',
    name: 'June 30 Revolution Day',
    startDate: '2026-06-30',
    endDate: '2026-06-30',
    type: 'National',
    isPaid: true,
    isRecurringYearly: true,
    departmentScope: 'All',
    description: 'National public holiday commemorating the June 30 Revolution.',
    color: '#e11d48' // Rose
  },
  {
    id: 'hol-2026-11',
    name: 'Company Annual Foundation Day',
    startDate: '2026-07-15',
    endDate: '2026-07-15',
    type: 'Company',
    isPaid: true,
    isRecurringYearly: true,
    departmentScope: 'All',
    description: 'Corporate celebration anniversary and full paid holiday for all business units.',
    color: '#0284c7' // Sky
  },
  {
    id: 'hol-2026-12',
    name: 'July 23 Revolution Day',
    startDate: '2026-07-23',
    endDate: '2026-07-23',
    type: 'National',
    isPaid: true,
    isRecurringYearly: true,
    departmentScope: 'All',
    description: 'Commemoration of the 1952 Revolution establishing the Republic.',
    color: '#e11d48' // Rose
  },
  {
    id: 'hol-2026-13',
    name: "Prophet's Birthday (Mawlid)",
    startDate: '2026-08-26',
    endDate: '2026-08-26',
    type: 'Religious',
    isPaid: true,
    isRecurringYearly: false,
    departmentScope: 'All',
    description: 'Observance of the anniversary of the birth of the Prophet Muhammad.',
    color: '#059669' // Emerald
  },
  {
    id: 'hol-2026-14',
    name: 'Armed Forces Day (6th of October)',
    startDate: '2026-10-06',
    endDate: '2026-10-06',
    type: 'National',
    isPaid: true,
    isRecurringYearly: true,
    departmentScope: 'All',
    description: 'National victory celebration and statutory public holiday.',
    color: '#e11d48' // Rose
  },
  {
    id: 'hol-2026-15',
    name: 'Year-End Corporate Maintenance Day',
    startDate: '2026-12-31',
    endDate: '2026-12-31',
    type: 'Company',
    isPaid: true,
    isRecurringYearly: true,
    departmentScope: 'All',
    description: 'Annual facility shut-down, IT systems maintenance, and employee holiday.',
    color: '#0284c7' // Sky
  }
];

const PALETTE_OPTIONS = [
  { label: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500' },
  { label: 'Emerald', value: '#059669', bg: 'bg-emerald-600' },
  { label: 'Rose', value: '#e11d48', bg: 'bg-rose-600' },
  { label: 'Amber', value: '#d97706', bg: 'bg-amber-600' },
  { label: 'Sky', value: '#0284c7', bg: 'bg-sky-600' },
  { label: 'Violet', value: '#7c3aed', bg: 'bg-violet-600' },
  { label: 'Teal', value: '#0d9488', bg: 'bg-teal-600' }
];

interface CompanyHolidaysProps {
  departments?: Department[];
  onBack?: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const CompanyHolidays: React.FC<CompanyHolidaysProps> = ({
  departments = [],
  onBack,
  showToast
}) => {
  const navigate = useNavigate();

  // Storage and State
  const [holidays, setHolidays] = useState<CompanyHoliday[]>(() => {
    try {
      const saved = localStorage.getItem('hr_company_holidays');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved company holidays:', e);
    }
    return DEFAULT_HOLIDAYS;
  });

  // View Mode: 'calendar' | 'list'
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Calendar Date State (Current Month / Year)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 0, 1)); // Jan 2026 as baseline

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'National' | 'Religious' | 'Company' | 'Observance'>('All');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<CompanyHoliday | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formType, setFormType] = useState<'National' | 'Religious' | 'Company' | 'Observance'>('National');
  const [formIsPaid, setFormIsPaid] = useState(true);
  const [formIsRecurring, setFormIsRecurring] = useState(true);
  const [formDepartmentScope, setFormDepartmentScope] = useState<'All' | number[]>('All');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#6366f1');

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sync to localStorage and notify matrix & other components
  useEffect(() => {
    try {
      localStorage.setItem('hr_company_holidays', JSON.stringify(holidays));
      window.dispatchEvent(new Event('company_holidays_updated'));
    } catch (e) {
      console.error('Failed to save company holidays to localStorage:', e);
    }
  }, [holidays]);

  // Handle open modal
  const handleOpenAddModal = (initialDate?: string) => {
    setEditingHoliday(null);
    setFormName('');
    const dStr = initialDate || `${selectedYear}-01-01`;
    setFormStartDate(dStr);
    setFormEndDate(dStr);
    setFormType('National');
    setFormIsPaid(true);
    setFormIsRecurring(true);
    setFormDepartmentScope('All');
    setFormDescription('');
    setFormColor('#6366f1');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (hol: CompanyHoliday) => {
    setEditingHoliday(hol);
    setFormName(hol.name);
    setFormStartDate(hol.startDate);
    setFormEndDate(hol.endDate || hol.startDate);
    setFormType(hol.type);
    setFormIsPaid(hol.isPaid);
    setFormIsRecurring(hol.isRecurringYearly);
    setFormDepartmentScope(hol.departmentScope);
    setFormDescription(hol.description || '');
    setFormColor(hol.color || '#6366f1');
    setIsModalOpen(true);
  };

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast?.('Please enter a holiday name', 'error');
      return;
    }
    if (!formStartDate) {
      showToast?.('Please select a start date', 'error');
      return;
    }

    const start = formStartDate;
    const end = formEndDate && formEndDate >= formStartDate ? formEndDate : formStartDate;

    if (editingHoliday) {
      // Update
      setHolidays(prev => prev.map(h => {
        if (h.id === editingHoliday.id) {
          return {
            ...h,
            name: formName.trim(),
            startDate: start,
            endDate: end,
            type: formType,
            isPaid: formIsPaid,
            isRecurringYearly: formIsRecurring,
            departmentScope: formDepartmentScope,
            description: formDescription.trim(),
            color: formColor
          };
        }
        return h;
      }));
      showToast?.(`Holiday "${formName}" updated successfully`, 'success');
    } else {
      // Add
      const newHol: CompanyHoliday = {
        id: `hol-${Date.now()}`,
        name: formName.trim(),
        startDate: start,
        endDate: end,
        type: formType,
        isPaid: formIsPaid,
        isRecurringYearly: formIsRecurring,
        departmentScope: formDepartmentScope,
        description: formDescription.trim(),
        color: formColor
      };
      setHolidays(prev => [...prev, newHol]);
      showToast?.(`Holiday "${formName}" added to company calendar`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDeleteHoliday = (id: string) => {
    const toDelete = holidays.find(h => h.id === id);
    setHolidays(prev => prev.filter(h => h.id !== id));
    setDeleteConfirmId(null);
    showToast?.(`Holiday "${toDelete?.name || 'Item'}" removed`, 'info');
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset company holidays list to official statutory defaults?')) {
      setHolidays(DEFAULT_HOLIDAYS);
      showToast?.('Holidays calendar reset to default corporate schedule', 'success');
    }
  };

  // Helper: calculate total duration in days
  const getHolidayDaysCount = (start: string, end?: string): number => {
    if (!end || end === start) return 1;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e) || e < s) return 1;
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  // Helper: check if a specific date (YYYY-MM-DD) falls within a holiday
  const getHolidaysForDate = (dateStr: string): CompanyHoliday[] => {
    return holidays.filter(h => {
      const start = h.startDate;
      const end = h.endDate || h.startDate;
      return dateStr >= start && dateStr <= end;
    });
  };

  // Filtered Holidays for list and statistics
  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => {
      // Filter by type
      if (typeFilter !== 'All' && h.type !== typeFilter) return false;
      // Filter by year
      const startYear = parseInt(h.startDate.split('-')[0], 10);
      const endYear = h.endDate ? parseInt(h.endDate.split('-')[0], 10) : startYear;
      if (selectedYear !== 0 && startYear !== selectedYear && endYear !== selectedYear) return false;
      // Filter by search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(query);
        const matchesDesc = h.description?.toLowerCase().includes(query);
        const matchesType = h.type.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesType) return false;
      }
      return true;
    }).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [holidays, typeFilter, selectedYear, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const yearHols = holidays.filter(h => {
      const y = parseInt(h.startDate.split('-')[0], 10);
      return y === selectedYear;
    });

    let totalOffDays = 0;
    yearHols.forEach(h => {
      totalOffDays += getHolidayDaysCount(h.startDate, h.endDate);
    });

    const paidCount = yearHols.filter(h => h.isPaid).length;
    const nationalCount = yearHols.filter(h => h.type === 'National').length;
    const religiousCount = yearHols.filter(h => h.type === 'Religious').length;
    const companyCount = yearHols.filter(h => h.type === 'Company').length;

    // Next upcoming holiday from today
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = holidays
      .filter(h => (h.endDate || h.startDate) >= todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

    let daysUntilUpcoming: number | null = null;
    if (upcoming) {
      const todayTime = new Date(todayStr).getTime();
      const holTime = new Date(upcoming.startDate).getTime();
      daysUntilUpcoming = Math.max(0, Math.ceil((holTime - todayTime) / (1000 * 60 * 60 * 24)));
    }

    return {
      totalHolidays: yearHols.length,
      totalOffDays,
      paidCount,
      nationalCount,
      religiousCount,
      companyCount,
      upcoming,
      daysUntilUpcoming
    };
  }, [holidays, selectedYear]);

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedYear(now.getFullYear());
  };

  // Keep selectedYear in sync with calendar navigation
  useEffect(() => {
    setSelectedYear(year);
  }, [year]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              navigate('/hr/attendance/shifts');
            }
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shift Schedule</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <button 
            type="button" 
            onClick={() => {
              if (onBack) onBack();
              else navigate('/hr/attendance/shifts');
            }} 
            className="hover:text-slate-600 transition-colors cursor-pointer"
          >
            Shift Schedule
          </button>
          <span>/</span>
          <span className="font-bold text-indigo-600">Company Holidays</span>
        </div>
      </div>

      {/* 2. Title & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <Palmtree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Company Holidays & Public Observances
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Annual company calendar, statutory national holidays, and corporate shut-down dates.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
          {/* Year Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedYear}
              onChange={e => {
                const y = parseInt(e.target.value, 10);
                setSelectedYear(y);
                setCurrentDate(new Date(y, month, 1));
              }}
              className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer pr-1"
            >
              <option value={2025}>Year 2025</option>
              <option value={2026}>Year 2026</option>
              <option value={2027}>Year 2027</option>
            </select>
          </div>

          {/* View Mode Toggle: Calendar vs List (Icon only toggler matching user standard) */}
          <div className="flex bg-slate-100/90 p-1 border border-slate-200/60 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={cn(
                "p-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer",
                viewMode === 'calendar' ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              )}
              title="Calendar View"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer",
                viewMode === 'list' ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              )}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Add Holiday Button */}
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
            title="Register a new company or national holiday"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday</span>
          </button>
        </div>
      </div>

      {/* 3. Summary Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Holidays in Year */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Holidays</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-800">{stats.totalHolidays}</span>
              <span className="text-xs font-bold text-slate-500">Occasions</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">In calendar year {selectedYear}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Total Non-Working Days */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Off Days</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-700">{stats.totalOffDays}</span>
              <span className="text-xs font-bold text-emerald-600">Full Days</span>
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-1 font-medium">{stats.paidCount} Fully Paid</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Breakdown by Type */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div className="w-full">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category Mix</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black">
                {stats.nationalCount} Nat'l
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                {stats.religiousCount} Rel'g
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-black">
                {stats.companyCount} Corp
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Standard HR policies</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0 ml-2">
            <Tag className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        {/* Metric 4: Next Upcoming Holiday Countdown */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Next Upcoming</span>
            </p>
            {stats.upcoming ? (
              <>
                <p className="text-sm font-black text-slate-900 truncate mt-1" title={stats.upcoming.name}>
                  {stats.upcoming.name}
                </p>
                <p className="text-[11px] text-indigo-600 font-bold mt-0.5">
                  {stats.daysUntilUpcoming === 0 ? 'Today!' : `In ${stats.daysUntilUpcoming} days (${stats.upcoming.startDate})`}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400 font-medium mt-1">No upcoming holidays scheduled</p>
            )}
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-indigo-600/30">
            <Clock4 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Filter Strip (Type Filters & Search) */}
      <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Category:</span>
          </span>
          {(['All', 'National', 'Religious', 'Company', 'Observance'] as const).map(cat => {
            const isActive = typeFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setTypeFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  isActive
                    ? "bg-white text-indigo-700 shadow-2xs ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input & Reset Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search holidays..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs w-48 sm:w-60"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
            title="Reset to default official corporate holidays"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* 5. View Content: Calendar View OR List View */}
      {viewMode === 'calendar' ? (
        /* ================= CALENDAR VIEW ================= */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Calendar Month Header */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
            <div className="flex items-center gap-3">
              <h4 className="text-xl font-black text-slate-800 tracking-tight">
                {monthNames[month]} {year}
              </h4>
              <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                {filteredHolidays.filter(h => {
                  const s = new Date(h.startDate);
                  const e = h.endDate ? new Date(h.endDate) : s;
                  return (s.getFullYear() === year && s.getMonth() === month) || (e.getFullYear() === year && e.getMonth() === month);
                }).length} Holidays this month
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToToday}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
              >
                Today
              </button>
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-3 sm:p-6">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center select-none">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, idx) => (
                <div
                  key={dayName}
                  className={cn(
                    "py-2 text-[11px] font-black uppercase tracking-wider rounded-xl",
                    idx === 5 || idx === 6 ? "text-amber-600/80 bg-amber-50/30" : "text-slate-400"
                  )}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 auto-rows-fr">
              {/* Previous Month Padding Days */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                const dayNum = daysInPrevMonth - firstDayOfMonth + i + 1;
                return (
                  <div
                    key={`prev-${i}`}
                    className="min-h-[90px] sm:min-h-[110px] p-2 bg-slate-50/40 border border-slate-100/80 rounded-2xl text-slate-300 opacity-60 select-none flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold">{dayNum}</span>
                  </div>
                );
              })}

              {/* Current Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayHolidays = getHolidaysForDate(dateStr);
                const hasHoliday = dayHolidays.length > 0;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                const dayOfWeek = (firstDayOfMonth + i) % 7;
                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday & Saturday in region

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={cn(
                      "min-h-[90px] sm:min-h-[115px] p-2 rounded-2xl border transition-all flex flex-col justify-between relative group",
                      hasHoliday
                        ? "bg-indigo-50/30 border-indigo-200/80 shadow-2xs hover:border-indigo-300"
                        : isWeekend
                        ? "bg-slate-50/70 border-slate-200/60"
                        : "bg-white border-slate-200/70 hover:border-indigo-200 hover:shadow-2xs",
                      isToday && "ring-2 ring-indigo-500 ring-offset-1"
                    )}
                  >
                    {/* Day Number & Quick Add Button */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs font-black w-6 h-6 flex items-center justify-center rounded-full",
                        isToday ? "bg-indigo-600 text-white" : hasHoliday ? "text-indigo-700 bg-indigo-100/60" : "text-slate-700"
                      )}>
                        {dayNum}
                      </span>

                      {/* Quick Add Button on Hover */}
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(dateStr)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all cursor-pointer"
                        title={`Add holiday on ${dateStr}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Holidays on this Day */}
                    <div className="space-y-1 my-1 overflow-y-auto max-h-[70px] scrollbar-none">
                      {dayHolidays.map(hol => {
                        return (
                          <div
                            key={hol.id}
                            onClick={() => handleOpenEditModal(hol)}
                            style={{ borderLeftColor: hol.color || '#6366f1' }}
                            className={cn(
                              "px-2 py-1 rounded-lg text-[10px] font-bold border-l-3 bg-white shadow-2xs cursor-pointer truncate transition-transform hover:scale-[1.02] flex items-center justify-between gap-1 group/item"
                            )}
                            title={`${hol.name} (${hol.type})${hol.description ? ' - ' + hol.description : ''}`}
                          >
                            <span className="truncate text-slate-800 font-extrabold">{hol.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono shrink-0">
                              {hol.type.slice(0, 3)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Status Indicator */}
                    <div className="text-[9px] font-bold text-slate-400 flex items-center justify-between">
                      {hasHoliday ? (
                        <span className="text-indigo-600 font-black tracking-wider uppercase text-[8px]">
                          Non-Working
                        </span>
                      ) : isWeekend ? (
                        <span className="text-slate-400 text-[8px] uppercase">Weekend</span>
                      ) : (
                        <span />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Next Month Padding Days */}
              {Array.from({ length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7 }, (_, i) => (
                <div
                  key={`next-${i}`}
                  className="min-h-[90px] sm:min-h-[110px] p-2 bg-slate-50/40 border border-slate-100/80 rounded-2xl text-slate-300 opacity-60 select-none flex flex-col justify-between"
                >
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ================= LIST / TABLE VIEW ================= */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-100 select-none">
                <tr>
                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap min-w-[220px]">
                    Holiday Name
                  </th>
                  <th className="px-3.5 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap text-center w-[160px]">
                    Date Range
                  </th>
                  <th className="px-3 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap text-center w-[110px]">
                    Duration
                  </th>
                  <th className="px-3.5 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap text-center w-[125px]">
                    Category
                  </th>
                  <th className="px-3.5 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap text-center w-[140px]">
                    Applicable Staff
                  </th>
                  <th className="px-3.5 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap text-center w-[120px]">
                    Pay Policy
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap text-right w-[110px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHolidays.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/30">
                      <Palmtree className="w-10 h-10 opacity-25 mx-auto mb-2 text-indigo-500" />
                      <p className="font-bold text-slate-700">No holidays match current criteria</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or click "Add Holiday" to register one.</p>
                    </td>
                  </tr>
                ) : (
                  filteredHolidays.map(hol => {
                    const daysCount = getHolidayDaysCount(hol.startDate, hol.endDate);
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isTodayActive = todayStr >= hol.startDate && todayStr <= (hol.endDate || hol.startDate);
                    const isPast = (hol.endDate || hol.startDate) < todayStr;

                    return (
                      <tr key={hol.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* 1. Holiday Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-2.5 h-9 rounded-full shrink-0 shadow-2xs" 
                              style={{ backgroundColor: hol.color || '#6366f1' }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(hol)}
                                  className="font-black text-xs text-slate-800 hover:text-indigo-600 transition-colors uppercase tracking-tight text-left cursor-pointer flex items-center gap-1 group/btn"
                                  title="Click to edit holiday"
                                >
                                  <span>{hol.name}</span>
                                  <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100 text-indigo-500 transition-opacity" />
                                </button>
                                {isTodayActive && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                    Active Today
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate max-w-sm font-medium mt-0.5">
                                {hol.description || 'Statutory company closure.'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Date Range */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-black text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {hol.startDate}
                              {hol.endDate && hol.endDate !== hol.startDate ? ` → ${hol.endDate}` : ''}
                            </span>
                          </div>
                        </td>

                        {/* 3. Duration */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black border shadow-2xs inline-block",
                            daysCount > 1 ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-100 text-slate-700 border-slate-200"
                          )}>
                            {daysCount} {daysCount > 1 ? 'Days' : 'Day'}
                          </span>
                        </td>

                        {/* 4. Category */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <span className={cn(
                            "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-2xs inline-block",
                            hol.type === 'National' && "bg-rose-50 text-rose-700 border-rose-200",
                            hol.type === 'Religious' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            hol.type === 'Company' && "bg-sky-50 text-sky-700 border-sky-200",
                            hol.type === 'Observance' && "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {hol.type}
                          </span>
                        </td>

                        {/* 5. Applicable Staff */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70 inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>
                              {hol.departmentScope === 'All'
                                ? 'All Departments'
                                : `${(hol.departmentScope as number[]).length} Depts`}
                            </span>
                          </span>
                        </td>

                        {/* 6. Pay Policy */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          {hol.isPaid ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Paid Off</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-slate-400" />
                              <span>Unpaid</span>
                            </span>
                          )}
                        </td>

                        {/* 7. Actions */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(hol)}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 transition-colors cursor-pointer shadow-2xs"
                              title="Edit Holiday"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(hol.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 transition-colors cursor-pointer shadow-2xs"
                              title="Delete Holiday"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* 6. Add / Edit Holiday Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <CalendarRange className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                    {editingHoliday ? 'Edit Company Holiday' : 'Add New Company Holiday'}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Configure official non-working day rules and scope.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveHoliday} className="p-6 space-y-4">
              {/* Holiday Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                  Holiday Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Day, Annual Summer Closure"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
              </div>

              {/* Category & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                    Category / Type
                  </label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
                  >
                    <option value="National">National Statutory</option>
                    <option value="Religious">Religious Observance</option>
                    <option value="Company">Company Specific</option>
                    <option value="Observance">General Observance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                    Calendar Color
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {PALETTE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormColor(opt.value)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center shadow-2xs",
                          opt.bg,
                          formColor === opt.value ? "scale-115 ring-2 ring-slate-800 ring-offset-1" : "hover:scale-105"
                        )}
                        title={opt.label}
                      >
                        {formColor === opt.value && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={e => {
                      setFormStartDate(e.target.value);
                      if (!formEndDate || formEndDate < e.target.value) {
                        setFormEndDate(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                    End Date (Inclusive)
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    min={formStartDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
                  />
                </div>
              </div>

              {/* Checkboxes: Paid & Recurring */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    checked={formIsPaid}
                    onChange={e => setFormIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Fully Paid Holiday</span>
                    <span className="text-[10px] text-slate-400">Included in monthly payroll</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    checked={formIsRecurring}
                    onChange={e => setFormIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Recurring Yearly</span>
                    <span className="text-[10px] text-slate-400">Repeats on calendar annually</span>
                  </div>
                </label>
              </div>

              {/* Applicable Departments */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                  Department Scope
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDepartmentScope('All')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                      formDepartmentScope === 'All'
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    All Departments (Company-wide)
                  </button>
                  {departments.length > 0 && formDepartmentScope !== 'All' && (
                    <span className="text-xs text-slate-400 font-medium">Custom subset</span>
                  )}
                </div>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                  Description & Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional internal policy instructions or statutory references..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {editingHoliday ? 'Save Changes' : 'Add to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-black text-slate-900 uppercase">Remove Holiday?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this holiday from the company roster? Employees will be expected to observe regular working shifts.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteHoliday(deleteConfirmId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyHolidays;
