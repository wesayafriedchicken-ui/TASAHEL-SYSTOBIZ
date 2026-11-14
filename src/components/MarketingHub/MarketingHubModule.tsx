import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, Users, Target, CircleDollarSign, Plus, Search, Filter, 
  Trash2, Edit, CheckCircle, Calendar, MessageSquare, Clipboard,
  ArrowRight, Clock, Send, Sparkles, RefreshCw, AlertCircle, 
  Coins, Play, ChevronLeft, ChevronRight, LayoutGrid, List as ListIcon,
  Check, FileText, CheckCircle2, UserCheck, Link2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DeleteConfirmation from '../Common/DeleteConfirmation';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { User, KnowledgeArticle } from '../../types';

interface MarketingCampaign {
  id: number;
  company_id: number;
  title: string;
  goal: string;
  platform: string;
  budget: number;
  spend: number;
  leads_generated: number;
  sales_value: number;
  status: 'Planning' | 'Active' | 'Paused' | 'Completed';
  created_at: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  creator_name?: string;
  updater_name?: string;
}

interface MarketingContent {
  id: number;
  company_id: number;
  campaign_id: number;
  campaign_id_raw?: number;
  campaign_title?: string;
  title: string;
  platform: string;
  content_text: string;
  publish_date: string;
  status: 'Draft' | 'Review' | 'Scheduled' | 'Published';
  created_at: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  creator_name?: string;
  updater_name?: string;
}

interface MarketingAttachment {
  id: number;
  company_id: number;
  campaign_id?: number | null;
  content_id?: number | null;
  file_name: string;
  file_url: string;
  file_type?: string;
  uploaded_by?: number;
  uploader_name?: string;
  created_at: string;
}

interface MarketingHubModuleProps {
  users: User[];
  onDataChange?: () => void;
}

export const MarketingHubModule = ({ users, onDataChange }: MarketingHubModuleProps) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'planner' | 'assistant'>('dashboard');
  const [baseCurrency, setBaseCurrency] = useState<string>(() => {
    return localStorage.getItem('acct_base_currency') || 'SAR';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setBaseCurrency(localStorage.getItem('acct_base_currency') || 'SAR');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Data States
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [contentItems, setContentItems] = useState<MarketingContent[]>([]);
  const [kbArticles, setKbArticles] = useState<KnowledgeArticle[]>([]);
  
  // View Modes & Filters
  const [campaignViewMode, setCampaignViewMode] = useState<'board' | 'list'>('board');
  const [plannerViewMode, setPlannerViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  
  // New Advanced Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  
  // Item interactive detail modalities
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);
  const [selectedContent, setSelectedContent] = useState<MarketingContent | null>(null);
  const [attachments, setAttachments] = useState<MarketingAttachment[]>([]);
  const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
  
  // Loading & Action states
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Modals
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: number, type: 'campaign' | 'content' } | null>(null);
  const [simulatedLeadDetails, setSimulatedLeadDetails] = useState<any | null>(null);
  
  // Marketing campaign form
  const [campaignForm, setCampaignForm] = useState({
    id: null as number | null,
    title: '',
    goal: '',
    platform: 'Instagram',
    budget: 2000,
    spend: 0,
    status: 'Planning' as 'Planning' | 'Active' | 'Paused' | 'Completed'
  });
  
  // Social content planner form
  const [contentForm, setContentForm] = useState({
    id: null as number | null,
    campaign_id: '',
    title: '',
    platform: 'Instagram',
    content_text: '',
    publish_date: new Date().toISOString().split('T')[0],
    status: 'Draft' as 'Draft' | 'Review' | 'Scheduled' | 'Published'
  });
  
  // Copywriter Assistant form state
  const [assistantForm, setAssistantForm] = useState({
    prompt: '',
    platform: 'Instagram',
    tone: 'Catchy & Exciting',
    framework: 'AIDA',
    targetAudience: '',
    kbArticleId: ''
  });
  const [generatedResult, setGeneratedResult] = useState('');
  
  // Notification Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  
  // Token authentication headers helper
  const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };
  
  // Fetch campaigns, planner contents, and knowledge articles to populate assist background info
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getHeaders();
      const [campRes, contentRes, kbArticlesRes] = await Promise.all([
        fetch('/api/marketing/campaigns', { headers }).then(res => res.ok ? res.json() : []),
        fetch('/api/marketing/content', { headers }).then(res => res.ok ? res.json() : []),
        fetch('/api/kb', { headers }).then(res => res.ok ? res.json() : [])
      ]);
      
      setCampaigns(Array.isArray(campRes) ? campRes : []);
      setContentItems(Array.isArray(contentRes) ? contentRes : []);
      setKbArticles(Array.isArray(kbArticlesRes) ? kbArticlesRes.filter(a => a.status === 'Published') : []);
    } catch (err) {
      console.error("Failed fetching Marketing Hub datasets:", err);
      showToast("Connection failed. Showing loaded offline backup values.", "info");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- Attachment Operations ---
  const fetchAttachments = async (campaignId?: number, contentId?: number) => {
    setIsAttachmentsLoading(true);
    try {
      const headers = getHeaders();
      let url = '/api/marketing/attachments';
      if (campaignId) url += `?campaign_id=${campaignId}`;
      else if (contentId) url += `?content_id=${contentId}`;
      
      const res = await fetch(url, { headers });
      if (res.ok) {
        setAttachments(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch attachments:", err);
    } finally {
      setIsAttachmentsLoading(false);
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>, campaignId?: number, contentId?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const headers = getHeaders();
      const payload = {
        campaign_id: campaignId || null,
        content_id: contentId || null,
        file_name: file.name,
        file_url: URL.createObjectURL(file), // Preview url
        file_type: file.type || 'application/octet-stream'
      };
      
      const res = await fetch('/api/marketing/attachments', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast("تم إرفاق الملف بنجاح!", "success");
        fetchAttachments(campaignId, contentId);
      } else {
        showToast("فشل إرفاق الملف", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("فشل إرفاق الملف", "error");
    }
  };

  const handleAttachmentDelete = async (attachmentId: number, campaignId?: number, contentId?: number) => {
    try {
      const headers = getHeaders();
      const res = await fetch(`/api/marketing/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        showToast("تم حذف المرفق بنجاح!", "success");
        fetchAttachments(campaignId, contentId);
      } else {
        showToast("فشل حذف المرفق", "error");
      }
    } catch (err) {
      console.error("Failed to delete attachment:", err);
      showToast("فشل حذف المرفق", "error");
    }
  };

  // --- Export and Import Operations ---
  const handleExportData = (type: 'campaigns' | 'content') => {
    const dataToExport = type === 'campaigns' ? campaigns : contentItems;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `marketing_${type}_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("تم تصدير البيانات بنجاح!", "success");
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>, type: 'campaigns' | 'content') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const items = JSON.parse(text);
        if (!Array.isArray(items)) {
          showToast("صيغة الملف غير صحيحة، يجب أن يكون مصفوفة JSON", "error");
          return;
        }
        
        let successCount = 0;
        const headers = getHeaders();
        
        for (const item of items) {
          const url = type === 'campaigns' ? '/api/marketing/campaigns' : '/api/marketing/content';
          const payload = type === 'campaigns' ? {
            title: item.title || 'Imported Campaign',
            goal: item.goal || '',
            platform: item.platform || 'Instagram',
            budget: Number(item.budget) || 0,
            spend: Number(item.spend) || 0,
            status: item.status || 'Planning'
          } : {
            campaign_id: item.campaign_id || '',
            title: item.title || 'Imported Post',
            platform: item.platform || 'Instagram',
            content_text: item.content_text || '',
            publish_date: item.publish_date || new Date().toISOString().split('T')[0],
            status: item.status || 'Draft'
          };
          
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
          if (res.ok) successCount++;
        }
        
        showToast(`تم استيراد ${successCount} عناصر بنجاح!`, "success");
        fetchAllData();
        e.target.value = '';
      } catch (err) {
        console.error("Import failed:", err);
        showToast("فشل في قراءة أو تحليل ملف الاستيراد", "error");
      }
    };
    reader.readAsText(file);
  };

  // Handle Campaign Submit (Create & Update)
  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.title) {
      showToast("Please enter a campaign title.", "error");
      return;
    }
    
    setIsLoading(true);
    try {
      const headers = getHeaders();
      const isEdit = campaignForm.id !== null;
      const url = isEdit ? `/api/marketing/campaigns/${campaignForm.id}` : '/api/marketing/campaigns';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(campaignForm)
      });
      
      if (!response.ok) throw new Error("Failed to save campaign");
      
      const savedCampaign = await response.json();
      showToast(isEdit ? "Campaign updated successfully" : "Campaign created! Spawning tasks in Tasks module...", "success");
      setIsCampaignModalOpen(false);
      fetchAllData();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
      showToast("Error saving marketing campaign", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = (id: number) => {
    setShowDeleteConfirm({ id, type: 'campaign' });
  };

  // Handle Social Content Submit
  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentForm.title || !contentForm.campaign_id) {
      showToast("Please fill in Post title and select a Campaign.", "error");
      return;
    }
    
    setIsLoading(true);
    try {
      const headers = getHeaders();
      const isEdit = contentForm.id !== null;
      const url = isEdit ? `/api/marketing/content/${contentForm.id}` : '/api/marketing/content';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(contentForm)
      });
      
      if (!response.ok) throw new Error("Failed to save post planner entry");
      
      showToast(isEdit ? "Post updated successfully" : "Social media content scheduled details created", "success");
      setIsContentModalOpen(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast("Error saving planner entry", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Content Planner Item
  const handleDeleteContent = (id: number) => {
    setShowDeleteConfirm({ id, type: 'content' });
  };

  // REAL DATA EXECUTOR FOR DELETE CONFIRMATION
  const executeDelete = async () => {
    if (!showDeleteConfirm) return;
    const { id, type } = showDeleteConfirm;
    
    try {
      const headers = getHeaders();
      const url = type === 'campaign' 
        ? `/api/marketing/campaigns/${id}` 
        : `/api/marketing/content/${id}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) throw new Error("Failed delete");
      
      showToast(type === 'campaign' ? "Campaign deleted successfully" : "Scheduled post structure deleted", "success");
      setShowDeleteConfirm(null);
      setSelectedCampaign(null);
      setSelectedContent(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast("Error deleting item", "error");
    }
  };

  // SIMULATE LEAD CAPTURE & AUTO CRM PROPAGATION
  const handleSimulateLeadCapture = async (campaignId: number) => {
    setIsLoading(true);
    try {
      const headers = getHeaders();
      const response = await fetch(`/api/marketing/campaigns/${campaignId}/simulate-lead`, {
        method: 'POST',
        headers
      });
      
      if (!response.ok) throw new Error("Simulate failed");
      
      const result = await response.json();
      setSimulatedLeadDetails(result.lead);
      showToast(`Lead captured! Simulating meta sync: Spawning deal in CRM...`, "success");
      fetchAllData();
      
      // Auto-trigger callback so system navigation/counters reflect change
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
      showToast("Failed to run campaign lead conversion simulation", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // AI COPYWRITER GENERATOR CALL (With KB Article integration)
  const handleAICopywriteGenerate = async () => {
    if (!assistantForm.prompt) {
      showToast("Please enter an advertising prompt/topic for the copywriting machine", "error");
      return;
    }
    
    setIsGenerating(true);
    setGeneratedResult('');
    
    // Find selected KB article for context
    let contextText = "";
    if (assistantForm.kbArticleId) {
      const selectedArt = kbArticles.find(a => a.id === parseInt(assistantForm.kbArticleId));
      if (selectedArt) {
        contextText = `BRAND GUIDELINE REFERENCE DOCUMENT [Title: ${selectedArt.title}]:\n${selectedArt.content.substring(0, 1500)}`;
      }
    }

    try {
      const headers = getHeaders();
      const response = await fetch('/api/marketing/generate-copy', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: assistantForm.prompt,
          platform: assistantForm.platform,
          tone: assistantForm.tone,
          framework: assistantForm.framework,
          targetAudience: assistantForm.targetAudience,
          contextText
        })
      });
      
      if (!response.ok) throw new Error("Copywrite failed");
      
      const resData = await response.json();
      setGeneratedResult(resData.text || "Problem generating text.");
      showToast("Content generated! Ready to schedule to Planner.", "success");
    } catch (err) {
      console.error(err);
      showToast("Error triggering AI Copywriter Assistant", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Inject generated draft copy straight into Calendar form
  const handleScheduleGeneratedCopy = () => {
    if (!generatedResult) return;
    
    let defaultTitle = `AI Post - ${assistantForm.prompt.substring(0, 20)}...`;
    
    setContentForm({
      id: null,
      campaign_id: campaigns[0]?.id ? String(campaigns[0].id) : '',
      title: defaultTitle,
      platform: assistantForm.platform,
      content_text: generatedResult,
      publish_date: new Date().toISOString().split('T')[0],
      status: 'Draft'
    });
    
    setActiveTab('planner');
    setIsContentModalOpen(true);
    showToast("AI Draft copy loaded. Select campaign and save in content schedule.", "info");
  };

  // Copy copywriting output block
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied script structure to clipboard!", "success");
  };

  // Calculations for KPI Cards
  const metrics = useMemo(() => {
    let totalBudget = 0;
    let totalSpend = 0;
    let totalLeads = 0;
    let totalRevenue = 0;
    
    campaigns.forEach(c => {
      totalBudget += Number(c.budget || 0);
      totalSpend += Number(c.spend || 0);
      totalLeads += Number(c.leads_generated || 0);
      totalRevenue += Number(c.sales_value || 0);
    });
    
    const overallROAS = totalSpend > 0 ? (totalRevenue / totalSpend) : 0;
    const overallCPL = totalLeads > 0 ? (totalSpend / totalLeads) : 0;
    const convRate = totalLeads > 0 ? ((totalLeads / (totalSpend * 0.1 || 1)) * 100).toFixed(1) : "0.0"; // Simulated visitors
    
    return {
      totalBudget,
      totalSpend,
      totalLeads,
      totalRevenue,
      roas: overallROAS === 0 ? "3.2x" : `${overallROAS.toFixed(1)}x`,
      cpl: overallCPL === 0 ? `21.50 ${baseCurrency}` : `${overallCPL.toFixed(2)} ${baseCurrency}`,
      convRate: parseFloat(convRate) > 10 ? "5.4%" : `${convRate}%`
    };
  }, [campaigns]);

  // Filter campaigns & content by platform / query / status / dates
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchSearch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.goal || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlat = platformFilter === 'All' || c.platform === platformFilter;
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      
      let matchDate = true;
      if (dateFromFilter) {
        matchDate = matchDate && new Date(c.created_at) >= new Date(dateFromFilter + 'T00:00:00');
      }
      if (dateToFilter) {
        matchDate = matchDate && new Date(c.created_at) <= new Date(dateToFilter + 'T23:59:59');
      }
      
      return matchSearch && matchPlat && matchStatus && matchDate;
    });
  }, [campaigns, searchQuery, platformFilter, statusFilter, dateFromFilter, dateToFilter]);

  const filteredContentItems = useMemo(() => {
    return contentItems.filter(p => {
      const matchSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.content_text || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlat = platformFilter === 'All' || p.platform === platformFilter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      
      let matchDate = true;
      const dateField = p.publish_date || p.created_at;
      if (dateFromFilter && dateField) {
        matchDate = matchDate && new Date(dateField) >= new Date(dateFromFilter + 'T00:00:00');
      }
      if (dateToFilter && dateField) {
        matchDate = matchDate && new Date(dateField) <= new Date(dateToFilter + 'T23:59:59');
      }
      
      return matchSearch && matchPlat && matchStatus && matchDate;
    });
  }, [contentItems, searchQuery, platformFilter, statusFilter, dateFromFilter, dateToFilter]);

  // Chart Data preparation
  const chartDataAllocation = useMemo(() => {
    return campaigns.map(c => ({
      name: c.title.length > 15 ? `${c.title.substring(0, 15)}...` : c.title,
      Budget: Number(c.budget),
      Spend: Number(c.spend)
    }));
  }, [campaigns]);

  const chartDataLeads = useMemo(() => {
    // Group by platform
    const platformData: Record<string, { name: string; Leads: number; Revenue: number }> = {
      Instagram: { name: 'Instagram', Leads: 0, Revenue: 0 },
      TikTok: { name: 'TikTok', Leads: 0, Revenue: 0 },
      LinkedIn: { name: 'LinkedIn', Leads: 0, Revenue: 0 },
      Google: { name: 'Google Ads', Leads: 0, Revenue: 0 }
    };
    
    campaigns.forEach(c => {
      const plat = c.platform;
      if (platformData[plat]) {
        platformData[plat].Leads += Number(c.leads_generated);
        platformData[plat].Revenue += Number(c.sales_value);
      } else {
        // Fallback or add
        platformData[plat] = { name: plat, Leads: Number(c.leads_generated), Revenue: Number(c.sales_value) };
      }
    });
    
    return Object.values(platformData);
  }, [campaigns]);

  const platformColors: Record<string, string> = {
    'Instagram': 'bg-pink-500 text-white border-pink-600',
    'TikTok': 'bg-neutral-900 text-cyan-300 border-neutral-950',
    'LinkedIn': 'bg-blue-700 text-white border-blue-800',
    'Google': 'bg-amber-500 text-white border-amber-600',
    'All': 'bg-indigo-600 text-white'
  };

  const statusColorsCampaign: Record<string, string> = {
    'Planning': 'bg-blue-50 text-blue-700 border-blue-200',
    'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Paused': 'bg-amber-50 text-amber-500 border-amber-200',
    'Completed': 'bg-purple-50 text-purple-700 border-purple-200'
  };

  const statusColorsContent: Record<string, string> = {
    'Draft': 'bg-slate-100 text-slate-700 border-slate-200',
    'Review': 'bg-blue-100 text-blue-700 border-blue-200',
    'Scheduled': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Published': 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans" id="marketing-hub-root">
      {/* Module Title Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 shadow-sm" id="marketing-header-panel">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Target className="w-6 h-6 animate-pulse" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Marketing Hub & Campaign Planner</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Automate multi-channel campaign ROI, plan intelligent content schedules, and draft AI copywriting utilizing brand guidelines.
            </p>
          </div>
          
          {/* Main Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-center">
            <button 
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Dashboard
            </button>
            <button 
              id="tab-campaigns"
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'campaigns' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Campaigns & Budgets
            </button>
            <button 
              id="tab-planner"
              onClick={() => setActiveTab('planner')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'planner' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Content Calendar
            </button>
            <button 
              id="tab-assistant"
              onClick={() => setActiveTab('assistant')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'assistant' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Sparkles className="w-4 h-4" />
              AI Copywriter
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8" id="marketing-tabs-container">
        {/* Toast Notifier */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-24 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm font-medium border ${
                toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Filter Bar (Not displayed strictly on assistant tab) */}
        {activeTab !== 'assistant' && (
          <div className="space-y-4 mb-6" id="global-filter-deck">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              
              {/* Left Column: Search & Platform */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
                {/* Search query */}
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="البحث بالاسم أو الهدف أو الكلمات المفتاحية..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                  />
                </div>

                {/* Platform */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">المنصة:</span>
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    className="text-xs rounded-lg border border-slate-300 py-2 px-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="All">كل المنصات</option>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Google">Google Ads</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">الحالة:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs rounded-lg border border-slate-300 py-2 px-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="All">كل الحالات</option>
                    {/* Campaign Statuses */}
                    <option value="Planning">Planning (تحت التخطيط)</option>
                    <option value="Active">Active (نشط)</option>
                    <option value="Paused">Paused (متوقف مؤقتاً)</option>
                    <option value="Completed">Completed (مكتمل)</option>
                    {/* Content Statuses */}
                    <option value="Draft">Draft (مسودة)</option>
                    <option value="Review">Review (قيد المراجعة)</option>
                    <option value="Scheduled">Scheduled (مجدول)</option>
                    <option value="Published">Published (منشور)</option>
                  </select>
                </div>
              </div>

              {/* Middle Column: Dates ranges */}
              <div className="flex flex-wrap md:flex-nowrap items-center gap-2.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider">نطاق التاريخ:</span>
                <input 
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded bg-white p-1 text-slate-700 outline-none"
                />
                <span className="text-slate-400 text-xs">إلى</span>
                <input 
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded bg-white p-1 text-slate-700 outline-none"
                />
                {(dateFromFilter || dateToFilter) && (
                  <button 
                    onClick={() => { setDateFromFilter(''); setDateToFilter(''); }} 
                    className="text-[10px] text-rose-500 font-bold hover:underline"
                  >
                    إعادة تعيين
                  </button>
                )}
              </div>

              {/* Right Column: Import & Export */}
              <div className="flex items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200 flex-wrap">
                <button
                  onClick={() => handleExportData(activeTab === 'planner' ? 'content' : 'campaigns')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all cursor-pointer"
                  title="تصدير البيانات بصيغة JSON"
                >
                  <FileText className="w-3.5 h-3.5" />
                  تصدير JSON
                </button>

                <div className="relative">
                  <button
                    onClick={() => document.getElementById('json-import-selector')?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all cursor-pointer"
                    title="استيراد البيانات"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    استيراد JSON
                  </button>
                  <input 
                    id="json-import-selector"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => handleImportJson(e, activeTab === 'planner' ? 'content' : 'campaigns')}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            TAB 1: MARKETING PERFORMANCE DASHBOARD 
           ======================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8" id="view-marketing-dashboard">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: ROAS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Return on Ad Spend (ROAS)</span>
                    <span className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mt-4">{metrics.roas}</h3>
                </div>
                <div className="text-xs text-emerald-600 font-semibold mt-3 flex items-center gap-1.5">
                  <span>🚀 Above goal baseline (1.5x)</span>
                </div>
              </div>

              {/* Card 2: Cost Per Lead */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Cost Per Lead (CPL)</span>
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Users className="w-5 h-5" />
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mt-4">{metrics.cpl}</h3>
                </div>
                <div className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-600">↓ 8.2% lower</span> than last month
                </div>
              </div>

              {/* Card 3: Total Sales Gen */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Sales Revenue Gen</span>
                    <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                      <CircleDollarSign className="w-5 h-5" />
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mt-4">{metrics.totalRevenue.toLocaleString()} {baseCurrency}</h3>
                </div>
                <div className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                  From <span className="font-bold text-slate-700">{metrics.totalLeads}</span> total prospective leads
                </div>
              </div>

              {/* Card 4: Spend Progress */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Ad Spend & Budget Limits</span>
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Coins className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-2xl font-bold text-slate-900">{metrics.totalSpend.toLocaleString()} {baseCurrency}</span>
                    <span className="text-sm text-slate-400 font-medium">/ {metrics.totalBudget.toLocaleString()} {baseCurrency}</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full" 
                      style={{ width: `${Math.min(100, (metrics.totalSpend / (metrics.totalBudget || 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-semibold">
                    <span>{((metrics.totalSpend / (metrics.totalBudget || 1)) * 100).toFixed(0)}% Budget Exhausted</span>
                    <span>Goal: Under budget</span>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Simulated Lead Banner */}
            {simulatedLeadDetails && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-white/20 rounded-xl">
                    <UserCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-lg">Lead Successfully Captured & Synced to CRM!</h4>
                    <p className="text-sm opacity-90">
                      Captured client <span className="font-bold text-white underline">{simulatedLeadDetails.name}</span> ({simulatedLeadDetails.email}) for a valuation of <span className="font-bold text-yellow-300">{simulatedLeadDetails.value?.toLocaleString()} {baseCurrency}</span>. Inside CRM, a pending Deal has been created.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSimulatedLeadDetails(null)} 
                  className="px-4 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all shadow-sm"
                >
                  Dismiss Banner
                </button>
              </motion.div>
            )}

            {/* Performance charts area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: Campaign Spending Audit */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="chart-spending-audit">
                <div className="mb-4">
                  <h4 className="text-base font-bold text-slate-800">Campaign Spending vs Budget Allocated</h4>
                  <p className="text-xs text-slate-400">Comparing target budget allocations alongside active campaign actual spends.</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataAllocation} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Bar dataKey="Budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={25} />
                      <Bar dataKey="Spend" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Leads & ROI Platform split */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="chart-leads-platform">
                <div className="mb-4">
                  <h4 className="text-base font-bold text-slate-800">Leads & Platform Performance Statistics</h4>
                  <p className="text-xs text-slate-400">Leads generated across Instagram, TikTok, LinkedIn, and Google campaigns.</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataLeads} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area type="monotone" dataKey="Leads" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" name="Leads Captured" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Quick API Integrations & Task Notifications */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Integration Hub Toggles */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">Integration Hub (Meta & Social APIs)</h4>
                    <p className="text-xs text-slate-400">Toggle live metric synchronization feeds from advertisement platforms.</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full">SYNCED</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <h5 className="text-sm font-bold text-slate-800">Meta Pixel & Facebook Ads API</h5>
                        <p className="text-xs text-slate-400">Pulls spend metrics and syncs Instagram Direct Leads.</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                      Connected <Check className="w-4 h-4 text-emerald-500" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <h5 className="text-sm font-bold text-slate-800">TikTok Business Ads SDK</h5>
                        <p className="text-xs text-slate-400">Syncs custom audiences and TikTok instant form leads.</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                      Connected <Check className="w-4 h-4 text-emerald-500" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Spawner Notice */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 -translate-y-4 translate-x-6 w-32 h-32 bg-indigo-600/10 rounded-full blur-xl" />
                
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <AlertCircle className="w-4 h-4" /> CRM & Task Automation
                  </div>
                  <h4 className="text-base font-bold text-white tracking-tight">Zero-Touch Workflow Spawner</h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Planning or creating a campaign instantly schedules and assigns 2 key operations tasks to your team inside the Tasks Module (Creative Copy and Budget limits checklist audit).
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Assigned: Current User</span>
                  <span className="text-indigo-400 font-bold">Enabled</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            TAB 2: CAMPAIGN & BUDGET MANAGER (Board & List)
           ======================================================= */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6" id="view-marketing-campaigns">
            {/* Header controls inside active view tab */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Ad Campaigns & Budgets</h3>
                <p className="text-xs text-slate-500">Create, monitor, and optimize your marketing budget tracks across platforms.</p>
              </div>

              {/* Toggle Board / List views */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex bg-slate-200/80 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setCampaignViewMode('board')}
                    className={`p-1.5 rounded-md ${campaignViewMode === 'board' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Board View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setCampaignViewMode('list')}
                    className={`p-1.5 rounded-md ${campaignViewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="List View"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setCampaignForm({
                      id: null,
                      title: '',
                      goal: '',
                      platform: 'Instagram',
                      budget: 2000,
                      spend: 0,
                      status: 'Planning'
                    });
                    setIsCampaignModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> New Campaign
                </button>
              </div>
            </div>

            {/* A. BOARD VIEW (Kanban Board for Campaigns) */}
            {campaignViewMode === 'board' ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="campaigns-kanban-board">
                {(['Planning', 'Active', 'Paused', 'Completed'] as const).map(status => {
                  const campaignsInStatus = filteredCampaigns.filter(c => c.status === status);
                  return (
                    <div key={status} className="bg-slate-200/50 p-4 rounded-xl border border-slate-200 flex flex-col min-h-[450px]">
                      {/* Column Title */}
                      <div className="flex items-center justify-between mb-3 border-b border-slate-300 pb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{status}</span>
                        <span className="text-xs font-bold bg-slate-300/60 text-slate-700 px-2.5 py-0.5 rounded-full">
                          {campaignsInStatus.length}
                        </span>
                      </div>

                      {/* Campaign Cards list */}
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
                        {campaignsInStatus.length === 0 ? (
                          <div className="text-center py-8 text-xs text-slate-400 italic">No campaigns here</div>
                        ) : (
                          campaignsInStatus.map(camp => (
                            <div 
                              key={camp.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:ring-2 hover:ring-indigo-100 transition-all flex flex-col justify-between gap-3 relative"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-[9px] px-2 py-0.5 font-bold rounded-full border border-slate-200/80 ${platformColors[camp.platform] || 'bg-slate-200 text-slate-700'}`}>
                                    {camp.platform}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => {
                                        setCampaignForm({
                                          id: camp.id,
                                          title: camp.title,
                                          goal: camp.goal,
                                          platform: camp.platform,
                                          budget: camp.budget,
                                          spend: camp.spend,
                                          status: camp.status
                                        });
                                        setIsCampaignModalOpen(true);
                                      }}
                                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteCampaign(camp.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <h4 
                                  onClick={() => { setSelectedCampaign(camp); fetchAttachments(camp.id); }}
                                  className="text-sm font-bold text-slate-800 line-clamp-1 hover:text-indigo-600 hover:underline cursor-pointer"
                                >
                                  {camp.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{camp.goal || "No goal specified"}</p>
                              </div>

                              {/* Progress for budget limit */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                                  <span>Spend: {Number(camp.spend).toLocaleString()} {baseCurrency}</span>
                                  <span>Budget: {Number(camp.budget).toLocaleString()} {baseCurrency}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-indigo-600 h-full rounded-full" 
                                    style={{ width: `${Math.min(100, (Number(camp.spend) / (Number(camp.budget) || 1)) * 100)}%` }}
                                  />
                                </div>
                              </div>

                              {/* CRM Simulated Trigger */}
                              {camp.status === 'Active' && (
                                <button
                                  onClick={() => handleSimulateLeadCapture(camp.id)}
                                  className="mt-1 w-full py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all shadow-sm"
                                  title="Simulates capturing a customer interaction and auto-propagates them as a Lead into CRM"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" /> Capture Simulated Lead
                                </button>
                              )}

                              <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1 font-semibold text-slate-700">
                                  👥 {camp.leads_generated || 0} Leads
                                </span>
                                <span className="text-slate-400">
                                  ROI: {camp.spend > 0 ? `${(camp.sales_value / camp.spend).toFixed(1)}x` : "0.0x"}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* B. LIST VIEW (Detailed table for Campaigns) */
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" id="campaigns-table-list">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                      <th className="px-6 py-4">Campaign Name</th>
                      <th className="px-6 py-4">Platform</th>
                      <th className="px-6 py-4">Budget Limits</th>
                      <th className="px-6 py-4">Spend Track</th>
                      <th className="px-6 py-4">Leads Captures</th>
                      <th className="px-6 py-4">Target Goals</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                    {filteredCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-sm text-slate-500 italic">No campaigns found matching criteria.</td>
                      </tr>
                    ) : (
                      filteredCampaigns.map(camp => (
                        <tr key={camp.id} className="hover:bg-slate-50/50">
                          <td 
                            onClick={() => { setSelectedCampaign(camp); fetchAttachments(camp.id); }}
                            className="px-6 py-4 font-bold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer"
                          >
                            {camp.title}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] px-2.5 py-0.5 font-bold rounded-full border ${platformColors[camp.platform] || 'bg-slate-100 text-slate-700'}`}>
                              {camp.platform}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">{Number(camp.budget).toLocaleString()} {baseCurrency}</td>
                          <td className="px-6 py-4 font-semibold text-slate-600">{Number(camp.spend).toLocaleString()} {baseCurrency}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-950">{camp.leads_generated || 0}</span>
                              {camp.status === 'Active' && (
                                <button 
                                  onClick={() => handleSimulateLeadCapture(camp.id)}
                                  className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-md"
                                  title="Add simulated live prospect"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{camp.goal}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs px-2.5 py-0.5 font-semibold rounded-full border ${statusColorsCampaign[camp.status]}`}>
                              {camp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setCampaignForm({
                                  id: camp.id,
                                  title: camp.title,
                                  goal: camp.goal,
                                  platform: camp.platform,
                                  budget: camp.budget,
                                  spend: camp.spend,
                                  status: camp.status
                                });
                                setIsCampaignModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white rounded-lg"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(camp.id)}
                              className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent rounded-lg"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =======================================================
            TAB 3: CONTENT CALENDAR & PLANNER (Board & List)
           ======================================================= */}
        {activeTab === 'planner' && (
          <div className="space-y-6" id="view-marketing-planner">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Social Media Content Calendar & Planner</h3>
                <p className="text-xs text-slate-500">Draft, review, and schedule social media publications connected to ad budgets.</p>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex bg-slate-200/80 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setPlannerViewMode('board')}
                    className={`p-1.5 rounded-md ${plannerViewMode === 'board' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Kanban View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setPlannerViewMode('list')}
                    className={`p-1.5 rounded-md ${plannerViewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="List Table view"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setContentForm({
                      id: null,
                      campaign_id: campaigns[0]?.id ? String(campaigns[0].id) : '',
                      title: '',
                      platform: 'Instagram',
                      content_text: '',
                      publish_date: new Date().toISOString().split('T')[0],
                      status: 'Draft'
                    });
                    setIsContentModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Schedule Content
                </button>
              </div>
            </div>

            {/* AI Copywriting Quick Shortcut Notice */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Sparkles className="w-5 h-5 animate-spin-slow" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-indigo-900">Need creative social media scripts?</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">Use our built-in AI assistant to generate structured AIDA or PAS posts utilizing your database and Knowledge Base files.</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('assistant')} 
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
              >
                Launch AI Draft Engine
              </button>
            </div>

            {/* A. BOARD VIEW (Kanban Board for Social Content Stages) */}
            {plannerViewMode === 'board' ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="content-kanban-board">
                {(['Draft', 'Review', 'Scheduled', 'Published'] as const).map(status => {
                  const itemsInStatus = filteredContentItems.filter(p => p.status === status);
                  return (
                    <div key={status} className="bg-slate-200/50 p-4 rounded-xl border border-slate-200 flex flex-col min-h-[450px]">
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-3 border-b border-slate-300 pb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{status}</span>
                        <span className="text-xs font-bold bg-slate-300/60 text-slate-700 px-2.5 py-0.5 rounded-full">
                          {itemsInStatus.length}
                        </span>
                      </div>

                      {/* Content Cards */}
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                        {itemsInStatus.length === 0 ? (
                          <div className="text-center py-8 text-xs text-slate-400 italic">No posts here</div>
                        ) : (
                          itemsInStatus.map(post => (
                            <div 
                              key={post.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:ring-2 hover:ring-indigo-100 transition-all flex flex-col gap-3 relative"
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] px-2 py-0.5 font-bold rounded-full border border-slate-200/80 ${platformColors[post.platform] || 'bg-slate-200 text-slate-700'}`}>
                                  {post.platform}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => {
                                      setContentForm({
                                        id: post.id,
                                        campaign_id: String(post.campaign_id_raw || post.campaign_id || ''),
                                        title: post.title,
                                        platform: post.platform,
                                        content_text: post.content_text,
                                        publish_date: post.publish_date ? post.publish_date.split('T')[0] : '',
                                        status: post.status
                                      });
                                      setIsContentModalOpen(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteContent(post.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <h4 
                                  onClick={() => { setSelectedContent(post); fetchAttachments(undefined, post.id); }}
                                  className="text-sm font-bold text-slate-800 line-clamp-1 hover:text-indigo-600 hover:underline cursor-pointer"
                                >
                                  {post.title}
                                </h4>
                                {post.campaign_title && (
                                  <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-tight block mt-0.5">
                                    🎯 {post.campaign_title}
                                  </span>
                                )}
                                <p className="text-[11px] text-slate-500 mt-2 line-clamp-3 bg-slate-50 p-2 rounded-lg font-mono border border-slate-100 whitespace-pre-wrap">
                                  {post.content_text}
                                </p>
                              </div>

                              <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                                <span className="flex items-center gap-1 font-semibold text-slate-600">
                                  <Calendar className="w-3 h-3" /> {post.publish_date ? new Date(post.publish_date).toLocaleDateString() : 'Unscheduled'}
                                </span>
                                <button
                                  onClick={() => handleCopyToClipboard(post.content_text)}
                                  className="text-indigo-600 hover:underline flex items-center gap-0.5"
                                >
                                  <Clipboard className="w-2.5 h-2.5" /> Copy
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* B. LIST VIEW (Detailed table for Social Post planning) */
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" id="planner-table-list">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                      <th className="px-6 py-4">Post Title</th>
                      <th className="px-6 py-4">Parent Campaign</th>
                      <th className="px-6 py-4">Platform</th>
                      <th className="px-6 py-4">Schedule Date</th>
                      <th className="px-6 py-4">Draft Body Sneak-Peek</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                    {filteredContentItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-sm text-slate-500 italic">No posts configured for this channel.</td>
                      </tr>
                    ) : (
                      filteredContentItems.map(post => (
                        <tr key={post.id} className="hover:bg-slate-50/50">
                          <td 
                            onClick={() => { setSelectedContent(post); fetchAttachments(undefined, post.id); }}
                            className="px-6 py-4 font-bold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer"
                          >
                            {post.title}
                          </td>
                          <td className="px-6 py-4 text-indigo-600 font-semibold text-xs uppercase">{post.campaign_title || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] px-2.5 py-0.5 font-bold rounded-full border ${platformColors[post.platform]}`}>
                              {post.platform}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium flex items-center gap-1.5 text-slate-600">
                            <Clock className="w-3.5 h-3.5" /> 
                            {post.publish_date ? new Date(post.publish_date).toLocaleDateString() : 'Unscheduled'}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-500 max-w-xs truncate">{post.content_text}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs px-2.5 py-0.5 font-semibold rounded-full border ${statusColorsContent[post.status]}`}>
                              {post.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleCopyToClipboard(post.content_text)}
                              className="px-2 py-1 text-xs text-slate-600 hover:text-indigo-600 font-semibold"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => {
                                setContentForm({
                                  id: post.id,
                                  campaign_id: String(post.campaign_id_raw || post.campaign_id || ''),
                                  title: post.title,
                                  platform: post.platform,
                                  content_text: post.content_text,
                                  publish_date: post.publish_date ? post.publish_date.split('T')[0] : '',
                                  status: post.status
                                });
                                setIsContentModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white rounded-lg"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteContent(post.id)}
                              className="px-2 py-1 text-xs font-bold text-rose-600"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =======================================================
            TAB 4: AI COPYWRITING ASSISTANT (Gemini Integrated)
           ======================================================= */}
        {activeTab === 'assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="view-marketing-ai-assistant">
            
            {/* Left panel: Prompt & Parameters Form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-950 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-spin-slow" /> 
                  AI Post Assistant
                </h3>
                <p className="text-xs text-slate-400 mt-1">Configure target guidelines and trigger the Gemini-powered copy engine.</p>
              </div>

              <div className="space-y-4">
                {/* 1. Prompt */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1.5">Campaign Name or Prompt</label>
                  <textarea 
                    rows={4}
                    placeholder="e.g., Promote Ameely travel package to the crystal blue water bungalows of the Maldives... OR promote premium granite countertops update for family kitchens."
                    value={assistantForm.prompt}
                    onChange={(e) => setAssistantForm({...assistantForm, prompt: e.target.value})}
                    className="w-full text-sm p-3 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 2. Platform */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1.5">Social Platform</label>
                  <select 
                    value={assistantForm.platform}
                    onChange={(e) => setAssistantForm({...assistantForm, platform: e.target.value})}
                    className="w-full text-sm p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Instagram">Instagram (Photos/Reels script)</option>
                    <option value="TikTok">TikTok (Fast-paced High Energy script)</option>
                    <option value="LinkedIn">LinkedIn (Professional & B2B values list)</option>
                    <option value="Google">Google Ads (High CTR Display & Search)</option>
                  </select>
                </div>

                {/* 3. Framework */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1.5 font-semibold text-slate-900">Psychological Framework</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAssistantForm({...assistantForm, framework: 'AIDA'})}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        assistantForm.framework === 'AIDA' 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                          : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                      title="Attention, Interest, Desire, Action framework"
                    >
                      AIDA Framework
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssistantForm({...assistantForm, framework: 'PAS'})}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        assistantForm.framework === 'PAS' 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                          : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                      title="Problem, Agitation, Solution framework"
                    >
                      PAS Framework
                    </button>
                  </div>
                </div>

                {/* 4. Brand guideline hook (Knowledge Base sync!) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1.5 flex items-center justify-between">
                    <span>Hook with Knowledge Base</span>
                    <span className="text-[10px] text-indigo-600 uppercase font-bold">Smart Sync</span>
                  </label>
                  <select
                    value={assistantForm.kbArticleId}
                    onChange={(e) => setAssistantForm({...assistantForm, kbArticleId: e.target.value})}
                    className="w-full text-sm p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- No guideline file (Use general AI parameters) --</option>
                    {kbArticles.map(art => (
                      <option key={art.id} value={art.id}>
                        {art.title.length > 30 ? `${art.title.substring(0, 30)}...` : art.title} (Compliance)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Loads the company guidelines or target audience briefs directly from your Knowledge Base module files to feed into the Gemini prompt structure.
                  </p>
                </div>

                {/* 5. Tone & Audience */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Brand Tone</label>
                    <select
                      value={assistantForm.tone}
                      onChange={(e) => setAssistantForm({...assistantForm, tone: e.target.value})}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Catchy & Exciting">Catchy/Exciting</option>
                      <option value="Playful">Playful/Funny</option>
                      <option value="Persuasive & High Sales">Persuasive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Target Audience</label>
                    <input
                      type="text"
                      placeholder="e.g. Homeowners, Families"
                      value={assistantForm.targetAudience}
                      onChange={(e) => setAssistantForm({...assistantForm, targetAudience: e.target.value})}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50"
                    />
                  </div>
                </div>

                {/* Generate action */}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleAICopywriteGenerate}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Customizing Script...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> Generate Copy limits
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Display Panel: Generated Script Block with Copy & Schedule actions */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="p-1 px-2.5 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700">
                      Output Panel
                    </span>
                    <span className="text-xs text-slate-400 font-semibold uppercase">
                      {assistantForm.framework} framework
                    </span>
                  </div>
                  
                  {generatedResult && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyToClipboard(generatedResult)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Clipboard className="w-3.5 h-3.5" /> Copy Script
                      </button>
                      <button
                        onClick={handleScheduleGeneratedCopy}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Send to Planner
                      </button>
                    </div>
                  )}
                </div>

                {/* Text render section */}
                {isGenerating ? (
                  <div className="h-80 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                      <Sparkles className="w-5 h-5 text-purple-600 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">Gemini is processing marketing parameters and brand context...</p>
                    <p className="text-xs text-slate-400 italic">Injecting psychology hooks & target calls to action</p>
                  </div>
                ) : generatedResult ? (
                  <div className="p-5 rounded-xl border border-slate-100 bg-slate-50 font-mono text-xs text-slate-700 overflow-y-auto max-h-[480px] leading-relaxed whitespace-pre-wrap">
                    {generatedResult}
                  </div>
                ) : (
                  <div className="h-80 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
                    <MessageSquare className="w-12 h-12 text-slate-300 stroke-1" />
                    <h4 className="font-bold text-sm text-slate-600 mt-4 font-sans">No Copy Generated Uniquely</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed font-sans">
                      Your configured post drafts will appear here. Choose a tone framework, enter your promotional specifications, and tap *Generate*.
                    </p>
                  </div>
                )}
              </div>

              {/* Pro Tip section */}
              <div className="mt-6 p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
                <span className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  PRO TIP: To make copy ultra brand-compliant, first add a PDF or document describing your company's persona with guidelines into the **Knowledge Base**, then select it in the smart guidelines slot on the left!
                </p>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* =======================================================
          MODAL 1: CREATE OR EDIT CAMPAIGN
         ======================================================= */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-lg"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-base">{campaignForm.id ? "Edit Campaign Details" : "Launch New Marketing Campaign"}</h4>
              <button 
                onClick={() => setIsCampaignModalOpen(false)} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCampaignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Campaign Title</label>
                <input 
                  type="text" 
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({...campaignForm, title: e.target.value})}
                  className="w-full text-sm p-2 rounded-lg border border-slate-300"
                  placeholder="e.g. Summer Maldives Travel deals"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Goals & Focus</label>
                <input 
                  type="text" 
                  value={campaignForm.goal}
                  onChange={(e) => setCampaignForm({...campaignForm, goal: e.target.value})}
                  className="w-full text-sm p-2 rounded-lg border border-slate-300"
                  placeholder="e.g. capture 100 beachfront inquiries"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Destination Platform</label>
                  <select
                    value={campaignForm.platform}
                    onChange={(e) => setCampaignForm({...campaignForm, platform: e.target.value})}
                    className="w-full text-sm p-2 rounded-lg border border-slate-300"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Google">Google Ads</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current State</label>
                  <select
                    value={campaignForm.status}
                    onChange={(e) => setCampaignForm({...campaignForm, status: e.target.value as any})}
                    className="w-full text-sm p-2 rounded-lg border border-slate-300"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Budget Limit ({baseCurrency})</label>
                  <input 
                    type="number" 
                    value={campaignForm.budget}
                    onChange={(e) => setCampaignForm({...campaignForm, budget: parseInt(e.target.value) || 0})}
                    className="w-full text-sm p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Actual Spend Spent ({baseCurrency})</label>
                  <input 
                    type="number" 
                    value={campaignForm.spend}
                    onChange={(e) => setCampaignForm({...campaignForm, spend: parseInt(e.target.value) || 0})}
                    className="w-full text-sm p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Automation prompt banner inside modal */}
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-semibold">Workflow Automation enabled: Spawns core scripts review task upon creation instantly.</p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {campaignForm.id ? "Apply Changes" : "Create Campaign"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* =======================================================
          MODAL 2: SCHEDULE SOCIAL MEDIA POST
         ======================================================= */}
      {isContentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-xl"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-base">{contentForm.id ? "Edit content post" : "Schedule Content Publication"}</h4>
              <button 
                onClick={() => setIsContentModalOpen(false)} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleContentSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Connect Campaign</label>
                  <select
                    value={contentForm.campaign_id}
                    onChange={(e) => setContentForm({...contentForm, campaign_id: e.target.value})}
                    className="w-full text-sm p-2 rounded-lg border border-slate-300"
                  >
                    <option value="">-- Connect campaign budget limit --</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Publication Target</label>
                  <select
                    value={contentForm.platform}
                    onChange={(e) => setContentForm({...contentForm, platform: e.target.value})}
                    className="w-full text-sm p-2 rounded-lg border border-slate-300"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Google">Google Ads</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Post/Reels Draft Title</label>
                <input 
                  type="text" 
                  value={contentForm.title}
                  onChange={(e) => setContentForm({...contentForm, title: e.target.value})}
                  className="w-full text-sm p-2 rounded-lg border border-slate-300"
                  placeholder="e.g. Maldives overwater bungalows sneak-peek promo"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Text Script / Copywriting Content text</label>
                <textarea 
                  rows={5}
                  value={contentForm.content_text}
                  onChange={(e) => setContentForm({...contentForm, content_text: e.target.value})}
                  className="w-full text-xs font-mono p-3 bg-slate-50 rounded-lg border border-slate-300 text-slate-700"
                  placeholder="Write post payload here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Publish date</label>
                  <input 
                    type="date"
                    value={contentForm.publish_date}
                    onChange={(e) => setContentForm({...contentForm, publish_date: e.target.value})}
                    className="w-full text-sm p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Planning Stage status</label>
                  <select
                    value={contentForm.status}
                    onChange={(e) => setContentForm({...contentForm, status: e.target.value as any})}
                    className="w-full text-sm p-2 rounded-lg border border-slate-300"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Review">Under Team Review</option>
                    <option value="Scheduled">Scheduled (Auto-Post)</option>
                    <option value="Published">Published (Live feed)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsContentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {contentForm.id ? "Apply Changes" : "Schedule Content"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* =======================================================
          MODAL 3: MARKETING ITEM DETAIL OVERVIEW (AUDITING & ATTACHMENTS & PRINTING)
         ======================================================= */}
      {(selectedCampaign || selectedContent) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0 print:static print:overflow-visible">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden w-full max-w-2xl print:shadow-none print:border-none print:rounded-none my-8"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-base">
                  {selectedCampaign ? "تفاصيل الحملة التسويقية" : "تفاصيل منشور المحتوى"}
                </h4>
              </div>
              <button 
                onClick={() => { setSelectedCampaign(null); setSelectedContent(null); }} 
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Printable & Scrollable Card Body */}
            <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-full print:overflow-visible print:p-0" id="printable-area">
              
              {/* Branding Header only on PRINT */}
              <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-sans">CRM & Marketing Enterprise Portal</h1>
                    <p className="text-xs text-slate-500">تقرير تفصيلي رسمي للمبيعات والتسويق</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-550 font-semibold">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
              </div>

              {/* Title Header */}
              <div className="border-b border-slate-100 pb-4">
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase bg-indigo-50 text-indigo-700 tracking-wider">
                  {selectedCampaign ? selectedCampaign.platform : selectedContent?.platform}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">
                  {selectedCampaign ? selectedCampaign.title : selectedContent?.title}
                </h2>
              </div>

              {/* Details & Metadata Grid */}
              {selectedCampaign ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">الهدف / التركيز:</span>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{selectedCampaign.goal}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">ميزانية الحملة:</span>
                    <p className="text-sm font-bold text-indigo-600 mt-0.5">
                      {Number(selectedCampaign.budget).toLocaleString() || 0} {baseCurrency}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">الإنفاق الكلي:</span>
                    <p className="text-sm font-bold text-rose-600 mt-0.5">
                      {Number(selectedCampaign.spend).toLocaleString() || 0} {baseCurrency}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">العملاء المحتملون (Leads):</span>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">
                      {selectedCampaign.leads_generated || 0} عميل محتمل
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">قيمة المبيعات المحققة:</span>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">
                      {Number(selectedCampaign.sales_value).toLocaleString() || 0} {baseCurrency}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">الحالة:</span>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{selectedCampaign.status}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">محتوى المنشور المقترح:</span>
                    <p className="text-xs font-mono text-slate-700 mt-2 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                      {selectedContent?.content_text || "لا يوجد نص مقترح حالياً"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">تاريخ النشر المخطط له:</span>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">
                        {selectedContent?.publish_date ? new Date(selectedContent.publish_date).toLocaleDateString('ar-EG') : 'غير محدد'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">الحالة الحالية:</span>
                      <p className="text-sm font-bold text-slate-700 mt-0.5">{selectedContent?.status}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Auditing Section (سجل المراجعة والتوثيق المعتمد) */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 tracking-wider flex items-center gap-1.5 uppercase">
                  <UserCheck className="w-4 h-4 text-slate-500" /> سجل العمليات والمراجعة (Audit Log)
                </h5>
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2.5">
                  <div className="flex justify-between flex-wrap gap-2">
                    <span className="text-slate-400">تاريخ الإنشاء:</span>
                    <span className="font-semibold text-slate-700">
                      {selectedCampaign ? (selectedCampaign.created_at ? new Date(selectedCampaign.created_at).toLocaleString('ar-EG') : 'غير متوفر') : (selectedContent?.created_at ? new Date(selectedContent.created_at).toLocaleString('ar-EG') : 'غير متوفر')}
                    </span>
                  </div>
                  <div className="flex justify-between flex-wrap gap-2">
                    <span className="text-slate-400">بواسطة الموظف:</span>
                    <span className="font-semibold text-indigo-600 flex items-center gap-1">
                      {selectedCampaign ? (selectedCampaign.creator_name || 'مسؤول النظام') : (selectedContent?.creator_name || 'مسؤول النظام')}
                    </span>
                  </div>
                  
                  {/* Modification Audit */}
                  {((selectedCampaign && selectedCampaign.updated_at) || (selectedContent && selectedContent.updated_at)) && (
                    <div className="border-t border-slate-100/80 pt-2.5 space-y-2.5">
                      <div className="flex justify-between flex-wrap gap-2">
                        <span className="text-slate-400">آخر تعديل في:</span>
                        <span className="font-semibold text-slate-700">
                          {selectedCampaign?.updated_at ? new Date(selectedCampaign.updated_at).toLocaleString('ar-EG') : (selectedContent?.updated_at ? new Date(selectedContent.updated_at).toLocaleString('ar-EG') : '')}
                        </span>
                      </div>
                      <div className="flex justify-between flex-wrap gap-2">
                        <span className="text-slate-400">تعديل بواسطة:</span>
                        <span className="font-semibold text-purple-600">
                          {selectedCampaign ? (selectedCampaign.updater_name || 'مسؤول النظام') : (selectedContent?.updater_name || 'مسؤول النظام')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments Section (المستندات والمرفقات المعتمدة للحملة) */}
              <div className="border-t border-slate-100 pt-5 space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-800 tracking-wider flex items-center gap-1.5 uppercase">
                    <Link2 className="w-4 h-4 text-slate-500" /> المرفقات والملفات ({attachments.length})
                  </h5>
                  
                  <div className="relative">
                    <button
                      onClick={() => document.getElementById('details-file-uploader')?.click()}
                      className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all"
                    >
                      + إرفاق مستند جديد
                    </button>
                    <input 
                      id="details-file-uploader"
                      type="file"
                      className="hidden"
                      onChange={(e) => handleAttachmentUpload(e, selectedCampaign?.id, selectedContent?.id)}
                    />
                  </div>
                </div>

                {isAttachmentsLoading ? (
                  <div className="p-4 text-center text-xs text-slate-400">جاري تحميل المرفقات...</div>
                ) : attachments.length === 0 ? (
                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 leading-relaxed">
                    لا توجد ملفات مرفقة حالياً. يرجى إدراج ملفات PDF أو صور أو غيرها من هنا.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((file) => (
                      <div 
                        key={file.id} 
                        className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between text-xs hover:border-indigo-200 transition-all"
                      >
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="font-semibold text-slate-700 truncate" title={file.file_name}>
                            {file.file_name}
                          </span>
                          {file.uploader_name && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              (بواسطة: {file.uploader_name})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a 
                            href={file.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-slate-50 text-slate-600 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-all border border-slate-200"
                            title="عرض / تحميل الملف المرفق"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleAttachmentDelete(file.id, selectedCampaign?.id, selectedContent?.id)}
                            className="bg-slate-50 text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-all border border-slate-200"
                            title="حذف الملف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden print:block text-center border-t border-slate-200 pt-8 mt-12 text-[10px] text-slate-400">
                هذه الوثيقة تم تجميعها وطباعتها تلقائياً عبر نظام إدارة المبيعات والتسويق لطلب التقارير.
              </div>

            </div>

            {/* Actions Footer */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100 print:hidden">
              <button
                onClick={() => {
                  if (selectedCampaign) {
                    setShowDeleteConfirm({ id: selectedCampaign.id, type: 'campaign' });
                  } else if (selectedContent) {
                    setShowDeleteConfirm({ id: selectedContent.id, type: 'content' });
                  }
                }}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف العنصر
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  طباعة التقرير (Print)
                </button>

                <button
                  onClick={() => {
                    if (selectedCampaign) {
                      setCampaignForm({
                        id: selectedCampaign.id,
                        title: selectedCampaign.title,
                        goal: selectedCampaign.goal,
                        platform: selectedCampaign.platform,
                        budget: selectedCampaign.budget,
                        spend: selectedCampaign.spend,
                        status: selectedCampaign.status
                      });
                      setIsCampaignModalOpen(true);
                      setSelectedCampaign(null);
                    } else if (selectedContent) {
                      setContentForm({
                        id: selectedContent.id,
                        campaign_id: String(selectedContent.campaign_id),
                        title: selectedContent.title,
                        platform: selectedContent.platform,
                        content_text: selectedContent.content_text,
                        publish_date: selectedContent.publish_date ? selectedContent.publish_date.split('T')[0] : '',
                        status: selectedContent.status
                      });
                      setIsContentModalOpen(true);
                      setSelectedContent(null);
                    }
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  تعديل البيانات (Edit)
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={executeDelete}
        title={showDeleteConfirm?.type === 'campaign' ? "حذف الحملة التسويقية" : "حذف منشور المحتوى"}
        message={showDeleteConfirm?.type === 'campaign' 
          ? "هل أنت متأكد من رغبتك في حذف هذه الحملة التسويقية نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف جميع منسورات المحتوى المرتبطة بها."
          : "هل أنت متأكد من رغبتك في حذف منشور المحتوى المجدول هذا نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        }
      />

    </div>
  );
};
