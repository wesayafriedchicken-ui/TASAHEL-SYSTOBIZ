// =========================================================================
// Sales CRM Dynamic Schema & Metadata Registry (salesModuleRegistry.ts)
// Defines default sections, fields, tables, and actions for Sales CRM entities
// =========================================================================

export interface SchemaFieldItem {
  id: string;
  label: string;
  type: 'field' | 'table';
  dataType?: 'text' | 'number' | 'currency' | 'select' | 'date' | 'file' | 'email' | 'boolean';
  permLevel?: number; // Level 0 (Default - All Staff) to Level 4 (Owner Only - C-Level)
  readOnly?: boolean;
  hidden?: boolean;
  isRequired?: boolean;
  maskValue?: boolean; // Mask Sensitive Value (***)
  options?: string[];
  isCustom?: boolean;
  orderIndex?: number;
  defaultValue?: string | number | boolean;
  description?: string;
}

export interface SchemaActionItem {
  id?: string;
  action_key: string;
  section_name: string;
  label_en: string;
  label_ar?: string;
  state: 'active' | 'disabled' | 'hidden';
  permission_scope: 'super_admin' | 'everyone' | 'direct_manager' | 'self';
  tooltip_text?: string;
  isCustom?: boolean;
  orderIndex?: number;
}

export interface SchemaSectionItem {
  id: string;
  name: string;
  description?: string;
  isCustom?: boolean;
  orderIndex?: number;
  items: SchemaFieldItem[];
  actions?: SchemaActionItem[];
}

export interface SalesScopeSchemaConfig {
  pageKey: string;
  displayName: string;
  category: 'pipeline' | 'leads' | 'contacts' | 'quotations';
  subCategory?: string;
  description: string;
  sections: SchemaSectionItem[];
}

export const SALES_MODULE_REGISTRY: Record<string, SalesScopeSchemaConfig> = {
  // =========================================================================
  // 1. Deals Pipeline (/sales/pipeline/deals)
  // =========================================================================
  deals: {
    pageKey: 'deals',
    displayName: 'Deals Pipeline',
    category: 'pipeline',
    description: 'Introspect and configure opportunities, commercial terms, stages, margin schedules, and deal owner rules.',
    sections: [
      {
        id: 'sec_deals_overview',
        name: 'Deal Overview & Core Commercials',
        description: 'Primary deal identity, target client, pipeline stage, and expected close date',
        items: [
          { id: 'title', label: 'Deal Title / Project Name', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
          { id: 'customer_id', label: 'Associated Account / Client', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
          { id: 'stage_id', label: 'Pipeline Stage', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
          { id: 'value', label: 'Commercial Contract Value', type: 'field', dataType: 'currency', isRequired: true, permLevel: 0, maskValue: false },
          { id: 'currency', label: 'Deal Currency', type: 'field', dataType: 'select', permLevel: 0, options: ['EGP', 'USD', 'EUR', 'SAR', 'AED'] },
          { id: 'probability', label: 'Win Probability (%)', type: 'field', dataType: 'number', permLevel: 1 },
          { id: 'expected_close_date', label: 'Expected Close Date', type: 'field', dataType: 'date', permLevel: 0 },
          { id: 'assigned_to', label: 'Deal Owner / Sales Rep', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 }
        ],
        actions: [
          { action_key: 'act_deal_create_new', section_name: 'Deal Overview & Core Commercials', label_en: 'Create New Deal', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_deal_configure_stages', section_name: 'Deal Overview & Core Commercials', label_en: 'Configure Pipeline Stages', state: 'active', permission_scope: 'super_admin' },
          { action_key: 'act_deal_export_roster', section_name: 'Deal Overview & Core Commercials', label_en: 'Export Deals to CSV', state: 'active', permission_scope: 'everyone' }
        ]
      },
      {
        id: 'sec_deals_scope',
        name: 'Scope, Solutions & Deliverables',
        description: 'Catalog products, service packages, and statement of work specifications',
        items: [
          { id: 'service_type', label: 'Solution / Service Offering', type: 'field', dataType: 'select', permLevel: 0, options: ['Enterprise SaaS', 'Custom Engineering', 'Cloud Infrastructure', 'Quality Assurance', 'Consulting & SLA'] },
          { id: 'product_sku', label: 'Primary Product SKU / Bundle', type: 'field', dataType: 'select', permLevel: 0 },
          { id: 'description', label: 'Executive Scope of Work & Deliverables', type: 'field', dataType: 'text', permLevel: 0 },
          { id: 'contract_term_months', label: 'Contract Term Duration (Months)', type: 'field', dataType: 'number', permLevel: 1 }
        ],
        actions: [
          { action_key: 'act_deal_link_catalog', section_name: 'Scope, Solutions & Deliverables', label_en: 'Attach Catalog Solutions', state: 'active', permission_scope: 'everyone' }
        ]
      },
      {
        id: 'sec_deals_financials',
        name: 'Financial Terms, Margins & Commission Splits',
        description: 'Confidential unit margins, payment schedules, and sales rep commission structures',
        items: [
          { id: 'payment_terms', label: 'Payment Terms Schedule', type: 'field', dataType: 'select', permLevel: 1, options: ['100% Upfront', '50% Deposit / 50% Delivery', 'Net 30 Days', 'Net 60 Days', 'Quarterly Milestone Billing'] },
          { id: 'cost_estimate', label: 'Estimated Direct Delivery Cost', type: 'field', dataType: 'currency', permLevel: 3, maskValue: true },
          { id: 'gross_margin_target', label: 'Projected Gross Margin (%)', type: 'field', dataType: 'number', permLevel: 3, maskValue: true },
          { id: 'rep_commission_override', label: 'Custom Rep Commission Override (%)', type: 'field', dataType: 'number', permLevel: 4, maskValue: true },
          { id: 'deal_stakeholders_table', label: 'Key Decision Makers & Stakeholders Matrix', type: 'table', permLevel: 1 }
        ],
        actions: [
          { action_key: 'act_deal_approve_margin', section_name: 'Financial Terms, Margins & Commission Splits', label_en: 'Commercial Margin Approval', state: 'active', permission_scope: 'super_admin' },
          { action_key: 'act_deal_won_dispatch', section_name: 'Financial Terms, Margins & Commission Splits', label_en: 'Dispatch Closed-Won to QA & Ops', state: 'active', permission_scope: 'everyone' }
        ]
      }
    ]
  },

  // =========================================================================
  // 2. Leads & Convert (/sales/leads)
  // =========================================================================
  leads: {
    pageKey: 'leads',
    displayName: 'Leads & Convert',
    category: 'leads',
    description: 'Manage prospect ingestion schemas, lead capture forms, UTM tracking parameters, and conversion triggers.',
    sections: [
      {
        id: 'sec_leads_contact',
        name: 'Prospect Identification & Contact Details',
        description: 'Individual contact details and corporate identity captured during inbound inquiry',
        items: [
          { id: 'name', label: 'Lead Full Name', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
          { id: 'phone', label: 'Phone Number', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
          { id: 'email', label: 'Work Email Address', type: 'field', dataType: 'email', isRequired: false, permLevel: 0 },
          { id: 'company', label: 'Company / Organization', type: 'field', dataType: 'text', permLevel: 0 },
          { id: 'job_title', label: 'Designation / Job Title', type: 'field', dataType: 'text', permLevel: 0 },
          { id: 'city_country', label: 'City & Country', type: 'field', dataType: 'text', permLevel: 0 }
        ],
        actions: [
          { action_key: 'act_lead_add_manual', section_name: 'Prospect Identification & Contact Details', label_en: 'Capture New Lead', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_lead_import_csv', section_name: 'Prospect Identification & Contact Details', label_en: 'Import Leads CSV', state: 'active', permission_scope: 'everyone' }
        ]
      },
      {
        id: 'sec_leads_attribution',
        name: 'Attribution & Marketing Intelligence',
        description: 'Omni-channel marketing sources, UTM tags, campaigns, and qualification score',
        items: [
          { id: 'source', label: 'Lead Inbound Channel', type: 'field', dataType: 'select', permLevel: 0, options: ['Google Ads', 'Website Contact Form', 'LinkedIn Outreach', 'Referral / Partner', 'Meta Campaign', 'Inbound Call'] },
          { id: 'utm_source', label: 'UTM Source', type: 'field', dataType: 'text', permLevel: 1 },
          { id: 'utm_campaign', label: 'UTM Campaign Name', type: 'field', dataType: 'text', permLevel: 1 },
          { id: 'service_interest', label: 'Interested Service / Solution', type: 'field', dataType: 'select', permLevel: 0, options: ['Enterprise Software', 'QA Audit', 'BPMN Consulting', 'SOP Engineering', 'General Inquiry'] },
          { id: 'lead_score', label: 'AI Lead Qualification Score (1-100)', type: 'field', dataType: 'number', permLevel: 1 },
          { id: 'assigned_rep', label: 'Assigned Sales Executive', type: 'field', dataType: 'select', permLevel: 0 }
        ],
        actions: [
          { action_key: 'act_lead_auto_assign', section_name: 'Attribution & Marketing Intelligence', label_en: 'Trigger Smart Auto-Assign', state: 'active', permission_scope: 'everyone' }
        ]
      },
      {
        id: 'sec_leads_requirements',
        name: 'Requirements & Inquiry Payload',
        description: 'Specific inquiry message, estimated budget, and multi-touch interactions',
        items: [
          { id: 'estimated_value', label: 'Estimated Budget / Opportunity Size', type: 'field', dataType: 'currency', permLevel: 0 },
          { id: 'notes', label: 'Prospect Project Scope & Notes', type: 'field', dataType: 'text', permLevel: 0 },
          { id: 'preferred_time', label: 'Preferred Contact Schedule', type: 'field', dataType: 'select', permLevel: 0, options: ['Morning (9 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 7 PM)', 'Anytime'] },
          { id: 'touchpoint_history_table', label: 'Omni-channel Touchpoint History Repeater', type: 'table', permLevel: 1 }
        ],
        actions: [
          { action_key: 'act_lead_convert_wizard', section_name: 'Requirements & Inquiry Payload', label_en: 'Launch Conversion Wizard', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_lead_mark_disqualified', section_name: 'Requirements & Inquiry Payload', label_en: 'Mark Disqualified', state: 'active', permission_scope: 'everyone' }
        ]
      }
    ]
  },

  // =========================================================================
  // 3. Contacts & Accounts -> Corporate Accounts (/sales/contacts-accounts/accounts)
  // =========================================================================
  contacts_corporate: {
    pageKey: 'contacts_corporate',
    displayName: 'Contacts & Accounts — Corporate Accounts',
    category: 'contacts',
    subCategory: 'Corporate Accounts',
    description: 'Enterprise company profiles, industry classification, tax credentials, and credit limits.',
    sections: [
      {
        id: 'sec_corp_identity',
        name: 'Corporate Entity & Legal Registration',
        description: 'Company name, registration numbers, industry domain, and official website',
        items: [
          { id: 'company_name', label: 'Legal Company Name', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
          { id: 'industry', label: 'Industry Domain', type: 'field', dataType: 'select', permLevel: 0, options: ['Technology & Software', 'Manufacturing & Heavy Industry', 'Financial Services & Banking', 'Healthcare & Pharma', 'Retail & FMCG', 'Construction & Real Estate'] },
          { id: 'tax_number', label: 'Tax Registration / Commercial Register No.', type: 'field', dataType: 'text', permLevel: 2 },
          { id: 'website', label: 'Corporate Website URL', type: 'field', dataType: 'text', permLevel: 0 },
          { id: 'headquarters_address', label: 'Headquarters Full Address', type: 'field', dataType: 'text', permLevel: 0 },
          { id: 'employee_size', label: 'Employee Scale Bracket', type: 'field', dataType: 'select', permLevel: 0, options: ['1-10 Employees', '11-50 Employees', '51-200 Employees', '201-1000 Employees', '1000+ Enterprise'] }
        ],
        actions: [
          { action_key: 'act_corp_create_account', section_name: 'Corporate Entity & Legal Registration', label_en: 'Register Corporate Account', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_corp_export_accounts', section_name: 'Corporate Entity & Legal Registration', label_en: 'Export Corporate Accounts', state: 'active', permission_scope: 'everyone' }
        ]
      },
      {
        id: 'sec_corp_commercials',
        name: 'Credit Risk, Account Tier & Commercial Terms',
        description: 'Confidential credit ratings, approved payment terms, and relationship director',
        items: [
          { id: 'account_tier', label: 'Client Tier Classification', type: 'field', dataType: 'select', permLevel: 1, options: ['Tier 1 Strategic VIP', 'Tier 2 Enterprise', 'Tier 3 Commercial SME', 'Government / Public Sector'] },
          { id: 'annual_turnover', label: 'Estimated Annual Revenue / Turnover', type: 'field', dataType: 'currency', permLevel: 3, maskValue: true },
          { id: 'credit_limit', label: 'Approved Credit Line (EGP)', type: 'field', dataType: 'currency', permLevel: 3, maskValue: true },
          { id: 'account_manager', label: 'Strategic Account Director', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
          { id: 'payment_standing', label: 'Financial Payment Standing', type: 'field', dataType: 'select', permLevel: 2, options: ['Pristine / Prompt Payer', 'Standard Terms Compliant', 'Requires Upfront Deposit', 'On Credit Hold'] },
          { id: 'subsidiaries_branches_table', label: 'Subsidiaries & Branch Locations Table', type: 'table', permLevel: 1 }
        ],
        actions: [
          { action_key: 'act_corp_credit_review', section_name: 'Credit Risk, Account Tier & Commercial Terms', label_en: 'Request Credit Review', state: 'active', permission_scope: 'super_admin' },
          { action_key: 'act_corp_new_deal', section_name: 'Credit Risk, Account Tier & Commercial Terms', label_en: 'Launch Opportunity Deal', state: 'active', permission_scope: 'everyone' }
        ]
      }
    ]
  },

  // =========================================================================
  // 4. Contacts & Accounts -> Individual Contact (/sales/contacts-accounts/contacts)
  // =========================================================================
  contacts_individual: {
    pageKey: 'contacts_individual',
    displayName: 'Contacts & Accounts — Individual Contact',
    category: 'contacts',
    subCategory: 'Individual Contact',
    description: 'Executive stakeholders, direct communication channels, buying roles, and interaction history.',
    sections: [
      {
        id: 'sec_ind_profile',
        name: 'Individual Contact Profile & Reachability',
        description: 'Direct mobile phone, email, WhatsApp, and parent company association',
        items: [
          { id: 'full_name', label: 'Contact Full Name', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
          { id: 'parent_account_id', label: 'Parent Corporate Account', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
          { id: 'designation', label: 'Official Title / Department', type: 'field', dataType: 'text', permLevel: 0 },
          { id: 'direct_email', label: 'Direct Corporate Email', type: 'field', dataType: 'email', isRequired: true, permLevel: 0 },
          { id: 'direct_phone', label: 'Direct Mobile Phone', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
          { id: 'secondary_phone', label: 'Alternate Mobile / WhatsApp', type: 'field', dataType: 'text', permLevel: 0 },
          { id: 'preferred_comm_channel', label: 'Preferred Contact Channel', type: 'field', dataType: 'select', permLevel: 0, options: ['Direct Phone Call', 'WhatsApp Business', 'Email Only', 'Teams / Zoom Meeting'] }
        ],
        actions: [
          { action_key: 'act_ind_create_contact', section_name: 'Individual Contact Profile & Reachability', label_en: 'Add Individual Contact', state: 'active', permission_scope: 'everyone' }
        ]
      },
      {
        id: 'sec_ind_buying_power',
        name: 'Buying Influence & Relationship Dossier',
        description: 'Role in purchasing decisions, LinkedIn profile, and key interaction logs',
        items: [
          { id: 'buying_role', label: 'Buying Role in Account', type: 'field', dataType: 'select', permLevel: 0, options: ['Economic Buyer (C-Level / Board)', 'Technical Evaluator / IT Lead', 'Procurement / Contracting Officer', 'End-User Champion', 'Executive Sponsor', 'External Consultant'] },
          { id: 'linkedin_profile', label: 'LinkedIn Profile URL', type: 'field', dataType: 'text', permLevel: 0 },
          { id: 'confidential_notes', label: 'Personal & Professional Relationship Notes', type: 'field', dataType: 'text', permLevel: 2, maskValue: true },
          { id: 'meeting_history_table', label: 'Historical Meetings & Meeting Minutes Table', type: 'table', permLevel: 1 }
        ],
        actions: [
          { action_key: 'act_ind_send_email', section_name: 'Buying Influence & Relationship Dossier', label_en: 'Compose Email', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_ind_log_call', section_name: 'Buying Influence & Relationship Dossier', label_en: 'Log Call Activity', state: 'active', permission_scope: 'everyone' }
        ]
      }
    ]
  },

  // =========================================================================
  // 5. Quotations (/sales/quotations)
  // =========================================================================
  quotations: {
    pageKey: 'quotations',
    displayName: 'Quotations',
    category: 'quotations',
    description: 'Commercial quotes, proposal validity, tax breakdowns, discount approvals, and line-item matrix.',
    sections: [
      {
        id: 'sec_quote_header',
        name: 'Quotation Header & Validity Schedule',
        description: 'Reference quote number, client recipient, issue date, and expiration timestamp',
        items: [
          { id: 'quote_number', label: 'Quotation Reference Code', type: 'field', dataType: 'text', isRequired: true, readOnly: true, permLevel: 0 },
          { id: 'customer_id', label: 'Target Account / Client Recipient', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
          { id: 'deal_id', label: 'Linked Sales Deal Opportunity', type: 'field', dataType: 'select', permLevel: 0 },
          { id: 'issue_date', label: 'Quotation Issue Date', type: 'field', dataType: 'date', isRequired: true, permLevel: 0 },
          { id: 'expiry_date', label: 'Proposal Validity Expiration Date', type: 'field', dataType: 'date', isRequired: true, permLevel: 0 },
          { id: 'payment_terms', label: 'Formal Payment Terms', type: 'field', dataType: 'select', permLevel: 0, options: ['100% Advance Payment', '50% Upon Signing, 50% Handover', 'Net 30 Days From Invoice', 'Monthly Retainer Schedule'] }
        ],
        actions: [
          { action_key: 'act_quote_build_new', section_name: 'Quotation Header & Validity Schedule', label_en: 'Open Quotation Builder', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_quote_export_pdf', section_name: 'Quotation Header & Validity Schedule', label_en: 'Generate Official PDF Quote', state: 'active', permission_scope: 'everyone' }
        ]
      },
      {
        id: 'sec_quote_totals',
        name: 'Financial Breakdown, VAT & Discounts',
        description: 'Live subtotals, promotional discounts, VAT tax calculations, and grand total',
        items: [
          { id: 'currency', label: 'Quotation Currency', type: 'field', dataType: 'select', permLevel: 0, options: ['EGP', 'USD', 'EUR', 'SAR', 'AED'] },
          { id: 'subtotal', label: 'Gross Catalog Subtotal', type: 'field', dataType: 'currency', readOnly: true, permLevel: 0 },
          { id: 'discount_percent', label: 'Special Promotional Discount (%)', type: 'field', dataType: 'number', permLevel: 1 },
          { id: 'discount_total', label: 'Discount Deducted Value', type: 'field', dataType: 'currency', readOnly: true, permLevel: 0 },
          { id: 'vat_rate', label: 'Value-Added Tax (VAT Rate %)', type: 'field', dataType: 'number', permLevel: 1 },
          { id: 'vat_amount', label: 'Calculated VAT Amount', type: 'field', dataType: 'currency', readOnly: true, permLevel: 0 },
          { id: 'grand_total', label: 'Net Grand Total Payable', type: 'field', dataType: 'currency', isRequired: true, readOnly: true, permLevel: 0 },
          { id: 'quote_line_items_table', label: 'Quotation Line Items & Specifications Table', type: 'table', permLevel: 0 }
        ],
        actions: [
          { action_key: 'act_quote_approve_discount', section_name: 'Financial Breakdown, VAT & Discounts', label_en: 'Approve Exceptional Discount', state: 'active', permission_scope: 'super_admin' },
          { action_key: 'act_quote_post_ledger', section_name: 'Financial Breakdown, VAT & Discounts', label_en: 'Post Invoice to General Ledger', state: 'active', permission_scope: 'everyone' }
        ]
      }
    ]
  }
};

export function getSalesDefaultSchema(scopeKey: string): SalesScopeSchemaConfig {
  const normKey = (scopeKey || '').toLowerCase().trim();
  if (SALES_MODULE_REGISTRY[normKey]) {
    return JSON.parse(JSON.stringify(SALES_MODULE_REGISTRY[normKey]));
  }
  // Default to deals
  return JSON.parse(JSON.stringify(SALES_MODULE_REGISTRY.deals));
}
