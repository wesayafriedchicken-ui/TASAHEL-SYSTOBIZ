import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  Plus, 
  Briefcase, 
  MessageSquare, 
  Calendar, 
  ExternalLink,
  Edit,
  Save,
  Trash2
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, deals, stages, saveCustomer, deleteCustomer, formatCurrency } = useSalesContext();

  const contact = customers.find(c => String(c.id) === id);
  const contactDeals = deals.filter(d => String(d.customer_id) === id);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(contact?.name || '');
  const [editCompany, setEditCompany] = useState(contact?.company || '');
  const [editEmail, setEditEmail] = useState(contact?.email || '');
  const [editPhone, setEditPhone] = useState(contact?.phone || '');

  if (!contact) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <h3 className="text-base font-black text-slate-800">Contact Not Found</h3>
        <p className="text-xs text-slate-500">The requested contact does not exist or has been removed.</p>
        <button
          type="button"
          onClick={() => navigate('/sales/contacts-accounts/contacts')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Contacts
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCustomer({
      id: contact.id,
      name: editName,
      company: editCompany,
      email: editEmail,
      phone: editPhone
    });
    setIsEditing(false);
  };

  const totalValue = contactDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Action & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/sales/contacts-accounts/contacts')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contacts List</span>
        </button>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Contact'}</span>
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {!isEditing ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-2xl">
                {contact.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {contact.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    ID #{contact.id}
                  </span>
                </div>
                {contact.company && (
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{contact.company}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {contact.phone && (
                <a
                  href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all"
                >
                  WhatsApp Chat
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Email Contact
                </a>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Company</label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>
            <div className="text-right">
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Contact Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Opportunities</span>
            <p className="text-lg font-black text-slate-900 mt-0.5">{contactDeals.length}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Pipeline Volume</span>
            <p className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totalValue)}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Direct Email</span>
            <p className="font-bold text-slate-700 mt-0.5 truncate">{contact.email || 'None'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
            <p className="font-bold text-slate-700 mt-0.5">{contact.phone || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Associated Deals Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">Associated Pipeline Deals</h2>
            <p className="text-xs text-slate-500 font-medium">All active and closed contracts linked to this contact</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/sales/pipeline/deals/new')}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-xl transition-all"
          >
            + New Deal for Contact
          </button>
        </div>

        {contactDeals.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-xl">
            No pipeline deals currently linked to this contact.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Deal Name</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3 text-right">Value</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contactDeals.map(deal => {
                  const stage = stages.find(s => s.id === deal.stage_id);
                  return (
                    <tr 
                      key={deal.id}
                      onClick={() => navigate(`/sales/pipeline/deals/${deal.id}`)}
                      className="hover:bg-slate-50/70 cursor-pointer"
                    >
                      <td className="py-3 px-3 font-bold text-slate-800">{deal.title}</td>
                      <td className="py-3 px-3">
                        <span 
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{ 
                            backgroundColor: `${stage?.color || '#4f46e5'}15`,
                            color: stage?.color || '#4f46e5',
                            borderColor: `${stage?.color || '#4f46e5'}30`
                          }}
                        >
                          {stage?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">{formatCurrency(deal.value)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-xs font-bold text-indigo-600 hover:underline">
                          View →
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
