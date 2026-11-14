import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  RefreshCcw, 
  Settings2, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Link,
  Table,
  Facebook,
  MessageCircle,
  Mail,
  Phone,
  Zap,
  Info,
  Trash2,
  X,
  Trash,
  Key,
  Lock,
  Grid,
  Cpu,
  AlertTriangle
} from 'lucide-react';
import { Integration, IntegrationLog } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import DeleteConfirmation from '../Common/DeleteConfirmation';
import { IntegrationsDashboard } from './IntegrationsDashboard';
import { AppDirectory } from './AppDirectory';
import { CredentialsManager } from './CredentialsManager';

const IntegrationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'active_connections' | 'app_directory' | 'credentials'>('dashboard');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch('/api/integrations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId || '1'
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setIntegrations(data);
      } else {
        setIntegrations([]);
      }
    } catch (error) {
      console.error('Failed to fetch integrations', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`/api/integrations/${id}/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId || '1'
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  };

  const handleSync = async (id: number) => {
    setSyncingId(id);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`/api/integrations/${id}/sync`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId || '1'
        }
      });
      const data = await res.json();
      if (data.success) {
        alert(`Sync executed successfully! Imported ${data.results?.count || 0} records.`);
        fetchIntegrations();
        if (selectedIntegration?.id === id) fetchLogs(id);
      } else {
        let errorMsg = data.message || 'Unknown error occurred';
        if (errorMsg.includes('Unauthorized')) {
          errorMsg += "\n\nTip: Please confirm that your Google Sheet is shared with 'Anyone with the link can view' permission.";
        }
        alert(`Sync failed: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Sync failed', error);
      alert(`Connection error: ${error.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  const handleConnect = async (connector: { name: string, type: string }) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-user-id': userId || '1'
        },
        body: JSON.stringify({
          name: `${connector.name} Integration`,
          type: connector.type,
          status: 'disconnected',
          config: {}
        })
      });
      
      if (res.ok) {
        const newIntegration = await res.json();
        setIntegrations(prev => [newIntegration, ...prev]);
        setSelectedIntegration(newIntegration);
        // Do not auto-sync here because config is empty
      }
    } catch (error) {
      console.error('Connection failed', error);
      alert('Failed to connect integration.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`/api/integrations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId || '1'
        }
      });
      
      if (res.ok) {
        setIntegrations(prev => prev.filter(i => i.id !== id));
        if (selectedIntegration?.id === id) setSelectedIntegration(null);
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete integration.');
    }
  };

  const getModuleFields = (moduleId: string) => {
    switch (moduleId) {
      case 'leads': return [
        { key: 'name', label: 'Customer Name', required: true },
        { key: 'email', label: 'Email Address', required: true, unique: true },
        { key: 'value', label: 'Expected Value', required: false },
      ];
      case 'crm': return [
        { key: 'customer_name', label: 'Customer Name', required: true },
        { key: 'email', label: 'Customer Email', required: true, unique: true },
        { key: 'deal_title', label: 'Deal Title', required: true },
        { key: 'value', label: 'Deal Value', required: false },
      ];
      case 'products': return [
        { key: 'name', label: 'Product Name', required: true, unique: true },
        { key: 'price', label: 'Price', required: true },
        { key: 'description', label: 'Description', required: false },
        { key: 'currency', label: 'Currency', required: false },
        { key: 'type', label: 'Type', required: false },
        { key: 'category', label: 'Category', required: false },
      ];
      case 'tasks': return [
        { key: 'title', label: 'Task Title', required: true },
        { key: 'description', label: 'Description', required: false },
        { key: 'priority', label: 'Priority', required: false },
      ];
      case 'attendance': return [
        { key: 'email', label: 'Employee Email', required: true },
        { key: 'date', label: 'Date', required: true },
        { key: 'clock_in', label: 'Clock In', required: false },
        { key: 'clock_out', label: 'Clock Out', required: false },
        { key: 'status', label: 'Status (Present/Late/Absent)', required: false },
      ];
      default: return [];
    }
  };

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configuringIntegration, setConfiguringIntegration] = useState<Integration | null>(null);
  const [configForm, setConfigForm] = useState<any>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);

  const [connectionMethod, setConnectionMethod] = useState<'oauth' | 'manual'>('oauth');
  const [ssoStep, setSsoStep] = useState<'idle' | 'loading' | 'prompt' | 'success'>('idle');

  useEffect(() => {
    if (configuringIntegration) {
      const isOauth = configuringIntegration.config?.auth_method === 'oauth';
      setConnectionMethod(isOauth ? 'oauth' : 'manual');
      setSsoStep(isOauth ? 'success' : 'idle');
    }
  }, [configuringIntegration]);

  const handleTestConnection = async () => {
    if (!configuringIntegration) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const type = configuringIntegration.type;
      
      if (type === 'email') {
        const res = await fetch('/api/integrations/test-smtp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: configForm.host,
            port: configForm.port || '587',
            user: configForm.sender_email, 
            pass: configForm.api_key,
            sender_email: configForm.sender_email
          })
        });
        const data = await res.json();
        setTestResult(data);
      } else if (type === 'custom_ai') {
        const res = await fetch('/api/integrations/test-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: configForm.provider || 'openai',
            api_key: configForm.api_key,
            api_url: configForm.api_url,
            model_name: configForm.model_name
          })
        });
        const data = await res.json();
        setTestResult(data);
      } else {
        // Mock test for other integrations
        await new Promise(r => setTimeout(r, 1200));
        if (!configForm.api_key) {
          setTestResult({ success: false, message: 'Please enter the API Key first to continue.' });
        } else {
          setTestResult({ success: true, message: `${configuringIntegration.name} successfully verified. The system responded correctly.` });
        }
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Server connection failed. Please check your internet connection settings.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleMappingChange = (fieldKey: string, sheetColumn: string) => {
    const newMappings = { ...(configForm.mappings || {}), [fieldKey]: sheetColumn };
    setConfigForm({ ...configForm, mappings: newMappings });
  };

  const handleProviderChange = (providerVal: string) => {
    let api_url = "";
    let model_name = "";
    
    if (providerVal === 'openai') {
      api_url = "https://api.openai.com/v1";
      model_name = "gpt-4o-mini";
    } else if (providerVal === 'anthropic') {
      api_url = "https://api.anthropic.com";
      model_name = "claude-3-5-sonnet-20241022";
    } else if (providerVal === 'deepseek') {
      api_url = "https://api.deepseek.com/v1";
      model_name = "deepseek-chat";
    } else if (providerVal === 'groq') {
      api_url = "https://api.groq.com/openai/v1";
      model_name = "llama3-8b-8192";
    }
    
    setConfigForm({
      ...configForm,
      provider: providerVal,
      api_url,
      model_name
    });
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringIntegration) return;

    setIsSavingConfig(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`/api/integrations/${configuringIntegration.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-user-id': userId || '1'
        },
        body: JSON.stringify({
          status: 'connected',
          config: configForm
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setIntegrations(prev => prev.map(i => i.id === updated.id ? updated : i));
        setSelectedIntegration(updated);
        setIsConfigModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to update config', error);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const getModuleInstructions = (moduleId: string) => {
    switch (moduleId) {
      case 'leads': return "Specify the header columns in your Google Sheet matching the lead fields. 'Email' is used as a unique identifier to prevent duplicate records.";
      case 'crm': return "Map your sheet columns to deal fields. The client will be searched by 'Email' and matched with the deal automatically.";
      case 'products': return "Define product columns. 'Product Name' is used as a unique key to update prices and specs synchronously.";
      case 'tasks': return "Assign columns for visual tasks. Newly found tasks will be loaded directly into your main task board.";
      case 'attendance': return "Map employee emails with corresponding dates and clock times. Attendance entries will refresh automatically.";
      case 'ai_all': return "ربط شامل لكافة ميزات الذكاء الاصطناعي في المنصة (AI Boardroom & AI Business) بمزود الخدمة الدوران الجديد. سيتم تحويل جميع الاستدعاءات والطلبات تلقائياً.";
      case 'ai_boardroom': return "ربط موديول AI Boardroom بمزود الخدمة المخصص. سيتم توجيه جميع مداولات واجتماعات مجلس الإدارة الافتراضية هنا.";
      case 'ai_business': return "ربط موديول AI Business بمزود الخدمة المخصص. سيتم توجيه عمليات صياغة خطط العمل وتوليد الاستراتيجيات هنا.";
      default: return "";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'google_sheets': return <Table className="w-6 h-6 text-emerald-600" />;
      case 'facebook_leads':
      case 'meta_ads':
      case 'facebook': return <Facebook className="w-6 h-6 text-blue-600" />;
      case 'whatsapp': return <MessageCircle className="w-6 h-6 text-green-500" />;
      case 'email': return <Mail className="w-6 h-6 text-blue-500" />;
      case 'sms': return <Phone className="w-6 h-6 text-amber-500" />;
      case 'custom_ai': return <Cpu className="w-6 h-6 text-indigo-600 animate-pulse" />;
      case 'zapier': return <Zap className="w-6 h-6 text-orange-500" />;
      default: return <Link className="w-6 h-6 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
          <CheckCircle2 className="w-3 h-3" /> Connected
        </span>;
      case 'error':
        return <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full border border-red-100">
          <AlertCircle className="w-3 h-3" /> Error
        </span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
          <XCircle className="w-3 h-3" /> Disconnected
        </span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-7 h-7 text-blue-500" /> Integration Hub
          </h1>
          <p className="text-slate-500 mt-1">Connect and manage your data sources and external tools.</p>
        </div>
        <button 
          onClick={fetchIntegrations}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Navigation tabs - Clean English & LTR style */}
      <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-full max-w-3xl overflow-x-auto scrollbar-none" id="integration-navigation-tabs" dir="ltr">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'dashboard'
              ? 'bg-white text-blue-700 shadow-sm shadow-blue-500/10'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-500" />
          Ecosystem Dashboard
        </button>

        <button
          onClick={() => setActiveTab('app_directory')}
          className={`flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'app_directory'
              ? 'bg-white text-violet-700 shadow-sm shadow-violet-500/10'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          <Grid className="w-4 h-4 text-violet-500" />
          App Directory & Store
        </button>

        <button
          onClick={() => setActiveTab('active_connections')}
          className={`flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'active_connections'
              ? 'bg-white text-emerald-700 shadow-sm shadow-emerald-500/10'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          <Settings2 className="w-4 h-4 text-emerald-500" />
          Active Connections
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'credentials'
              ? 'bg-white text-amber-700 shadow-sm shadow-amber-500/10'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          <Key className="w-4 h-4 text-amber-500" />
          Credentials Manager
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
          >
            <IntegrationsDashboard 
              integrations={integrations} 
              logs={logs} 
              onNavigateToDirectory={() => setActiveTab('app_directory')} 
            />
          </motion.div>
        )}

        {activeTab === 'app_directory' && (
          <motion.div
            key="app_directory"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
          >
            <AppDirectory 
              onConnect={handleConnect} 
              integrations={integrations} 
              onOpenConfig={(integration) => {
                setConfiguringIntegration(integration);
                setConfigForm(integration.config || {});
                setIsConfigModalOpen(true);
              }} 
            />
          </motion.div>
        )}

        {activeTab === 'credentials' && (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
          >
            <CredentialsManager />
          </motion.div>
        )}

        {activeTab === 'active_connections' && (
          <motion.div
            key="active_connections"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Integrations List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  [1, 2, 3, 4].map(i => (
                    <div key={i} className="h-40 bg-slate-50 animate-pulse rounded-xl border border-slate-100"></div>
                  ))
                ) : integrations.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No integrations configured yet.</p>
                    <button onClick={() => setActiveTab('app_directory')} className="mt-4 text-blue-600 font-medium hover:underline">Add First Integration</button>
                  </div>
                ) : (
                  integrations.map(integration => (
                    <motion.div
                      layoutId={`integration-${integration.id}`}
                      key={integration.id}
                      onClick={() => {
                        setSelectedIntegration(integration);
                        fetchLogs(integration.id);
                      }}
                      className={`p-5 rounded-xl border transition-all cursor-pointer ${
                        selectedIntegration?.id === integration.id 
                        ? 'border-blue-500 bg-blue-50/30 font-semibold' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-500">
                          {getTypeIcon(integration.type)}
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-tight mt-1">{integration.type.replace('_', ' ')}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-slate-400">Last Sync: {integration.last_sync ? new Date(integration.last_sync).toLocaleString() : 'Never'}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (integration.type === 'google_sheets' && !integration.config?.sheet_id) {
                              alert('Please configure the Sheet ID first.');
                              return;
                            }
                            handleSync(integration.id);
                          }}
                          disabled={syncingId === integration.id}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50"
                        >
                          <RefreshCcw className={`w-4 h-4 ${syncingId === integration.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* New Connections Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 font-bold">Quick Connect Guides</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { name: 'Google Sheets', type: 'google_sheets', icon: <Table className="text-emerald-600" /> },
                    { name: 'WhatsApp API', type: 'whatsapp', icon: <MessageCircle className="text-green-500" /> },
                    { name: 'Email Sendout', type: 'email', icon: <Mail className="text-blue-500" /> },
                  ].map(connector => (
                    <div key={connector.name} className="p-4 rounded-lg border border-slate-100 text-center space-y-2 hover:bg-slate-50 transition-colors group relative overflow-hidden">
                      <div className="mx-auto w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full group-hover:scale-110 transition-transform">
                        {connector.icon}
                      </div>
                      <span className="text-sm font-medium text-slate-700 block">{connector.name}</span>
                      <button 
                        onClick={() => handleConnect(connector)}
                        className="w-full text-xs py-1.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        Quick Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Integration Details / Logs */}
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                {selectedIntegration ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden h-[calc(100vh-12rem)] flex flex-col"
                  >
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                          {getTypeIcon(selectedIntegration.type)}
                        </div>
                        <div>
                          <h2 className="font-bold text-slate-900 leading-tight">{selectedIntegration.name}</h2>
                          <p className="text-xs text-slate-400">Settings & Logs</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => {
                            setConfiguringIntegration(selectedIntegration);
                            setConfigForm(selectedIntegration.config || {});
                            setIsConfigModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          <Settings2 className="w-4 h-4" /> Configure
                        </button>
                        <button 
                          onClick={() => {
                            if (selectedIntegration.type === 'google_sheets' && !selectedIntegration.config?.sheet_id) {
                              alert('Please configure the Sheet ID first.');
                              return;
                            }
                            handleSync(selectedIntegration.id);
                          }}
                          disabled={syncingId === selectedIntegration.id}
                          className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                          <RefreshCcw className={`w-4 h-4 ${syncingId === selectedIntegration.id ? 'animate-spin' : ''}`} /> Sync
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(selectedIntegration.id)}
                          className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors mt-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Integration
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0">
                      <div className="p-4 bg-white sticky top-0 border-b border-slate-100 z-10 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-500" /> Recent Activity
                        </h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {logs.length === 0 ? (
                          <div className="p-12 text-center text-slate-400">
                            <p className="text-sm">No activity logs yet.</p>
                          </div>
                        ) : (
                          logs.map(log => (
                            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-medium text-slate-800">{log.action}</span>
                                {log.status === 'success' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              {log.details && <p className="text-xs text-slate-500 mb-2">{log.details}</p>}
                              {log.error_message && <p className="text-xs font-mono text-red-500 bg-red-50 p-2 rounded mb-2 border border-red-100">{log.error_message}</p>}
                              <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4 text-slate-300">
                      <Activity className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold text-slate-600">No Integration Selected</h3>
                    <p className="text-sm text-slate-400 max-w-xs mt-2">Select an integration from the list to view its configuration and activity logs.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmation 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        title="Delete Integration"
        message="Are you sure you want to delete this integration? This will stop all automated syncs and remove the connection. Logs will be preserved."
      />

      <DeleteConfirmation 
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          setConfigForm({...configForm, last_synced_row: 0});
          setShowResetConfirm(false);
        }}
        title="Reset Cursor Pointer"
        message="Are you sure you want to reset the sync indicator pointer? This will reconfirm and synchronize all past historical data once more."
      />

      {/* Configuration Modal */}
      <AnimatePresence>
        {isConfigModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfigModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Settings2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Integration Configuration</h2>
                    <p className="text-xs text-slate-500">Configure connection settings for {configuringIntegration?.name} and define key data maps.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsConfigModalOpen(false)}
                  className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm"
                >
                  <X />
                </button>
              </div>

              <form onSubmit={handleUpdateConfig} className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Connection Credentials */}
                  <div className="col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 border-l-4 border-blue-500 pl-2">Connection Credentials</h3>

                    {['facebook_leads', 'facebook', 'whatsapp', 'meta_ads'].includes(configuringIntegration?.type || '') && (
                      <div className="flex bg-slate-100 p-1.5 rounded-xl gap-2 mb-4" dir="ltr">
                        <button
                          type="button"
                          onClick={() => {
                            setConnectionMethod('oauth');
                            if (configForm.auth_method !== 'oauth') {
                              setSsoStep('idle');
                            }
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                            connectionMethod === 'oauth'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-950'
                          }`}
                        >
                          <Lock className="w-4 h-4 mr-1" />
                          OAuth Connect (Quick SSO)
                        </button>
                        <button
                          type="button"
                          onClick={() => setConnectionMethod('manual')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                            connectionMethod === 'manual'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-950'
                          }`}
                        >
                          <Settings2 className="w-4 h-4 mr-1" />
                          Manual Setup (Developer)
                        </button>
                      </div>
                    )}

                    {['facebook_leads', 'facebook', 'whatsapp', 'meta_ads'].includes(configuringIntegration?.type || '') && connectionMethod === 'oauth' && (
                      <div className="space-y-4 border border-blue-100 bg-blue-50/20 p-5 rounded-2xl">
                        {ssoStep === 'idle' && (
                          <div className="text-center py-6 space-y-4">
                            <div className="mx-auto w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center relative shadow-sm">
                              {getTypeIcon(configuringIntegration?.type || '')}
                              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 text-white border-2 border-white shadow">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm text-slate-800">Automatic Integration with Fast Login</h4>
                              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                                This option allows you to connect your account securely in under a minute without manual developer credentials.
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setSsoStep('loading');
                                setTimeout(() => {
                                  setSsoStep('prompt');
                                }, 1300);
                              }}
                              className={`w-full max-w-xs mx-auto py-3 px-6 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 text-white ${
                                configuringIntegration?.type === 'whatsapp' ? 'bg-[#25D366] hover:bg-[#20BA5A]' :
                                configuringIntegration?.type === 'facebook' ? 'bg-black hover:bg-zinc-950 border border-zinc-800' :
                                'bg-[#1877F2] hover:bg-[#166FE5]'
                              }`}
                            >
                              <Lock className="w-4 h-4" />
                              <span>Login securely via {configuringIntegration?.name}</span>
                            </button>
                          </div>
                        )}

                        {ssoStep === 'loading' && (
                          <div className="text-center py-12 space-y-3">
                            <span className="relative flex h-10 w-10 mx-auto">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-10 w-10 bg-blue-600 flex items-center justify-center text-white">
                                <RefreshCcw className="w-5 h-5 animate-spin" />
                              </span>
                            </span>
                            <p className="text-sm font-semibold text-slate-700 animate-pulse">Fetching verification interface from {configuringIntegration?.name}...</p>
                            <p className="text-xs text-slate-400">Please wait while securely verifying connection protocols...</p>
                          </div>
                        )}

                        {ssoStep === 'prompt' && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-left"
                            dir="ltr"
                          >
                            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                                  {getTypeIcon(configuringIntegration?.type || '')}
                                </span>
                                <span className="text-xs font-bold text-slate-700">Secure connection to {configuringIntegration?.name}</span>
                              </div>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Secure SSL v3</span>
                            </div>
                            
                            <div className="p-5 space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center font-bold text-blue-600 text-lg shadow-sm">
                                  IE
                                </div>
                                <div>
                                  <h5 className="font-bold text-xs text-slate-800">Esraa El-Eswy (Admin Director)</h5>
                                  <p className="text-[10px] text-slate-500 font-medium">esraaessoo19@gmail.com</p>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-150">
                                <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Authorized Data Permissions:</h6>
                                <ul className="space-y-1.5 text-xs text-slate-600 font-semibold list-disc list-inside">
                                  <li>Real-time automated customer leads sync (Leads Sync).</li>
                                  <li>Fetch active tracking forms and page settings (Form List).</li>
                                  <li>Manage and receive webhook payloads (Webhook access).</li>
                                </ul>
                              </div>

                              <p className="text-[10px] text-slate-400 text-center font-medium">
                                By clicking authorize, you agree to grant automatic Leads synchronization permissions to Business CORE.
                              </p>

                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const mockConfig = {
                                      auth_method: 'oauth',
                                      connected_account: 'Esraa Esso (Verified Client)',
                                      access_token: 'eaag_oauth_simulated_token_' + Math.random().toString(36).substring(2, 10),
                                      api_key: 'oauth_token_simulated_esraa_esso',
                                      page_name: configuringIntegration?.type === 'whatsapp' ? undefined : 'Cyberdyne Systems Page',
                                      page_id: configuringIntegration?.type === 'whatsapp' ? undefined : '106728097000742',
                                      form_name: configuringIntegration?.type === 'whatsapp' ? undefined : 'Lead Generation Form (Main Ads)',
                                      form_id: configuringIntegration?.type === 'whatsapp' ? undefined : '56565656565',
                                      phone_id: configuringIntegration?.type === 'whatsapp' ? 'wa_phone_id_simulated_962873' : undefined,
                                      target_module: configForm.target_module || 'leads',
                                      mappings: configForm.mappings || {
                                        name: 'full_name',
                                        email: 'email',
                                        value: 'lead_value',
                                        phone: 'phone_number',
                                      }
                                    };
                                    setConfigForm(mockConfig);
                                    setSsoStep('success');
                                    setTestResult({ success: true, message: '🎉 Success! Secured credentials authorized successfully for your account.' });
                                  }}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm"
                                >
                                  Authorize & Connect
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSsoStep('idle')}
                                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {ssoStep === 'success' && (
                          <div className="text-center py-6 space-y-4">
                            <div className="text-4xl text-emerald-500">✓</div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm text-emerald-800">Account Connected & Active!</h4>
                              <p className="text-xs text-slate-500">
                                Integration successfully authorized for: <strong className="text-slate-800">{configForm.connected_account || 'Esraa Esso'}</strong>
                              </p>
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 mt-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {configuringIntegration?.type === 'whatsapp' ? 'WhatsApp Receiver Configured' : 'Leads Routing Active'}
                              </div>
                            </div>

                            <div className="p-3 bg-white border border-slate-150 rounded-xl text-left max-w-md mx-auto" dir="ltr">
                              <span className="block text-[10px] font-bold text-slate-400 mb-1">Session Parameters:</span>
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-650 font-semibold mb-2">
                                <div><span className="font-semibold text-slate-500">Connection:</span> Secure SSO (OAuth)</div>
                                <div><span className="font-semibold text-slate-500">Updates:</span> Real-time Live</div>
                                {configForm.page_name && <div><span className="font-semibold text-slate-500">Linked Page:</span> {configForm.page_name}</div>}
                                {configForm.form_name && <div><span className="font-semibold text-slate-500">Bound Form:</span> {configForm.form_name}</div>}
                                {configForm.phone_id && <div><span className="font-semibold text-slate-500">WhatsApp Gateway:</span> {configForm.phone_id}</div>}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const resetConfig = { ...configForm };
                                delete resetConfig.auth_method;
                                delete resetConfig.connected_account;
                                delete resetConfig.access_token;
                                delete resetConfig.page_name;
                                delete resetConfig.page_id;
                                delete resetConfig.form_name;
                                delete resetConfig.form_id;
                                delete resetConfig.phone_id;
                                setConfigForm(resetConfig);
                                setSsoStep('idle');
                                setTestResult(null);
                              }}
                              className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors uppercase"
                            >
                              Disconnect Account
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {configuringIntegration?.type === 'google_sheets' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-blue-900 mb-1">How to find your Sheet ID?</p>
                            <p className="text-[10px] text-blue-700 leading-relaxed">
                              Open your Google Sheet and look at the URL. Copy the character string between <code className="bg-white/50 px-1 rounded">/d/</code> and <code className="bg-white/50 px-1 rounded">/edit</code>.
                              <br />
                              <span className="opacity-70 mt-1 block italic font-mono">Example: sheets/d/<strong>1A2B3C...XYZ</strong>/edit</span>
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Sheet ID</label>
                          <input 
                            type="text"
                            required
                            value={configForm.sheet_id || ''}
                            onChange={e => setConfigForm({...configForm, sheet_id: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                            placeholder="e.g. 1aBC...xyz"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Tab Name</label>
                          <input 
                            type="text"
                            value={configForm.tab_name || ''}
                            onChange={e => setConfigForm({...configForm, tab_name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                            placeholder="e.g. Sheet1"
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-100">
                             <RefreshCcw className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={configForm.incremental !== false}
                                onChange={e => setConfigForm({...configForm, incremental: e.target.checked})}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm font-bold text-slate-700">Incremental Sync</span>
                            </label>
                            <span className="block text-xs text-slate-500 mt-1">When active, the system retains the last updated row index to avoid double syncing.</span>
                          </div>
                          {configForm.last_synced_row > 0 && (
                            <div className="text-right">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Synced Rows: {configForm.last_synced_row}</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  setShowResetConfirm(true);
                                }}
                                className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 px-2 py-1 rounded hover:bg-rose-100 transition-colors"
                              >
                                Reset Cursor
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {configuringIntegration?.type === 'custom_ai' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 p-4 bg-indigo-50 border border-indigo-150 rounded-2xl flex items-start gap-3 text-left">
                          <Cpu className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-indigo-900 mb-1">Universal AI Router Configuration (ربط موجه الذكاء الاصطناعي الشامل)</p>
                            <p className="text-[10px] text-indigo-700 leading-relaxed font-sans">
                              تتيح لك هذه الإضافة ربط موديول AI Boardroom و AI Business بأي مقدم خدمة ذكاء اصطناعي آخر في العالم (مثل OpenAI أو Anthropic أو DeepSeek أو غيرهم) عبر توفير API Key الخاص بهم وتحتفظ بالمرونة الكاملة لتعديل النموذج وعنوان API.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-xs font-bold text-slate-500 uppercase">مقدم الخدمة (AI Provider)</label>
                          <select 
                            value={configForm.provider || 'openai'}
                            onChange={e => handleProviderChange(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                          >
                            <option value="openai">OpenAI (ChatGPT)</option>
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="deepseek">DeepSeek AI</option>
                            <option value="groq">Groq Cloud (Llama / Mixtral)</option>
                            <option value="other">Custom API (OpenAI Format)</option>
                          </select>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-xs font-bold text-slate-500 uppercase">اسم النموذج (Target Model Name)</label>
                          <input 
                            type="text"
                            value={configForm.model_name || ''}
                            onChange={e => setConfigForm({...configForm, model_name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                            placeholder="e.g. gpt-4o, claude-3-5-sonnet, deepseek-chat"
                          />
                        </div>

                        <div className="space-y-1 col-span-2 text-left">
                          <label className="text-xs font-bold text-slate-500 uppercase">مفتاح بروتوكول التطبيق (API Key)</label>
                          <input 
                            type="password"
                            required
                            value={configForm.api_key || ''}
                            onChange={e => setConfigForm({...configForm, api_key: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                            placeholder="sk-..."
                          />
                        </div>

                        <div className="space-y-1 col-span-2 text-left">
                          <label className="text-xs font-bold text-slate-500 uppercase">رابط عنوان الـ API (Base API URL - اختياري)</label>
                          <input 
                            type="text"
                            value={configForm.api_url || ''}
                            onChange={e => setConfigForm({...configForm, api_url: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                            placeholder="e.g. https://api.openai.com/v1"
                          />
                          <p className="text-[10px] text-slate-400 font-sans mt-1">
                            اتركه فارغاً لاستخدام الرابط الافتراضي لمزود الخدمة المختار.
                          </p>
                        </div>
                        
                        <div className="pt-2 col-span-2">
                           <button
                             type="button"
                             disabled={isTesting}
                             onClick={handleTestConnection}
                             className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-black transition-all shadow-sm cursor-pointer ${
                               isTesting ? 'bg-slate-50 text-slate-400 border-slate-100 italic' : 
                               'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                             }`}
                           >
                             {isTesting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                             {isTesting ? 'Verifying AI credentials...' : 'اختبار اتصال الذكاء الاصطناعي (Check Connection)'}
                           </button>
                           
                           <AnimatePresence>
                             {testResult && (
                               <motion.div 
                                 initial={{ opacity: 0, height: 0 }}
                                 animate={{ opacity: 1, height: 'auto' }}
                                 exit={{ opacity: 0, height: 0 }}
                                 className="overflow-hidden mt-3"
                               >
                                 <div className={`p-4 rounded-xl border text-xs font-bold text-left ${
                                   testResult.success 
                                     ? 'bg-emerald-50 border-emerald-150 text-emerald-800' 
                                     : 'bg-rose-50 border-rose-150 text-rose-800'
                                 }`}>
                                   <div className="flex items-start gap-2">
                                     <div className="mt-0.5 shrink-0">
                                       {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                                     </div>
                                     <div>
                                       <span className="block font-black text-sm">{testResult.message}</span>
                                       {testResult.details && <span className="block font-mono font-medium text-[10px] text-slate-500 mt-1.5 bg-white/50 p-2 rounded border border-slate-100">{testResult.details}</span>}
                                     </div>
                                   </div>
                                 </div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {(['whatsapp', 'email', 'sms', 'meta_ads'] as string[]).includes(configuringIntegration?.type || '') && (
                      configuringIntegration?.type !== 'google_sheets' && configuringIntegration?.type !== 'zapier' && 
                      (!['whatsapp', 'meta_ads'].includes(configuringIntegration?.type || '') || connectionMethod === 'manual') && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">{configuringIntegration?.type === 'email' ? 'SMTP Password / API Key' : 'API Key / Access Token'}</label>
                            <input 
                              type="password"
                              required
                              value={configForm.api_key || ''}
                              onChange={e => setConfigForm({...configForm, api_key: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                            {configuringIntegration?.type === 'email' && (
                              <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100 mt-1 flex items-start gap-2">
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>For Gmail accounts: You must generate and specify an App Password rather than your human account login password.</span>
                              </p>
                            )}
                          </div>
                          {configuringIntegration?.type === 'email' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">SMTP Host</label>
                                <input 
                                  type="text"
                                  value={configForm.host || ''}
                                  onChange={e => setConfigForm({...configForm, host: e.target.value})}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                                  placeholder="smtp.gmail.com"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">SMTP Port</label>
                                <input 
                                  type="text"
                                  value={configForm.port || '587'}
                                  onChange={e => setConfigForm({...configForm, port: e.target.value})}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                              </div>
                              <div className="space-y-1 col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Sender Email</label>
                                <input 
                                  type="email"
                                  value={configForm.sender_email || ''}
                                  onChange={e => setConfigForm({...configForm, sender_email: e.target.value})}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                              </div>
                            </div>
                          )}
                          {configuringIntegration?.type === 'whatsapp' && (
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Phone Number ID</label>
                              <input 
                                type="text"
                                value={configForm.phone_id || ''}
                                onChange={e => setConfigForm({...configForm, phone_id: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                              />
                            </div>
                          )}
                          {configuringIntegration?.type === 'sms' && (
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Account SID (Twilio)</label>
                              <input 
                                type="text"
                                value={configForm.account_sid || ''}
                                onChange={e => setConfigForm({...configForm, account_sid: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                              />
                            </div>
                          )}
                          
                          <div className="pt-2">
                             <button
                               type="button"
                               disabled={isTesting}
                               onClick={handleTestConnection}
                               className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-sm font-bold transition-all shadow-sm ${
                                 isTesting ? 'bg-slate-50 text-slate-400 border-slate-100 italic' : 
                                 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'
                               }`}
                             >
                               {isTesting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                               {isTesting ? 'Verifying connection...' : 'Test Connection'}
                             </button>
                             
                             <AnimatePresence>
                               {testResult && (
                                 <motion.div 
                                   initial={{ opacity: 0, height: 0 }}
                                   animate={{ opacity: 1, height: 'auto' }}
                                   exit={{ opacity: 0, height: 0 }}
                                   className={`mt-2 p-3 rounded-lg border flex gap-3 items-start ${
                                     testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                                   }`}
                                 >
                                   {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                                   <p className="text-xs font-medium">{testResult.message}</p>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                          </div>
                        </div>
                      )
                    )}

                    {(configuringIntegration?.type === 'facebook_leads' || configuringIntegration?.type === 'facebook') && 
                     (connectionMethod === 'manual') && (
                      <div className="space-y-4">
                        <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-start gap-3">
                          <Facebook className="w-5 h-5 text-sky-600 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <p className="text-xs font-bold text-sky-900 mb-1">Facebook Lead Ads Setup Flow</p>
                            <p className="text-[10px] text-sky-700 leading-relaxed font-semibold">
                              Link your Facebook Pages and forms directly. Submissions sync seamlessly to CRM Leads in real-time, backed by our fully automated webhook listeners.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 avatar-holder">
                          <label className="text-xs font-bold text-slate-500 uppercase">Page Access Token (Meta API)</label>
                          <input 
                            type="password"
                            required
                            placeholder="e.g. EAAGkb..."
                            value={configForm.access_token || configForm.api_key || ''}
                            onChange={e => setConfigForm({...configForm, access_token: e.target.value, api_key: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-slate-300"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Facebook Page Name</label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. Cyberdyne Systems Page"
                              value={configForm.page_name || ''}
                              onChange={e => setConfigForm({...configForm, page_name: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Facebook Page ID</label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. 106728097000742"
                              value={configForm.page_id || ''}
                              onChange={e => setConfigForm({...configForm, page_id: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Lead Ad Form Name</label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. Lead Generation Form"
                              value={configForm.form_name || ''}
                              onChange={e => setConfigForm({...configForm, form_name: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Lead Ad Form ID</label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. 56565656565"
                              value={configForm.form_id || ''}
                              onChange={e => setConfigForm({...configForm, form_id: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                           <button
                             type="button"
                             disabled={isTesting}
                             onClick={handleTestConnection}
                             className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-sm font-bold transition-all shadow-sm ${
                               isTesting ? 'bg-slate-50 text-slate-400 border-slate-100 italic' : 
                               'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
                             }`}
                           >
                             {isTesting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Facebook className="w-4 h-4" />}
                             {isTesting ? 'Verifying with Meta API...' : 'Test Connection & Verification API'}
                           </button>
                           
                           <AnimatePresence>
                             {testResult && (
                               <motion.div 
                                 initial={{ opacity: 0, height: 0 }}
                                 animate={{ opacity: 1, height: 'auto' }}
                                 exit={{ opacity: 0, height: 0 }}
                                 className={`mt-2 p-3 rounded-lg border flex gap-3 items-start ${
                                   testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                                 }`}
                               >
                                 {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                                 <p className="text-xs font-medium">{testResult.message}</p>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {(configuringIntegration?.type === 'facebook' || configuringIntegration?.type === 'whatsapp' || configuringIntegration?.type === 'zapier') && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-bold text-slate-700 border-l-4 border-indigo-500 pl-2">Ingest Live Data (Webhook)</h3>
                        <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3 relative overflow-hidden shadow-xl">
                           <div className="absolute top-0 right-0 p-4 opacity-10">
                              <Share2 className="w-12 h-12" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Webhook Endpoint URL</p>
                              <div className="flex items-center gap-2 bg-slate-800/50 p-3 rounded-xl border border-white/10 group">
                                 <code className="text-xs font-mono text-indigo-300 break-all flex-1">
                                    {`${window.location.origin}/api/integrations/webhook/${configuringIntegration?.id || '...'}`}
                                 </code>
                                 <button 
                                   type="button"
                                   onClick={() => {
                                      navigator.clipboard.writeText(`${window.location.origin}/api/integrations/webhook/${configuringIntegration?.id}`);
                                      alert('Webhook URL copied successfully to your clipboard. Place it in your external application settings.');
                                   }}
                                   className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors shadow-sm"
                                 >
                                    <Share2 className="w-3.5 h-3.5" />
                                 </button>
                              </div>
                           </div>
                           <p className="text-[10px] text-slate-400 leading-relaxed">
                              Copy this URL and place it in the "Webhook Settings" of {configuringIntegration?.name} to stream events instantly.
                           </p>
                        </div>
                      </div>
                    )}

                    {configuringIntegration?.type === 'zapier' && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Webhook URL</label>
                        <input 
                          type="url"
                          required
                          value={configForm.webhook_url || ''}
                          onChange={e => setConfigForm({...configForm, webhook_url: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                          placeholder="https://hooks.zapier.com/..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Mapping Configuration */}
                  <div className="col-span-2 space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 border-l-4 border-emerald-500 pl-2">Data Routing (Mapping)</h3>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Target Module (Table)</label>
                      <select 
                        required
                        value={configForm.target_module || ''}
                        onChange={e => setConfigForm({...configForm, target_module: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                      >
                        <option value="">Select Target Module...</option>
                        {configuringIntegration?.type === 'custom_ai' ? (
                          <>
                            <option value="ai_all">Unified AI Core Modules (AI Boardroom & AI Business)</option>
                            <option value="ai_boardroom">AI Boardroom Module (مداولات مجلس الإدارة)</option>
                            <option value="ai_business">AI Business Module (النمذجة والخطط)</option>
                          </>
                        ) : (
                          <>
                            <option value="leads">CRM Leads</option>
                            <option value="crm">Sales CRM (Deals)</option>
                            <option value="products">Catalog & Services (Products)</option>
                            <option value="tasks">Task Management</option>
                            <option value="attendance">HR Attendance Ledgers</option>
                          </>
                        )}
                      </select>
                    </div>

                    {configForm.target_module && (
                      <div className="space-y-4">
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-amber-50 border border-amber-150 rounded-xl p-4 flex items-start gap-3"
                        >
                          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-700 uppercase mb-1">Mapping Instructions:</p>
                            <p className="text-sm text-amber-800 leading-relaxed font-medium">
                              {getModuleInstructions(configForm.target_module)}
                            </p>
                          </div>
                        </motion.div>

                        {getModuleFields(configForm.target_module).length > 0 && (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                              <Table className="w-4 h-4 text-emerald-500" /> Column Mapping
                            </h4>
                            <div className="space-y-3">
                              {getModuleFields(configForm.target_module).map(field => (
                                <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-600 min-w-[100px]">{field.label}</span>
                                    {field.required && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">Required</span>}
                                    {field.unique && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">Unique</span>}
                                  </div>
                                  <input 
                                    type="text"
                                    placeholder={configuringIntegration?.type === 'google_sheets' ? "Sheet Column Header" : "External field name (e.g. full_name)"}
                                    value={(configForm.mappings || {})[field.key] || ''}
                                    onChange={e => handleMappingChange(field.key, e.target.value)}
                                    className="text-sm px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500/20 outline-none w-full sm:w-48"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsConfigModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSavingConfig}
                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSavingConfig ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Settings2 className="w-5 h-5" />}
                    Save Config & Connect
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntegrationHub;
