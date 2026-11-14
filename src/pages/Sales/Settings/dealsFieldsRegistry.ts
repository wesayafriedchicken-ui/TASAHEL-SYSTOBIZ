export interface DealFieldOption {
  key: string;
  label: string;
  category: 'Deal Scope & Identity' | 'Client & Account Information' | 'Line Items & Deliverables' | 'Marketing & Source Attribution';
  isRequired?: boolean;
  dataType: 'text' | 'number' | 'currency' | 'select' | 'email' | 'phone';
  description: string;
  aliases: string[];
}

export const ALL_NEW_DEAL_FIELDS: DealFieldOption[] = [
  // --- Category 1: Deal Scope & Identity ---
  {
    key: 'title',
    label: 'Deal Title / Project Reference',
    category: 'Deal Scope & Identity',
    isRequired: true,
    dataType: 'text',
    description: 'Name of the commercial opportunity or project scope (Required in New Deal)',
    aliases: ['deal title', 'title', 'project reference', 'project', 'opportunity', 'deal name', 'deal']
  },
  {
    key: 'value',
    label: 'Estimated Deal Value / Total Amount',
    category: 'Deal Scope & Identity',
    isRequired: true,
    dataType: 'currency',
    description: 'Total revenue or estimated opportunity value in base currency',
    aliases: ['estimated deal value', 'deal value', 'value', 'amount', 'total value', 'budget', 'price', 'contract value']
  },
  {
    key: 'stage_id',
    label: 'Pipeline Stage',
    category: 'Deal Scope & Identity',
    isRequired: true,
    dataType: 'select',
    description: 'Initial pipeline stage (Lead In, Meeting, Proposal, Negotiation, Closed Won)',
    aliases: ['pipeline stage', 'stage', 'deal stage', 'status', 'sales stage']
  },
  {
    key: 'assigned_to',
    label: 'Assigned Sales Rep / Deal Owner',
    category: 'Deal Scope & Identity',
    dataType: 'select',
    description: 'Representative responsible for closing the deal',
    aliases: ['assigned sales rep', 'assigned to', 'deal owner', 'sales rep', 'agent', 'owner', 'representative']
  },
  {
    key: 'service_type',
    label: 'Service Category / Tag',
    category: 'Deal Scope & Identity',
    dataType: 'text',
    description: 'Classification tag (e.g. Software, Cloud, Consulting, BPMN)',
    aliases: ['service category', 'service tag', 'service type', 'service', 'category', 'offering']
  },
  {
    key: 'product',
    label: 'Target Product / Solution',
    category: 'Deal Scope & Identity',
    dataType: 'text',
    description: 'Primary product or solution targeted in the deal',
    aliases: ['target product', 'product', 'solution', 'package', 'sku', 'catalog product']
  },
  {
    key: 'description',
    label: 'Internal Deal Memo & Objectives',
    category: 'Deal Scope & Identity',
    dataType: 'text',
    description: 'Internal deal context, key decision makers, and milestones',
    aliases: ['internal deal memo', 'deal memo', 'description', 'notes', 'objectives', 'internal notes', 'memo']
  },

  // --- Category 2: Client & Account Information ---
  {
    key: 'customer_name',
    label: 'Client / Contact Full Name',
    category: 'Client & Account Information',
    isRequired: true,
    dataType: 'text',
    description: 'Full name of the contact person or client champion (Required in New Deal)',
    aliases: ['contact name', 'full name', 'client name', 'customer name', 'name', 'person', 'lead name', 'contact']
  },
  {
    key: 'customer_company',
    label: 'Client Company / Organization',
    category: 'Client & Account Information',
    dataType: 'text',
    description: 'Corporate or organization name associated with the deal',
    aliases: ['company', 'organization', 'client company', 'customer company', 'account name', 'firm', 'business']
  },
  {
    key: 'customer_email',
    label: 'Client Email Address',
    category: 'Client & Account Information',
    dataType: 'email',
    description: 'Primary business email of the client or prospect',
    aliases: ['email', 'email address', 'client email', 'customer email', 'contact email', 'mail']
  },
  {
    key: 'customer_phone',
    label: 'Client Phone Number',
    category: 'Client & Account Information',
    dataType: 'phone',
    description: 'Direct phone number or mobile with international country code',
    aliases: ['phone', 'phone number', 'mobile', 'telephone', 'client phone', 'customer phone', 'cell']
  },
  {
    key: 'customer_job_title',
    label: 'Client Job Title / Role',
    category: 'Client & Account Information',
    dataType: 'text',
    description: 'Executive title or decision role (e.g. CTO, Procurement Director)',
    aliases: ['job title', 'designation', 'position', 'role', 'title of contact']
  },
  {
    key: 'customer_city_country',
    label: 'Client City & Location',
    category: 'Client & Account Information',
    dataType: 'text',
    description: 'City, region, or country of the client headquarters',
    aliases: ['city', 'location', 'country', 'region', 'address', 'hq']
  },

  // --- Category 3: Line Items & Deliverables ---
  {
    key: 'items_name',
    label: 'Line Item: Product / Deliverable Name',
    category: 'Line Items & Deliverables',
    dataType: 'text',
    description: 'Specific deliverable or item breakdown inside the deal',
    aliases: ['item name', 'deliverable', 'product item', 'line item', 'item description']
  },
  {
    key: 'items_quantity',
    label: 'Line Item: Quantity (Units Count)',
    category: 'Line Items & Deliverables',
    dataType: 'number',
    description: 'Number of units, hours, or licenses',
    aliases: ['quantity', 'qty', 'units', 'count', 'item quantity']
  },
  {
    key: 'items_unit_price',
    label: 'Line Item: Unit Price Rate',
    category: 'Line Items & Deliverables',
    dataType: 'currency',
    description: 'Price per single unit or deliverable rate',
    aliases: ['unit price', 'rate', 'price per unit', 'item rate']
  },
  {
    key: 'items_total',
    label: 'Line Item: Subtotal Total',
    category: 'Line Items & Deliverables',
    dataType: 'currency',
    description: 'Computed subtotal for this deliverable line item',
    aliases: ['item total', 'subtotal', 'line total', 'item amount']
  },

  // --- Category 4: Marketing & Source Attribution ---
  {
    key: 'utm_source',
    label: 'UTM Source Channel',
    category: 'Marketing & Source Attribution',
    dataType: 'text',
    description: 'Inbound channel (e.g. google, linkedin, direct, referral, newsletter)',
    aliases: ['utm source', 'source', 'channel', 'acquisition channel', 'traffic source']
  },
  {
    key: 'utm_medium',
    label: 'UTM Marketing Medium',
    category: 'Marketing & Source Attribution',
    dataType: 'text',
    description: 'Traffic medium (e.g. cpc, organic, email, social)',
    aliases: ['utm medium', 'medium', 'traffic medium']
  },
  {
    key: 'utm_campaign',
    label: 'UTM Campaign Name',
    category: 'Marketing & Source Attribution',
    dataType: 'text',
    description: 'Marketing campaign reference or ad set code',
    aliases: ['utm campaign', 'campaign', 'campaign name', 'ad set']
  },
  {
    key: 'inbound_notes',
    label: 'Inbound Customer Inquiry Notes',
    category: 'Marketing & Source Attribution',
    dataType: 'text',
    description: 'Raw inquiries, custom questions, or web form message content',
    aliases: ['inquiry notes', 'message', 'inbound notes', 'customer requirements', 'form message', 'inquiry']
  }
];

/**
 * Intelligent helper to auto-match a spreadsheet column header name
 * to one of the exhaustive /sales/pipeline/deals/new fields.
 */
export function autoMatchColumnToDealField(sheetColumn: string): string {
  if (!sheetColumn) return 'title';
  const clean = sheetColumn.toLowerCase().trim();

  // 1. Direct key match
  const directKey = ALL_NEW_DEAL_FIELDS.find(f => f.key.toLowerCase() === clean);
  if (directKey) return directKey.key;

  // 2. Alias match
  for (const field of ALL_NEW_DEAL_FIELDS) {
    if (field.aliases.some(a => a.toLowerCase() === clean || clean.includes(a.toLowerCase()))) {
      return field.key;
    }
  }

  // 3. Fallbacks based on common patterns
  if (clean.includes('name') && !clean.includes('item') && !clean.includes('project')) return 'customer_name';
  if (clean.includes('phone') || clean.includes('mobile')) return 'customer_phone';
  if (clean.includes('email') || clean.includes('mail')) return 'customer_email';
  if (clean.includes('company') || clean.includes('org')) return 'customer_company';
  if (clean.includes('service') || clean.includes('category')) return 'service_type';
  if (clean.includes('product') || clean.includes('solution')) return 'product';
  if (clean.includes('val') || clean.includes('amount') || clean.includes('cost') || clean.includes('price')) return 'value';
  if (clean.includes('stage') || clean.includes('status')) return 'stage_id';
  if (clean.includes('owner') || clean.includes('rep') || clean.includes('agent')) return 'assigned_to';
  if (clean.includes('note') || clean.includes('memo') || clean.includes('desc')) return 'description';
  if (clean.includes('source') || clean.includes('utm')) return 'utm_source';

  return 'title';
}
