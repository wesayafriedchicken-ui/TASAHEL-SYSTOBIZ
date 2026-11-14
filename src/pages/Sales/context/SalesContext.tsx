import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  CRMStage, 
  CRMDeal, 
  CRMCustomer, 
  Product, 
  User, 
  Department 
} from '../../../types';
import { checkPermission } from '../../../lib/audit';

export interface CommissionSettings {
  activeScheme: 'revenue_fixed' | 'volume_tiers' | 'revenue_tiers' | 'profit_fixed' | 'profit_tiers';
  revenueFixedPercentage: number;
  volumeCalculationType: 'flat' | 'cumulative';
  volumeTiers: { id: string; min: number; max: number; rate: number }[];
  revenueCalculationType: 'flat' | 'cumulative';
  revenueTiers: { id: string; min: number; max: number; rate: number }[];
  profitFixedPercentage: number;
  profitCostPercentage: number;
  profitCalculationType: 'flat' | 'cumulative';
  profitTiers: { id: string; min: number; max: number; rate: number }[];
  repOverrides: { [repId: number]: { customCost?: number; customCostPercentage?: number } };
}

export interface AutoAssignRule {
  id: string;
  userIds: number[];
  triggerType: 'always' | 'on_create';
  stageId: string;
  serviceFilters: string[];
  maxCapacity: number;
  isActive: boolean;
}

export interface RoutingLog {
  id: string;
  timestamp: string;
  dealId: number;
  dealTitle: string;
  assignedUserId: number;
  assignedUserName: string;
  ruleId: string;
  status: 'success' | 'skipped';
  reason?: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  dealId?: number;
  customerId: number;
  customerName: string;
  customerEmail?: string;
  customerCompany?: string;
  issueDate: string;
  expiryDate: string;
  items: {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    total: number;
  }[];
  subtotal: number;
  discountTotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  currency: string;
  paymentTerms: string;
  notes?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'signed';
  signature?: string;
  signedAt?: string;
  signedBy?: string;
}

export interface InboxMessage {
  id: string;
  sender: 'rep' | 'customer';
  senderName: string;
  text: string;
  time: string;
  timestamp: number;
}

export interface InboxConversation {
  id: string;
  customer_id: number;
  customer_name: string;
  company: string;
  channel: 'WhatsApp' | 'Email' | 'Facebook' | 'SMS';
  last_message: string;
  last_message_time: string;
  unread_count: number;
  avatar?: string;
  messages: InboxMessage[];
}

export interface SalesTemplate {
  id: string;
  title: string;
  category: 'introduction' | 'pitch' | 'followup' | 'closing' | 'support';
  channel: 'all' | 'WhatsApp' | 'Email' | 'Facebook';
  subject?: string;
  content: string;
}

interface SalesContextType {
  // Global & Currency
  baseCurrency: string;
  setBaseCurrency: (c: string) => void;
  currenciesList: { code: string; name_en: string; symbol: string; rate_to_sar: number }[];
  formatCurrency: (val: number, cur?: string) => string;
  users: User[];
  departments: Department[];
  currentUser: any;
  isCRMAdmin: boolean;

  // Data collections
  deals: CRMDeal[];
  stages: CRMStage[];
  customers: CRMCustomer[];
  leads: any[];
  products: Product[];
  attachments: any[];
  quotations: Quotation[];
  inboxConversations: InboxConversation[];
  salesTemplates: SalesTemplate[];
  autoAssignRules: AutoAssignRule[];
  routingLogs: RoutingLog[];
  commissionSettings: CommissionSettings;

  // Loading & Action states
  isLoading: boolean;
  isSaving: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Refresh & Lazy load methods (Egress friendly)
  fetchDeals: () => Promise<void>;
  fetchStages: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchLeads: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchQuotations: () => Promise<void>;

  // Deal actions
  saveDeal: (dealData: any) => Promise<CRMDeal | null>;
  deleteDeal: (dealId: number) => Promise<boolean>;
  updateDealStage: (dealId: number, stageId: number) => Promise<boolean>;

  // Stage actions
  saveStage: (stageData: any) => Promise<CRMStage | null>;
  deleteStage: (stageId: number) => Promise<boolean>;

  // Customer actions
  saveCustomer: (customerData: any) => Promise<CRMCustomer | null>;
  deleteCustomer: (customerId: number) => Promise<boolean>;

  // Lead actions
  saveLead: (leadData: any) => Promise<any>;
  deleteLead: (leadId: number) => Promise<boolean>;
  convertLeadToDeal: (leadId: number, dealConfig: any) => Promise<CRMDeal | null>;

  // Quotation actions
  saveQuotation: (quote: Quotation) => Promise<void>;
  deleteQuotation: (quoteId: string) => Promise<void>;
  updateQuotationStatus: (quoteId: string, status: Quotation['status'], signatureData?: string) => Promise<void>;

  // Commission actions
  setCommissionSettings: React.Dispatch<React.SetStateAction<CommissionSettings>>;
  calculateCommissionForRep: (rep: any) => {
    amount: number;
    formula: string;
    description: string;
    matchedTierName: string;
    netProfit: number;
    totalCost: number;
    wonCount: number;
    wonValue: number;
  };

  // Auto assign actions
  setAutoAssignRules: React.Dispatch<React.SetStateAction<AutoAssignRule[]>>;
  saveAutoAssignRule: (rule: AutoAssignRule) => void;
  deleteAutoAssignRule: (ruleId: string) => void;
  runAutoAssignmentEngine: () => Promise<number>;
  setRoutingLogs: React.Dispatch<React.SetStateAction<RoutingLog[]>>;

  // Inbox actions
  sendInboxReply: (conversationId: string, text: string) => Promise<void>;
  saveSalesTemplate: (template: SalesTemplate) => void;
  deleteSalesTemplate: (templateId: string) => void;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user from storage
  const currentUser = useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const isCRMAdmin = useMemo(() => {
    if (!currentUser) return true;
    const role = (currentUser.role || '').toLowerCase();
    const isSuperAdmin = currentUser.is_super_admin || role.includes('super admin') || role.includes('owner') || role.includes('admin');
    return isSuperAdmin || role.includes('sales manager') || role.includes('crm director');
  }, [currentUser]);

  // Currency management
  const [baseCurrency, setBaseCurrency] = useState<string>(() => {
    return localStorage.getItem('acct_base_currency') || 'USD';
  });

  const currenciesList = useMemo(() => [
    { code: 'USD', name_en: 'US Dollar', symbol: '$', rate_to_sar: 3.75 },
    { code: 'SAR', name_en: 'Saudi Riyal', symbol: 'SAR', rate_to_sar: 1.0 },
    { code: 'EUR', name_en: 'Euro', symbol: '€', rate_to_sar: 4.05 },
    { code: 'GBP', name_en: 'British Pound', symbol: '£', rate_to_sar: 4.75 },
    { code: 'AED', name_en: 'UAE Dirham', symbol: 'AED', rate_to_sar: 1.02 },
    { code: 'EGP', name_en: 'Egyptian Pound', symbol: 'EGP', rate_to_sar: 0.078 },
  ], []);

  const formatCurrency = useCallback((val: number, cur?: string) => {
    const code = cur || baseCurrency;
    const curr = currenciesList.find(c => c.code === code);
    const sym = curr?.symbol || code;
    return `${sym} ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }, [baseCurrency, currenciesList]);

  // Shared Data States
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stages, setStages] = useState<CRMStage[]>([]);
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);

  // Quotations state with localStorage persistence
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    try {
      const saved = localStorage.getItem('crm_quotations_records');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'q-101',
        quoteNumber: 'QUO-2026-001',
        dealId: 1,
        customerId: 1,
        customerName: 'Aramco Energy Services',
        customerEmail: 'procurement@aramco.com',
        customerCompany: 'Saudi Aramco',
        issueDate: '2026-09-01',
        expiryDate: '2026-09-30',
        items: [
          { id: 'item-1', name: 'Enterprise Cloud Core License', quantity: 1, unitPrice: 45000, total: 45000 },
          { id: 'item-2', name: 'Dedicated Migration Consulting', quantity: 20, unitPrice: 500, total: 10000 }
        ],
        subtotal: 55000,
        discountTotal: 2500,
        vatRate: 15,
        vatAmount: 7875,
        grandTotal: 60375,
        currency: 'USD',
        paymentTerms: 'Net 30 Days',
        notes: 'Includes 12-month SLA maintenance package and technical support.',
        status: 'approved'
      },
      {
        id: 'q-102',
        quoteNumber: 'QUO-2026-002',
        dealId: 2,
        customerId: 2,
        customerName: 'Red Sea Global Hospitality',
        customerEmail: 'rfp@redseaglobal.com',
        customerCompany: 'Red Sea Global',
        issueDate: '2026-09-10',
        expiryDate: '2026-10-10',
        items: [
          { id: 'item-3', name: 'Omnichannel CRM Platform', quantity: 1, unitPrice: 32000, total: 32000 }
        ],
        subtotal: 32000,
        discountTotal: 0,
        vatRate: 15,
        vatAmount: 4800,
        grandTotal: 36800,
        currency: 'USD',
        paymentTerms: 'Net 15 Days',
        notes: 'Standard licensing terms apply.',
        status: 'sent'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('crm_quotations_records', JSON.stringify(quotations));
  }, [quotations]);

  // Inbox Conversations State
  const [inboxConversations, setInboxConversations] = useState<InboxConversation[]>(() => {
    try {
      const saved = localStorage.getItem('crm_inbox_conversations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'conv-1',
        customer_id: 1,
        customer_name: 'Khalid Al-Mansoor',
        company: 'Saudi Aramco',
        channel: 'WhatsApp',
        last_message: 'We reviewed the technical proposal. Can we schedule a brief closing call?',
        last_message_time: '10:42 AM',
        unread_count: 1,
        messages: [
          { id: 'm-1', sender: 'rep', senderName: 'Sales Rep', text: 'Good morning Mr. Khalid! Sending over our updated enterprise scope.', time: '09:15 AM', timestamp: Date.now() - 7200000 },
          { id: 'm-2', sender: 'customer', senderName: 'Khalid Al-Mansoor', text: 'Thank you. The pricing on cloud instances looks solid.', time: '10:20 AM', timestamp: Date.now() - 3600000 },
          { id: 'm-3', sender: 'customer', senderName: 'Khalid Al-Mansoor', text: 'We reviewed the technical proposal. Can we schedule a brief closing call?', time: '10:42 AM', timestamp: Date.now() - 1200000 }
        ]
      },
      {
        id: 'conv-2',
        customer_id: 2,
        customer_name: 'Sarah Jenkins',
        company: 'Red Sea Global',
        channel: 'Email',
        last_message: 'Please send over the tax registration and certificate of compliance.',
        last_message_time: 'Yesterday',
        unread_count: 0,
        messages: [
          { id: 'm-4', sender: 'customer', senderName: 'Sarah Jenkins', text: 'Hi Team, please share the invoice terms.', time: 'Yesterday 2:10 PM', timestamp: Date.now() - 86400000 },
          { id: 'm-5', sender: 'rep', senderName: 'Sales Rep', text: 'Shared via secure portal. Let us know if you need anything else.', time: 'Yesterday 3:30 PM', timestamp: Date.now() - 82000000 },
          { id: 'm-6', sender: 'customer', senderName: 'Sarah Jenkins', text: 'Please send over the tax registration and certificate of compliance.', time: 'Yesterday 4:05 PM', timestamp: Date.now() - 79000000 }
        ]
      },
      {
        id: 'conv-3',
        customer_id: 3,
        customer_name: 'Omar Farooq',
        company: 'NEOM Tech & Digital',
        channel: 'Facebook',
        last_message: 'Interested in the API automation module mentioned on your website.',
        last_message_time: 'Sep 12',
        unread_count: 0,
        messages: [
          { id: 'm-7', sender: 'customer', senderName: 'Omar Farooq', text: 'Interested in the API automation module mentioned on your website.', time: 'Sep 12 11:15 AM', timestamp: Date.now() - 172800000 }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('crm_inbox_conversations', JSON.stringify(inboxConversations));
  }, [inboxConversations]);

  // Sales Templates State
  const [salesTemplates, setSalesTemplates] = useState<SalesTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('crm_sales_templates');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 't-1',
        title: 'Initial Consultation Welcome',
        category: 'introduction',
        channel: 'all',
        subject: 'Thank you for connecting with our team',
        content: 'Hi {{customer_name}},\n\nThank you for reaching out to us regarding {{deal_title}}. We are thrilled to partner with {{company}} to scale your operations.\n\nCould we schedule a quick 15-minute alignment call this week?'
      },
      {
        id: 't-2',
        title: 'Quotation Follow-Up',
        category: 'followup',
        channel: 'Email',
        subject: 'Follow-up regarding your proposal {{quote_number}}',
        content: 'Dear {{customer_name}},\n\nI wanted to follow up on the proposal we prepared for {{company}} valued at {{deal_value}}.\n\nPlease let me know if you have questions regarding the terms or delivery schedule.'
      },
      {
        id: 't-3',
        title: 'WhatsApp Fast Response',
        category: 'pitch',
        channel: 'WhatsApp',
        content: 'Hello {{customer_name}}! Thanks for your interest in our business software solutions. Here is our product overview and quick pricing guide.'
      },
      {
        id: 't-4',
        title: 'End of Quarter Closing Special',
        category: 'closing',
        channel: 'all',
        subject: 'Special terms available for immediate signing',
        content: 'Hi {{customer_name}},\n\nWe have received executive approval to offer prioritized deployment terms for {{company}} if signed before the end of the month.'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('crm_sales_templates', JSON.stringify(salesTemplates));
  }, [salesTemplates]);

  // Auto Assign Rules State
  const [autoAssignRules, setAutoAssignRules] = useState<AutoAssignRule[]>(() => {
    try {
      const saved = localStorage.getItem('crm_auto_assign_rules');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((rule: any) => ({
          ...rule,
          userIds: rule.userIds || (rule.userId ? [Number(rule.userId)] : []),
          serviceFilters: rule.serviceFilters || (rule.serviceFilter ? [rule.serviceFilter] : ['any'])
        }));
      }
    } catch {}
    return [
      {
        id: 'rule-1',
        userIds: [1],
        triggerType: 'always',
        stageId: 'any',
        serviceFilters: ['All Services and Products'],
        maxCapacity: 5,
        isActive: true
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('crm_auto_assign_rules', JSON.stringify(autoAssignRules));
  }, [autoAssignRules]);

  // Routing Logs State
  const [routingLogs, setRoutingLogs] = useState<RoutingLog[]>(() => {
    try {
      const saved = localStorage.getItem('crm_assignment_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('crm_assignment_logs', JSON.stringify(routingLogs));
  }, [routingLogs]);

  // Commission Settings State
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>(() => {
    try {
      const saved = localStorage.getItem('crm_commission_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      activeScheme: 'revenue_fixed',
      revenueFixedPercentage: 5,
      volumeCalculationType: 'flat',
      volumeTiers: [
        { id: 'v1', min: 1, max: 20, rate: 100 },
        { id: 'v2', min: 21, max: 50, rate: 250 },
        { id: 'v3', min: 51, max: 999999, rate: 500 }
      ],
      revenueCalculationType: 'flat',
      revenueTiers: [
        { id: 'r1', min: 0, max: 50000, rate: 3 },
        { id: 'r2', min: 50001, max: 150000, rate: 6 },
        { id: 'r3', min: 150001, max: 99999999, rate: 10 }
      ],
      profitFixedPercentage: 12,
      profitCostPercentage: 65,
      profitCalculationType: 'flat',
      profitTiers: [
        { id: 'p1', min: 0, max: 30000, rate: 6 },
        { id: 'p2', min: 30001, max: 80000, rate: 12 },
        { id: 'p3', min: 80001, max: 99999999, rate: 18 }
      ],
      repOverrides: {}
    };
  });

  useEffect(() => {
    localStorage.setItem('crm_commission_settings', JSON.stringify(commissionSettings));
  }, [commissionSettings]);

  // General States
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.id) headers['X-User-Id'] = String(u.id);
        if (u.role) headers['X-User-Role'] = u.role;
      } catch {}
    }
    return headers;
  };

  // Lazy Fetch Functions
  const fetchDeals = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/deals', { headers: getHeaders() });
      if (res.ok) {
        setDeals(await res.json());
      }
    } catch (err) {
      console.error('Error loading deals:', err);
    }
  }, []);

  const fetchStages = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/stages', { headers: getHeaders() });
      if (res.ok) {
        setStages(await res.json());
      }
    } catch (err) {
      console.error('Error loading stages:', err);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/customers', { headers: getHeaders() });
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads', { headers: getHeaders() });
      if (res.ok) {
        setLeads(await res.json());
      }
    } catch (err) {
      console.error('Error loading leads:', err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products', { headers: getHeaders() });
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      console.error('Error loading products:', err);
    }
  }, []);

  const fetchUsersAndDepartments = useCallback(async () => {
    try {
      const [uRes, dRes] = await Promise.all([
        fetch('/api/users', { headers: getHeaders() }).catch(() => null),
        fetch('/api/departments', { headers: getHeaders() }).catch(() => null)
      ]);
      if (uRes && uRes.ok) setUsers(await uRes.json());
      if (dRes && dRes.ok) setDepartments(await dRes.json());
    } catch (err) {
      console.error('Error loading users/departments:', err);
    }
  }, []);

  const fetchQuotations = useCallback(async () => {
    // Already in memory / localStorage
  }, []);

  // Initial Core Load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchStages(),
      fetchDeals(),
      fetchCustomers(),
      fetchLeads(),
      fetchProducts(),
      fetchUsersAndDepartments()
    ]).finally(() => setIsLoading(false));
  }, [fetchStages, fetchDeals, fetchCustomers, fetchLeads, fetchProducts, fetchUsersAndDepartments]);

  // Deal Operations
  const saveDeal = async (dealData: any): Promise<CRMDeal | null> => {
    setIsSaving(true);
    try {
      const method = dealData.id ? 'PUT' : 'POST';
      const url = dealData.id ? `/api/crm/deals/${dealData.id}` : '/api/crm/deals';
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(dealData)
      });
      if (res.ok) {
        const saved = await res.json();
        await fetchDeals();
        showToast(dealData.id ? 'Deal updated successfully!' : 'New deal created!', 'success');
        return saved;
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to save deal.', 'error');
        return null;
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while saving deal.', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDeal = async (dealId: number): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setDeals(prev => prev.filter(d => d.id !== dealId));
        showToast('Deal deleted successfully.', 'success');
        return true;
      } else {
        showToast('Could not delete deal.', 'error');
        return false;
      }
    } catch {
      showToast('Network error while deleting deal.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateDealStage = async (dealId: number, stageId: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/crm/deals/${dealId}/stage`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ stage_id: stageId })
      });
      if (res.ok) {
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage_id: stageId } : d));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Stage Operations
  const saveStage = async (stageData: any): Promise<CRMStage | null> => {
    setIsSaving(true);
    try {
      const method = stageData.id ? 'PUT' : 'POST';
      const url = stageData.id ? `/api/crm/stages/${stageData.id}` : '/api/crm/stages';
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(stageData)
      });
      if (res.ok) {
        const saved = await res.json();
        await fetchStages();
        showToast('Stage saved successfully!', 'success');
        return saved;
      } else {
        showToast('Failed to save stage.', 'error');
        return null;
      }
    } catch {
      showToast('Network error while saving stage.', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStage = async (stageId: number): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/crm/stages/${stageId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setStages(prev => prev.filter(s => s.id !== stageId));
        showToast('Stage removed successfully.', 'success');
        return true;
      } else {
        showToast('Could not delete stage.', 'error');
        return false;
      }
    } catch {
      showToast('Network error while deleting stage.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Customer Operations
  const saveCustomer = async (customerData: any): Promise<CRMCustomer | null> => {
    setIsSaving(true);
    try {
      const method = customerData.id ? 'PUT' : 'POST';
      const url = customerData.id ? `/api/crm/customers/${customerData.id}` : '/api/crm/customers';
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(customerData)
      });
      if (res.ok) {
        const saved = await res.json();
        await fetchCustomers();
        showToast('Customer profile updated.', 'success');
        return saved;
      } else {
        showToast('Failed to save customer.', 'error');
        return null;
      }
    } catch {
      showToast('Network error saving customer.', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCustomer = async (customerId: number): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/crm/customers/${customerId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        showToast('Customer deleted successfully.', 'success');
        return true;
      } else {
        showToast('Failed to delete customer.', 'error');
        return false;
      }
    } catch {
      showToast('Network error deleting customer.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Lead Operations
  const saveLead = async (leadData: any) => {
    setIsSaving(true);
    try {
      const method = leadData.id ? 'PUT' : 'POST';
      const url = leadData.id ? `/api/leads/${leadData.id}` : '/api/leads';
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(leadData)
      });
      if (res.ok) {
        const saved = await res.json();
        await fetchLeads();
        showToast('Lead saved successfully.', 'success');
        return saved;
      } else {
        showToast('Failed to save lead.', 'error');
        return null;
      }
    } catch {
      showToast('Network error saving lead.', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLead = async (leadId: number): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        showToast('Lead removed.', 'success');
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const convertLeadToDeal = async (leadId: number, dealConfig: any): Promise<CRMDeal | null> => {
    setIsSaving(true);
    try {
      // 1. Find or create customer
      let customerId = dealConfig.customerId;
      if (!customerId) {
        const custRes = await saveCustomer({
          name: dealConfig.customerName || 'Converted Lead Client',
          company: dealConfig.customerCompany || '',
          email: dealConfig.customerEmail || '',
          phone: dealConfig.customerPhone || ''
        });
        if (custRes) customerId = custRes.id;
      }

      // 2. Create the deal
      const newDeal = await saveDeal({
        title: dealConfig.title || `Deal for ${dealConfig.customerName || 'Lead #' + leadId}`,
        customer_id: customerId,
        value: Number(dealConfig.value || 0),
        stage_id: dealConfig.stageId || stages[0]?.id || 1,
        assigned_to: dealConfig.assignedTo || currentUser?.id || 1,
        service_type: dealConfig.serviceType || 'Sales',
        product: dealConfig.product || '',
        description: `Converted from Lead #${leadId}. Notes: ${dealConfig.notes || ''}`,
        items: dealConfig.items || []
      });

      // 3. Mark lead as converted
      await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'converted' })
      }).catch(() => null);

      await fetchLeads();
      showToast('Lead successfully converted into active deal!', 'success');
      return newDeal;
    } catch (e) {
      console.error(e);
      showToast('Error during lead conversion wizard.', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Quotations Operations
  const saveQuotation = async (quote: Quotation) => {
    setQuotations(prev => {
      const idx = prev.findIndex(q => q.id === quote.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = quote;
        return copy;
      }
      return [quote, ...prev];
    });
    showToast(`Quotation ${quote.quoteNumber} saved.`, 'success');
  };

  const deleteQuotation = async (quoteId: string) => {
    setQuotations(prev => prev.filter(q => q.id !== quoteId));
    showToast('Quotation removed.', 'info');
  };

  const updateQuotationStatus = async (quoteId: string, status: Quotation['status'], signatureData?: string) => {
    setQuotations(prev => prev.map(q => {
      if (q.id === quoteId) {
        return {
          ...q,
          status,
          signature: signatureData || q.signature,
          signedAt: signatureData ? new Date().toISOString() : q.signedAt,
          signedBy: signatureData ? currentUser?.name || 'Customer' : q.signedBy
        };
      }
      return q;
    }));
    showToast(`Quotation marked as ${status.toUpperCase()}.`, 'success');
  };

  // Commission Engine
  const calculateCommissionForRep = useCallback((rep: any) => {
    const { activeScheme } = commissionSettings;

    // Automatically derive wonCount and wonValue if not provided directly on rep
    const wonCount = rep.wonCount !== undefined 
      ? Number(rep.wonCount) 
      : deals.filter(d => {
          if (d.assigned_to !== rep.id) return false;
          const stage = stages.find(s => s.id === d.stage_id);
          return stage ? (stage.is_won || stage.name.toLowerCase().includes('won')) : false;
        }).length;

    const wonValue = rep.wonValue !== undefined 
      ? Number(rep.wonValue) 
      : deals.filter(d => {
          if (d.assigned_to !== rep.id) return false;
          const stage = stages.find(s => s.id === d.stage_id);
          return stage ? (stage.is_won || stage.name.toLowerCase().includes('won')) : false;
        }).reduce((sum, d) => sum + Number(d.value || 0), 0);

    const repOverride = commissionSettings.repOverrides?.[rep.id] || {};
    const costPercentage = repOverride.customCostPercentage !== undefined 
      ? repOverride.customCostPercentage 
      : commissionSettings.profitCostPercentage;
    const totalCost = repOverride.customCost !== undefined 
      ? repOverride.customCost 
      : (wonValue * (costPercentage / 100));
    const netProfit = Math.max(0, wonValue - totalCost);

    let amount = 0;
    let description = '';
    let formula = '';
    let matchedTierName = 'N/A';

    switch (activeScheme) {
      case 'revenue_fixed': {
        const rate = commissionSettings.revenueFixedPercentage || 0;
        amount = wonValue * (rate / 100);
        formula = `${formatCurrency(wonValue)} × ${rate}%`;
        description = `Fixed percentage (${rate}%) of total closed revenue.`;
        break;
      }
      case 'volume_tiers': {
        const tiers = [...commissionSettings.volumeTiers].sort((a, b) => a.min - b.min);
        const type = commissionSettings.volumeCalculationType;

        if (type === 'flat') {
          const matched = tiers.find(t => wonCount >= t.min && wonCount <= t.max) || 
                          tiers.filter(t => wonCount >= t.min).pop();
          const rate = matched ? matched.rate : 0;
          amount = wonCount * rate;
          matchedTierName = matched ? `Tier (${matched.min}-${matched.max === 999999 ? '∞' : matched.max})` : 'No Tier';
          formula = `${wonCount} orders × ${formatCurrency(rate)} / deal (Flat Mode)`;
          description = `Flat tier payout of ${formatCurrency(rate)} per deal.`;
        } else {
          let calcSum = 0;
          let steps: string[] = [];
          tiers.forEach(t => {
            if (wonCount >= t.min) {
              const countInTier = Math.min(wonCount, t.max) - (t.min - 1);
              if (countInTier > 0) {
                calcSum += countInTier * t.rate;
                steps.push(`${countInTier} @ ${formatCurrency(t.rate)}`);
              }
            }
          });
          amount = calcSum;
          formula = steps.join(' + ') || '0';
          description = 'Cumulative progressive volume tier calculation.';
        }
        break;
      }
      case 'revenue_tiers': {
        const tiers = [...commissionSettings.revenueTiers].sort((a, b) => a.min - b.min);
        const type = commissionSettings.revenueCalculationType;

        if (type === 'flat') {
          const matched = tiers.find(t => wonValue >= t.min && wonValue <= t.max) || 
                          tiers.filter(t => wonValue >= t.min).pop();
          const rate = matched ? matched.rate : 0;
          amount = wonValue * (rate / 100);
          matchedTierName = matched ? `Tier (${formatCurrency(matched.min)}-${matched.max === 99999999 ? '∞' : formatCurrency(matched.max)})` : 'No Tier';
          formula = `${formatCurrency(wonValue)} × ${rate}%`;
          description = `Flat rate tier of ${rate}% for revenue band.`;
        } else {
          let calcSum = 0;
          let steps: string[] = [];
          tiers.forEach(t => {
            const minPortion = Math.min(t.max, wonValue);
            const portion = Math.max(0, minPortion - t.min);
            if (portion > 0) {
              calcSum += portion * (t.rate / 100);
              steps.push(`${formatCurrency(portion)} @ ${t.rate}%`);
            }
          });
          amount = calcSum;
          formula = steps.join(' + ') || '0';
          description = 'Cumulative progressive revenue brackets.';
        }
        break;
      }
      case 'profit_fixed': {
        const rate = commissionSettings.profitFixedPercentage || 0;
        amount = netProfit * (rate / 100);
        formula = `${formatCurrency(netProfit)} (Net Profit) × ${rate}%`;
        description = `Fixed percentage (${rate}%) of net profit. Revenue (${formatCurrency(wonValue)}) minus Cost (${formatCurrency(totalCost)}).`;
        break;
      }
      case 'profit_tiers': {
        const tiers = [...commissionSettings.profitTiers].sort((a, b) => a.min - b.min);
        const type = commissionSettings.profitCalculationType;

        if (type === 'flat') {
          const matched = tiers.find(t => netProfit >= t.min && netProfit <= t.max) || 
                          tiers.filter(t => netProfit >= t.min).pop();
          const rate = matched ? matched.rate : 0;
          amount = netProfit * (rate / 100);
          matchedTierName = matched ? `Tier (${formatCurrency(matched.min)}-${matched.max === 99999999 ? '∞' : formatCurrency(matched.max)})` : 'No Tier';
          formula = `${formatCurrency(netProfit)} (Profit) × ${rate}%`;
          description = `Flat profit bracket of ${rate}%.`;
        } else {
          let calcSum = 0;
          let steps: string[] = [];
          tiers.forEach(t => {
            const minPortion = Math.min(t.max, netProfit);
            const portion = Math.max(0, minPortion - t.min);
            if (portion > 0) {
              calcSum += portion * (t.rate / 100);
              steps.push(`${formatCurrency(portion)} @ ${t.rate}%`);
            }
          });
          amount = calcSum;
          formula = steps.join(' + ') || '0';
          description = 'Cumulative progressive profit tiers.';
        }
        break;
      }
    }

    return {
      amount,
      formula,
      description,
      matchedTierName,
      netProfit,
      totalCost,
      wonCount,
      wonValue
    };
  }, [commissionSettings, formatCurrency]);

  // Auto Assign Rules Operations
  const saveAutoAssignRule = (rule: AutoAssignRule) => {
    setAutoAssignRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = rule;
        return copy;
      }
      return [...prev, rule];
    });
    showToast('Auto-assign rule updated.', 'success');
  };

  const deleteAutoAssignRule = (ruleId: string) => {
    setAutoAssignRules(prev => prev.filter(r => r.id !== ruleId));
    showToast('Rule removed.', 'info');
  };

  const runAutoAssignmentEngine = async (): Promise<number> => {
    setIsSaving(true);
    const logs: RoutingLog[] = [];
    let updatedCount = 0;

    const unassignedDeals = deals.filter(d => !d.assigned_to);
    const unassignedLeads = leads.filter(l => !l.assigned_to);

    if (unassignedDeals.length === 0 && unassignedLeads.length === 0) {
      showToast('No unassigned deals or leads currently found in queue.', 'info');
      setIsSaving(false);
      return 0;
    }

    // Active reps pool
    const activeReps = users.length > 0 ? users : [{ id: 1, name: 'Sales Representative' } as any];

    const currentWorkloads: Record<number, number> = {};
    deals.forEach(d => {
      if (d.assigned_to) {
        currentWorkloads[d.assigned_to] = (currentWorkloads[d.assigned_to] || 0) + 1;
      }
    });

    const activeRules = autoAssignRules.filter(r => r.isActive);
    let roundRobinIdx = 0;

    // Distribute Deals
    for (const deal of unassignedDeals) {
      let chosenRepId: number | null = null;
      let matchedRuleName = 'Round-Robin Balancing';

      // First check if any rule matches
      if (activeRules.length > 0) {
        for (const rule of activeRules) {
          if (rule.stageId !== 'any' && String(deal.stage_id) !== String(rule.stageId)) continue;
          const isAllServices = rule.serviceFilters.length === 0 || rule.serviceFilters.some(f => {
            const lf = f.toLowerCase();
            return lf === 'any' || lf === 'all' || lf.includes('all services');
          });

          if (!isAllServices) {
            const dealService = (deal.service_type || '').toLowerCase();
            const dealProd = (deal.product || '').toLowerCase();
            const matches = rule.serviceFilters.some(f => 
              dealService.includes(f.toLowerCase()) || dealProd.includes(f.toLowerCase())
            );
            if (!matches) continue;
          }

          const eligible = rule.userIds
            .map(uid => ({ id: uid, load: currentWorkloads[uid] || 0 }))
            .filter(rep => rep.load < rule.maxCapacity)
            .sort((a, b) => a.load - b.load);

          if (eligible.length > 0) {
            chosenRepId = eligible[0].id;
            matchedRuleName = `Rule #${rule.id}`;
            break;
          }
        }
      }

      // Fallback to general lowest workload or round robin
      if (!chosenRepId && activeReps.length > 0) {
        const sortedReps = [...activeReps].sort((a, b) => (currentWorkloads[a.id] || 0) - (currentWorkloads[b.id] || 0));
        chosenRepId = sortedReps[0]?.id || activeReps[roundRobinIdx % activeReps.length].id;
        roundRobinIdx++;
      }

      if (chosenRepId) {
        const repUser = users.find(u => u.id === chosenRepId);
        try {
          await fetch(`/api/crm/deals/${deal.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ assigned_to: chosenRepId })
          }).catch(() => null);

          // Update local state directly
          setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, assigned_to: chosenRepId! } : d));
          currentWorkloads[chosenRepId] = (currentWorkloads[chosenRepId] || 0) + 1;
          updatedCount++;

          logs.unshift({
            id: `log-${Date.now()}-${deal.id}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            dealId: deal.id,
            dealTitle: deal.title || 'Deal',
            assignedUserId: chosenRepId,
            assignedUserName: repUser?.name || `Rep #${chosenRepId}`,
            ruleId: matchedRuleName,
            status: 'success'
          });
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Also distribute unassigned Leads if any
    for (const lead of unassignedLeads) {
      if (activeReps.length === 0) break;
      const sortedReps = [...activeReps].sort((a, b) => (currentWorkloads[a.id] || 0) - (currentWorkloads[b.id] || 0));
      const chosenRep = sortedReps[0] || activeReps[0];
      if (chosenRep) {
        try {
          await fetch(`/api/leads/${lead.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ assigned_to: chosenRep.id })
          }).catch(() => null);

          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, assigned_to: chosenRep.id } : l));
          currentWorkloads[chosenRep.id] = (currentWorkloads[chosenRep.id] || 0) + 1;
          updatedCount++;

          logs.unshift({
            id: `log-lead-${Date.now()}-${lead.id}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            dealId: lead.id,
            dealTitle: `Lead: ${lead.name}`,
            assignedUserId: chosenRep.id,
            assignedUserName: chosenRep.name,
            ruleId: 'Lead Round-Robin',
            status: 'success'
          });
        } catch (e) {
          console.error(e);
        }
      }
    }

    setRoutingLogs(prev => [...logs, ...prev].slice(0, 100));
    await fetchDeals().catch(() => null);
    setIsSaving(false);
    showToast(`Smart Engine executed: ${updatedCount} opportunities successfully distributed!`, 'success');
    return updatedCount;
  };

  // Inbox Operations
  const sendInboxReply = async (conversationId: string, text: string) => {
    if (!text.trim()) return;
    const newMsg: InboxMessage = {
      id: `msg-${Date.now()}`,
      sender: 'rep',
      senderName: currentUser?.name || 'Sales Representative',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    setInboxConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        return {
          ...c,
          last_message: newMsg.text,
          last_message_time: newMsg.time,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));
    showToast('Reply sent.', 'success');
  };

  const saveSalesTemplate = (template: SalesTemplate) => {
    setSalesTemplates(prev => {
      const idx = prev.findIndex(t => t.id === template.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = template;
        return copy;
      }
      return [template, ...prev];
    });
    showToast('Template saved.', 'success');
  };

  const deleteSalesTemplate = (templateId: string) => {
    setSalesTemplates(prev => prev.filter(t => t.id !== templateId));
    showToast('Template removed.', 'info');
  };

  const value = {
    baseCurrency,
    setBaseCurrency,
    currenciesList,
    formatCurrency,
    users,
    departments,
    currentUser,
    isCRMAdmin,

    deals,
    stages,
    customers,
    leads,
    products,
    attachments,
    quotations,
    inboxConversations,
    salesTemplates,
    autoAssignRules,
    routingLogs,
    commissionSettings,

    isLoading,
    isSaving,
    toast,
    showToast,

    fetchDeals,
    fetchStages,
    fetchCustomers,
    fetchLeads,
    fetchProducts,
    fetchQuotations,

    saveDeal,
    deleteDeal,
    updateDealStage,

    saveStage,
    deleteStage,

    saveCustomer,
    deleteCustomer,

    saveLead,
    deleteLead,
    convertLeadToDeal,

    saveQuotation,
    deleteQuotation,
    updateQuotationStatus,

    setCommissionSettings,
    calculateCommissionForRep,

    setAutoAssignRules,
    saveAutoAssignRule,
    deleteAutoAssignRule,
    runAutoAssignmentEngine,
    setRoutingLogs,

    sendInboxReply,
    saveSalesTemplate,
    deleteSalesTemplate
  };

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
};

export const useSalesContext = () => {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error('useSalesContext must be used within a SalesProvider');
  return ctx;
};
