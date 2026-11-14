import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { SOP, Department, User, GlobalStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { logAudit } from '../../lib/audit';
import { supabase } from '../../lib/supabase';

export interface LifecycleLog {
  stage: string;
  timestamp: string;
  user: string;
  comment: string;
}

export interface TrainingRecord {
  id: number;
  employeeName: string;
  sopId: number;
  sopTitle: string;
  progress: number;
  status: 'certified' | 'reading' | 'failed' | 'enrolled';
  dateAssigned: string;
}

export interface SOPContextType {
  sopList: SOP[];
  setSopList: React.Dispatch<React.SetStateAction<SOP[]>>;
  selectedSop: SOP | null;
  setSelectedSop: React.Dispatch<React.SetStateAction<SOP | null>>;
  lifecycleSopId: string | number;
  setLifecycleSopId: React.Dispatch<React.SetStateAction<string | number>>;
  lifecycleComment: string;
  setLifecycleComment: React.Dispatch<React.SetStateAction<string>>;
  lifecycleTransitionLog: LifecycleLog[];
  setLifecycleTransitionLog: React.Dispatch<React.SetStateAction<LifecycleLog[]>>;
  trainingSops: TrainingRecord[];
  setTrainingSops: React.Dispatch<React.SetStateAction<TrainingRecord[]>>;
  activeQuizTrainingId: number | null;
  setActiveQuizTrainingId: React.Dispatch<React.SetStateAction<number | null>>;
  quizAnswers: Record<number, string>;
  setQuizAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  quizScore: number | null;
  setQuizScore: React.Dispatch<React.SetStateAction<number | null>>;
  certifiedCode: string | null;
  setCertifiedCode: React.Dispatch<React.SetStateAction<string | null>>;
  enrollEmployeeName: string;
  setEnrollEmployeeName: React.Dispatch<React.SetStateAction<string>>;
  enrollSopId: number | string;
  setEnrollSopId: React.Dispatch<React.SetStateAction<number | string>>;
  toast: { message: string; type: 'success' | 'error' } | null;
  setToast: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' } | null>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  showDeleteConfirm: number | null;
  setShowDeleteConfirm: React.Dispatch<React.SetStateAction<number | null>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  departmentFilter: string;
  setDepartmentFilter: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  changeSummary: string;
  setChangeSummary: React.Dispatch<React.SetStateAction<string>>;
  isAcknowledged: boolean;
  setIsAcknowledged: React.Dispatch<React.SetStateAction<boolean>>;
  relatedCourses: any[];
  setRelatedCourses: React.Dispatch<React.SetStateAction<any[]>>;
  newSop: Partial<SOP>;
  setNewSop: React.Dispatch<React.SetStateAction<Partial<SOP>>>;
  newStep: { step_number: number; step_description: string; attachment_url: string; required_course_id?: number };
  setNewStep: React.Dispatch<React.SetStateAction<{ step_number: number; step_description: string; attachment_url: string; required_course_id?: number }>>;
  isAddingStep: boolean;
  setIsAddingStep: React.Dispatch<React.SetStateAction<boolean>>;
  departments: Department[];
  globalStatuses: GlobalStatus[];
  users: User[];
  setActiveModule?: (mod: string) => void;
  fetchSops: () => Promise<void>;
  fetchSopDetails: (id: number) => Promise<SOP | null>;
  handleCreate: (e?: React.FormEvent) => Promise<SOP | null>;
  handleUpdate: (e?: React.FormEvent) => Promise<boolean>;
  handleDelete: () => Promise<void>;
  handleStatusChange: (statusOrId: string | number, newStatus?: string) => Promise<void>;
  handleAcknowledge: () => Promise<void>;
  handleAddStep: (e: React.FormEvent) => Promise<void>;
}

const SOPContext = createContext<SOPContextType | null>(null);

export const useSOP = () => {
  const context = useContext(SOPContext);
  if (!context) {
    throw new Error('useSOP must be used within a SOPProvider');
  }
  return context;
};

export const SOPProvider: React.FC<{
  children: React.ReactNode;
  departments: Department[];
  globalStatuses: GlobalStatus[];
  users: User[];
  setActiveModule?: (mod: string) => void;
}> = ({ children, departments, globalStatuses, users, setActiveModule }) => {
  const { user } = useAuth();

  // SOP Lifecycle & Approvals State
  const [lifecycleSopId, setLifecycleSopId] = useState<string | number>(1);
  const [lifecycleComment, setLifecycleComment] = useState('');
  const [lifecycleTransitionLog, setLifecycleTransitionLog] = useState<LifecycleLog[]>([
    { stage: 'Draft Initialized', timestamp: '2026-05-18 10:14', user: 'Esraa Essam', comment: 'Compiled US Visa application processes according to new guidelines.' },
    { stage: 'QA Compliance Gate 1', timestamp: '2026-05-19 14:30', user: 'Michael Chen', comment: 'Audit verified checklists and security protocols.' },
    { stage: 'Executive Sign-Off', timestamp: '2026-05-20 09:00', user: 'Admin User', comment: 'Officially endorsed operational standards.' }
  ]);

  // SOP Training Hub State
  const [trainingSops, setTrainingSops] = useState<TrainingRecord[]>([
    { id: 1, employeeName: 'Mohamed Ahmed', sopId: 1, sopTitle: 'US Visa Processing Guide', progress: 100, status: 'certified', dateAssigned: '2026-05-12' },
    { id: 2, employeeName: 'Sarah Jenkins', sopId: 2, sopTitle: 'Refund Request Protocol', progress: 45, status: 'reading', dateAssigned: '2026-05-19' },
    { id: 3, employeeName: 'Khaled Omar', sopId: 3, sopTitle: 'Server Deployment Steps', progress: 0, status: 'enrolled', dateAssigned: '2026-05-20' }
  ]);
  const [activeQuizTrainingId, setActiveQuizTrainingId] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [certifiedCode, setCertifiedCode] = useState<string | null>(null);
  const [enrollEmployeeName, setEnrollEmployeeName] = useState('');
  const [enrollSopId, setEnrollSopId] = useState<number | string>('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sopList, setSopList] = useState<SOP[]>([]);
  const [selectedSop, setSelectedSop] = useState<SOP | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [changeSummary, setChangeSummary] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [relatedCourses, setRelatedCourses] = useState<any[]>([]);

  const [newSop, setNewSop] = useState<Partial<SOP>>({
    title: '',
    objective: '',
    scope: '',
    roles_responsibilities: '',
    required_documentation: '',
    reporting_line: '',
    tools_channels_used: '',
    kpis: '',
    flowchart_data: '',
    department_id: 1,
    process_type: 'Standard',
    tags: '',
    status: 'Draft',
    review_date: ''
  });

  const [newStep, setNewStep] = useState<{
    step_number: number;
    step_description: string;
    attachment_url: string;
    required_course_id?: number;
  }>({
    step_number: 1,
    step_description: '',
    attachment_url: '',
    required_course_id: undefined
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const storedUserId = localStorage.getItem('user_id') || (user?.id ? String(user.id) : '1');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (storedUserId && storedUserId !== 'null' && storedUserId !== 'undefined') {
      headers['x-user-id'] = storedUserId;
    }
    return headers;
  }, [user?.id]);

  const fetchSops = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (departmentFilter !== 'All') {
        const matchedDept = departments.find(d => d.name === departmentFilter || String(d.id) === departmentFilter);
        if (matchedDept) {
          params.append('department_id', String(matchedDept.id));
        } else if (!isNaN(Number(departmentFilter))) {
          params.append('department_id', departmentFilter);
        }
      }
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      const res = await fetch(`/api/sops?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSopList(data);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to fetch SOPs from database', error);
    }
  }, [searchQuery, departmentFilter, statusFilter, departments, getAuthHeaders]);

  useEffect(() => {
    fetchSops();
  }, [fetchSops]);

  // Real-time synchronization with Supabase postgres_changes
  useEffect(() => {
    try {
      const channel = supabase
        .channel('sop-db-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sops' },
          (payload) => {
            console.log('[SOP Real-time] Database event received:', payload);
            fetchSops();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Supabase realtime subscription skipped:', err);
    }
  }, [fetchSops]);

  const fetchSopDetails = useCallback(async (id: number): Promise<SOP | null> => {
    try {
      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      const res = await fetch(`/api/sops/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedSop(data);

        // Fetch related courses
        try {
          const coursesRes = await fetch(`/api/training/courses?sop_id=${id}`, { headers });
          if (coursesRes.ok) {
            const courses = await coursesRes.json();
            setRelatedCourses(courses);
          }
        } catch (e) {
          console.error('Failed to fetch related courses', e);
        }

        // Check acknowledgment
        const userId = user?.id || parseInt(localStorage.getItem('user_id') || '1') || 1;
        try {
          const ackRes = await fetch(`/api/sops/${id}/acknowledgment?user_id=${userId}`, { headers });
          if (ackRes.ok) {
            const ackData = await ackRes.json();
            setIsAcknowledged(ackData.acknowledged);
          }
        } catch (e) {
          console.error('Failed to check acknowledgment', e);
        }

        return data;
      }
    } catch (error) {
      console.error('Failed to fetch SOP details from database', error);
    }
    // Fallback to local list if not found
    const found = sopList.find(s => s.id === id);
    if (found) {
      setSelectedSop(found);
      return found;
    }
    return null;
  }, [user?.id, sopList, getAuthHeaders]);

  const handleCreate = async (e?: React.FormEvent): Promise<SOP | null> => {
    if (e) e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const currentUserId = user?.id || parseInt(localStorage.getItem('user_id') || '1') || 1;

      const payload = {
        ...newSop,
        owner_id: currentUserId
      };
      const res = await fetch('/api/sops', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const createdData = await res.json();
        const createdId = createdData.id;
        showToast('SOP created successfully in database!', 'success');
        setNewSop({
          title: '',
          objective: '',
          scope: '',
          roles_responsibilities: '',
          required_documentation: '',
          reporting_line: '',
          tools_channels_used: '',
          kpis: '',
          flowchart_data: '',
          department_id: 1,
          process_type: 'Standard',
          tags: '',
          status: 'Draft',
          review_date: ''
        });
        await fetchSops();
        if (createdId) {
          const fullSop = await fetchSopDetails(createdId);
          return fullSop || ({ id: createdId, ...payload } as any);
        }
        return createdData;
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || 'Failed to create SOP in database', 'error');
        return null;
      }
    } catch (error) {
      console.error('Failed to create SOP in database', error);
      showToast('Failed to create SOP in database', 'error');
      return null;
    }
  };

  const handleUpdate = async (e?: React.FormEvent): Promise<boolean> => {
    if (e) e.preventDefault();
    if (!selectedSop) return false;
    try {
      const headers = getAuthHeaders();
      const currentUserId = user?.id || parseInt(localStorage.getItem('user_id') || '1') || 1;

      const res = await fetch(`/api/sops/${selectedSop.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...selectedSop,
          change_summary: changeSummary,
          updated_by: currentUserId
        })
      });
      if (res.ok) {
        const resData = await res.json();
        showToast('SOP updated successfully in database!', 'success');
        setChangeSummary('');
        await fetchSops();
        const targetId = resData.id || selectedSop.id;
        await fetchSopDetails(targetId);
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || 'Failed to update SOP', 'error');
        return false;
      }
    } catch (error) {
      console.error('Failed to update SOP in database', error);
      showToast('Failed to update SOP in database', 'error');
      return false;
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      const res = await fetch(`/api/sops/${showDeleteConfirm}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        logAudit({
          module: 'sops',
          action: 'delete',
          record_id: String(showDeleteConfirm),
          details: { message: `Deleted SOP ID ${showDeleteConfirm}` }
        });
        showToast('SOP deleted successfully from database', 'success');
        if (selectedSop?.id === showDeleteConfirm) {
          setSelectedSop(null);
        }
        await fetchSops();
      } else {
        showToast('Failed to delete SOP from database', 'error');
      }
    } catch (error) {
      console.error('Failed to delete SOP from database', error);
      showToast('Failed to delete SOP from database', 'error');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (statusOrId: string | number, newStatus?: string) => {
    let targetId: number | null = null;
    let statusToSet: string = '';

    if (typeof statusOrId === 'number') {
      targetId = statusOrId;
      statusToSet = newStatus || '';
    } else if (newStatus !== undefined) {
      targetId = Number(statusOrId);
      statusToSet = newStatus;
    } else {
      targetId = selectedSop?.id || null;
      statusToSet = String(statusOrId);
    }

    if (!targetId || !statusToSet) return;

    try {
      const headers = getAuthHeaders();
      const currentUserId = user?.id || parseInt(localStorage.getItem('user_id') || '1') || 1;

      const res = await fetch(`/api/sops/${targetId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: statusToSet, user_id: currentUserId })
      });
      if (res.ok) {
        logAudit({
          module: 'sops',
          action: 'update',
          record_id: String(targetId),
          details: { message: `Changed SOP status to ${statusToSet}` }
        });
        showToast(`SOP status updated to ${statusToSet} in database`, 'success');
        await fetchSops();
        if (selectedSop?.id === targetId) {
          await fetchSopDetails(targetId);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update SOP status', 'error');
      }
    } catch (error) {
      console.error('Failed to update SOP status in database', error);
      showToast('Failed to update SOP status in database', 'error');
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedSop) return;
    const userId = user?.id || parseInt(localStorage.getItem('user_id') || '1') || 1;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/sops/${selectedSop.id}/acknowledge`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        setIsAcknowledged(true);
        showToast('You have acknowledged reading and understanding this SOP.', 'success');
      }
    } catch (error) {
      console.error('Failed to acknowledge SOP in database', error);
      setIsAcknowledged(true);
      showToast('You have acknowledged reading and understanding this SOP.', 'success');
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSop) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/sops/${selectedSop.id}/steps`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newStep)
      });
      if (res.ok) {
        showToast('Step added to database successfully!', 'success');
        setIsAddingStep(false);
        setNewStep({
          step_number: (selectedSop.steps?.length || 0) + 2,
          step_description: '',
          attachment_url: '',
          required_course_id: undefined
        });
        await fetchSopDetails(selectedSop.id);
      } else {
        showToast('Failed to save step to database', 'error');
      }
    } catch (error) {
      console.error('Failed to add step in database', error);
      showToast('Failed to add step to database', 'error');
    }
  };

  const value: SOPContextType = {
    sopList,
    setSopList,
    selectedSop,
    setSelectedSop,
    lifecycleSopId,
    setLifecycleSopId,
    lifecycleComment,
    setLifecycleComment,
    lifecycleTransitionLog,
    setLifecycleTransitionLog,
    trainingSops,
    setTrainingSops,
    activeQuizTrainingId,
    setActiveQuizTrainingId,
    quizAnswers,
    setQuizAnswers,
    quizScore,
    setQuizScore,
    certifiedCode,
    setCertifiedCode,
    enrollEmployeeName,
    setEnrollEmployeeName,
    enrollSopId,
    setEnrollSopId,
    toast,
    setToast,
    showToast,
    showDeleteConfirm,
    setShowDeleteConfirm,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    changeSummary,
    setChangeSummary,
    isAcknowledged,
    setIsAcknowledged,
    relatedCourses,
    setRelatedCourses,
    newSop,
    setNewSop,
    newStep,
    setNewStep,
    isAddingStep,
    setIsAddingStep,
    departments,
    globalStatuses,
    users,
    setActiveModule,
    fetchSops,
    fetchSopDetails,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleStatusChange,
    handleAcknowledge,
    handleAddStep
  };

  return <SOPContext.Provider value={value}>{children}</SOPContext.Provider>;
};
