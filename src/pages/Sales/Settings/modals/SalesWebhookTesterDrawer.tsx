import React, { useState } from 'react';
import {
  X,
  Play,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Code2,
  RefreshCw,
  Copy,
  Check,
  Zap,
  ArrowRight
} from 'lucide-react';

interface SalesWebhookTesterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
  secretToken: string;
  onPayloadSimulated?: () => void;
}

const PRESET_PAYLOADS = {
  shopify_order: JSON.stringify(
    {
      event: 'order.created',
      order_id: 'SH-9042',
      customer_name: 'Karim Mansour',
      phone_number: '+20 100 123 4567',
      user_email: 'karim.mansour@apexholding.com',
      company: 'Apex Holding Group',
      service: 'Enterprise SaaS Annual License',
      amount: 45000,
      currency: 'EGP',
      utm_source: 'google_search_campaign',
      inbound_notes: 'Urgent expansion for Cairo headquarters branch.'
    },
    null,
    2
  ),
  webflow_form: JSON.stringify(
    {
      form_name: 'B2B Request Quote',
      fullName: 'Dr. Sarah Al-Sayed',
      phone: '+971 50 987 6543',
      email: 's.alsayed@gulfhealth.ae',
      organization: 'Gulf Healthcare Systems',
      product: 'Quality Assurance & Audit Suite',
      budget: 85000,
      city: 'Dubai',
      inquiry_message: 'Interested in on-premise installation and 24/7 SLA.'
    },
    null,
    2
  ),
  woocommerce: JSON.stringify(
    {
      action: 'checkout_lead',
      name: 'Tarek Zaki',
      phone: '+20 122 345 6789',
      email: 'tarek.zaki@cairologistix.eg',
      company: 'Cairo Logistics Ltd',
      serviceType: 'BPMN Process Optimization',
      estimatedValue: 60000,
      utm_campaign: 'linkedin_q3_scale'
    },
    null,
    2
  )
};

export const SalesWebhookTesterDrawer: React.FC<SalesWebhookTesterDrawerProps> = ({
  isOpen,
  onClose,
  webhookUrl,
  secretToken,
  onPayloadSimulated
}) => {
  const [activePreset, setActivePreset] = useState<'shopify_order' | 'webflow_form' | 'woocommerce'>('shopify_order');
  const [jsonPayload, setJsonPayload] = useState<string>(PRESET_PAYLOADS.shopify_order);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (key: 'shopify_order' | 'webflow_form' | 'woocommerce') => {
    setActivePreset(key);
    setJsonPayload(PRESET_PAYLOADS[key]);
    setTestResult(null);
    setError(null);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleTestPayload = async () => {
    setIsAnalyzing(true);
    setError(null);
    setTestResult(null);

    try {
      // Validate JSON syntax first
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(jsonPayload);
      } catch (err: any) {
        throw new Error(`JSON Syntax Error: ${err.message}`);
      }

      const res = await fetch('/api/crm/integrations/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': 'sha256=test_signature_valid'
        },
        body: JSON.stringify({ payload: parsedPayload })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setTestResult(data);
      if (onPayloadSimulated) {
        onPayloadSimulated();
      }
    } catch (err: any) {
      setError(err.message || 'Payload evaluation failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Zap className="w-4 h-4" />
              </span>
              <h3 className="text-base font-semibold text-slate-800">
                Payload JSON Tester & Auto-Field Detection
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate external webhooks (Shopify, Webflow, custom APIs) and preview extracted lead attributes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Webhook Destination Banner */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Target Ingestion Endpoint</span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied URL' : 'Copy Endpoint'}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-emerald-300 break-all bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
              {webhookUrl}
            </div>
          </div>

          {/* Sample Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Sample E-Commerce / Webhook Preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('shopify_order')}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                  activePreset === 'shopify_order'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Shopify Order
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('webflow_form')}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                  activePreset === 'webflow_form'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Webflow Form
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('woocommerce')}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                  activePreset === 'woocommerce'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                WooCommerce
              </button>
            </div>
          </div>

          {/* JSON Payload Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-slate-500" />
                Raw JSON Request Body
              </label>
              <span className="text-[11px] text-slate-400">Content-Type: application/json</span>
            </div>
            <textarea
              value={jsonPayload}
              onChange={(e) => setJsonPayload(e.target.value)}
              rows={9}
              className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              spellCheck={false}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Auto-Detection & Test Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestPayload}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Payload...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Detect Fields & Test Ingestion</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-400">Signature: HMAC SHA-256</span>
          </div>

          {/* Inspection Result Preview */}
          {testResult && (
            <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/80 rounded-xl p-3">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Payload successfully parsed!</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                  {testResult.detectedKeysCount} Keys Detected
                </span>
              </div>

              {/* Mapped Lead Record Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Extracted Sales CRM Lead Preview
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-medium bg-emerald-100 px-2 py-0.5 rounded-md">
                    Ready for Auto-Assign
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Full Name</span>
                    <strong className="text-slate-800 font-medium">
                      {testResult.mappedLeadPreview.name || '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Phone Number</span>
                    <strong className="text-slate-800 font-medium">
                      {testResult.mappedLeadPreview.phone || '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Email Address</span>
                    <strong className="text-slate-800 font-medium">
                      {testResult.mappedLeadPreview.email || '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Company / Organization</span>
                    <strong className="text-slate-800 font-medium">
                      {testResult.mappedLeadPreview.company || '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Service Offering</span>
                    <strong className="text-slate-800 font-medium">
                      {testResult.mappedLeadPreview.serviceType || '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Estimated Opportunity</span>
                    <strong className="text-emerald-700 font-semibold">
                      {testResult.mappedLeadPreview.estimatedValue
                        ? `${Number(testResult.mappedLeadPreview.estimatedValue).toLocaleString()} EGP`
                        : '—'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Detected Schema Fields Table */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2">
                  Auto-Discovered Payload Attributes
                </h4>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Payload Key</th>
                        <th className="px-3 py-2">Inferred Type</th>
                        <th className="px-3 py-2">Sample Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {testResult.detectedFields.map((f: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-3 py-1.5 font-semibold text-slate-800">{f.key}</td>
                          <td className="px-3 py-1.5 text-indigo-600">{f.type}</td>
                          <td className="px-3 py-1.5 text-slate-500 truncate max-w-[180px]">{f.sample}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
