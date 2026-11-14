// =========================================================================
// Products & Services Catalog Dynamic Schema & Metadata Registry
// Defines default sections, fields, tables, and actions for Catalog entities
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

export interface CatalogScopeSchemaConfig {
  pageKey: string;
  displayName: string;
  category: 'catalog' | 'pricing' | 'services' | 'inventory';
  subCategory?: string;
  description: string;
  sections: SchemaSectionItem[];
}

export const CATALOG_MODULE_REGISTRY: Record<string, CatalogScopeSchemaConfig> = {
  // =========================================================================
  // 1. Products & Services Items (/catalog/items)
  // =========================================================================
  items: {
    pageKey: 'items',
    displayName: 'Products & Services Directory',
    category: 'catalog',
    description: 'Introspect, customize, and govern fields, classification, taxonomy, financials, inventory parameters, and action buttons for catalog items.',
    sections: [
      {
        id: 'sec_item_identity',
        name: 'Item Identification & Core Classification',
        description: 'Primary product/service naming, SKU codes, categorization taxonomy, and classification type',
        items: [
          { id: 'name', label: 'Item / Offering Name', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
          { id: 'sku', label: 'Stock Keeping Unit (SKU)', type: 'field', dataType: 'text', permLevel: 0 },
          { 
            id: 'category', 
            label: 'Product / Service Category', 
            type: 'field', 
            dataType: 'select', 
            permLevel: 0, 
            options: ['Software & SaaS', 'Professional Services', 'Consulting & Advisory', 'Cloud Infrastructure', 'Hardware & Equipment', 'Maintenance & SLA', 'Training & Enablement'] 
          },
          { 
            id: 'type', 
            label: 'Item Classification Type', 
            type: 'field', 
            dataType: 'select', 
            isRequired: true, 
            permLevel: 0, 
            options: ['product', 'service'] 
          },
          { id: 'description', label: 'Detailed Scope of Work / Description', type: 'field', dataType: 'text', permLevel: 0 },
          { 
            id: 'status', 
            label: 'Catalog Active Status', 
            type: 'field', 
            dataType: 'select', 
            permLevel: 0, 
            options: ['active', 'archived', 'draft'] 
          }
        ],
        actions: [
          { action_key: 'act_item_create_new', section_name: 'Item Identification & Core Classification', label_en: 'Create New Item', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_item_import_csv', section_name: 'Item Identification & Core Classification', label_en: 'Import Catalog CSV', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_item_export_csv', section_name: 'Item Identification & Core Classification', label_en: 'Export Catalog Directory', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_item_seed_samples', section_name: 'Item Identification & Core Classification', label_en: 'Seed Sample Offerings', state: 'active', permission_scope: 'super_admin' }
        ]
      },
      {
        id: 'sec_item_financials',
        name: 'Financial Structure, Costing & Margins',
        description: 'General selling price, currency denomination, production cost, VAT rates, and variable margin indicators',
        items: [
          { id: 'price', label: 'General Selling Price', type: 'field', dataType: 'currency', isRequired: true, permLevel: 0 },
          { 
            id: 'currency', 
            label: 'Pricing Currency Code', 
            type: 'field', 
            dataType: 'select', 
            permLevel: 0, 
            options: ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP'] 
          },
          { id: 'cost', label: 'Production / Direct Operational Cost', type: 'field', dataType: 'currency', permLevel: 1, maskValue: false },
          { id: 'tax', label: 'Tax VAT Rate (%)', type: 'field', dataType: 'number', permLevel: 0 },
          { id: 'is_cost_variable', label: 'Variable Operational Cost Flag', type: 'field', dataType: 'boolean', permLevel: 1 },
          { id: 'is_price_variable', label: 'Variable Selling Price Flag', type: 'field', dataType: 'boolean', permLevel: 0 },
          { id: 'net_unit_profit', label: 'Net Unit Profit Margin (Price - Cost)', type: 'field', dataType: 'currency', readOnly: true, permLevel: 1 },
          { id: 'profit_margin_pct', label: 'Calculated Profit Margin Percentage (%)', type: 'field', dataType: 'number', readOnly: true, permLevel: 1 }
        ],
        actions: [
          { action_key: 'act_item_edit_specs', section_name: 'Financial Structure, Costing & Margins', label_en: 'Edit Specifications', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_item_save_specs', section_name: 'Financial Structure, Costing & Margins', label_en: 'Save Specifications', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_item_delete_record', section_name: 'Financial Structure, Costing & Margins', label_en: 'Delete Catalog Item', state: 'active', permission_scope: 'super_admin' }
        ]
      },
      {
        id: 'sec_item_operational',
        name: 'Inventory & Service Delivery Parameters',
        description: 'Physical inventory tracking, low-stock threshold alert, and estimated service duration in hours or days',
        items: [
          { id: 'stock_qty', label: 'Physical Stock On-Hand (Units)', type: 'field', dataType: 'number', permLevel: 0 },
          { id: 'low_stock_threshold', label: 'Low Stock Alert Threshold', type: 'field', dataType: 'number', permLevel: 0 },
          { id: 'service_duration_hours', label: 'Estimated Service Duration', type: 'field', dataType: 'number', permLevel: 0 },
          { 
            id: 'service_duration_unit', 
            label: 'Service Duration Unit Measure', 
            type: 'field', 
            dataType: 'select', 
            permLevel: 0, 
            options: ['hours', 'days'] 
          },
          { id: 'sop_id', label: 'Linked Standard Operating Procedure (SOP)', type: 'field', dataType: 'select', permLevel: 0 },
          { id: 'process_mapping_id', label: 'Linked Process Architecture Flow', type: 'field', dataType: 'select', permLevel: 0 }
        ],
        actions: [
          { action_key: 'act_item_audit_stock', section_name: 'Inventory & Service Delivery Parameters', label_en: 'Audit Stock & SLAs', state: 'active', permission_scope: 'direct_manager' },
          { action_key: 'act_item_dispatch_crm', section_name: 'Inventory & Service Delivery Parameters', label_en: 'Dispatch to CRM Quote', state: 'active', permission_scope: 'everyone' }
        ]
      },
      {
        id: 'sec_item_tiered_pricing',
        name: 'Multi-Tier Price Lists & Wholesale Agreements',
        description: 'Customer tiers, wholesale partners, and regional price override matrix',
        items: [
          { id: 'price_lists_table', label: 'Assigned Price Lists Matrix', type: 'table', permLevel: 0 }
        ],
        actions: [
          { action_key: 'act_item_assign_price_list', section_name: 'Multi-Tier Price Lists & Wholesale Agreements', label_en: 'Assign to Price List', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_item_edit_override', section_name: 'Multi-Tier Price Lists & Wholesale Agreements', label_en: 'Update Tier Override', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_item_delete_override', section_name: 'Multi-Tier Price Lists & Wholesale Agreements', label_en: 'Remove Price Override', state: 'active', permission_scope: 'super_admin' }
        ]
      }
    ]
  },

  // =========================================================================
  // 2. Custom Price Lists (/catalog/pricing/price-lists)
  // =========================================================================
  price_lists: {
    pageKey: 'price_lists',
    displayName: 'Multi-Tier Price Lists',
    category: 'pricing',
    description: 'Configure wholesale tier profiles, distributor schedules, customer-specific pricing structures, and preset markdown formulas.',
    sections: [
      {
        id: 'sec_price_list_header',
        name: 'Price Profile Header & Target Agreement',
        description: 'Name, market segment description, designated currency, and active status',
        items: [
          { id: 'name', label: 'Price List Name / Profile Title', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
          { id: 'description', label: 'Target Segment & Commercial Terms', type: 'field', dataType: 'text', permLevel: 0 },
          { 
            id: 'currency', 
            label: 'Designated Profile Currency', 
            type: 'field', 
            dataType: 'select', 
            permLevel: 0, 
            options: ['EGP', 'USD', 'EUR', 'SAR', 'AED'] 
          },
          { id: 'is_active', label: 'Active Profile Status', type: 'field', dataType: 'boolean', permLevel: 0 }
        ],
        actions: [
          { action_key: 'act_pl_new_profile', section_name: 'Price Profile Header & Target Agreement', label_en: 'New Price Profile', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_pl_edit_profile', section_name: 'Price Profile Header & Target Agreement', label_en: 'Edit Price Profile', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_pl_delete_profile', section_name: 'Price Profile Header & Target Agreement', label_en: 'Delete Price Profile', state: 'active', permission_scope: 'super_admin' }
        ]
      },
      {
        id: 'sec_price_list_matrix',
        name: 'Item Overrides & Profitability Matrix',
        description: 'Catalog items roster with custom override price, discount variance percentage, and net margin',
        items: [
          { id: 'price_overrides_table', label: 'Product Tier Price Overrides Roster', type: 'table', permLevel: 0 }
        ],
        actions: [
          { action_key: 'act_pl_save_override_price', section_name: 'Item Overrides & Profitability Matrix', label_en: 'Save Tier Override Price', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_pl_apply_presets', section_name: 'Item Overrides & Profitability Matrix', label_en: 'Apply Preset (-5%, -10%, -15%, -20%)', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_pl_cost_plus', section_name: 'Item Overrides & Profitability Matrix', label_en: 'Apply Cost + 25% Markup', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_pl_filter_catalog', section_name: 'Item Overrides & Profitability Matrix', label_en: 'Filter Catalog Items', state: 'active', permission_scope: 'everyone' }
        ]
      }
    ]
  },

  // =========================================================================
  // 3. Discount Coupons & Promo Codes (/catalog/pricing/promo-codes)
  // =========================================================================
  promo_codes: {
    pageKey: 'promo_codes',
    displayName: 'Promo Codes & Discount Vouchers',
    category: 'pricing',
    description: 'Manage campaign discount codes, percentage vouchers, fixed dollar markdowns, expiry dates, and CRM checkout validation.',
    sections: [
      {
        id: 'sec_promo_core',
        name: 'Promo Coupon Rules & Discount Model',
        description: 'Voucher code string, percentage vs fixed amount, rate value, expiration deadline, and active flag',
        items: [
          { id: 'code', label: 'Promo Voucher Code (e.g. VIP2026)', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
          { 
            id: 'discount_type', 
            label: 'Discount Calculation Mechanism', 
            type: 'field', 
            dataType: 'select', 
            isRequired: true, 
            permLevel: 0, 
            options: ['percentage', 'fixed'] 
          },
          { id: 'discount_value', label: 'Discount Value Rate (% or Fixed)', type: 'field', dataType: 'number', isRequired: true, permLevel: 0 },
          { id: 'expiry_date', label: 'Campaign Expiration Date', type: 'field', dataType: 'date', permLevel: 0 },
          { id: 'is_active', label: 'Voucher Active & Redeemable', type: 'field', dataType: 'boolean', permLevel: 0 },
          { id: 'min_order_value', label: 'Minimum Qualifying Order Subtotal', type: 'field', dataType: 'currency', permLevel: 0 }
        ],
        actions: [
          { action_key: 'act_promo_create_new', section_name: 'Promo Coupon Rules & Discount Model', label_en: 'New Promo Code', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_promo_copy_clipboard', section_name: 'Promo Coupon Rules & Discount Model', label_en: 'Copy Code to Clipboard', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_promo_toggle_status', section_name: 'Promo Coupon Rules & Discount Model', label_en: 'Toggle Active Status', state: 'active', permission_scope: 'direct_manager' },
          { action_key: 'act_promo_delete_coupon', section_name: 'Promo Coupon Rules & Discount Model', label_en: 'Delete Voucher Code', state: 'active', permission_scope: 'super_admin' }
        ]
      }
    ]
  },

  // =========================================================================
  // 4. Service Solutions & SLA Delivery (/catalog/services)
  // =========================================================================
  service_specs: {
    pageKey: 'service_specs',
    displayName: 'Service Solutions & SLA Delivery',
    category: 'services',
    description: 'Configure professional services delivery parameters, turnaround hours vs days, billable labor rates, and SOP operational standards.',
    sections: [
      {
        id: 'sec_service_turnaround_standards',
        name: 'Turnaround Metrics & Billing Standards',
        description: 'Duration measurement unit, standard delivery hours or days, client SLA milestone commitment, and variable cost structures',
        items: [
          { id: 'service_duration_hours', label: 'Estimated Turnaround Duration', type: 'field', dataType: 'number', isRequired: true, permLevel: 0 },
          { 
            id: 'service_duration_unit', 
            label: 'Duration Unit (Hours / Days)', 
            type: 'field', 
            dataType: 'select', 
            isRequired: true, 
            permLevel: 0, 
            options: ['hours', 'days'] 
          },
          { id: 'hourly_billable_rate', label: 'Standard Billable Hourly Rate', type: 'field', dataType: 'currency', permLevel: 0 },
          { id: 'delivery_sla_days', label: 'Client SLA Turnaround Target (Days)', type: 'field', dataType: 'number', permLevel: 0 },
          { id: 'is_cost_variable', label: 'Variable Labor / Contractor Cost', type: 'field', dataType: 'boolean', permLevel: 1 }
        ],
        actions: [
          { action_key: 'act_service_dispatch_task', section_name: 'Turnaround Metrics & Billing Standards', label_en: 'Dispatch Service Task', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_service_log_hours', section_name: 'Turnaround Metrics & Billing Standards', label_en: 'Log Billable Delivery Hours', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_service_audit_sla', section_name: 'Turnaround Metrics & Billing Standards', label_en: 'Audit SLA Compliance', state: 'active', permission_scope: 'direct_manager' }
        ]
      },
      {
        id: 'sec_service_sop_governance',
        name: 'Operational Protocols & SOP Governance',
        description: 'Standard Operating Procedures (SOP), Kaizen continuous improvement links, and Process Architecture',
        items: [
          { id: 'sop_id', label: 'Associated Standard Operating Procedure', type: 'field', dataType: 'select', permLevel: 0 },
          { id: 'process_mapping_id', label: 'Linked Process Workflow Architecture', type: 'field', dataType: 'select', permLevel: 0 },
          { id: 'quality_checklist_ref', label: 'Quality Assurance Protocol Reference', type: 'field', dataType: 'text', permLevel: 0 }
        ],
        actions: [
          { action_key: 'act_service_view_sop', section_name: 'Operational Protocols & SOP Governance', label_en: 'Open Linked SOP Document', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_service_view_process', section_name: 'Operational Protocols & SOP Governance', label_en: 'Inspect Workflow Diagram', state: 'active', permission_scope: 'everyone' }
        ]
      }
    ]
  },

  // =========================================================================
  // 5. Physical Inventory & Warehouse Tracking (/catalog/inventory)
  // =========================================================================
  inventory_control: {
    pageKey: 'inventory_control',
    displayName: 'Physical Inventory & Stock Control',
    category: 'inventory',
    description: 'Manage warehouse inventory balances, minimum safety thresholds, replenishment batch sizes, and stock count reconciliations.',
    sections: [
      {
        id: 'sec_stock_quantities_thresholds',
        name: 'Warehouse Quantities & Alert Thresholds',
        description: 'Current on-hand stock quantities, automated low-stock warnings, and reorder batch rules',
        items: [
          { id: 'stock_qty', label: 'Current Stock Quantity On-Hand', type: 'field', dataType: 'number', isRequired: true, permLevel: 0 },
          { id: 'low_stock_threshold', label: 'Low Stock Safety Alert Threshold', type: 'field', dataType: 'number', permLevel: 0 },
          { id: 'reorder_batch_qty', label: 'Recommended Reorder Batch Quantity', type: 'field', dataType: 'number', permLevel: 0 },
          { id: 'supplier_lead_time_days', label: 'Supplier Procurement Lead Time (Days)', type: 'field', dataType: 'number', permLevel: 0 },
          { id: 'warehouse_location', label: 'Warehouse Bin / Aisle Location Code', type: 'field', dataType: 'text', permLevel: 0 },
          { 
            id: 'unit_of_measure', 
            label: 'Unit of Measure (UOM)', 
            type: 'field', 
            dataType: 'select', 
            permLevel: 0, 
            options: ['Units', 'Boxes', 'Cartons', 'Sets', 'Pallets', 'Kilograms', 'Meters'] 
          }
        ],
        actions: [
          { action_key: 'act_inv_adjust_qty', section_name: 'Warehouse Quantities & Alert Thresholds', label_en: 'Adjust Physical Stock Count', state: 'active', permission_scope: 'everyone' },
          { action_key: 'act_inv_generate_po', section_name: 'Warehouse Quantities & Alert Thresholds', label_en: 'Generate Purchase Requisition', state: 'active', permission_scope: 'direct_manager' },
          { action_key: 'act_inv_export_stock_roster', section_name: 'Warehouse Quantities & Alert Thresholds', label_en: 'Export Stock Valuation CSV', state: 'active', permission_scope: 'everyone' }
        ]
      }
    ]
  }
};

export function getCatalogDefaultSchema(scopeKey: string): CatalogScopeSchemaConfig {
  const cleanKey = scopeKey.toLowerCase().trim();
  const config = CATALOG_MODULE_REGISTRY[cleanKey];
  if (config) {
    // Return deep clone so mutations don't dirty the singleton
    return JSON.parse(JSON.stringify(config));
  }
  // Fallback to items schema if unknown
  return JSON.parse(JSON.stringify(CATALOG_MODULE_REGISTRY.items));
}
