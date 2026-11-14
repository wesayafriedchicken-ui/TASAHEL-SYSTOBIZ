import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Inbox, 
  Search, 
  Send, 
  FileText, 
  MessageSquare, 
  Phone, 
  Mail, 
  ExternalLink, 
  Briefcase,
  Paperclip,
  Sparkles
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

export const InboxThreadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { customers, deals, stages, users, showToast } = useSalesContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    customers.length > 0 ? customers[0].id : null
  );

  const [messageInput, setMessageInput] = useState('');
  const [channelType, setChannelType] = useState<'email' | 'whatsapp' | 'note'>('email');

  // Static or simulated thread messages per customer with persistence in local memory
  const [threads, setThreads] = useState<Record<number, Array<{
    id: string;
    sender: 'customer' | 'rep';
    senderName: string;
    channel: string;
    content: string;
    timestamp: string;
  }>>>({
    1: [
      {
        id: 'm1',
        sender: 'customer',
        senderName: 'Client Contact',
        channel: 'email',
        content: 'Hello, could you please send the revised commercial pricing with 10 user licenses included?',
        timestamp: '10:15 AM'
      },
      {
        id: 'm2',
        sender: 'rep',
        senderName: 'Sales Rep',
        channel: 'email',
        content: 'Hi! I have prepared the quotation including the requested licenses. You can view it in the proposal link.',
        timestamp: '11:00 AM'
      }
    ]
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerDeals = deals.filter(d => d.customer_id === selectedCustomerId);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      return !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [customers, searchQuery]);

  const activeMessages = selectedCustomerId ? (threads[selectedCustomerId] || [
    {
      id: 'init',
      sender: 'customer',
      senderName: selectedCustomer?.name || 'Customer',
      channel: 'email',
      content: `Inquiry regarding services for ${selectedCustomer?.company || 'organization'}.`,
      timestamp: 'Yesterday'
    }
  ]) : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedCustomerId) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'rep' as const,
      senderName: 'You (Sales Rep)',
      channel: channelType,
      content: messageInput.trim(),
      timestamp: 'Just now'
    };

    setThreads(prev => ({
      ...prev,
      [selectedCustomerId]: [...(prev[selectedCustomerId] || []), newMsg]
    }));

    setMessageInput('');
    showToast(`Message logged via ${channelType.toUpperCase()}.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Sub-Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/sales/unified-inbox/threads')}
            className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs"
          >
            Omnichannel Threads
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/unified-inbox/templates')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Templates & Snippets
          </button>
        </div>
      </div>

      {/* Main Split Chat / Inbox Interface */}
      <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden h-[700px]">
        {/* Left Sidebar: Threads List (4 cols) */}
        <div className="md:col-span-4 border-r border-slate-200/80 flex flex-col h-full bg-slate-50/50">
          <div className="p-3.5 border-b border-slate-200/80 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No contacts found</div>
            ) : (
              filteredCustomers.map(cust => {
                const isSelected = cust.id === selectedCustomerId;
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={cn(
                      "p-3.5 flex items-start gap-3 cursor-pointer transition-colors",
                      isSelected ? "bg-indigo-50/80 border-r-2 border-indigo-600" : "hover:bg-white"
                    )}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                      {cust.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{cust.name}</h4>
                        <span className="text-[10px] text-slate-400">Recent</span>
                      </div>
                      {cust.company && (
                        <p className="text-[11px] text-slate-500 truncate">{cust.company}</p>
                      )}
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {cust.email || cust.phone || 'No direct channel'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Pane: Conversation & Context (8 cols) */}
        <div className="md:col-span-8 flex flex-col h-full bg-white">
          {selectedCustomer ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{selectedCustomer.name}</h3>
                    <p className="text-xs text-slate-400">
                      {selectedCustomer.company || 'Private Account'} • {customerDeals.length} active deal{customerDeals.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCustomer.phone && (
                    <a
                      href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors"
                    >
                      WhatsApp
                    </a>
                  )}
                  {customerDeals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate(`/sales/pipeline/deals/${customerDeals[0].id}`)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Deal #{customerDeals[0].id}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/40">
                {activeMessages.map(msg => {
                  const isRep = msg.sender === 'rep';
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[75%]",
                        isRep ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                        <span className="font-bold">{msg.senderName}</span>
                        <span>•</span>
                        <span className="uppercase">{msg.channel}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={cn(
                          "p-3.5 rounded-2xl text-xs font-medium leading-relaxed",
                          isRep 
                            ? "bg-indigo-600 text-white rounded-br-none shadow-xs" 
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-xs"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input & Channel Switcher */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 space-y-2 bg-white">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Channel:</span>
                    <button
                      type="button"
                      onClick={() => setChannelType('email')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors",
                        channelType === 'email' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannelType('whatsapp')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors",
                        channelType === 'whatsapp' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannelType('note')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors",
                        channelType === 'note' ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      Internal Note
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/sales/unified-inbox/templates')}
                    className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Insert Template</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Compose ${channelType} message to ${selectedCustomer.name}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-medium">
              Select a customer conversation thread from the left.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
