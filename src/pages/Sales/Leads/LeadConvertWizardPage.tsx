import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  Briefcase, 
  DollarSign, 
  UserCheck, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

export const LeadConvertWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLeadId = searchParams.get('leadId');

  const { 
    leads, 
    stages, 
    users, 
    customers, 
    convertLeadToDeal, 
    isSaving, 
    formatCurrency 
  } = useSalesContext();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLeadId || '');

  // Step 2 Customer fields
  const [custName, setCustName] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [existingCustomerId, setExistingCustomerId] = useState<string>('');

  // Step 3 Deal fields
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState<number>(0);
  const [dealStageId, setDealStageId] = useState<string>(() => stages[0]?.id ? String(stages[0].id) : '1');
  const [dealRepId, setDealRepId] = useState<string>('');
  const [dealService, setDealService] = useState('');
  const [dealNotes, setDealNotes] = useState('');

  // Auto-populate when lead is picked
  useEffect(() => {
    if (!selectedLeadId) return;
    const lead = leads.find(l => String(l.id) === selectedLeadId);
    if (lead) {
      setCustName(lead.name || '');
      setCustCompany(lead.company || '');
      setCustEmail(lead.email || '');
      setCustPhone(lead.phone || '');
      setDealTitle(`Deal for ${lead.company || lead.name}`);
      setDealValue(Number(lead.value || 0));
      if (lead.assigned_to) setDealRepId(String(lead.assigned_to));
      setDealNotes(lead.notes || '');

      // Check if existing customer matches email or company
      const matched = customers.find(c => 
        (lead.email && c.email && c.email.toLowerCase() === lead.email.toLowerCase()) ||
        (lead.company && c.company && c.company.toLowerCase() === lead.company.toLowerCase())
      );
      if (matched) {
        setExistingCustomerId(String(matched.id));
      }
    }
  }, [selectedLeadId, leads, customers]);

  const handleCompleteConversion = async () => {
    if (!selectedLeadId) return;

    const deal = await convertLeadToDeal(Number(selectedLeadId), {
      customerId: existingCustomerId ? Number(existingCustomerId) : undefined,
      customerName: custName,
      customerCompany: custCompany,
      customerEmail: custEmail,
      customerPhone: custPhone,
      title: dealTitle || `New Deal for ${custName}`,
      value: dealValue,
      stageId: Number(dealStageId),
      assignedTo: dealRepId ? Number(dealRepId) : null,
      serviceType: dealService || 'Direct Sales',
      notes: dealNotes
    });

    if (deal) {
      navigate(`/sales/pipeline/deals/${deal.id}`);
    }
  };

  const steps = [
    { num: 1, title: 'Select Prospect' },
    { num: 2, title: 'Account Mapping' },
    { num: 3, title: 'Deal Parameters' },
    { num: 4, title: 'Verify & Launch' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Back Link */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/sales/leads/pool')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Leads Pool</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Opportunity Conversion Engine</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Lead Conversion Wizard
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Seamlessly graduate qualified prospect leads into active pipeline contracts and corporate accounts.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 border-y border-slate-100 py-3">
          {steps.map(s => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div 
                key={s.num} 
                onClick={() => {
                  if (isCompleted || (s.num === 2 && selectedLeadId)) setCurrentStep(s.num);
                }}
                className={cn(
                  "flex items-center gap-2 text-xs cursor-pointer transition-colors",
                  isCurrent && "font-black text-indigo-600",
                  isCompleted && "font-bold text-emerald-600",
                  !isCurrent && !isCompleted && "font-medium text-slate-400"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0",
                  isCurrent && "bg-indigo-600 text-white font-bold",
                  isCompleted && "bg-emerald-100 text-emerald-700 font-bold",
                  !isCurrent && !isCompleted && "bg-slate-100 text-slate-400"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className="truncate hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* STEP 1: SELECT LEAD */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide">
              Step 1: Choose a Prospect from the Pool
            </h3>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 block">
                Select Lead to Convert
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
              >
                <option value="">Choose a prospect...</option>
                {leads.filter(l => l.status !== 'converted').map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} {lead.company ? `(${lead.company})` : ''} - Value: {formatCurrency(lead.value || 0)}
                  </option>
                ))}
              </select>
            </div>

            {selectedLeadId && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-1">
                <span className="font-bold text-indigo-900">Prospect ready for conversion:</span>
                <p className="text-slate-600">
                  Click Next to automatically map this contact into a verified customer account and initialize the sales deal.
                </p>
              </div>
            )}

            <div className="text-right pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={!selectedLeadId}
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <span>Continue to Account Mapping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ACCOUNT MAPPING */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>Step 2: Customer Account Verification</span>
            </h3>

            {/* Match existing toggle */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="text-[11px] font-bold text-slate-700 block">
                Link to an Existing Customer Profile (Optional)
              </label>
              <select
                value={existingCustomerId}
                onChange={(e) => setExistingCustomerId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
              >
                <option value="">Create as Brand New Customer Profile</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} - ID #{c.id}
                  </option>
                ))}
              </select>
            </div>

            {!existingCustomerId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={custCompany}
                    onChange={(e) => setCustCompany(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <span>Continue to Deal Parameters</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DEAL PARAMETERS */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              <span>Step 3: Define Opportunity Parameters</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Contract Value</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={dealValue || ''}
                    onChange={(e) => setDealValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Initial Pipeline Stage</label>
                  <select
                    value={dealStageId}
                    onChange={(e) => setDealStageId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Assigned Sales Owner</label>
                  <select
                    value={dealRepId}
                    onChange={(e) => setDealRepId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="">Select Rep...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Service Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Licensing, Consulting, Retainer..."
                    value={dealService}
                    onChange={(e) => setDealService(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <span>Review & Confirm</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: VERIFY & CONVERT */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Step 4: Final Summary & Conversion</span>
            </h3>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Profile</span>
                  <p className="font-bold text-slate-900 mt-0.5">{custName} {custCompany ? `(${custCompany})` : ''}</p>
                  <p className="text-slate-500 text-[11px]">{custEmail || 'No email'} • {custPhone || 'No phone'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Target Deal Value</span>
                  <p className="font-black text-slate-900 mt-0.5 text-base">{formatCurrency(dealValue)}</p>
                  <p className="text-slate-500 text-[11px]">Stage: {stages.find(s => String(s.id) === String(dealStageId))?.name}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Sales Rep</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {users.find(u => String(u.id) === String(dealRepId))?.name || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleCompleteConversion}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSaving ? 'Converting...' : 'Launch Opportunity in Pipeline'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
