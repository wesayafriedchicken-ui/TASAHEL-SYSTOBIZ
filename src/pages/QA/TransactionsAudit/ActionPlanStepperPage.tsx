import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { 
  QualityRemediationForm 
} from '../../../components/QA/QualityRemediationForm';
import { ActionPlan } from '../../../components/QA/ActionPlansManager';
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  Zap,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const ActionPlanStepperPage: React.FC = () => {
  const { id: paramId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isNew = !paramId || paramId === 'new';

  const [plan, setPlan] = useState<Partial<ActionPlan> | null>(null);
  const [loading, setLoading] = useState<boolean>(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [presets, setPresets] = useState<any[]>([]);
  const [availableRules, setAvailableRules] = useState<any[]>([]);
  const [auditRecords, setAuditRecords] = useState<any[]>([]);

  // Fetch presets and rules
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const userId = localStorage.getItem('userId') || '';
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        };

        const [presetsRes, rulesRes, auditsRes] = await Promise.all([
          fetch('/api/qa/presets', { headers }),
          fetch('/api/qa/action-rules', { headers }),
          fetch('/api/qa/audits', { headers })
        ]);

        if (presetsRes.ok) {
          const pData = await presetsRes.json();
          setPresets(pData);
        }
        if (rulesRes.ok) {
          const rData = await rulesRes.json();
          setAvailableRules(rData);
        }
        if (auditsRes.ok) {
          const aData = await auditsRes.json();
          setAuditRecords(aData);
        }
      } catch (err) {
        console.error('Failed to load QA metadata for Action Plan stepper:', err);
      }
    };

    fetchMetadata();
  }, []);

  // Fetch or initialize plan
  useEffect(() => {
    if (isNew) {
      const locationState = location.state as { presetRecord?: any } | undefined;
      const preset = locationState?.presetRecord;

      const newCode = `AP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const nowIso = new Date().toISOString();

      const newPlan: Partial<ActionPlan> = {
        plan_code: newCode,
        title: preset 
          ? `Action Plan for ${preset.type?.toUpperCase() || 'AUDIT'} - ${preset.transaction_id || ''}: ${preset.root_cause || 'Audit Deviation'}`
          : '',
        incident_type: (preset?.type || searchParams.get('type') || 'complaint') as any,
        transaction_id: preset?.transaction_id || searchParams.get('transaction_id') || '',
        customer_name: preset?.customer_name || searchParams.get('customer_name') || '',
        agent_name: preset?.agent_name || searchParams.get('agent_name') || '',
        agent_id: preset?.agent_id || null,
        owner_id: preset?.owner_id || null,
        reviewer_id: preset?.reviewer_id || null,
        department: preset?.department || searchParams.get('department') || '',
        severity: (preset?.severity || searchParams.get('severity') || 'Medium') as any,
        status: 'Draft',
        current_step: 1,
        root_cause_category: preset?.department || '',
        root_cause_name: preset?.root_cause || '',
        root_cause_analysis: preset?.comment || '',
        assigned_to: preset?.assigned_manager || searchParams.get('assigned_to') || '',
        target_completion_date: '',
        created_by: preset?.auditor_name || '',
        created_at: nowIso,
        updated_at: nowIso,
        action_details: []
      };

      setPlan(newPlan);
      setLoading(false);
      setLoadError(null);
    } else {
      const fetchPlan = async () => {
        setLoading(true);
        setLoadError(null);
        try {
          const token = localStorage.getItem('token') || '';
          const userId = localStorage.getItem('userId') || '';
          const res = await fetch(`/api/qa/action-plans/${encodeURIComponent(paramId!)}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-user-id': userId
            }
          });

          if (!res.ok) {
            if (res.status === 404) {
              throw new Error(`Action Plan with ID / Code "${paramId}" was not found.`);
            }
            throw new Error(`Failed to load Action Plan (${res.status} ${res.statusText})`);
          }

          const data = await res.json();
          // Ensure timestamps exist
          if (!data.created_at) data.created_at = new Date().toISOString();
          if (!data.updated_at) data.updated_at = new Date().toISOString();
          setPlan(data);
        } catch (err: any) {
          console.error('Error fetching action plan:', err);
          setLoadError(err.message || 'An unexpected error occurred while loading the action plan.');
        } finally {
          setLoading(false);
        }
      };

      fetchPlan();
    }
  }, [paramId, isNew, location.state, searchParams]);

  const handleClose = () => {
    navigate('/qa/transactions-audit/action-plans');
  };

  const handleSave = async (updatedPlan: Partial<ActionPlan>) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || '';
      const userId = localStorage.getItem('userId') || '';
      
      const payload = {
        ...plan,
        ...updatedPlan,
        created_at: updatedPlan.created_at || plan?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const res = await fetch('/api/qa/action-plans', {
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
        throw new Error(errData.error || 'Failed to save action plan.');
      }

      navigate('/qa/transactions-audit/action-plans');
    } catch (err: any) {
      console.error('Error saving action plan:', err);
      alert(`Error saving action plan: ${err.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center" id="action-plan-loading">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <h3 className="text-base font-bold text-slate-900">Loading Action Plan Stepper</h3>
        <p className="text-xs text-slate-500 mt-1">Retrieving remediation plan details and quality rules for #{paramId || 'new'}...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-8 text-center max-w-xl mx-auto space-y-4 my-8" id="action-plan-error">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Action Plan Not Found</h3>
          <p className="text-xs text-slate-500 mt-1">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
        >
          Return to Action Plans Register
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="action-plan-stepper-page">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Return to action plans register"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Transactions Audit</span>
              <span className="text-slate-300">/</span>
              <Link
                to="/qa/transactions-audit/action-plans"
                className="text-[11px] font-bold text-blue-600 hover:underline capitalize"
              >
                Action Plans
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[11px] font-bold text-slate-700">Action Plan Stepper</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {isNew ? 'New Action Plan' : `Action Plan: ${plan?.plan_code || paramId}`}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-blue-50 text-blue-700 border-blue-200 uppercase">
                {plan?.incident_type || 'INCIDENT'}
              </span>
              {plan?.severity && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  plan.severity === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  plan.severity === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {plan.severity}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Audit Timestamps Badges */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Created: <strong className="text-slate-800">{plan?.created_at ? new Date(plan.created_at).toLocaleDateString() : 'Today'}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Updated: <strong className="text-slate-800">{plan?.updated_at ? new Date(plan.updated_at).toLocaleDateString() : 'Now'}</strong></span>
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

      {/* Embedded 6-Stage Quality Remediation Stepper */}
      {plan && (
        <div className="w-full">
          <QualityRemediationForm
            plan={plan}
            isOpen={true}
            isFullPage={true}
            onClose={handleClose}
            onSave={handleSave}
            saving={saving}
            presets={presets}
            availableRules={availableRules}
            auditRecords={auditRecords}
          />
        </div>
      )}
    </div>
  );
};

export default ActionPlanStepperPage;
