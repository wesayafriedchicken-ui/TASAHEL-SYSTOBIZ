import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Mail, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';

interface TemplateItem {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp';
  subject?: string;
  body: string;
}

const defaultTemplates: TemplateItem[] = [
  {
    id: '1',
    name: 'Introductory Discovery Reachout',
    channel: 'email',
    subject: 'Collaboration opportunity with {{company}}',
    body: 'Hello {{customer_name}},\n\nI came across your operations at {{company}} and noticed opportunities where our modern solutions can streamline your team workflows.\n\nWould you be open to a brief 10-minute briefing call this week?\n\nBest regards,\n{{rep_name}}'
  },
  {
    id: '2',
    name: 'Quotation Follow-Up & Review',
    channel: 'email',
    subject: 'Commercial Proposal Follow-Up: {{deal_title}}',
    body: 'Hi {{customer_name}},\n\nFollowing our earlier discussion, I wanted to follow up regarding the quotation sent for {{deal_title}} (Total: {{deal_value}}).\n\nPlease let me know if you have any questions regarding the deliverables or contract terms.\n\nBest regards,\n{{rep_name}}'
  },
  {
    id: '3',
    name: 'WhatsApp Quick Meeting Ping',
    channel: 'whatsapp',
    body: 'Hi {{customer_name}}, hope you are having a productive day! Just checking in to see if you had a chance to review the proposal for {{company}}? Happy to answer any questions here. 👍'
  }
];

export const EmailTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useSalesContext();

  const [templates, setTemplates] = useState<TemplateItem[]>(() => {
    try {
      const saved = localStorage.getItem('sales_crm_email_templates');
      return saved ? JSON.parse(saved) : defaultTemplates;
    } catch {
      return defaultTemplates;
    }
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Template Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Template copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;

    const newT: TemplateItem = {
      id: Date.now().toString(),
      name: name.trim(),
      channel,
      subject: channel === 'email' ? subject.trim() : undefined,
      body: body.trim()
    };

    const updated = [...templates, newT];
    setTemplates(updated);
    localStorage.setItem('sales_crm_email_templates', JSON.stringify(updated));

    setIsAddModalOpen(false);
    setName('');
    setSubject('');
    setBody('');
    showToast('Template created.', 'success');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this message template?')) {
      const updated = templates.filter(t => t.id !== id);
      setTemplates(updated);
      localStorage.setItem('sales_crm_email_templates', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/sales/unified-inbox/threads')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Omnichannel Threads
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/unified-inbox/templates')}
            className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs"
          >
            Templates & Snippets ({templates.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ New Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(tmpl => (
          <div
            key={tmpl.id}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    {tmpl.channel === 'email' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{tmpl.name}</h4>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{tmpl.channel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(tmpl.id, tmpl.body)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                    title="Copy Body"
                  >
                    {copiedId === tmpl.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tmpl.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {tmpl.subject && (
                <div className="p-2 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-700">
                  <span className="text-slate-400 font-medium">Subject: </span>
                  {tmpl.subject}
                </div>
              )}

              <p className="text-xs text-slate-600 whitespace-pre-wrap font-medium p-3 bg-slate-50/50 rounded-xl border border-slate-100 max-h-40 overflow-y-auto">
                {tmpl.body}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-1 text-[10px] font-bold text-indigo-600">
              <span>Tokens: {'{{customer_name}}, {{company}}, {{deal_value}}'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Template Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Create Communication Template</h3>
            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Follow-up"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp / SMS</option>
                </select>
              </div>

              {channel === 'email' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Subject Line</label>
                  <input
                    type="text"
                    placeholder="e.g. Next steps for {{company}}"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Message Body *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write message template with {{customer_name}}, {{company}}..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
