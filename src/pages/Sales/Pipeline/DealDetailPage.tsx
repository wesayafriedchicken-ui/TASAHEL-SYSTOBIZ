import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  DollarSign, 
  User, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Paperclip, 
  Bell, 
  MessageSquare, 
  History, 
  Upload, 
  Trash2, 
  Edit, 
  Send,
  ExternalLink,
  Phone,
  Mail,
  Share2
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

export const DealDetailPage: React.FC = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { 
    deals, 
    stages, 
    customers, 
    users, 
    formatCurrency, 
    updateDealStage, 
    deleteDeal, 
    saveDeal, 
    showToast 
  } = useSalesContext();

  const deal = deals.find(d => String(d.id) === dealId);
  const customer = customers.find(c => c.id === deal?.customer_id);
  const rep = users.find(u => u.id === deal?.assigned_to);
  const currentStage = stages.find(s => s.id === deal?.stage_id);

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'reminders' | 'attachments' | 'history'>('overview');

  // Interactive details states
  const [dealNotes, setDealNotes] = useState<any[]>([]);
  const [dealReminders, setDealReminders] = useState<any[]>([]);
  const [dealHistory, setDealHistory] = useState<any[]>([]);
  const [dealAttachments, setDealAttachments] = useState<any[]>([]);
  
  // Note / Reminder inputs
  const [newNote, setNewNote] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Edit deal modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editValue, setEditValue] = useState<number>(0);
  const [editStageId, setEditStageId] = useState<number>(0);
  const [editRepId, setEditRepId] = useState<number>(0);
  const [editService, setEditService] = useState('');
  const [editMemo, setEditMemo] = useState('');

  // Fetch deal specific sub-resources
  useEffect(() => {
    if (!deal) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.id) headers['X-User-Id'] = String(u.id);
      } catch {}
    }

    Promise.all([
      fetch(`/api/crm/deals/${deal.id}/notes`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/crm/deals/${deal.id}/reminders`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/crm/deals/${deal.id}/history`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/crm/attachments`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
    ]).then(([notes, reminders, history, atts]) => {
      setDealNotes(notes);
      setDealReminders(reminders);
      setDealHistory(history);
      setDealAttachments(atts.filter((a: any) => a.deal_id === deal.id));
    });

    setEditTitle(deal.title);
    setEditValue(Number(deal.value || 0));
    setEditStageId(deal.stage_id);
    setEditRepId(deal.assigned_to || 0);
    setEditService(deal.service_type || '');
    setEditMemo(deal.description || '');
  }, [deal]);

  if (!deal) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <h3 className="text-base font-black text-slate-800">Deal Not Found</h3>
        <p className="text-xs text-slate-500">The requested deal could not be located or has been deleted.</p>
        <button
          type="button"
          onClick={() => navigate('/sales/pipeline/deals')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Pipeline
        </button>
      </div>
    );
  }

  // Sorted stages for the progression bar
  const sortedStages = [...stages].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const currentStageIndex = sortedStages.findIndex(s => s.id === deal.stage_id);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      const res = await fetch(`/api/crm/deals/${deal.id}/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: newNote.trim(),
          sender_id: rep?.id || null,
          customer_id: deal.customer_id
        })
      });
      if (res.ok) {
        const updated = await fetch(`/api/crm/deals/${deal.id}/notes`, { headers }).then(r => r.json());
        setDealNotes(updated);
        setNewNote('');
        showToast('Note added successfully.', 'success');
      }
    } catch {
      showToast('Failed to add note.', 'error');
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderDate) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      const res = await fetch(`/api/crm/deals/${deal.id}/reminders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: reminderTitle.trim(),
          reminder_date: reminderDate,
          user_name: rep?.name || 'Sales Rep'
        })
      });
      if (res.ok) {
        const updated = await fetch(`/api/crm/deals/${deal.id}/reminders`, { headers }).then(r => r.json());
        setDealReminders(updated);
        setReminderTitle('');
        setReminderDate('');
        showToast('Reminder scheduled.', 'success');
      }
    } catch {
      showToast('Failed to schedule reminder.', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('deal_id', String(deal.id));
      formData.append('customer_id', String(deal.customer_id));

      const res = await fetch('/api/crm/attachments', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const atts = await fetch('/api/crm/attachments').then(r => r.json());
        setDealAttachments(atts.filter((a: any) => a.deal_id === deal.id));
        showToast('Document uploaded successfully.', 'success');
      }
    } catch {
      showToast('Error uploading attachment.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (window.confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      const success = await deleteDeal(deal.id);
      if (success) {
        navigate('/sales/pipeline/deals');
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await saveDeal({
      id: deal.id,
      title: editTitle,
      value: Number(editValue),
      stage_id: editStageId,
      assigned_to: editRepId || null,
      service_type: editService,
      description: editMemo,
      customer_id: deal.customer_id,
      items: deal.items
    });
    if (updated) {
      setIsEditModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/sales/pipeline/deals')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pipeline Kanban</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => navigate(`/sales/quotations/builder?dealId=${deal.id}&customerId=${deal.customer_id}`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Quote</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Deal</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteDeal}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Deal Hero Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className="px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider"
                style={{ 
                  backgroundColor: `${currentStage?.color || '#4f46e5'}15`,
                  color: currentStage?.color || '#4f46e5',
                  borderColor: `${currentStage?.color || '#4f46e5'}30`
                }}
              >
                {currentStage?.name || 'In Progress'}
              </span>
              {deal.service_type && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                  {deal.service_type}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {deal.title}
            </h1>

            <p className="text-xs text-slate-500 font-medium max-w-2xl">
              {deal.description || 'No additional follow-up memo provided for this opportunity.'}
            </p>
          </div>

          <div className="text-left md:text-right p-4 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Opportunity Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block mt-0.5">
              {formatCurrency(deal.value)}
            </span>
            <span className="text-[11px] font-bold text-slate-500 mt-1 block">
              Owner: {rep?.name || 'Unassigned'}
            </span>
          </div>
        </div>

        {/* Interactive Stage Stepper */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Pipeline Progression</span>
            <span>Step {currentStageIndex + 1} of {sortedStages.length}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {sortedStages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={async () => {
                    await updateDealStage(deal.id, stage.id);
                    showToast(`Deal advanced to ${stage.name}.`, 'info');
                  }}
                  className={cn(
                    "p-2.5 rounded-xl text-left border transition-all text-xs font-bold flex flex-col justify-between gap-1",
                    isCurrent && "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20",
                    isPast && "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
                    !isCurrent && !isPast && "bg-white text-slate-400 border-slate-200 hover:border-indigo-300"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] opacity-70">#{idx + 1}</span>
                    {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                  </div>
                  <span className="truncate">{stage.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Section: Left Info Cards & Right Navigation Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer & Details (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Profile Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>Associated Prospect</span>
              </h3>
              {customer && (
                <button
                  type="button"
                  onClick={() => navigate(`/sales/contacts-accounts/contacts/${customer.id}`)}
                  className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {customer ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Name</span>
                  <p className="font-bold text-slate-900 mt-0.5">{customer.name}</p>
                </div>

                {customer.company && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Company / Entity</span>
                    <p className="font-bold text-slate-800 mt-0.5">{customer.company}</p>
                  </div>
                )}

                {customer.email && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
                    <a href={`mailto:${customer.email}`} className="font-semibold text-indigo-600 hover:underline mt-0.5 block truncate">
                      {customer.email}
                    </a>
                  </div>
                )}

                {customer.phone && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Direct Phone</span>
                    <a href={`tel:${customer.phone}`} className="font-semibold text-slate-700 hover:underline mt-0.5 block">
                      {customer.phone}
                    </a>
                  </div>
                )}

                {/* Direct action triggers */}
                <div className="pt-2 flex items-center gap-2">
                  {customer.phone && (
                    <a
                      href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-center font-bold text-[11px] rounded-xl transition-all"
                    >
                      WhatsApp
                    </a>
                  )}
                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-bold text-[11px] rounded-xl transition-all"
                    >
                      Send Email
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No customer account associated with this deal.</p>
            )}
          </div>

          {/* Key Facts Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide">
              Key Deal Specs
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Deal ID</span>
                <span className="font-bold text-slate-800">#{deal.id}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Product / Solution</span>
                <span className="font-bold text-slate-800 truncate max-w-[140px]">{deal.product || 'Standard'}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Service Tag</span>
                <span className="font-bold text-slate-800">{deal.service_type || 'General'}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Stage Probability</span>
                <span className="font-bold text-indigo-600">{currentStage?.is_won ? '100%' : '65%'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Tabs (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                activeTab === 'overview' ? "bg-white text-indigo-600 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Deliverables & Items
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === 'notes' ? "bg-white text-indigo-600 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Notes ({dealNotes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reminders')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === 'reminders' ? "bg-white text-indigo-600 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Reminders ({dealReminders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === 'attachments' ? "bg-white text-indigo-600 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Receipts & Docs ({dealAttachments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === 'history' ? "bg-white text-indigo-600 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & ITEMS */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide">
                Contract Deliverables & Scope Items
              </h3>

              {deal.items && deal.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deal.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-bold text-slate-800">{item.name || 'Custom Deliverable'}</td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-600">{item.quantity || 1}</td>
                          <td className="py-3 px-3 text-right font-medium text-slate-600">{formatCurrency(item.unitPrice || 0)}</td>
                          <td className="py-3 px-3 text-right font-black text-slate-900">{formatCurrency(item.total || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-xl">
                  No line items attached. Total value of {formatCurrency(deal.value)} is recorded directly.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NOTES & TIMELINE */}
          {activeTab === 'notes' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
              <form onSubmit={handleAddNote} className="space-y-3">
                <label className="text-xs font-black uppercase text-slate-800 tracking-wide block">
                  Add Communication Note / Internal Update
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    required
                    placeholder="Log a client conversation, negotiation concession, or team follow-up..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 bottom-3 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post Note</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Timeline Activity ({dealNotes.length})
                </h4>

                {dealNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No notes recorded yet.</p>
                ) : (
                  dealNotes.map((note) => (
                    <div key={note.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">{note.sender_name || 'Team Member'}</span>
                        <span className="text-slate-400 font-medium">
                          {note.created_at ? new Date(note.created_at).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
              <form onSubmit={handleAddReminder} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-indigo-500" />
                  <span>Schedule Action Item / Alert</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Follow up on revised pricing..."
                      value={reminderTitle}
                      onChange={(e) => setReminderTitle(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      required
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Add Reminder
                  </button>
                </div>
              </form>

              <div className="space-y-2.5">
                {dealReminders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No active reminders scheduled for this deal.</p>
                ) : (
                  dealReminders.map((rem: any) => (
                    <div key={rem.id} className="p-3.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{rem.title}</p>
                          <p className="text-[10px] text-slate-400">Due: {rem.reminder_date}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATTACHMENTS & RECEIPTS */}
          {activeTab === 'attachments' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 rounded-2xl p-6 text-center transition-all relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload className={cn("w-7 h-7", isUploading ? "text-indigo-600 animate-bounce" : "text-slate-400")} />
                  <p className="text-xs font-bold text-slate-700">Click or drag files here to upload</p>
                  <p className="text-[10px] text-slate-400">Attach signed contracts, RFPs, wire receipts, or PDF proposals</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Uploaded Files ({dealAttachments.length})
                </h4>

                {dealAttachments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No documents uploaded yet.</p>
                ) : (
                  dealAttachments.map((att) => (
                    <div key={att.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-bold text-slate-800 truncate">{att.file_name}</span>
                      </div>
                      <a
                        href={att.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline font-bold text-[11px] shrink-0"
                      >
                        Download / View
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT TRAIL */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide">
                Deal Activity & State Changes
              </h3>

              {dealHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No historical events recorded yet.</p>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-4 pt-1">
                  {dealHistory.map((h: any, i: number) => (
                    <div key={i} className="relative group">
                      <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
                      <div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-black text-slate-800">{h.action}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-400">{h.user_name || 'System'}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-400 text-[10px]">{h.created_at ? new Date(h.created_at).toLocaleTimeString() : ''}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{h.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Deal Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Edit Deal Parameters</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Value ({formatCurrency(0).split(' ')[0]})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editValue}
                    onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Pipeline Stage</label>
                  <select
                    value={editStageId}
                    onChange={(e) => setEditStageId(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    {sortedStages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Assigned Rep</label>
                  <select
                    value={editRepId}
                    onChange={(e) => setEditRepId(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="0">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Service Category</label>
                  <input
                    type="text"
                    value={editService}
                    onChange={(e) => setEditService(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Follow-up Notes / Memo</label>
                <textarea
                  rows={2}
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
