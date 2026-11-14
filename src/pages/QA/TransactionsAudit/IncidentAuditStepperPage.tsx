import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  IncidentWorkflowStepper, 
  IncidentType, 
  AuditRecord 
} from '../../../components/QA/IncidentWorkflowStepper';
import { supabase } from '../../../lib/supabase';
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert,
  Clock,
  DollarSign,
  XCircle,
  Star
} from 'lucide-react';

interface IncidentAuditStepperPageProps {
  forcedType?: IncidentType;
}

const TYPE_CONFIG: Record<IncidentType, {
  label: string;
  pluralRoute: string;
  badgeColor: string;
  icon: any;
}> = {
  complaint: {
    label: 'Customer Complaint',
    pluralRoute: 'complaints',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: ShieldAlert
  },
  delay: {
    label: 'Order Delivery & SLA Delay',
    pluralRoute: 'delays',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock
  },
  refund: {
    label: 'Refund & Financial Adjustment',
    pluralRoute: 'refunds',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: DollarSign
  },
  cancellation: {
    label: 'Order Cancellation & Churn',
    pluralRoute: 'cancellations',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: XCircle
  },
  nps: {
    label: 'NPS & Customer Satisfaction Feedback',
    pluralRoute: 'nps',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Star
  }
};

export const IncidentAuditStepperPage: React.FC<IncidentAuditStepperPageProps> = ({ forcedType }) => {
  const { type: paramType, transactionId: paramTransactionId, id: paramId } = useParams<{ type?: string; transactionId?: string; id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const targetId = paramTransactionId || paramId;

  // Normalize incident type
  const incidentType: IncidentType = React.useMemo(() => {
    if (forcedType) return forcedType;

    // Check pathname explicitly first
    const path = (location.pathname || '').toLowerCase();
    if (path.includes('/transactions-audit/nps') || path.includes('/nps/new') || path.includes('/nps/')) return 'nps';
    if (path.includes('/transactions-audit/cancellations') || path.includes('/cancellations/new') || path.includes('/cancellation/')) return 'cancellation';
    if (path.includes('/transactions-audit/refunds') || path.includes('/refunds/new') || path.includes('/refund/')) return 'refund';
    if (path.includes('/transactions-audit/delays') || path.includes('/delays/new') || path.includes('/delay/')) return 'delay';
    if (path.includes('/transactions-audit/complaints') || path.includes('/complaints/new') || path.includes('/complaint/')) return 'complaint';

    const raw = (paramType || '').toLowerCase().trim();
    if (raw === 'nps') return 'nps';
    if (raw === 'complaint' || raw === 'complaints') return 'complaint';
    if (raw === 'delay' || raw === 'delays') return 'delay';
    if (raw === 'refund' || raw === 'refunds') return 'refund';
    if (raw === 'cancellation' || raw === 'cancellations') return 'cancellation';

    // Strip trailing 's' ONLY if not 'nps'
    const cleanType = raw !== 'nps' ? raw.replace(/s$/, '') : raw;
    if (cleanType === 'complaint') return 'complaint';
    if (cleanType === 'delay') return 'delay';
    if (cleanType === 'refund') return 'refund';
    if (cleanType === 'cancellation') return 'cancellation';
    if (cleanType === 'nps') return 'nps';
    return 'complaint';
  }, [forcedType, paramType, location.pathname]);

  const config = TYPE_CONFIG[incidentType] || TYPE_CONFIG.complaint;
  const TypeIcon = config.icon;

  const isNew = !targetId || targetId === 'new';

  const [loading, setLoading] = useState<boolean>(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [record, setRecord] = useState<Partial<AuditRecord> | null>(null);
  const [presets, setPresets] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('user_id') || '1';
        const headers = {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        };

        // Fetch presets
        const presetsPromise = fetch('/api/qa/presets', { headers })
          .then(r => r.ok ? r.json() : [])
          .catch(() => []);

        if (isNew) {
          const presetsData = await presetsPromise;
          if (isMounted) {
            setPresets(presetsData);
            setRecord({
              type: incidentType,
              transaction_id: '',
              owner: '',
              operations_owner: '',
              owner_id: null,
              request_type: '',
              request_sub_type: '',
              request_date: new Date().toISOString().slice(0, 10),
              survey_date: new Date().toISOString().slice(0, 10),
              agent_name: '',
              agent_id: null,
              customer_name: '',
              customer_phone: '',
              order_amount: 0,
              order_date: new Date().toISOString().slice(0, 10),
              sla_status: 'Met SLA',
              auditor_name: '',
              auditor_id: null,
              reviewer_id: null,
              qa_status: 'Pending',
              department: '',
              root_cause: '',
              sub_reason: '',
              error_classification: '',
              refund_amount: 0,
              refund_reason: '',
              refund_sub_reason: '',
              lose_on_employee: false,
              lose_employee_id: '',
              lose_employee_name: '',
              lose_status: 'Accepted',
              lose_amount: 0,
              comment: '',
              system_remarks: '',
              corrective_action: '',
              assigned_manager: '',
              manager_approval: 'Pending',
              current_step: 1,
              workflow_status: 'Draft',
              switches: {
                over_promise: false,
                system_remark: false,
                b1_error: false,
                b2_error: false,
                document_accuracy: false,
                avoidable_refund: false
              }
            });
            setLoading(false);
          }
          return;
        }

        // Fetch specific record by targetId (transactionId or id)
        const endpoint = incidentType === 'nps' 
          ? `/api/qa/nps/${encodeURIComponent(targetId!)}`
          : `/api/qa/transactions-audit/${encodeURIComponent(targetId!)}`;

        const [recordRes, presetsData] = await Promise.all([
          fetch(endpoint, { headers }),
          presetsPromise
        ]);

        if (recordRes.ok) {
          const data = await recordRes.json();
          if (isMounted) {
            const resolvedOwner = data.owner || data.operations_owner || data.operation_owner || data.details?.operations_owner || data.details?.owner || '';
            const resolvedComment = data.comment !== undefined && data.comment !== null ? data.comment : (data.details?.comment || data.feedback_text || '');
            setRecord({
              ...data,
              owner: resolvedOwner,
              operations_owner: resolvedOwner,
              operation_owner: resolvedOwner,
              comment: resolvedComment,
              details: {
                ...(data.details || {}),
                owner: resolvedOwner,
                operations_owner: resolvedOwner,
                comment: resolvedComment
              }
            });
            setPresets(presetsData);
            setLoading(false);
          }
        } else {
          // If record does not exist yet in database, initialize a clean draft with this transaction ID
          if (isMounted) {
            setRecord({
              type: incidentType,
              transaction_id: targetId || '',
              owner: '',
              operations_owner: '',
              owner_id: null,
              request_type: '',
              request_sub_type: '',
              request_date: new Date().toISOString().slice(0, 10),
              survey_date: new Date().toISOString().slice(0, 10),
              agent_name: '',
              agent_id: null,
              customer_name: '',
              customer_phone: '',
              order_amount: 0,
              order_date: new Date().toISOString().slice(0, 10),
              sla_status: 'Met SLA',
              auditor_name: '',
              auditor_id: null,
              reviewer_id: null,
              qa_status: 'Pending',
              department: '',
              root_cause: '',
              sub_reason: '',
              error_classification: '',
              refund_amount: 0,
              refund_reason: '',
              refund_sub_reason: '',
              lose_on_employee: false,
              lose_employee_id: '',
              lose_employee_name: '',
              lose_status: 'Accepted',
              lose_amount: 0,
              comment: '',
              system_remarks: '',
              corrective_action: '',
              assigned_manager: '',
              manager_approval: 'Pending',
              current_step: 1,
              workflow_status: 'Draft',
              switches: {
                over_promise: false,
                system_remark: false,
                b1_error: false,
                b2_error: false,
                document_accuracy: false,
                avoidable_refund: false
              }
            });
            setPresets(presetsData);
            setLoading(false);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Failed to load incident record:", err);
          setLoadError(err.message || 'Error loading transaction incident details');
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [incidentType, targetId, isNew]);

  const handleSave = async (updatedRecord: AuditRecord) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id') || '1';

    // Helper to validate and convert to ISO YYYY-MM-DD
    const formatIsoDate = (d?: string | null): string => {
      if (!d) return '';
      const trimmed = String(d).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      try {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().slice(0, 10);
        }
      } catch {}
      return '';
    };

    const safeRequestDate = formatIsoDate(updatedRecord.request_date);
    const safeSurveyDate = formatIsoDate(updatedRecord.survey_date);
    const safeChosenDate = safeRequestDate || safeSurveyDate || formatIsoDate(updatedRecord.order_date);
    const safeOrderDate = safeChosenDate || formatIsoDate(updatedRecord.order_date) || new Date().toISOString().slice(0, 10);
    const safeCreatedAt = safeChosenDate 
      ? new Date(safeChosenDate + 'T12:00:00Z').toISOString() 
      : (updatedRecord.created_at ? new Date(updatedRecord.created_at).toISOString() : new Date().toISOString());

    const safeAgentId = updatedRecord.agent_id ? String(updatedRecord.agent_id) : null;
    const safeAuditorId = updatedRecord.auditor_id ? String(updatedRecord.auditor_id) : null;
    const safeReviewerId = updatedRecord.reviewer_id ? String(updatedRecord.reviewer_id) : null;
    const safeOwnerId = updatedRecord.owner_id ? String(updatedRecord.owner_id) : null;
    const resolvedOwner = updatedRecord.owner || updatedRecord.operations_owner || (updatedRecord as any).operation_owner || '';
    const resolvedComment = updatedRecord.comment !== undefined && updatedRecord.comment !== null ? updatedRecord.comment : '';

    const payload: any = {
      ...updatedRecord,
      owner: resolvedOwner,
      operations_owner: resolvedOwner,
      operation_owner: resolvedOwner,
      comment: resolvedComment,
      transaction_id: updatedRecord.transaction_id || '',
      request_date: safeChosenDate || safeRequestDate || null,
      survey_date: safeChosenDate || safeSurveyDate || null,
      order_date: safeOrderDate,
      created_at: safeCreatedAt,
      agent_id: safeAgentId,
      auditor_id: safeAuditorId,
      reviewer_id: safeReviewerId,
      owner_id: safeOwnerId,
      order_amount: Number(updatedRecord.order_amount) || 0,
      refund_amount: Number(updatedRecord.refund_amount) || 0,
      lose_amount: Number(updatedRecord.lose_amount) || 0,
      details: {
        ...(updatedRecord.details || {}),
        owner: resolvedOwner,
        operations_owner: resolvedOwner,
        operation_owner: resolvedOwner,
        comment: resolvedComment
      }
    };

    // Console log for audit and verification
    console.log("Saving QA Transaction Audit Payload (DB & Supabase Persistence):", payload);

    // Attempt direct Supabase persistence if available
    try {
      if (supabase && typeof supabase.from === 'function') {
        const targetTable = incidentType === 'nps' ? 'qa_nps_feedbacks' : 'qa_transactions_audit';
        if (payload.id) {
          await supabase.from(targetTable).update(payload).eq('id', payload.id);
        } else {
          await supabase.from(targetTable).insert([payload]);
        }
      }
    } catch (sbErr) {
      console.warn("Notice: Supabase direct insert bypassed or fallback triggered:", sbErr);
    }
    
    if (incidentType === 'nps') {
      const res = await fetch('/api/qa/nps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify({
          id: updatedRecord.id,
          transaction_id: updatedRecord.transaction_id || '',
          qa_reference_number: updatedRecord.qa_reference_number || null,
          customer_name: updatedRecord.customer_name || '',
          agent_name: updatedRecord.agent_name || '',
          agent_id: safeAgentId,
          owner: resolvedOwner,
          operations_owner: resolvedOwner,
          owner_id: safeOwnerId,
          comment: resolvedComment,
          rating: updatedRecord.rating ?? 8,
          category: updatedRecord.category || (Number(updatedRecord.rating) >= 9 ? 'Promoter' : Number(updatedRecord.rating) >= 7 ? 'Passive' : 'Detractor'),
          feedback_text: resolvedComment || updatedRecord.manager_notes || '',
          delay_linked: updatedRecord.switches?.b1_error || false,
          root_cause: updatedRecord.root_cause || updatedRecord.bucket_3_root_cause || '',
          corrective_action: updatedRecord.corrective_action || updatedRecord.action_required || '',
          status: updatedRecord.manager_approval || (updatedRecord.qa_status === 'Pass' ? 'Reviewed' : 'Escalated'),
          auditor_name: updatedRecord.auditor_name || 'Sarah Jenkins',
          survey_date: safeChosenDate || null,
          date: safeChosenDate || null,
          created_at: safeCreatedAt
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save NPS audit record');
      }
    } else {
      const res = await fetch('/api/qa/transactions-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save transaction audit record');
      }
    }

    // Navigate back to the register
    navigate(`/qa/transactions-audit/${config.pluralRoute}`);
  };

  const handleClose = () => {
    navigate(`/qa/transactions-audit/${config.pluralRoute}`);
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <h3 className="text-base font-bold text-slate-900">Loading Incident Audit Stepper</h3>
        <p className="text-xs text-slate-500 mt-1">Retrieving incident audit data and presets for #{targetId || 'new'}...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Transaction Incident Not Found</h3>
          <p className="text-xs text-slate-500 mt-1">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
        >
          Return to {config.label} Register
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="incident-audit-stepper-page">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Return to transactions list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Transactions Audit</span>
              <span className="text-slate-300">/</span>
              <Link
                to={`/qa/transactions-audit/${config.pluralRoute}`}
                className="text-[11px] font-bold text-indigo-600 hover:underline capitalize"
              >
                {config.pluralRoute}
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[11px] font-bold text-slate-700">Incident Stepper</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {isNew ? `New ${config.label} Audit` : `Audit Stepper: ${record?.transaction_id || targetId}`}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${config.badgeColor}`}>
                {incidentType.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{incidentType === 'delay' ? '7-Stage' : incidentType === 'complaint' ? '6-Stage' : '5-Stage'} {config.label} Stepper Flow</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel & Exit
          </button>
        </div>
      </div>

      {/* Embedded Incident Workflow Stepper */}
      <div className="w-full">
        <IncidentWorkflowStepper
          type={incidentType}
          initialRecord={record as AuditRecord}
          presets={presets}
          onSave={handleSave}
          onClose={handleClose}
          isFullPage={true}
        />
      </div>
    </div>
  );
};

export default IncidentAuditStepperPage;
