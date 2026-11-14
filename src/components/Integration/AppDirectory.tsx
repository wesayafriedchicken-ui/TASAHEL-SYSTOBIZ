import React, { useState } from 'react';
import { 
  Search, Grid, Sparkles, MessageSquare, ShoppingBag, CreditCard, 
  Cpu, Key, Link as LinkIcon, BadgeAlert, Check, CheckCircle2,
  Trash, ArrowRight, Video, Mail, Smartphone, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { Integration } from '../../types';

interface AppDirectoryProps {
  onConnect: (connector: { name: string, type: string, iconType?: string }) => void;
  integrations: Integration[];
  onOpenConfig: (integration: Integration) => void;
}

export const AppDirectory: React.FC<AppDirectoryProps> = ({ 
  onConnect, 
  integrations,
  onOpenConfig
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Marketing' | 'AI' | 'Payments'>('All');

  const DIRECTORY_APPS = [
    {
      id: 'facebook_lead_ads',
      name: 'Facebook Lead Ads',
      category: 'Marketing',
      desc: 'Connect your Facebook Pages and specify Lead Ad Forms. Imported leads map dynamically to CRM Leads in real-time via Meta Webhooks.',
      icon: <MessageSquare className="w-5 h-5 text-blue-600" />,
      type: 'facebook_leads',
      badge: 'Certified',
      benefits: ['Real-Time Webhook Streaming', 'Page & Lead Form Association', 'Custom CRM Mapping Schema']
    },
    {
      id: 'tiktok_ads',
      name: 'TikTok Ads integration',
      category: 'Marketing',
      desc: 'Receive immediate notifications on TikTok Lead forms and assign follow-ups inside CRM.',
      icon: <Video className="w-5 h-5 text-rose-500" />,
      type: 'facebook',
      badge: 'Popular',
      benefits: ['Fast tracking', 'Form syncing']
    },
    {
      id: 'whatsapp_api',
      name: 'WhatsApp Business API',
      category: 'Marketing',
      desc: 'Connect with customers on the worlds most popular messaging app. Send instant follow-up alerts, automated replies, and interactive template messages.',
      icon: <MessageSquare className="w-5 h-5 text-emerald-500" />,
      type: 'whatsapp',
      badge: 'Verified',
      benefits: ['Instant notification templates', 'Automated CRM feedback loops', 'Interactive chat logs']
    },
    {
      id: 'meta_api',
      name: 'Meta Unified API (Messenger & IG)',
      category: 'Marketing',
      desc: 'Synchronize page message payloads, TikTok comments, and Instagram comment threads directly as leads inside your dashboard tracking.',
      icon: <MessageSquare className="w-5 h-5 text-indigo-500" />,
      type: 'meta_ads',
      badge: 'Advanced',
      benefits: ['Two-way social synchronization', 'Lead collection directly from comments', 'Unified lead flow interface']
    },
    {
      id: 'google_ai_studio',
      name: 'Google AI Studio (Gemini)',
      category: 'AI',
      desc: 'Integrate the Gemini LLM into custom pipelines to analyze continuous customer sentiments or suggestions.',
      icon: <Sparkles className="w-5 h-5 text-violet-600 animate-pulse" />,
      type: 'email',
      badge: 'Advanced AI',
      benefits: ['Sentiment Analysis', 'Automatic Task Routing']
    },
    {
      id: 'custom_ai_provider',
      name: 'Any AI Provider LLM (Custom AI Router)',
      category: 'AI',
      desc: 'Connect the AI Boardroom and AI Business models to any other AI supplier in the world (OpenAI, Claude, custom endpoint, etc.) with custom model parameters.',
      icon: <Cpu className="w-5 h-5 text-indigo-600 animate-pulse" />,
      type: 'custom_ai',
      badge: 'Universal Router',
      benefits: ['Supports OpenAI, Claude, DeepSeek APIs', 'Allows custom model specification', 'Dynamic router failover mapping']
    },
    {
      id: 'gemini_gateway',
      name: 'Gemini API Router',
      category: 'AI',
      desc: 'A unified prompt engineering workspace connection designed for HR performance scoring.',
      icon: <Cpu className="w-5 h-5 text-indigo-500" />,
      type: 'email',
      badge: 'Intelligence',
      benefits: ['Score compilation', 'SOP flow generation']
    },
    {
      id: 'stripe_gateway',
      name: 'Stripe Payment Hub',
      category: 'Payments',
      desc: 'Link active Stripe checkouts and payouts to Accounting General Ledger and invoices in real-time.',
      icon: <CreditCard className="w-5 h-5 text-sky-600" />,
      type: 'zapier',
      badge: 'Financial',
      benefits: ['Instant bookkeeping', 'Invoice auto-payment']
    },
    {
      id: 'shopify_sync',
      name: 'Shopify Store Connector',
      category: 'Payments',
      desc: 'Sync catalog product status, levels, order invoices, and CRM inventory values automatically.',
      icon: <ShoppingBag className="w-5 h-5 text-emerald-600" />,
      type: 'google_sheets',
      badge: 'E-Commerce',
      benefits: ['Inventory syncing', 'Sales CRM logging']
    }
  ];

  // Filter based on search and category
  const filteredApps = DIRECTORY_APPS.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isInstalled = (type: string) => {
    return integrations.some(i => i.type === type);
  };

  const getInstalledIntegration = (type: string) => {
    return integrations.find(i => i.type === type);
  };

  return (
    <div className="space-y-6 text-left" dir="ltr">
      {/* Search and Category Filtering Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search integrations, platforms or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium text-slate-800"
          />
        </div>
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'All', label: 'All Apps' },
            { id: 'Marketing', label: 'Marketing' },
            { id: 'AI', label: 'AI Tools' },
            { id: 'Payments', label: 'Payments & E-Commerce' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white hover:bg-slate-100 border border-slate-250 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Directory Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map(app => {
          const installed = isInstalled(app.type);
          const activeItem = getInstalledIntegration(app.type);
          
          return (
            <div 
              key={app.id} 
              className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group ${
                installed ? 'border-blue-500 bg-blue-50/5' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header item */}
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-slate-50 group-hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors">
                    {app.icon}
                  </div>
                  
                  {/* Status Indicator */}
                  {installed ? (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold tracking-wider bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full uppercase border border-blue-200">
                      <Check className="w-3 h-3 text-blue-700" /> Connected
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold tracking-wider bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full uppercase border border-orange-100">
                      {app.badge}
                    </span>
                  )}
                </div>

                {/* Info titles */}
                <h3 className="font-bold text-slate-850 text-base">{app.name}</h3>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase mt-0.5">
                  {app.category} APPLICATION
                </span>
                
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-3.5 mb-4">
                  {app.desc}
                </p>

                {/* Key Features/Benefits */}
                <div className="space-y-1.5 py-3 border-t border-slate-100 mb-4">
                  {app.benefits.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Install and Action buttons */}
              <div>
                {installed && activeItem ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenConfig(activeItem)}
                      className="flex-1 text-center font-bold text-xs py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all"
                    >
                      Configure Settings
                    </button>
                    <div className="p-2 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onConnect({ name: app.name, type: app.type })}
                    className="w-full inline-flex items-center justify-center gap-1.5 font-bold text-xs py-2.5 bg-slate-800 hover:bg-slate-950 text-white rounded-xl shadow-sm transition-all"
                  >
                    <span>Connect Platform</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredApps.length === 0 && (
          <div className="col-span-full text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <BadgeAlert className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-slate-700 font-bold">No Applications Match Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Try typing another term, changing the category filter on the top, or check our global webhooks system.
            </p>
          </div>
        )}
      </div>

      {/* Advanced Integration / Developer Webhook sandbox */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-slate-850 text-sm">Need a custom external payload receiver?</h4>
          <p className="text-xs text-slate-500 max-w-xl font-medium">
            Generate customized Webhook channels that capture JSON objects directly from any unsupported system (i.e., custom scripts) and route payloads automatically.
          </p>
        </div>
        <button 
          onClick={() => onConnect({ name: 'External Webhook Platform', type: 'zapier' })}
          className="bg-white border border-slate-280 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl block text-center"
        >
          Create Generic Webhook Hub
        </button>
      </div>

    </div>
  );
};
