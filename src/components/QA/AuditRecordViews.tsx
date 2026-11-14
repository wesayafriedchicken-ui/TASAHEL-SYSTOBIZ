import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Target, 
  Eye, 
  FileSpreadsheet,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  Star,
  Trash2
} from 'lucide-react';
import { AuditRecord, IncidentType } from './IncidentWorkflowStepper';
import { SortableColumnHeader } from './SortableColumnHeader';

interface AuditListTableViewProps {
  audits: AuditRecord[];
  currentIncidentType: IncidentType | null;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onTriggerActionPlan: (rec: Partial<AuditRecord>) => void;
  onOpenStepper: (rec: AuditRecord) => void;
  onDeleteAudit?: (rec: AuditRecord) => void;
}

export const AuditListTableView: React.FC<AuditListTableViewProps> = ({
  audits,
  currentIncidentType,
  sortField,
  sortDirection,
  onSort,
  onTriggerActionPlan,
  onOpenStepper,
  onDeleteAudit,
}) => {
  if (audits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-400">
        <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <p className="font-bold text-slate-700 text-xs">No transaction audit records found</p>
        <p className="text-[11px] text-slate-400 mt-1">Try adjusting your filters or date range, or click "Pull Orders / Import Sheet".</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <SortableColumnHeader
                label="Transaction ID & Date"
                field="order_date"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableColumnHeader
                label="Agent & Customer"
                field="agent_name"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableColumnHeader
                label="QA Auditor"
                field="auditor_name"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableColumnHeader
                label="Department & Root Cause"
                field="department"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableColumnHeader
                label="SLA / QA Status"
                field="qa_status"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              {currentIncidentType === 'refund' && (
                <SortableColumnHeader
                  label="Refund Amount"
                  field="refund_amount"
                  currentSortField={sortField}
                  currentSortDirection={sortDirection}
                  onSort={onSort}
                />
              )}
              <SortableColumnHeader
                label="Manager Review"
                field="manager_approval"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              <th className="p-3.5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Workflow Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-xs">
            {audits.map((item, idx) => (
              <tr key={item.id ? `audit-${item.id}` : `audit-${item.transaction_id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-mono font-bold text-slate-900 text-xs">
                  <span className="block">{item.transaction_id}</span>
                  {item.qa_reference_number && (
                    <span className="inline-block mt-0.5 text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-200">
                      {item.qa_reference_number}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-normal font-sans block">
                    {new Date(item.order_date).toLocaleDateString('en-GB')}
                  </span>
                </td>

                <td className="p-3.5">
                  <span className="block font-bold text-slate-800 text-xs">{item.agent_name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.customer_name}</span>
                </td>

                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-[11px] shrink-0">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-bold text-slate-800 text-xs truncate max-w-[130px]">
                        {item.auditor_name || 'QA Specialist'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        QA Auditor
                      </span>
                    </div>
                  </div>
                </td>

                <td className="p-3.5">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] mb-1">
                    {item.department}
                  </span>
                  <span className="block text-slate-800 font-bold truncate max-w-[180px] text-xs">
                    {item.root_cause || 'Root cause pending...'}
                  </span>
                  {item.sub_reason && <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">{item.sub_reason}</span>}
                </td>

                <td className="p-3.5">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      item.qa_status === 'Pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {item.qa_status === 'Pass' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{item.qa_status}</span>
                    </span>

                    <span className={`block text-[10px] font-bold ${
                      item.sla_status === 'Breached SLA' ? 'text-rose-600' : 'text-slate-400'
                    }`}>
                      {item.sla_status}
                    </span>
                  </div>
                </td>

                {currentIncidentType === 'refund' && (
                  <td className="p-3.5 font-bold text-indigo-900 text-xs">
                    {item.refund_amount?.toLocaleString() || 0} EGP
                    {item.switches?.avoidable_refund && (
                      <span className="block text-[9px] text-rose-600 font-extrabold">Avoidable Refund</span>
                    )}
                  </td>
                )}

                <td className="p-3.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    item.manager_approval === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    item.manager_approval === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    <UserCheck className="w-3 h-3" />
                    <span>{item.manager_approval}</span>
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">{item.assigned_manager}</span>
                </td>

                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => onTriggerActionPlan(item)}
                      className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 border border-indigo-100 hover:border-indigo-600 group"
                      title="Trigger Action Plan (إنشاء خطة عمل وتحليل السبب الجذري)"
                      aria-label="Action Plan"
                    >
                      <Target className="w-4 h-4 text-indigo-600 group-hover:text-amber-300 transition-colors" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenStepper(item)}
                      className="p-2 bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 border border-slate-200 hover:border-slate-800"
                      title="Audit Details & Stepper (مراجعة وتدقيق)"
                      aria-label="Audit Record"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {onDeleteAudit && (
                      <button
                        type="button"
                        onClick={() => onDeleteAudit(item)}
                        className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 border border-rose-100 hover:border-rose-600"
                        title="Delete Audit Record (حذف السجل)"
                        aria-label="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AuditBoardCardsView: React.FC<AuditListTableViewProps> = ({
  audits,
  currentIncidentType,
  onTriggerActionPlan,
  onOpenStepper,
  onDeleteAudit,
}) => {
  if (audits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-400">
        <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <p className="font-bold text-slate-700 text-xs">No transaction audit records found</p>
        <p className="text-[11px] text-slate-400 mt-1">Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {audits.map((item, idx) => (
        <div 
          key={item.id ? `card-${item.id}` : `card-${item.transaction_id}-${idx}`}
          className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3"
        >
          {/* Card Top */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <span className="font-mono font-bold text-indigo-700 text-xs block">{item.transaction_id}</span>
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {new Date(item.order_date).toLocaleDateString('en-GB')}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
              {item.department}
            </span>
          </div>

          {/* Customer, Agent & QA Auditor */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Agent:</span>
              <span className="font-bold text-slate-800">{item.agent_name}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Customer:</span>
              <span className="font-medium text-slate-700 truncate max-w-[150px]">{item.customer_name}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">QA Auditor:</span>
              <span className="font-bold text-indigo-700 truncate max-w-[150px]">{item.auditor_name || 'QA Specialist'}</span>
            </div>
          </div>

          {/* Root Cause Bucket */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Root Cause</span>
            <span className="block font-bold text-slate-800 text-xs truncate" title={item.root_cause || 'Root cause pending...'}>
              {item.root_cause || 'Root cause pending...'}
            </span>
            {item.sub_reason && (
              <span className="text-[10px] text-slate-500 block truncate">{item.sub_reason}</span>
            )}
          </div>

          {/* Status & Metrics */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                item.qa_status === 'Pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {item.qa_status === 'Pass' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                <span>{item.qa_status}</span>
              </span>

              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                item.manager_approval === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                item.manager_approval === 'Rejected' ? 'bg-rose-50 text-rose-700' :
                'bg-amber-50 text-amber-800'
              }`}>
                {item.manager_approval}
              </span>
            </div>

            {currentIncidentType === 'refund' && (
              <span className="font-bold text-xs text-indigo-900">
                {item.refund_amount?.toLocaleString() || 0} EGP
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onTriggerActionPlan(item)}
              className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 border border-indigo-100 hover:border-indigo-600 group"
              title="Action Plan & RCA"
              aria-label="Action Plan"
            >
              <Target className="w-4 h-4 text-indigo-600 group-hover:text-amber-300 transition-colors" />
            </button>
            <button
              type="button"
              onClick={() => onOpenStepper(item)}
              className="p-2 bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 border border-slate-200 hover:border-slate-800"
              title="Audit Stepper"
              aria-label="Audit"
            >
              <Eye className="w-4 h-4" />
            </button>
            {onDeleteAudit && (
              <button
                type="button"
                onClick={() => onDeleteAudit(item)}
                className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 border border-rose-100 hover:border-rose-600"
                title="Delete Record"
                aria-label="Delete Record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

interface NpsListTableViewProps {
  npsRecords: any[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onOpenStepper: (rec: any) => void;
  onTriggerActionPlan: (rec: Partial<AuditRecord>) => void;
  onDeleteNps?: (rec: any) => void;
}

export const NpsListTableView: React.FC<NpsListTableViewProps> = ({
  npsRecords,
  sortField,
  sortDirection,
  onSort,
  onOpenStepper,
  onTriggerActionPlan,
  onDeleteNps,
}) => {
  if (npsRecords.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-400">
        <Star className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <p className="font-bold text-slate-700 text-xs">No NPS feedback records found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <SortableColumnHeader
                label="Transaction & Customer"
                field="transaction_id"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableColumnHeader
                label="Agent"
                field="agent_name"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableColumnHeader
                label="QA Auditor"
                field="auditor_name"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableColumnHeader
                label="Rating & Category"
                field="rating"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              <th className="p-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer Comment</th>
              <SortableColumnHeader
                label="Root Cause"
                field="root_cause"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableColumnHeader
                label="Action & Status"
                field="status"
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              />
              <th className="p-3.5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Workflow Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-xs">
            {npsRecords.map((item, idx) => (
              <tr key={item.id ? `nps-${item.id}` : `nps-${item.transaction_id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-bold text-slate-900">
                  <span className="block font-mono text-[11px] text-indigo-600">{item.transaction_id}</span>
                  {item.qa_reference_number && (
                    <span className="inline-block mt-0.5 text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-200">
                      {item.qa_reference_number}
                    </span>
                  )}
                  <span className="text-xs block text-slate-700">{item.customer_name}</span>
                </td>

                <td className="p-3.5 text-slate-800 font-bold text-xs">{item.agent_name}</td>

                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-[11px] shrink-0">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-bold text-slate-800 text-xs truncate max-w-[130px]">
                        {item.auditor_name || 'QA Specialist'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        QA Auditor
                      </span>
                    </div>
                  </div>
                </td>

                <td className="p-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-6 h-6 rounded-lg text-white font-black text-xs flex items-center justify-center ${
                      item.rating >= 9 ? 'bg-emerald-600' : item.rating >= 7 ? 'bg-amber-500' : 'bg-rose-600'
                    }`}>
                      {item.rating}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      item.category === 'Promoter' ? 'bg-emerald-50 text-emerald-700' :
                      item.category === 'Passive' ? 'bg-amber-50 text-amber-700' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                </td>

                <td className="p-3.5 max-w-xs text-slate-700 italic text-[11px]">
                  {item.feedback_text || item.comment || 'No verbal comment provided.'}
                </td>

                <td className="p-3.5 font-bold text-slate-800 text-xs">
                  {item.root_cause || 'Wrong Evaluation'}
                </td>

                <td className="p-3.5">
                  <span className="block font-bold text-slate-800 text-xs">{item.corrective_action || 'Coaching Required'}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{item.status || 'Pending'}</span>
                </td>

                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => onTriggerActionPlan({
                        type: 'nps',
                        transaction_id: item.transaction_id,
                        customer_name: item.customer_name,
                        agent_name: item.agent_name,
                        department: item.department || 'Customer Service',
                        root_cause: item.root_cause || 'Customer Detractor Feedback',
                        comment: item.feedback_text || item.comment || 'NPS score below benchmark needing quality action plan remediation.'
                      })}
                      className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 border border-indigo-100 hover:border-indigo-600 group"
                      title="Trigger Action Plan (إنشاء خطة عمل)"
                      aria-label="Action Plan"
                    >
                      <Target className="w-4 h-4 text-indigo-600 group-hover:text-amber-300 transition-colors" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenStepper(item)}
                      className="p-2 bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 border border-slate-200 hover:border-slate-800"
                      title="Audit Details (تدقيق)"
                      aria-label="Audit"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {onDeleteNps && (
                      <button
                        type="button"
                        onClick={() => onDeleteNps(item)}
                        className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 border border-rose-100 hover:border-rose-600"
                        title="Delete NPS Record (حذف السجل)"
                        aria-label="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const NpsBoardCardsView: React.FC<NpsListTableViewProps> = ({
  npsRecords,
  onOpenStepper,
  onTriggerActionPlan,
  onDeleteNps,
}) => {
  if (npsRecords.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-400">
        <Star className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <p className="font-bold text-slate-700 text-xs">No NPS feedback records found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {npsRecords.map((item, idx) => (
        <div
          key={item.id ? `nps-card-${item.id}` : `nps-card-${item.transaction_id}-${idx}`}
          className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3"
        >
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <span className="font-mono font-bold text-indigo-700 text-xs block">{item.transaction_id}</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">{item.customer_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-lg text-white font-black text-xs flex items-center justify-center ${
                item.rating >= 9 ? 'bg-emerald-600' : item.rating >= 7 ? 'bg-amber-500' : 'bg-rose-600'
              }`}>
                {item.rating}
              </span>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                item.category === 'Promoter' ? 'bg-emerald-50 text-emerald-700' :
                item.category === 'Passive' ? 'bg-amber-50 text-amber-700' :
                'bg-rose-50 text-rose-700'
              }`}>
                {item.category}
              </span>
            </div>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Agent:</span>
              <span className="font-bold text-slate-800">{item.agent_name}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">QA Auditor:</span>
              <span className="font-bold text-indigo-700 truncate max-w-[150px]">{item.auditor_name || 'QA Specialist'}</span>
            </div>
            <p className="text-slate-600 italic text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
              "{item.feedback_text || item.comment || 'No feedback text'}"
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-400">Root Cause:</span>
            <span className="font-bold text-slate-800">{item.root_cause || 'Wrong Evaluation'}</span>
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onTriggerActionPlan({
                type: 'nps',
                transaction_id: item.transaction_id,
                customer_name: item.customer_name,
                agent_name: item.agent_name,
                department: item.department || 'Customer Service',
                root_cause: item.root_cause || 'Customer Detractor Feedback',
                comment: item.feedback_text || item.comment || 'NPS remediation'
              })}
              className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 border border-indigo-100 hover:border-indigo-600 group"
              title="Action Plan"
              aria-label="Action Plan"
            >
              <Target className="w-4 h-4 text-indigo-600 group-hover:text-amber-300 transition-colors" />
            </button>
            <button
              type="button"
              onClick={() => onOpenStepper(item)}
              className="p-2 bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 border border-slate-200 hover:border-slate-800"
              title="Audit Details"
              aria-label="Audit"
            >
              <Eye className="w-4 h-4" />
            </button>
            {onDeleteNps && (
              <button
                type="button"
                onClick={() => onDeleteNps(item)}
                className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 border border-rose-100 hover:border-rose-600"
                title="Delete NPS Record"
                aria-label="Delete Record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
