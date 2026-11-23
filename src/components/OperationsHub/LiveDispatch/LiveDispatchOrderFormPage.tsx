import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowRight,
  UserPlus,
  Clock
} from 'lucide-react';
import {
  DispatchOrder,
  DispatchOrderFile,
  DispatchServiceUnit,
  DispatchOperationExecution,
  DispatchRepresentativeEntry,
  DispatchChangeLogEntry,
  DispatchTeam,
  DispatchRider,
  DispatchProvider,
  getDispatchAuthHeaders,
  formatShortDate
} from './types';

interface StaffMember {
  id: number;
  name: string;
  email: string;
}

const ORDER_CATEGORIES = [
  'Government Services',
  'Corporate Services',
  'Legal & Notary',
  'Travel & Visas',
  'Document Courier',
  'Delivery & Logistics',
  'General Services'
];

const ORDER_TYPES = [
  'Passport',
  'National ID',
  'Birth Certificate',
  'Marriage Certificate',
  'Driver License',
  'Commercial Register',
  'Tax Card',
  'Embassy Legalization',
  'Package Delivery',
  'Custom Request'
];

const URGENCY_TYPES = ['Standard', 'Express', 'Urgent', 'Same Day', 'VIP'];

const GOVERNORATES = [
  'Giza',
  'Cairo',
  'Alexandria',
  'Qalyubia',
  'Dakahlia',
  'Sharqia',
  'Gharbia',
  'Monufia',
  'Beheira',
  'Port Said',
  'Suez',
  'Ismailia',
  'Fayoum',
  'Beni Suef',
  'Minya',
  'Asyut',
  'Sohag',
  'Luxor',
  'Aswan',
  'Red Sea',
  'Other'
];

const DOCUMENT_RECEIPT_OPTIONS = [
  'Not Applicable',
  'Pending Pickup',
  'Received at Branch',
  'Delivered to Office',
  'In Verification',
  'Returned to Customer'
];

const OPERATIONS_STATUS_OPTIONS = [
  'New',
  'Assigned',
  'In Progress',
  'Pending Documents',
  'On Hold',
  'Completed',
  'Cancelled'
];

const HOLD_REASON_OPTIONS = [
  '',
  'Missing or Invalid Documents',
  'Waiting for Vendor',
  'Customer Unreachable',
  'Pending Payment Confirmation',
  'Government Processing Delay',
  'Address Verification Required',
  'Customer Requested Reschedule'
];

const QUEUE_OPTIONS = [
  'Government',
  'General Operations',
  'Field Dispatch',
  'Legal & Compliance',
  'VIP Desk',
  'Accounting Review'
];

const STAGE_OPTIONS = [
  'New Intake',
  'Document Verification',
  'Operations Pending - Missing/Invalid Docs',
  'Operations Pending - Waiting for Vendor',
  'In Execution',
  'Quality Check',
  'Ready for Dispatch',
  'Out for Delivery',
  'Completed',
  'Cancelled'
];

const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Urgent'];

const PAYMENT_STATUS_OPTIONS = [
  'Paid',
  'Unpaid',
  'Partially Paid',
  'Cash on Delivery',
  'Refunded'
];

const SALES_STATUS_OPTIONS = ['Won', 'Open', 'Negotiation', 'Pending Approval', 'Lost'];

const UNIT_STATUS_OPTIONS = ['New', 'In Progress', 'Pending Documents', 'Completed', 'Cancelled'];

const EXECUTION_STATUS_OPTIONS = ['New', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

const ACCOUNTING_STATUS_OPTIONS = ['Pending', 'Confirmed', 'Rejected'];

const CURRENCIES = ['EGP', 'SAR', 'USD', 'AED', 'EUR'];

const DISPATCH_STATUSES = [
  'Ready',
  'In Progress',
  'On Trip',
  'Picked-up',
  'Way To Customer',
  'Delivered',
  'Scheduled',
  'Paused',
  'Canceled',
  'Returned'
];

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeShortHex(): string {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return Math.floor(0x10000000 + Math.random() * 0xefffffff).toString(16);
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getInitials(name: string): string {
  const parts = String(name || 'OP')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'OP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatLogDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function LiveDispatchOrderFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id && id.toLowerCase() !== 'new');

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploadingGeneral, setUploadingGeneral] = useState(false);
  const [uploadingOperational, setUploadingOperational] = useState(false);
  const [showDispatchLogistics, setShowDispatchLogistics] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Reference data from MySQL
  const [teams, setTeams] = useState<DispatchTeam[]>([]);
  const [riders, setRiders] = useState<DispatchRider[]>([]);
  const [providers, setProviders] = useState<DispatchProvider[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  // Core Form State (all fields from Screenshot 1)
  const [serviceNumber, setServiceNumber] = useState(() => makeShortHex());
  const [orderNumber, setOrderNumber] = useState(() => makeShortHex());
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [orderCategory, setOrderCategory] = useState('Government Services');
  const [orderType, setOrderType] = useState('Passport');
  const [serviceUrgency, setServiceUrgency] = useState('Express');
  const [governorate, setGovernorate] = useState('Giza');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [documentReceipt, setDocumentReceipt] = useState('Not Applicable');
  const [operationsStatus, setOperationsStatus] = useState('In Progress');
  const [holdReason, setHoldReason] = useState('');
  const [operationsOfficer, setOperationsOfficer] = useState('');
  const [currentQueue, setCurrentQueue] = useState('Government');
  const [currentStage, setCurrentStage] = useState('New Intake');
  const [casePriority, setCasePriority] = useState('High');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [readyToCloseSale, setReadyToCloseSale] = useState(true);
  const [salesStatus, setSalesStatus] = useState('Won');

  // Dispatch & Billing linkage fields
  const [dispatchStatus, setDispatchStatus] = useState('Ready');
  const [teamName, setTeamName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('RBST-002');
  const [customerZone, setCustomerZone] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [balanceDue, setBalanceDue] = useState<number>(0);
  const [vehicleType, setVehicleType] = useState('Motorcycle');

  // Structured Sections (Screenshots 2 & 3)
  const [files, setFiles] = useState<DispatchOrderFile[]>([]);
  const [operationalFiles, setOperationalFiles] = useState<DispatchOrderFile[]>([]);
  const [serviceUnits, setServiceUnits] = useState<DispatchServiceUnit[]>([]);
  const [executions, setExecutions] = useState<DispatchOperationExecution[]>([]);
  const [representatives, setRepresentatives] = useState<DispatchRepresentativeEntry[]>([]);
  const [changeHistory, setChangeHistory] = useState<DispatchChangeLogEntry[]>([]);

  // Inline Representative Adder state
  const [showRepAdder, setShowRepAdder] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [customRepName, setCustomRepName] = useState('');
  const [customRepMobile, setCustomRepMobile] = useState('');
  const [repRole, setRepRole] = useState('Document Pickup & Delivery');

  const generalFileInputRef = useRef<HTMLInputElement | null>(null);
  const operationalFileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load reference data (teams, riders, providers, staff)
  useEffect(() => {
    let active = true;
    const loadRefs = async () => {
      try {
        const headers = getDispatchAuthHeaders(false);
        const [tRes, rRes, pRes, sRes] = await Promise.all([
          fetch('/api/operations/live-dispatch/teams', { headers }),
          fetch('/api/operations/live-dispatch/riders?archived=false', { headers }),
          fetch('/api/operations/live-dispatch/providers', { headers }),
          fetch('/api/operations/live-dispatch/staff', { headers })
        ]);
        if (!active) return;
        const [tData, rData, pData, sData] = await Promise.all([
          tRes.ok ? tRes.json() : [],
          rRes.ok ? rRes.json() : [],
          pRes.ok ? pRes.json() : [],
          sRes.ok ? sRes.json() : []
        ]);
        setTeams(Array.isArray(tData) ? tData : []);
        setRiders(Array.isArray(rData) ? rData : []);
        setProviders(Array.isArray(pData) ? pData : []);
        setStaff(Array.isArray(sData) ? sData : []);

        if (!isEditMode && Array.isArray(tData) && tData.length > 0) {
          setTeamName((prev) => prev || tData[0].name || '');
          setStoreName((prev) => prev || tData[0].name || '');
          setStoreCode((prev) => prev || tData[0].store_code || 'RBST-002');
        }
      } catch (err) {
        console.error('Failed to load reference lists:', err);
      }
    };
    loadRefs();
    return () => {
      active = false;
    };
  }, [isEditMode]);

  // Load existing order when editing
  const loadOrder = useCallback(async () => {
    if (!isEditMode || !id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/orders/${id}`, {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) {
        throw new Error('Order not found');
      }
      const o: DispatchOrder = await res.json();
      setServiceNumber(o.service_number || makeShortHex());
      setOrderNumber(o.order_number || '');
      setCustomerName(o.customer_name || '');
      setCustomerMobile(o.customer_mobile || '');
      setOrderDate(formatShortDate(o.order_date || o.shift_date || o.created_at).replace('—', '') || new Date().toISOString().slice(0, 10));
      setOrderCategory(o.order_category || 'Government Services');
      setOrderType(o.order_type || '');
      setServiceUrgency(o.service_urgency || 'Standard');
      setGovernorate(o.governorate || o.city || 'Giza');
      setAddress(o.address || '');
      setDescription(o.description || o.note || '');
      setDocumentReceipt(o.document_receipt || 'Not Applicable');
      setOperationsStatus(o.operations_status || 'New');
      setHoldReason(o.hold_reason || '');
      setOperationsOfficer(o.operations_officer || '');
      setCurrentQueue(o.current_queue || 'Government');
      setCurrentStage(o.current_stage || '');
      setCasePriority(o.case_priority || 'Normal');
      setPaymentStatus(o.payment_status || (o.payment_type === 'Paid' ? 'Paid' : 'Unpaid'));
      setReadyToCloseSale(Boolean(o.ready_to_close_sale));
      setSalesStatus(o.sales_status || 'Open');

      setDispatchStatus(o.status || 'Ready');
      setTeamName(o.team_name || '');
      setStoreName(o.store_name || '');
      setStoreCode(o.store_code || '');
      setCustomerZone(o.customer_zone || '');
      setAmount(Number(o.amount || 0));
      setBalanceDue(Number(o.balance_due || 0));
      setVehicleType(o.vehicle_type || 'Motorcycle');

      setFiles(Array.isArray(o.files) ? o.files : []);
      setOperationalFiles(Array.isArray(o.operational_files) ? o.operational_files : []);
      setServiceUnits(Array.isArray(o.service_units) ? o.service_units : []);
      setExecutions(Array.isArray(o.operations_executions) ? o.operations_executions : []);
      setRepresentatives(Array.isArray(o.representatives) ? o.representatives : []);
      setChangeHistory(Array.isArray(o.change_history) ? o.change_history : []);
    } catch (err: any) {
      showToast(err?.message || 'Unable to load order details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode, showToast]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Derived Individuals Progress from Service Units
  const individualsCompleted = useMemo(
    () => serviceUnits.filter((u) => u.status === 'Completed').length,
    [serviceUnits]
  );
  const individualsTotal = useMemo(
    () => Math.max(serviceUnits.length, 1),
    [serviceUnits]
  );

  // File Upload handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: 'general' | 'operational'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const setBusy = category === 'operational' ? setUploadingOperational : setUploadingGeneral;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await fetch('/api/operations/live-dispatch/upload', {
        method: 'POST',
        headers: getDispatchAuthHeaders(false),
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      const uploaded: DispatchOrderFile = await res.json();
      if (category === 'operational') {
        setOperationalFiles((prev) => [uploaded, ...prev]);
      } else {
        setFiles((prev) => [uploaded, ...prev]);
      }
      showToast(`Attached "${uploaded.name}"`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload file', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadFile = async (file: DispatchOrderFile) => {
    try {
      const res = await fetch(file.url, {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showToast(err?.message || 'Unable to download attachment', 'error');
    }
  };

  // Service Unit handlers
  const handleAddServiceUnit = () => {
    setServiceUnits((prev) => [
      ...prev,
      {
        id: makeId(),
        name: prev.length === 0 && customerName.trim() ? customerName.trim() : '',
        status: 'New'
      }
    ]);
  };

  const handleUpdateServiceUnit = (unitId: string, patch: Partial<DispatchServiceUnit>) => {
    setServiceUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, ...patch } : u)));
  };

  const handleRemoveServiceUnit = (unitId: string) => {
    setServiceUnits((prev) => prev.filter((u) => u.id !== unitId));
  };

  // Operations Execution handlers
  const handleAddExecution = () => {
    setExecutions((prev) => [
      ...prev,
      {
        id: makeId(),
        vendor: providers[0]?.name || '',
        currency: 'EGP',
        execution_amount: 0,
        execution_cost: 0,
        execution_status: 'New',
        accounting_confirmation: 'Pending',
        confirmed_by: '',
        confirmation_date: ''
      }
    ]);
  };

  const handleUpdateExecution = (execId: string, patch: Partial<DispatchOperationExecution>) => {
    setExecutions((prev) =>
      prev.map((ex) => {
        if (ex.id !== execId) return ex;
        const merged = { ...ex, ...patch };
        if (patch.accounting_confirmation === 'Confirmed' && !merged.confirmation_date) {
          merged.confirmation_date = new Date().toISOString().slice(0, 10);
          if (!merged.confirmed_by) {
            merged.confirmed_by = operationsOfficer || localStorage.getItem('user_name') || 'Accounting';
          }
        }
        return merged;
      })
    );
  };

  const handleRemoveExecution = (execId: string) => {
    setExecutions((prev) => prev.filter((ex) => ex.id !== execId));
  };

  // Representative handlers
  const handleAddRepresentative = () => {
    let repName = customRepName.trim();
    let repMobile = customRepMobile.trim();
    let riderId: number | null = null;

    if (selectedRiderId) {
      const found = riders.find((r) => String(r.id) === selectedRiderId);
      if (found) {
        riderId = found.id;
        repName = found.name;
        repMobile = found.mobile_number || '';
      }
    }

    if (!repName) {
      showToast('Select a rider or enter a representative name', 'error');
      return;
    }

    setRepresentatives((prev) => [
      ...prev,
      {
        id: makeId(),
        riderId,
        name: repName,
        mobile: repMobile,
        role: repRole,
        status: 'Assigned',
        assignedAt: new Date().toISOString()
      }
    ]);
    setSelectedRiderId('');
    setCustomRepName('');
    setCustomRepMobile('');
    setShowRepAdder(false);
  };

  const handleUpdateRepresentative = (
    repId: string,
    patch: Partial<DispatchRepresentativeEntry>
  ) => {
    setRepresentatives((prev) => prev.map((r) => (r.id === repId ? { ...r, ...patch } : r)));
  };

  const handleRemoveRepresentative = (repId: string) => {
    setRepresentatives((prev) => prev.filter((r) => r.id !== repId));
  };

  // Group change history by date (matches Screenshot 3)
  const groupedHistory = useMemo(() => {
    const groups: { dateLabel: string; entries: DispatchChangeLogEntry[] }[] = [];
    const map = new Map<string, DispatchChangeLogEntry[]>();
    changeHistory.forEach((entry) => {
      const key = formatLogDate(entry.timestamp);
      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    });
    map.forEach((entries, dateLabel) => {
      groups.push({ dateLabel, entries });
    });
    return groups;
  }, [changeHistory]);

  // Save Order (Create or Update in MySQL)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Customer Name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        service_number: serviceNumber.trim() || makeShortHex(),
        order_number: orderNumber.trim() || makeShortHex(),
        customer_name: customerName.trim(),
        customer_mobile: customerMobile.trim(),
        order_date: orderDate || new Date().toISOString().slice(0, 10),
        shift_date: orderDate || new Date().toISOString().slice(0, 10),
        order_category: orderCategory.trim(),
        order_type: orderType.trim(),
        service_urgency: serviceUrgency.trim(),
        governorate: governorate.trim(),
        city: governorate.trim(),
        address: address.trim(),
        description: description.trim(),
        note: description.trim(),
        document_receipt: documentReceipt,
        operations_status: operationsStatus,
        hold_reason: holdReason.trim(),
        operations_officer: operationsOfficer.trim(),
        current_queue: currentQueue,
        current_stage: currentStage.trim(),
        case_priority: casePriority,
        payment_status: paymentStatus,
        payment_type: paymentStatus === 'Paid' ? 'Paid' : 'Cash',
        ready_to_close_sale: readyToCloseSale,
        sales_status: salesStatus,
        individuals_completed: individualsCompleted,
        individuals_total: individualsTotal,
        status: dispatchStatus,
        team_name: teamName || teams[0]?.name || 'فرع فيصل',
        store_name: storeName || teamName || teams[0]?.name || 'فرع فيصل',
        store_code: storeCode || 'RBST-002',
        customer_zone: customerZone || address.trim().slice(0, 80),
        amount: Number(amount || 0),
        balance_due: paymentStatus === 'Paid' ? 0 : Number(balanceDue || amount || 0),
        vehicle_type: vehicleType,
        is_manual: true,
        files,
        operational_files: operationalFiles,
        service_units: serviceUnits,
        operations_executions: executions,
        representatives
      };

      const url = isEditMode
        ? `/api/operations/live-dispatch/orders/${id}`
        : '/api/operations/live-dispatch/orders';

      const res = await fetch(url, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save dispatch order');
      }

      const saved: DispatchOrder = await res.json();
      showToast(
        isEditMode
          ? 'Dispatch order updated successfully'
          : 'Dispatch order created and saved to database'
      );

      if (!isEditMode && saved?.id) {
        navigate(`/operations-hub/LiveDispatchSystem/orders/${saved.id}`, { replace: true });
      } else {
        setChangeHistory(Array.isArray(saved.change_history) ? saved.change_history : changeHistory);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving dispatch order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputBase =
    'w-full px-3 py-2 text-sm text-slate-800 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all';
  const labelBase = 'text-xs font-medium text-slate-500 whitespace-nowrap';

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading dispatch order...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Sticky Action Header */}
      <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/operations-hub/LiveDispatchSystem/orders')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders</span>
          </button>
          <span className="text-slate-300" aria-hidden="true">
            /
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 truncate">
              {isEditMode ? `Dispatch Order #${orderNumber}` : 'Create New Dispatch Order'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
              <span>Service #{serviceNumber}</span>
              <span aria-hidden="true">·</span>
              <span>{currentQueue}</span>
              <span aria-hidden="true">·</span>
              <span>{operationsStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/operations-hub/LiveDispatchSystem/orders')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Dispatch Order'}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SECTION 1: ORDER & OPERATIONS SUMMARY TABLE (Matches Screenshot 1)
         ===================================================================== */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Order & Operations Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Core service identifiers, customer contact, workflow stage, priority, and billing state.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Individuals Progress:{' '}
            <strong className="text-slate-900">
              {individualsCompleted} / {individualsTotal}
            </strong>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Row 1: Service Number | Order Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-100">
            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
              <label className={labelBase}>Service Number</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={serviceNumber}
                  onChange={(e) => setServiceNumber(e.target.value)}
                  placeholder="e.g. 340bb8cc"
                  className={`${inputBase} font-mono font-semibold text-slate-900`}
                />
                <button
                  type="button"
                  onClick={() => setServiceNumber(makeShortHex())}
                  title="Generate Service Number"
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-700 hover:border-teal-300 transition-colors shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2 border-t md:border-t-0 border-slate-100">
              <label className={labelBase}>Order Number</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. 6dbb2faf"
                  className={`${inputBase} font-mono font-semibold text-teal-800`}
                />
                <button
                  type="button"
                  onClick={() => setOrderNumber(makeShortHex())}
                  title="Generate Order Number"
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-700 hover:border-teal-300 transition-colors shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Customer Name / Mobile */}
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
            <label className={labelBase}>
              Customer / Mobile <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer full name"
                className={inputBase}
              />
              <input
                type="text"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="Mobile number (e.g. 01065355617)"
                className={`${inputBase} font-mono tabular-nums`}
              />
            </div>
          </div>

          {/* Row 3: Order Date | Order Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-100">
            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
              <label className={labelBase}>Order Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className={`${inputBase} tabular-nums`}
              />
            </div>

            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2 border-t md:border-t-0 border-slate-100">
              <label className={labelBase}>Order Category</label>
              <select
                value={orderCategory}
                onChange={(e) => setOrderCategory(e.target.value)}
                className={inputBase}
              >
                {ORDER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Order Type | Urgency Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-100">
            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
              <label className={labelBase}>Order Type</label>
              <input
                type="text"
                list="dispatch-order-types-list"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                placeholder="e.g. Passport"
                className={inputBase}
              />
              <datalist id="dispatch-order-types-list">
                {ORDER_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2 border-t md:border-t-0 border-slate-100">
              <label className={labelBase}>Type / Urgency</label>
              <select
                value={serviceUrgency}
                onChange={(e) => setServiceUrgency(e.target.value)}
                className={inputBase}
              >
                {URGENCY_TYPES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Governorate | Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-100">
            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
              <label className={labelBase}>Governorate</label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className={inputBase}
              >
                {GOVERNORATES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2 border-t md:border-t-0 border-slate-100">
              <label className={labelBase}>Customer Zone</label>
              <input
                type="text"
                value={customerZone}
                onChange={(e) => setCustomerZone(e.target.value)}
                placeholder="e.g. Faisal, Haram, Maadi"
                className={inputBase}
              />
            </div>
          </div>

          {/* Row 6: Address */}
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
            <label className={labelBase}>Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, district, building, and landmarks"
              className={inputBase}
            />
          </div>

          {/* Row 7: Description */}
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-start gap-2">
            <label className={`${labelBase} pt-2`}>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter operational instructions, payment notes, or special handling requirements..."
              className={`${inputBase} resize-y`}
            />
          </div>

          {/* Row 8: Document Receipt | Operations Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-100">
            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
              <label className={labelBase}>Document Receipt</label>
              <select
                value={documentReceipt}
                onChange={(e) => setDocumentReceipt(e.target.value)}
                className={inputBase}
              >
                {DOCUMENT_RECEIPT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2 border-t md:border-t-0 border-slate-100">
              <label className={labelBase}>Operations Status</label>
              <select
                value={operationsStatus}
                onChange={(e) => setOperationsStatus(e.target.value)}
                className={inputBase}
              >
                {OPERATIONS_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 9: Operations Hold Reason | Operations Officer */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-100">
            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
              <label className={labelBase}>Hold Reason</label>
              <select
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                className={inputBase}
              >
                <option value="">None</option>
                {HOLD_REASON_OPTIONS.filter(Boolean).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2 border-t md:border-t-0 border-slate-100">
              <label className={labelBase}>Operations Officer</label>
              <input
                type="text"
                list="dispatch-staff-list"
                value={operationsOfficer}
                onChange={(e) => setOperationsOfficer(e.target.value)}
                placeholder="Assign officer (e.g. Ahmed Ezzat)"
                className={inputBase}
              />
              <datalist id="dispatch-staff-list">
                {staff.map((s) => (
                  <option key={s.id} value={s.name || s.email} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 10: Current Queue | Current Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-100">
            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
              <label className={labelBase}>Current Queue</label>
              <select
                value={currentQueue}
                onChange={(e) => setCurrentQueue(e.target.value)}
                className={inputBase}
              >
                {QUEUE_OPTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2 border-t md:border-t-0 border-slate-100">
              <label className={labelBase}>Current Stage</label>
              <input
                type="text"
                list="dispatch-stages-list"
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value)}
                placeholder="e.g. Operations Pending - Missing/Invalid Docs"
                className={inputBase}
              />
              <datalist id="dispatch-stages-list">
                {STAGE_OPTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 11: Case Priority | Payment Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-100">
            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
              <label className={labelBase}>Case Priority</label>
              <select
                value={casePriority}
                onChange={(e) => setCasePriority(e.target.value)}
                className={inputBase}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2 border-t md:border-t-0 border-slate-100">
              <label className={labelBase}>Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentStatus(val);
                  if (val === 'Paid') setBalanceDue(0);
                }}
                className={inputBase}
              >
                {PAYMENT_STATUS_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 12: Ready to Close Sale | Sales Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-100">
            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
              <label className={labelBase}>Ready to Close Sale</label>
              <select
                value={readyToCloseSale ? 'yes' : 'no'}
                onChange={(e) => setReadyToCloseSale(e.target.value === 'yes')}
                className={inputBase}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2 border-t md:border-t-0 border-slate-100">
              <label className={labelBase}>Sales Status</label>
              <select
                value={salesStatus}
                onChange={(e) => setSalesStatus(e.target.value)}
                className={inputBase}
              >
                {SALES_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 13: Individuals Progress | Dispatch & Billing toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-slate-100">
            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-[150px_1fr] items-center gap-2">
              <span className={labelBase}>Individuals Progress</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                  {individualsCompleted} / {individualsTotal}
                </span>
                <div className="flex-1 max-w-[160px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((individualsCompleted / individualsTotal) * 100))}%`
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400">Synced with Service Units</span>
              </div>
            </div>

            <div className="px-6 py-3.5 flex items-center justify-between border-t md:border-t-0 border-slate-100">
              <span className="text-xs text-slate-500">
                Dispatch Queue: <strong className="text-slate-800">{dispatchStatus}</strong> · Amount:{' '}
                <strong className="text-slate-800 font-mono tabular-nums">{amount.toFixed(2)} EGP</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowDispatchLogistics((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer whitespace-nowrap"
              >
                <span>{showDispatchLogistics ? 'Hide Logistics' : 'Dispatch & Billing'}</span>
                {showDispatchLogistics ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Dispatch & Billing Details for Live Board integration */}
          {showDispatchLogistics && (
            <div className="px-6 py-4 bg-slate-50/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Dispatch Status</label>
                <select
                  value={dispatchStatus}
                  onChange={(e) => setDispatchStatus(e.target.value)}
                  className={inputBase}
                >
                  {DISPATCH_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Branch / Team</label>
                <select
                  value={teamName}
                  onChange={(e) => {
                    setTeamName(e.target.value);
                    setStoreName(e.target.value);
                  }}
                  className={inputBase}
                >
                  {teams.length === 0 ? (
                    <option value="فرع فيصل">Main Branch</option>
                  ) : (
                    teams.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Total Amount (EGP)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAmount(val);
                    if (paymentStatus !== 'Paid') setBalanceDue(val);
                  }}
                  className={`${inputBase} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Balance Due (EGP)</label>
                <input
                  type="number"
                  step="0.01"
                  value={balanceDue}
                  onChange={(e) => setBalanceDue(Number(e.target.value))}
                  className={`${inputBase} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className={inputBase}
                >
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Car">Car</option>
                  <option value="Van">Van</option>
                  <option value="On Foot">On Foot</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: FILES (Matches Screenshot 2, Panel 1)
         ===================================================================== */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900">Files</h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">{files.length}</span>
          </div>
          <div>
            <input
              ref={generalFileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'general')}
            />
            <button
              type="button"
              disabled={uploadingGeneral}
              onClick={() => generalFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-600 hover:text-teal-700 text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {uploadingGeneral ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{uploadingGeneral ? 'Uploading...' : 'Add File'}</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {files.length === 0 ? (
            <div className="text-sm text-slate-400">—</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {files.map((file) => (
                <div key={file.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{file.name}</div>
                      <div className="text-xs text-slate-400 tabular-nums">
                        {formatBytes(file.size)} · Uploaded by {file.uploadedBy} · {formatLogDate(file.uploadedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(file)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: OPERATIONAL FILES (Matches Screenshot 2, Panel 2)
         ===================================================================== */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900">Operational Files</h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {operationalFiles.length}
            </span>
          </div>
          <div>
            <input
              ref={operationalFileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'operational')}
            />
            <button
              type="button"
              disabled={uploadingOperational}
              onClick={() => operationalFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-600 hover:text-teal-700 text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {uploadingOperational ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{uploadingOperational ? 'Uploading...' : 'Add Operational File'}</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {operationalFiles.length === 0 ? (
            <div className="text-sm text-slate-400">—</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {operationalFiles.map((file) => (
                <div key={file.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{file.name}</div>
                      <div className="text-xs text-slate-400 tabular-nums">
                        {formatBytes(file.size)} · Uploaded by {file.uploadedBy} · {formatLogDate(file.uploadedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(file)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOperationalFiles((prev) => prev.filter((f) => f.id !== file.id))
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: SERVICE UNITS (Matches Screenshot 2, Panel 3)
         ===================================================================== */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900">Service Units</h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {serviceUnits.length}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddServiceUnit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-600 hover:text-teal-700 text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service Unit</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/40 border-b border-slate-100 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-2.5 w-1/2">Name</th>
                <th className="px-6 py-2.5 w-1/3">Status</th>
                <th className="px-6 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serviceUnits.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-5 text-sm text-slate-400">
                    No service units added yet. Click &ldquo;Add Service Unit&rdquo; to track individuals under this order.
                  </td>
                </tr>
              ) : (
                serviceUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/40">
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={unit.name}
                        onChange={(e) =>
                          handleUpdateServiceUnit(unit.id, { name: e.target.value })
                        }
                        placeholder="Applicant / unit name"
                        className={inputBase}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={unit.status}
                        onChange={(e) =>
                          handleUpdateServiceUnit(unit.id, { status: e.target.value })
                        }
                        className={inputBase}
                      >
                        {UNIT_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateServiceUnit(unit.id, {
                              status: unit.status === 'Completed' ? 'In Progress' : 'Completed'
                            })
                          }
                          title={
                            unit.status === 'Completed' ? 'Reopen Unit' : 'Mark Unit Completed'
                          }
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            unit.status === 'Completed'
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-slate-500 hover:text-teal-700 hover:bg-teal-50'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceUnit(unit.id)}
                          title="Delete Unit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: OPERATIONS EXECUTION (Matches Screenshot 2, Panel 4)
         ===================================================================== */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900">Operations Execution</h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {executions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddExecution}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-600 hover:text-teal-700 text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Execution</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-slate-50/40 border-b border-slate-100 font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-2.5 min-w-[180px]">Vendor</th>
                <th className="px-3 py-2.5 min-w-[90px]">Currency</th>
                <th className="px-3 py-2.5 min-w-[125px] text-right">Execution Amount</th>
                <th className="px-3 py-2.5 min-w-[125px] text-right">Execution Cost</th>
                <th className="px-3 py-2.5 min-w-[130px]">Execution Status</th>
                <th className="px-3 py-2.5 min-w-[140px]">Accounting Confirmation</th>
                <th className="px-3 py-2.5 min-w-[140px]">Confirmed By</th>
                <th className="px-3 py-2.5 min-w-[130px]">Confirmation Date</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {executions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-5 text-sm text-slate-400">
                    No operations execution entries yet. Click &ldquo;Add Execution&rdquo; to assign a vendor and track execution costs.
                  </td>
                </tr>
              ) : (
                executions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        list="dispatch-vendors-list"
                        value={ex.vendor}
                        onChange={(e) =>
                          handleUpdateExecution(ex.id, { vendor: e.target.value })
                        }
                        placeholder="e.g. Hamada Mokhtar / GOV"
                        className="w-full px-2.5 py-1.5 text-xs font-medium text-teal-800 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-600"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={ex.currency}
                        onChange={(e) =>
                          handleUpdateExecution(ex.id, { currency: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-xs font-semibold text-teal-800 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-600"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        value={ex.execution_amount}
                        onChange={(e) =>
                          handleUpdateExecution(ex.id, {
                            execution_amount: Number(e.target.value)
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs text-right font-mono tabular-nums text-slate-800 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-600"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        value={ex.execution_cost}
                        onChange={(e) =>
                          handleUpdateExecution(ex.id, {
                            execution_cost: Number(e.target.value)
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs text-right font-mono tabular-nums text-slate-800 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-600"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={ex.execution_status}
                        onChange={(e) =>
                          handleUpdateExecution(ex.id, { execution_status: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-600"
                      >
                        {EXECUTION_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={ex.accounting_confirmation}
                        onChange={(e) =>
                          handleUpdateExecution(ex.id, {
                            accounting_confirmation: e.target.value
                          })
                        }
                        className={`w-full px-2 py-1.5 text-xs font-semibold bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-600 ${
                          ex.accounting_confirmation === 'Confirmed'
                            ? 'text-emerald-700'
                            : ex.accounting_confirmation === 'Rejected'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {ACCOUNTING_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        value={ex.confirmed_by}
                        onChange={(e) =>
                          handleUpdateExecution(ex.id, { confirmed_by: e.target.value })
                        }
                        placeholder="—"
                        className="w-full px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-600"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="date"
                        value={ex.confirmation_date}
                        onChange={(e) =>
                          handleUpdateExecution(ex.id, { confirmation_date: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-xs font-mono tabular-nums text-slate-700 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-600"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveExecution(ex.id)}
                        title="Remove Execution"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <datalist id="dispatch-vendors-list">
            {providers.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
        </div>
      </section>

      {/* =====================================================================
          SECTION 6: REPRESENTATIVES / COURIERS (Matches Screenshot 3, Panel 1)
         ===================================================================== */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900">Representatives</h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {representatives.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowRepAdder((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-600 hover:text-teal-700 text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Assign Representative</span>
          </button>
        </div>

        {showRepAdder && (
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Select Rider from Fleet
              </label>
              <select
                value={selectedRiderId}
                onChange={(e) => {
                  setSelectedRiderId(e.target.value);
                  const found = riders.find((r) => String(r.id) === e.target.value);
                  if (found) {
                    setCustomRepName(found.name);
                    setCustomRepMobile(found.mobile_number || '');
                  }
                }}
                className={inputBase}
              >
                <option value="">-- Choose rider or type custom --</option>
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Representative Name
              </label>
              <input
                type="text"
                value={customRepName}
                onChange={(e) => {
                  setCustomRepName(e.target.value);
                  if (selectedRiderId) setSelectedRiderId('');
                }}
                placeholder="Full name"
                className={inputBase}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Mobile</label>
              <input
                type="text"
                value={customRepMobile}
                onChange={(e) => setCustomRepMobile(e.target.value)}
                placeholder="Phone number"
                className={`${inputBase} font-mono tabular-nums`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Task / Role</label>
              <select
                value={repRole}
                onChange={(e) => setRepRole(e.target.value)}
                className={inputBase}
              >
                <option value="Document Pickup & Delivery">Document Pickup & Delivery</option>
                <option value="Government Submission">Government Submission</option>
                <option value="Customer Delivery">Customer Delivery</option>
                <option value="Branch Transfer">Branch Transfer</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRepresentative}
                className="flex-1 px-3 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Assign
              </button>
              <button
                type="button"
                onClick={() => setShowRepAdder(false)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="px-6 py-4">
          {representatives.length === 0 ? (
            <div className="text-sm text-slate-400">—</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {representatives.map((rep) => (
                <div
                  key={rep.id}
                  className="py-2.5 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {getInitials(rep.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{rep.name}</div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        {rep.mobile || 'No phone'} · {rep.role} · Assigned {formatLogDate(rep.assignedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={rep.status}
                      onChange={(e) =>
                        handleUpdateRepresentative(rep.id, { status: e.target.value })
                      }
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-600"
                    >
                      <option value="Assigned">Assigned</option>
                      <option value="On Way">On Way</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveRepresentative(rep.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove Representative"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          SECTION 7: CHANGE HISTORY / ACTIVITY LOG (Matches Screenshot 3, Panel 2)
         ===================================================================== */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900">Change History</h2>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {changeHistory.length} {changeHistory.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {groupedHistory.length === 0 ? (
            <div className="px-6 py-6 text-sm text-slate-400">
              Change history will be recorded automatically once this dispatch order is saved.
            </div>
          ) : (
            groupedHistory.map((group) => (
              <div key={group.dateLabel} className="px-6 py-4 space-y-4">
                <div className="text-xs font-semibold font-mono tabular-nums text-slate-500">
                  {group.dateLabel}
                </div>
                <div className="space-y-4">
                  {group.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {getInitials(entry.actor)}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-900">{entry.actor}</span>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-blue-700 font-medium">{entry.queue}</span>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-slate-500">{entry.action}</span>
                          </div>
                          <div className="space-y-1">
                            {entry.changes.map((chg, idx) => (
                              <div
                                key={`${entry.id}-${idx}`}
                                className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700"
                              >
                                <span className="font-medium text-slate-500">{chg.field}:</span>
                                <span className="text-slate-400 line-through">
                                  {chg.oldValue}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-900">
                                  {chg.newValue}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0 pt-1">
                        {formatLogTime(entry.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </form>
  );
}
