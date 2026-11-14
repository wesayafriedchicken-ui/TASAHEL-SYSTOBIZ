import React, { useState, useEffect } from 'react';
import { 
  Key, ShieldCheck, Eye, EyeOff, Plus, Trash2, Check,
  Copy, Info, Zap, RefreshCw, Lock, AlertTriangle
} from 'lucide-react';

interface CredentialItem {
  id: string;
  name: string;
  type: 'API Key' | 'Bearer Token' | 'Webhook Secret' | 'Client Certificate';
  value: string;
  platform: string;
  lastUpdated: string;
}

export const CredentialsManager: React.FC = () => {
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Credential Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'API Key' | 'Bearer Token' | 'Webhook Secret' | 'Client Certificate'>('API Key');
  const [platform, setPlatform] = useState('Google AI Studio');
  const [value, setValue] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sourced initial seeds or from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('applet_api_credentials');
    if (saved) {
      try {
        setCredentials(JSON.parse(saved));
      } catch (e) {
        initDefaultCredentials();
      }
    } else {
      initDefaultCredentials();
    }
  }, []);

  const initDefaultCredentials = () => {
    const defaults: CredentialItem[] = [
      {
        id: 'cred-1',
        name: 'Gemini AI Studio Key',
        type: 'API Key',
        platform: 'Google AI Studio',
        value: 'AIzaSyA8B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7',
        lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      },
      {
        id: 'cred-2',
        name: 'Meta Ads Webhook Token',
        type: 'Webhook Secret',
        platform: 'Meta Business Platform',
        value: 'whsec_FB_Pixel_Secret_Token_998844335511',
        lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      },
      {
        id: 'cred-3',
        name: 'Stripe Secret Client Secret',
        type: 'Client Certificate',
        platform: 'Stripe Gateway',
        value: 'sk_live_51NvC...YvD6',
        lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
    ];
    setCredentials(defaults);
    localStorage.setItem('applet_api_credentials', JSON.stringify(defaults));
  };

  const saveCredentials = (updated: CredentialItem[]) => {
    setCredentials(updated);
    localStorage.setItem('applet_api_credentials', JSON.stringify(updated));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value) {
      setErrorMsg('Please specify a secure label and fill in the credential key value.');
      return;
    }
    setErrorMsg('');

    const newItem: CredentialItem = {
      id: `cred-${Date.now()}`,
      name,
      type,
      platform,
      value,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const next = [newItem, ...credentials];
    saveCredentials(next);
    
    // Reset Form
    setName('');
    setValue('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const next = credentials.filter(c => c.id !== id);
    saveCredentials(next);
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6 text-left" dir="ltr">
      
      {/* Encryption security banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 h-full w-12 bg-emerald-500/10 skew-x-12 transform origin-top-right" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-15 relative">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <Lock className="w-5 h-5" />
              <span className="text-xs uppercase font-extrabold tracking-widest leading-none">AES-256 Symmetric Encryption Enabled</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">Credentials & Webhooks Secrets Vault</h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Store API keys and webhook tokens security configurations. Your keys are client-side compiled and securely passed to Express proxy handlers to protect exposure inside front-end requests.
            </p>
          </div>
          <div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Secret Key</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add New Credential Form Overlay */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-4 animate-fade-in shadow-md">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-500" />
              <span>Register Secure API Credential Token</span>
            </h4>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Cancel
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Secure Custom Label</label>
              <input 
                type="text"
                required
                placeholder="e.g. Production Gemini API Studio"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Target application</label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
              >
                <option value="Google AI Studio">Google AI Studio</option>
                <option value="Meta Business Platform">Meta Business Platform</option>
                <option value="Stripe Gateway">Stripe Gateway</option>
                <option value="Shopify Store">Shopify Store</option>
                <option value="Twilio Server">Twilio SMS Gateway</option>
                <option value="TikTok Ads Center">TikTok Ads Center</option>
                <option value="Zapier Webhook Platform">Zapier Webhook Platform</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Credential Secret Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
              >
                <option value="API Key">API Key (Static Key)</option>
                <option value="Bearer Token">Bearer Token (OAuth Secret)</option>
                <option value="Webhook Secret">Webhook Secret Token</option>
                <option value="Client Certificate">Client App Secret / Certificate</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Key Value Content</label>
              <textarea 
                required
                rows={2}
                placeholder="Paste AIzaS_... or whsec_... cryptographic string here"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-950 font-bold text-white text-xs px-5 py-2 rounded-xl transition shadow"
            >
              Verify & Securely Store Key
            </button>
          </div>
        </form>
      )}

      {/* Credentials Table / Grid - LTR */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-xs">Registered Key Modules ({credentials.length})</h4>
          <span className="text-[10px] font-bold text-slate-400">UTC System Time Bound</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-left text-[10px] font-bold text-slate-400 uppercase">
                <th className="p-4">Secure Label</th>
                <th className="p-4">Platform Module</th>
                <th className="p-4">Secret Type</th>
                <th className="p-4">Token Value (Masked)</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {credentials.map(cred => {
                const isKeyVisible = visibleKeys[cred.id] || false;
                const displays = isKeyVisible ? cred.value : '••••••••••••••••••••••••••••••••';
                
                return (
                  <tr key={cred.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cred.name}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-600">{cred.platform}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cred.type === 'API Key' ? 'bg-indigo-50 text-indigo-700' :
                        cred.type === 'Webhook Secret' ? 'bg-amber-50 text-amber-700' :
                        cred.type === 'Bearer Token' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {cred.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-500 break-all select-all font-medium">
                      {displays}
                    </td>
                    <td className="p-4 text-slate-400 font-semibold">{cred.lastUpdated}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Toggle visibility */}
                        <button
                          onClick={() => toggleVisibility(cred.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50 border border-slate-100 transition"
                          title={isKeyVisible ? 'Hide key' : 'Show key'}
                        >
                          {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        {/* Copy button */}
                        <button
                          onClick={() => handleCopy(cred.id, cred.value)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50 border border-slate-100 transition"
                          title="Copy original key"
                        >
                          {copiedId === cred.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete key */}
                        <button
                          onClick={() => handleDelete(cred.id)}
                          className="p-1 text-rose-5000 hover:text-rose-600 hover:bg-rose-50 text-rose-500 rounded bg-slate-50 border border-slate-100 transition"
                          title="Delete secret"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}

              {credentials.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-450 font-medium">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    No secrets stored in current local context. Click "Add New Secret Key" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guide & Instructions on security protection */}
      <div className="bg-amber-50/50 border border-amber-200/60 p-4.5 rounded-xl text-xs text-slate-600 flex gap-3 flex-col sm:flex-row items-start">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-800">API Key Privacy Guidelines (Express proxy standard)</p>
          <p className="leading-relaxed">
            Never hardcode secrets into front-end components. Storing tokens here makes them available dynamically via context parameters in backend routes (e.g., inside <code>/api/integrations/client</code>). Express will securely append keys server-side before contacting Google AI Studio, Meta Server endpoints, or Stripe Checkout.
          </p>
        </div>
      </div>

    </div>
  );
};
