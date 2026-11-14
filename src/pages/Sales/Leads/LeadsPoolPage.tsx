import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  Sparkles, 
  Mail, 
  Phone, 
  Globe, 
  Share2, 
  Trash2, 
  Edit,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

const leadSources = [
  { id: 'all', label: 'All Channels' },
  { id: 'Website', label: 'Website Inquiries' },
  { id: 'Meta Ads', label: 'Meta / Facebook Ads' },
  { id: 'WhatsApp', label: 'WhatsApp Direct' },
  { id: 'Cold Outreach', label: 'Cold Outreach' },
  { id: 'Referral', label: 'Client Referral' },
];

export const LeadsPoolPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    leads, 
    users, 
    saveLead, 
    deleteLead, 
    formatCurrency, 
    isSaving, 
    showToast 
  } = useSalesContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // New Lead Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSource, setNewSource] = useState('Website');
  const [newValue, setNewValue] = useState<number>(0);
  const [newAssignedTo, setNewAssignedTo] = useState<string>('');
  const [newNotes, setNewNotes] = useState('');

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = !searchQuery || 
        (lead.name && lead.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.company && lead.company.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSource = selectedSource === 'all' || lead.source === selectedSource;
      const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;

      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [leads, searchQuery, selectedSource, selectedStatus]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const res = await saveLead({
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      company: newCompany.trim(),
      source: newSource,
      value: Number(newValue) || 0,
      assigned_to: newAssignedTo ? Number(newAssignedTo) : null,
      status: 'new',
      notes: newNotes.trim()
    });

    if (res) {
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewCompany('');
      setNewValue(0);
      setNewNotes('');
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this lead?')) {
      await deleteLead(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
          </div>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            {leadSources.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="new">New Prospect</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted to Deal</option>
            <option value="lost">Archived / Lost</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => navigate('/sales/leads/convert')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Conversion Wizard</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Lead Contact</th>
                <th className="py-3.5 px-4">Channel Source</th>
                <th className="py-3.5 px-4">Qualification Status</th>
                <th className="py-3.5 px-4">Assigned Rep</th>
                <th className="py-3.5 px-4 text-right">Potential Value</th>
                <th className="py-3.5 px-4 text-center">Convert / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No leads found in this pool view.
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => {
                  const rep = users.find(u => u.id === lead.assigned_to);
                  const isConverted = lead.status === 'converted';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{lead.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          {lead.company && <span className="font-medium text-slate-700">{lead.company}</span>}
                          {lead.email && <span className="text-slate-400">{lead.email}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 inline-flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{lead.source || 'Direct Web'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide inline-block",
                          lead.status === 'new' && "bg-blue-50 text-blue-700 border border-blue-200",
                          lead.status === 'contacted' && "bg-amber-50 text-amber-700 border border-amber-200",
                          lead.status === 'qualified' && "bg-purple-50 text-purple-700 border border-purple-200",
                          lead.status === 'converted' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                          lead.status === 'lost' && "bg-slate-100 text-slate-500"
                        )}>
                          {lead.status || 'new'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {rep?.name || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {formatCurrency(lead.value || 0)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!isConverted ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/sales/leads/convert?leadId=${lead.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition-all"
                            >
                              <span>Convert</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Converted</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                            title="Delete Lead"
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

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Capture New Prospect Lead</h3>
            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faisal Al-Harbi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Noor Logistics"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Channel Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="Website">Website</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="faisal@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+966 55 123 4567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Value</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={newValue || ''}
                    onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Assigned Sales Rep</label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Prospect Notes</label>
                <textarea
                  rows={2}
                  placeholder="Inquiry requirements, budget notes, or initial timeline..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
