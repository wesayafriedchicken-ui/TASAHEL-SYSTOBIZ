import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  DollarSign, 
  Briefcase, 
  ExternalLink, 
  FileText, 
  Plus, 
  Mail, 
  Phone 
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';

export const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, deals, stages, quotations, formatCurrency } = useSalesContext();

  const anchorCustomer = customers.find(c => String(c.id) === id);
  const companyName = anchorCustomer?.company || anchorCustomer?.name || 'Account';

  // All customers associated with this company name
  const companyContacts = customers.filter(c => 
    (c.company && c.company.toLowerCase() === companyName.toLowerCase()) ||
    c.name.toLowerCase() === companyName.toLowerCase() ||
    String(c.id) === id
  );

  const contactIds = companyContacts.map(c => c.id);

  // All deals linked to these contacts
  const companyDeals = deals.filter(d => contactIds.includes(d.customer_id));
  const totalValue = companyDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

  const wonStageIds = stages.filter(s => s.is_won || s.name.toLowerCase().includes('won')).map(s => s.id);
  const wonDeals = companyDeals.filter(d => wonStageIds.includes(d.stage_id));
  const wonRevenue = wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

  const companyQuotes = quotations.filter(q => contactIds.includes(q.customerId));

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/sales/contacts-accounts/accounts')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Corporate Accounts</span>
        </button>
      </div>

      {/* Account Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-2xl">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Corporate Account Profile
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {companyName}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {companyContacts.length} verified contact{companyContacts.length > 1 ? 's' : ''} • {companyDeals.length} opportunity records
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Pipeline Value</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">{formatCurrency(totalValue)}</span>
            <span className="text-xs font-bold text-emerald-600 block mt-1">
              {formatCurrency(wonRevenue)} Closed Won
            </span>
          </div>
        </div>
      </div>

      {/* Two Column: Left Contacts & Right Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Contacts List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Associated Contacts ({companyContacts.length})</span>
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {companyContacts.map(c => (
              <div 
                key={c.id} 
                onClick={() => navigate(`/sales/contacts-accounts/contacts/${c.id}`)}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-all cursor-pointer group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {c.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    {c.email && <span className="truncate max-w-[150px]">{c.email}</span>}
                    {c.phone && <span>• {c.phone}</span>}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Deals List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              <span>Account Pipeline Deals ({companyDeals.length})</span>
            </h3>
          </div>

          {companyDeals.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-xl">
              No active pipeline deals for this account.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {companyDeals.map(deal => {
                const stage = stages.find(s => s.id === deal.stage_id);
                return (
                  <div
                    key={deal.id}
                    onClick={() => navigate(`/sales/pipeline/deals/${deal.id}`)}
                    className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-all cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {deal.title}
                      </h4>
                      <span 
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold border inline-block mt-1"
                        style={{ 
                          backgroundColor: `${stage?.color || '#4f46e5'}15`,
                          color: stage?.color || '#4f46e5',
                          borderColor: `${stage?.color || '#4f46e5'}30`
                        }}
                      >
                        {stage?.name || 'In Progress'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">{formatCurrency(deal.value)}</span>
                      <span className="text-[10px] font-bold text-indigo-600 group-hover:underline">Inspect →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
